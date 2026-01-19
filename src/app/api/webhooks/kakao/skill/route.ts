import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  KakaoSkillRequest,
  createTextResponse,
  createCardResponse,
  createQuickReplyResponse,
} from "@/lib/kakao/config";
import { getClaudeClient, CLAUDE_MODELS } from "@/lib/ai/claude";

// 카카오 챗봇 스킬 서버
// 카카오 i 오픈빌더에서 스킬 서버로 등록하여 사용
export async function POST(request: NextRequest) {
  try {
    const body: KakaoSkillRequest = await request.json();

    const { intent, userRequest, action } = body;
    const userMessage = userRequest?.utterance || "";
    const userKey = userRequest?.user?.id || "";

    // 인텐트에 따른 처리
    const intentName = intent?.name || "";

    switch (intentName) {
      case "가격문의":
        return handlePriceInquiry(userMessage);

      case "영업시간문의":
        return handleScheduleInquiry(userMessage);

      case "위치문의":
        return handleLocationInquiry(userMessage);

      case "체험신청":
        return handleTrialRequest(userMessage, userKey);

      case "PT문의":
        return handlePTInquiry(userMessage);

      case "회원권문의":
        return handleMembershipInquiry(userMessage);

      case "상담예약":
        return handleReservationRequest(userMessage, userKey, action?.params);

      case "AI응답":
      case "폴백블록":
      default:
        return handleAIResponse(userMessage, userKey);
    }
  } catch (error) {
    console.error("[Kakao Skill] Error:", error);
    return NextResponse.json(
      createTextResponse(
        "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      )
    );
  }
}

// 가격 문의 처리
async function handlePriceInquiry(userMessage: string) {
  const supabase = getSupabaseAdmin();
  const gymId = process.env.DEFAULT_GYM_ID;

  if (!gymId) {
    return NextResponse.json(
      createTextResponse(
        "가격 정보를 가져올 수 없습니다. 고객센터로 문의해주세요."
      )
    );
  }

  const { data: settings } = await supabase
    .from("gym_auto_response_settings")
    .select("pricing")
    .eq("gym_id", gymId)
    .maybeSingle();

  if (settings?.pricing) {
    const pricing = settings.pricing as Record<string, unknown>;
    let priceText = "💰 회원권 가격 안내\n\n";

    if (pricing.membership) {
      priceText += "▶ 헬스 회원권\n";
      const membership = pricing.membership as Record<string, number>;
      Object.entries(membership).forEach(([period, price]) => {
        priceText += `• ${period}: ${Number(price).toLocaleString()}원\n`;
      });
    }

    if (pricing.pt) {
      priceText += "\n▶ PT 가격\n";
      const pt = pricing.pt as Record<string, number>;
      Object.entries(pt).forEach(([sessions, price]) => {
        priceText += `• ${sessions}: ${Number(price).toLocaleString()}원\n`;
      });
    }

    priceText += "\n자세한 상담은 방문 또는 전화로 문의해주세요.";

    return NextResponse.json(
      createQuickReplyResponse(priceText, [
        { label: "체험 신청", action: "block", blockId: "체험신청" },
        { label: "상담 예약", action: "block", blockId: "상담예약" },
      ])
    );
  }

  return NextResponse.json(
    createTextResponse(
      "가격은 회원권 종류와 기간에 따라 다릅니다.\n\n자세한 가격 안내를 위해 방문 상담 또는 전화 상담을 권해드립니다."
    )
  );
}

// 영업시간 문의 처리
async function handleScheduleInquiry(userMessage: string) {
  const supabase = getSupabaseAdmin();
  const gymId = process.env.DEFAULT_GYM_ID;

  if (!gymId) {
    return NextResponse.json(
      createTextResponse(
        "영업시간 정보를 가져올 수 없습니다. 고객센터로 문의해주세요."
      )
    );
  }

  const { data: settings } = await supabase
    .from("gym_auto_response_settings")
    .select("business_hours")
    .eq("gym_id", gymId)
    .maybeSingle();

  if (settings?.business_hours) {
    const hours = settings.business_hours as Record<string, string>;
    let hoursText = "🕐 영업시간 안내\n\n";

    if (hours.weekday) hoursText += `평일: ${hours.weekday}\n`;
    if (hours.saturday) hoursText += `토요일: ${hours.saturday}\n`;
    if (hours.sunday) hoursText += `일요일: ${hours.sunday}\n`;
    if (hours.holiday) hoursText += `공휴일: ${hours.holiday}\n`;

    return NextResponse.json(createTextResponse(hoursText));
  }

  return NextResponse.json(
    createTextResponse(
      "🕐 영업시간 안내\n\n평일: 06:00 - 23:00\n토요일: 09:00 - 18:00\n일요일/공휴일: 10:00 - 17:00"
    )
  );
}

// 위치 문의 처리
async function handleLocationInquiry(userMessage: string) {
  const supabase = getSupabaseAdmin();
  const gymId = process.env.DEFAULT_GYM_ID;

  if (!gymId) {
    return NextResponse.json(
      createTextResponse(
        "위치 정보를 가져올 수 없습니다. 고객센터로 문의해주세요."
      )
    );
  }

  const { data: gym } = await supabase
    .from("gyms")
    .select("name, address, phone")
    .eq("id", gymId)
    .maybeSingle();

  const { data: settings } = await supabase
    .from("gym_auto_response_settings")
    .select("location_info, parking_info")
    .eq("gym_id", gymId)
    .maybeSingle();

  let locationText = "📍 오시는 길\n\n";

  if (gym?.address) {
    locationText += `주소: ${gym.address}\n`;
  }

  if (settings?.location_info) {
    locationText += `\n${settings.location_info}\n`;
  }

  if (settings?.parking_info) {
    locationText += `\n🅿️ 주차 안내\n${settings.parking_info}`;
  }

  if (gym?.phone) {
    locationText += `\n\n☎️ 문의: ${gym.phone}`;
  }

  return NextResponse.json(createTextResponse(locationText));
}

// 체험 신청 처리
async function handleTrialRequest(userMessage: string, userKey: string) {
  const supabase = getSupabaseAdmin();
  const gymId = process.env.DEFAULT_GYM_ID;
  const companyId = process.env.DEFAULT_COMPANY_ID;

  if (!gymId || !companyId) {
    return NextResponse.json(
      createTextResponse(
        "체험 신청을 처리할 수 없습니다. 전화로 문의해주세요."
      )
    );
  }

  // 문의 생성
  await supabase.from("inquiries").insert({
    gym_id: gymId,
    company_id: companyId,
    channel: "kakao",
    channel_id: userKey,
    inquiry_type: "trial",
    content: userMessage || "무료 체험 신청",
    status: "new",
    priority: "high",
  });

  return NextResponse.json(
    createTextResponse(
      "✅ 무료 체험 신청이 접수되었습니다!\n\n담당자가 확인 후 연락드리겠습니다.\n\n빠른 상담을 원하시면 전화주세요."
    )
  );
}

// PT 문의 처리
async function handlePTInquiry(userMessage: string) {
  return NextResponse.json(
    createQuickReplyResponse(
      "💪 PT(개인 트레이닝) 문의를 주셨네요!\n\n저희 센터는 1:1 맞춤 트레이닝을 제공합니다.\n\n무료 체험 PT를 통해 직접 경험해보세요!",
      [
        { label: "PT 가격", action: "block", blockId: "가격문의" },
        { label: "무료 체험", action: "block", blockId: "체험신청" },
        { label: "상담 예약", action: "block", blockId: "상담예약" },
      ]
    )
  );
}

// 회원권 문의 처리
async function handleMembershipInquiry(userMessage: string) {
  return NextResponse.json(
    createQuickReplyResponse(
      "🏋️ 회원권 문의를 주셨네요!\n\n다양한 회원권 옵션이 준비되어 있습니다.\n\n어떤 정보가 필요하신가요?",
      [
        { label: "가격 안내", action: "block", blockId: "가격문의" },
        { label: "영업 시간", action: "block", blockId: "영업시간문의" },
        { label: "무료 체험", action: "block", blockId: "체험신청" },
      ]
    )
  );
}

// 상담 예약 처리
async function handleReservationRequest(
  userMessage: string,
  userKey: string,
  params?: Record<string, unknown>
) {
  const supabase = getSupabaseAdmin();
  const gymId = process.env.DEFAULT_GYM_ID;
  const companyId = process.env.DEFAULT_COMPANY_ID;

  if (!gymId || !companyId) {
    return NextResponse.json(
      createTextResponse("예약을 처리할 수 없습니다. 전화로 문의해주세요.")
    );
  }

  // 파라미터에서 날짜/시간 추출
  const dateParam = params?.date as { value?: string } | undefined;
  const timeParam = params?.time as { value?: string } | undefined;

  if (dateParam?.value && timeParam?.value) {
    // 예약 생성
    const { data: inquiry } = await supabase
      .from("inquiries")
      .insert({
        gym_id: gymId,
        company_id: companyId,
        channel: "kakao",
        channel_id: userKey,
        inquiry_type: "trial",
        content: `상담 예약 요청: ${dateParam.value} ${timeParam.value}`,
        status: "new",
        priority: "high",
      })
      .select("id")
      .single();

    if (inquiry) {
      await supabase.from("reservations").insert({
        gym_id: gymId,
        inquiry_id: inquiry.id,
        reservation_type: "consultation",
        customer_name: "카카오 고객",
        scheduled_date: dateParam.value,
        scheduled_time: timeParam.value,
        status: "pending",
        notes: "카카오 챗봇을 통한 예약",
      });
    }

    return NextResponse.json(
      createTextResponse(
        `📅 상담 예약 요청이 접수되었습니다!\n\n일시: ${dateParam.value} ${timeParam.value}\n\n담당자 확인 후 예약 확정 안내를 드리겠습니다.`
      )
    );
  }

  // 날짜/시간 정보가 없으면 안내 메시지
  return NextResponse.json(
    createTextResponse(
      "📅 상담 예약을 도와드리겠습니다.\n\n원하시는 날짜와 시간을 말씀해주세요.\n\n예) 내일 오후 2시, 이번 주 토요일 11시"
    )
  );
}

// AI 응답 처리 (폴백)
async function handleAIResponse(userMessage: string, userKey: string) {
  const supabase = getSupabaseAdmin();
  const gymId = process.env.DEFAULT_GYM_ID;

  // 헬스장 정보 조회
  const { data: gym } = await supabase
    .from("gyms")
    .select("name, address, phone")
    .eq("id", gymId)
    .maybeSingle();

  const { data: settings } = await supabase
    .from("gym_auto_response_settings")
    .select("*")
    .eq("gym_id", gymId)
    .maybeSingle();

  try {
    const claude = getClaudeClient();

    const systemPrompt = `당신은 피트니스 센터의 친절한 상담원입니다.
고객 문의에 정확하고 친절하게 답변합니다.

## 센터 정보
- 센터명: ${gym?.name || "헬스장"}
- 주소: ${gym?.address || "문의 바랍니다"}
- 연락처: ${gym?.phone || "문의 바랍니다"}
${settings?.business_hours ? `- 영업시간: ${JSON.stringify(settings.business_hours)}` : ""}
${settings?.location_info ? `- 위치 안내: ${settings.location_info}` : ""}
${settings?.parking_info ? `- 주차 안내: ${settings.parking_info}` : ""}

## 가격 정보
${settings?.pricing ? JSON.stringify(settings.pricing, null, 2) : "가격은 방문 상담 또는 전화 문의 부탁드립니다."}

## 응답 규칙
1. 항상 존대말로 정중하게 답변합니다.
2. 150자 이내로 간결하게 작성합니다.
3. 이모지는 사용하지 않습니다.
4. 상담/체험 예약으로 자연스럽게 연결합니다.
5. 카카오톡 메시지로 표시되므로 줄바꿈을 적절히 사용합니다.`;

    const response = await claude.messages.create({
      model: CLAUDE_MODELS.FAST,
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const aiResponse =
      response.content[0].type === "text" ? response.content[0].text : "";

    // 문의 저장
    await supabase.from("inquiries").insert({
      gym_id: gymId,
      company_id: process.env.DEFAULT_COMPANY_ID,
      channel: "kakao",
      channel_id: userKey,
      inquiry_type: "etc",
      content: userMessage,
      status: "new",
      priority: "normal",
      ai_responded: true,
      ai_response_content: aiResponse,
      ai_responded_at: new Date().toISOString(),
    });

    return NextResponse.json(
      createQuickReplyResponse(aiResponse, [
        { label: "가격 문의", action: "block", blockId: "가격문의" },
        { label: "무료 체험", action: "block", blockId: "체험신청" },
        { label: "상담 예약", action: "block", blockId: "상담예약" },
      ])
    );
  } catch (error) {
    console.error("[Kakao Skill] AI Error:", error);
    return NextResponse.json(
      createQuickReplyResponse(
        "문의해주셔서 감사합니다.\n\n더 자세한 상담을 원하시면 아래 버튼을 눌러주세요.",
        [
          { label: "가격 문의", action: "block", blockId: "가격문의" },
          { label: "무료 체험", action: "block", blockId: "체험신청" },
          { label: "상담 예약", action: "block", blockId: "상담예약" },
        ]
      )
    );
  }
}
