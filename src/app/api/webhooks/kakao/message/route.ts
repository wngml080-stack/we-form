import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { KakaoWebhookEvent } from "@/lib/kakao/config";
import { getClaudeClient, CLAUDE_MODELS } from "@/lib/ai/claude";
import { decrypt } from "@/lib/utils/encryption";
import crypto from "crypto";

interface GymKakaoChannel {
  gym_id: string;
  company_id: string;
  channel_id: string;
  admin_key: string;
  webhook_secret?: string;
  chatbot_enabled: boolean;
}

// 카카오 Webhook 서명 검증
function verifySignature(body: string, signature: string, webhookSecret?: string): boolean {
  // 개발 환경에서만 서명 검증 스킵 허용
  if (!webhookSecret) {
    if (process.env.NODE_ENV === "development" && process.env.SKIP_WEBHOOK_SIGNATURE === "true") {
      console.warn("[Kakao Webhook] 개발 환경에서 서명 검증을 스킵합니다.");
      return true;
    }
    console.error("[Kakao Webhook] Webhook secret이 설정되지 않았습니다. 보안상 요청을 거부합니다.");
    return false;
  }

  const hash = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("base64");

  return hash === signature;
}

// 채널 ID로 지점 설정 조회
async function getGymByChannelId(supabase: ReturnType<typeof getSupabaseAdmin>, channelId: string): Promise<GymKakaoChannel | null> {
  // 채널 ID로 매핑된 지점 찾기
  const { data } = await supabase
    .from("gym_kakao_channels")
    .select("gym_id, company_id, channel_id, admin_key, webhook_secret, chatbot_enabled")
    .eq("channel_id", channelId)
    .eq("is_verified", true)
    .maybeSingle();

  if (data) {
    // 암호화된 키 복호화
    return {
      ...data,
      admin_key: data.admin_key ? decrypt(data.admin_key) : "",
      webhook_secret: data.webhook_secret ? decrypt(data.webhook_secret) : undefined,
    };
  }

  // 채널 ID가 없으면 기본값 사용 (개발용)
  const defaultGymId = process.env.DEFAULT_GYM_ID;
  const defaultCompanyId = process.env.DEFAULT_COMPANY_ID;

  if (defaultGymId && defaultCompanyId) {
    return {
      gym_id: defaultGymId,
      company_id: defaultCompanyId,
      channel_id: channelId,
      admin_key: process.env.KAKAO_ADMIN_KEY || "",
      webhook_secret: process.env.KAKAO_WEBHOOK_SECRET,
      chatbot_enabled: true,
    };
  }

  return null;
}

