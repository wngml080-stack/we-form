import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";
import { getClaudeClient, CLAUDE_MODELS } from "@/lib/ai/claude";

// AI 문의 응답 생성
export async function POST(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { inquiry_id, content } = await request.json();

    if (!inquiry_id && !content) {
      return NextResponse.json(
        { error: "inquiry_id 또는 content가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    let gymId: string;
    let inquiryContent: string;
    let customerName: string | null = null;

    if (inquiry_id) {
      // 문의 조회
      const { data: inquiry, error: inquiryError } = await supabase
        .from("inquiries")
        .select("*")
        .eq("id", inquiry_id)
        .single();

      if (inquiryError || !inquiry) {
        return NextResponse.json({ error: "문의를 찾을 수 없습니다." }, { status: 404 });
      }

      gymId = inquiry.gym_id;
      inquiryContent = inquiry.content || inquiry.subject || "";
      customerName = inquiry.customer_name;

      // 권한 확인
      const { data: gym } = await supabase
        .from("gyms")
        .select("company_id")
        .eq("id", gymId)
        .maybeSingle();

      if (!canAccessGym(staff, gymId, gym?.company_id)) {
        return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
      }
    } else {
      // 직접 content 제공 시
      if (!staff.gym_id) {
        return NextResponse.json({ error: "지점 정보가 없습니다." }, { status: 400 });
      }
      gymId = staff.gym_id;
      inquiryContent = content;
    }

    // 헬스장 설정 조회
    const { data: settings } = await supabase
      .from("gym_auto_response_settings")
      .select("*")
      .eq("gym_id", gymId)
      .maybeSingle();

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
- 영업시간: ${settings?.business_hours ? JSON.stringify(settings.business_hours) : "평일 06:00-23:00, 주말 09:00-18:00"}
${settings?.location_info ? `- 위치 안내: ${settings.location_info}` : ""}
${settings?.parking_info ? `- 주차 안내: ${settings.parking_info}` : ""}

## 가격 정보
${settings?.pricing ? JSON.stringify(settings.pricing, null, 2) : "가격은 방문 상담 또는 전화 문의 부탁드립니다."}

## 응답 규칙
1. 항상 존대말로 정중하게 답변합니다.
2. 가격은 정확한 정보만 제공합니다. 모르면 "방문 상담 또는 전화 문의"를 권유합니다.
3. 상담/체험 예약으로 자연스럽게 연결합니다.
4. 150자 이내로 간결하게 작성합니다.
5. 이모지는 사용하지 않습니다.

## 답변 불가 케이스
- 클레임/환불 문의 → "담당자가 확인 후 연락드리겠습니다"
- 복잡한 계약 문의 → "방문 상담을 권유드립니다"`;

    const userMessage = customerName
      ? `고객명: ${customerName}\n문의 내용: ${inquiryContent}`
      : `문의 내용: ${inquiryContent}`;

    const response = await claude.messages.create({
      model: settings?.ai_model || CLAUDE_MODELS.FAST,
      max_tokens: settings?.ai_max_tokens || 500,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const aiResponse =
      response.content[0].type === "text" ? response.content[0].text : "";

    // 문의에 AI 응답 저장
    if (inquiry_id) {
      await supabase
        .from("inquiries")
        .update({
          ai_responded: true,
          ai_response_content: aiResponse,
          ai_responded_at: new Date().toISOString(),
        })
        .eq("id", inquiry_id);
    }

    return NextResponse.json({
      response: aiResponse,
      model: settings?.ai_model || CLAUDE_MODELS.FAST,
    });
  } catch (error) {
    console.error("[AI Inquiry Response API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI 응답 생성 실패" },
      { status: 500 }
    );
  }
}