// 카카오 메시지 Webhook 수신
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("X-Kakao-Signature") || "";

    const event: KakaoWebhookEvent = JSON.parse(rawBody);

    const supabase = getSupabaseAdmin();

    // 채널 ID로 지점 설정 조회
    const channelId = request.headers.get("X-Kakao-Channel-Id") || "";
    const gymChannel = await getGymByChannelId(supabase, channelId);

    // 서명 검증 (지점별 webhook secret 사용)
    if (!verifySignature(rawBody, signature, gymChannel?.webhook_secret)) {
      console.error("[Kakao Webhook] 서명 검증 실패");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (!gymChannel) {
      console.error("[Kakao Webhook] 매핑된 지점을 찾을 수 없습니다:", channelId);
      return NextResponse.json({ error: "Channel not configured" }, { status: 400 });
    }

    // 이벤트 타입에 따른 처리
    switch (event.event) {
      case "message":
        await handleMessage(supabase, event, gymChannel);
        break;
      case "added":
        await handleChannelAdded(supabase, event);
        break;
      case "blocked":
        await handleChannelBlocked(supabase, event);
        break;
    }

    // 마지막 웹훅 수신 시간 업데이트
    if (gymChannel.gym_id) {
      await supabase
        .from("gym_kakao_channels")
        .update({ last_webhook_received_at: new Date().toISOString() })
        .eq("gym_id", gymChannel.gym_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Kakao Webhook] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// 메시지 수신 처리
async function handleMessage(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  event: KakaoWebhookEvent,
  gymChannel: GymKakaoChannel
) {
  const { user_key, message, timestamp } = event;

  if (!message?.text) {
    return;
  }

  const { gym_id: gymId, company_id: companyId, admin_key: adminKey, chatbot_enabled } = gymChannel;

  // 기존 문의 찾기 (같은 user_key로 최근 24시간 내)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: existingInquiry } = await supabase
    .from("inquiries")
    .select("id")
    .eq("gym_id", gymId)
    .eq("channel", "kakao")
    .eq("channel_id", user_key)
    .gte("created_at", oneDayAgo)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let inquiryId: string;

  if (existingInquiry) {
    // 기존 문의에 메시지 추가
    inquiryId = existingInquiry.id;
  } else {
    // 문의 유형 분류
    const inquiryType = classifyInquiryType(message.text);

    const { data: newInquiry, error } = await supabase
      .from("inquiries")
      .insert({
        gym_id: gymId,
        company_id: companyId,
        channel: "kakao",
        channel_id: user_key,
        inquiry_type: inquiryType,
        content: message.text,
        status: "new",
        priority: "normal",
        source_data: { event },
      })
      .select("id")
      .single();

    if (error || !newInquiry) {
      console.error("[Kakao Webhook] Failed to create inquiry:", error);
      return;
    }

    inquiryId = newInquiry.id;
  }

  // 메시지 저장
  await supabase.from("inquiry_messages").insert({
    inquiry_id: inquiryId,
    direction: "inbound",
    sender_type: "customer",
    content: message.text,
    message_type: "text",
    channel_message_id: `${user_key}_${timestamp}`,
    sent_at: new Date(timestamp).toISOString(),
  });

  // 챗봇이 비활성화되어 있으면 여기서 종료
  if (!chatbot_enabled) {
    return;
  }

  // 자동 응답 설정 확인
  const { data: settings } = await supabase
    .from("gym_auto_response_settings")
    .select("*")
    .eq("gym_id", gymId)
    .maybeSingle();

  if (settings?.auto_response_enabled) {
    // AI 응답 생성 및 발송
    await generateAndSendAIResponse(supabase, inquiryId, gymId, user_key, message.text, settings, adminKey);
  }
}

// 채널 추가 처리
async function handleChannelAdded(_supabase: ReturnType<typeof getSupabaseAdmin>, _event: KakaoWebhookEvent) {
  // 환영 메시지 발송 등 처리 가능
}

// 채널 차단 처리
async function handleChannelBlocked(_supabase: ReturnType<typeof getSupabaseAdmin>, _event: KakaoWebhookEvent) {
  // 관련 문의 상태 업데이트 등 처리 가능
}

// 문의 유형 분류
function classifyInquiryType(text: string): string {
  const lowerText = text.toLowerCase();

  if (lowerText.includes("가격") || lowerText.includes("비용") || lowerText.includes("얼마")) {
    return "price";
  }
  if (lowerText.includes("시간") || lowerText.includes("영업") || lowerText.includes("오픈")) {
    return "schedule";
  }
  if (lowerText.includes("위치") || lowerText.includes("주소") || lowerText.includes("어디")) {
    return "location";
  }
  if (lowerText.includes("체험") || lowerText.includes("무료") || lowerText.includes("경험")) {
    return "trial";
  }
  if (lowerText.includes("회원권") || lowerText.includes("등록") || lowerText.includes("가입")) {
    return "membership";
  }
  if (lowerText.includes("pt") || lowerText.includes("피티") || lowerText.includes("트레이너")) {
    return "pt";
  }
  if (lowerText.includes("환불") || lowerText.includes("해지") || lowerText.includes("취소")) {
    return "cancel";
  }

  return "etc";
}

// AI 응답 생성 및 발송
async function generateAndSendAIResponse(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  inquiryId: string,
  gymId: string,
  userKey: string,
  messageText: string,
  settings: Record<string, unknown>,
  adminKey: string
) {
  try {
    // 헬스장 정보 조회
    const { data: gymInfo } = await supabase
      .from("gyms")
      .select("name, address, phone")
      .eq("id", gymId)
      .maybeSingle();

    // AI 응답 생성
    const claude = getClaudeClient();

    const systemPrompt = `당신은 피트니스 센터의 친절한 상담원입니다.
고객 문의에 정확하고 친절하게 답변합니다.

## 센터 정보
- 센터명: ${gymInfo?.name || "헬스장"}
- 주소: ${gymInfo?.address || "문의 바랍니다"}
- 연락처: ${gymInfo?.phone || "문의 바랍니다"}
- 영업시간: ${settings.business_hours ? JSON.stringify(settings.business_hours) : "평일 06:00-23:00, 주말 09:00-18:00"}
${settings.location_info ? `- 위치 안내: ${settings.location_info}` : ""}
${settings.parking_info ? `- 주차 안내: ${settings.parking_info}` : ""}

## 가격 정보
${settings.pricing ? JSON.stringify(settings.pricing, null, 2) : "가격은 방문 상담 또는 전화 문의 부탁드립니다."}

## 응답 규칙
1. 항상 존대말로 정중하게 답변합니다.
2. 150자 이내로 간결하게 작성합니다.
3. 이모지는 사용하지 않습니다.
4. 상담/체험 예약으로 자연스럽게 연결합니다.`;

    const response = await claude.messages.create({
      model: (settings.ai_model as string) || CLAUDE_MODELS.FAST,
      max_tokens: (settings.ai_max_tokens as number) || 500,
      system: systemPrompt,
      messages: [{ role: "user", content: messageText }],
    });

    const aiResponse = response.content[0].type === "text" ? response.content[0].text : "";

    // 문의에 AI 응답 저장
    await supabase
      .from("inquiries")
      .update({
        ai_responded: true,
        ai_response_content: aiResponse,
        ai_responded_at: new Date().toISOString(),
      })
      .eq("id", inquiryId);

    // 응답 메시지 저장
    await supabase.from("inquiry_messages").insert({
      inquiry_id: inquiryId,
      direction: "outbound",
      sender_type: "ai",
      content: aiResponse,
      message_type: "text",
    });

    // 카카오 채널로 응답 발송 (지점별 Admin Key 사용)
    if (adminKey) {
      await sendChannelMessageWithKey(userKey, aiResponse, adminKey);
    }
  } catch (error) {
    console.error("[Kakao Webhook] AI response error:", error);
  }
}

// 지점별 Admin Key를 사용한 메시지 발송
async function sendChannelMessageWithKey(
  userKey: string,
  text: string,
  adminKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("https://kapi.kakao.com/v1/api/talk/channels/message/send", {
      method: "POST",
      headers: {
        Authorization: `KakaoAK ${adminKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        receiver_uuids: JSON.stringify([userKey]),
        template_object: JSON.stringify({
          object_type: "text",
          text,
        }),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[Kakao Message] Error:", error);
      return { success: false, error: error.msg || "메시지 발송 실패" };
    }

    return { success: true };
  } catch (error) {
    console.error("[Kakao Message] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "알 수 없는 오류" };
  }
}
