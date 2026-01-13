import { NextRequest, NextResponse } from "next/server";
import { getClaudeClient, CLAUDE_MODELS } from "@/lib/ai/claude";
import { SYSTEM_PROMPTS, buildContextPrompt } from "@/lib/ai/prompts";
import { executeAiTool } from "@/lib/ai/tool-executor";
import { authenticateRequest, isAdmin } from "@/lib/api/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Insight {
  type: "opportunity" | "warning" | "info";
  title: string;
  description: string;
  metric?: string;
  priority: "high" | "medium" | "low";
}

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    if (!staff || !isAdmin(staff.role)) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const gymId = searchParams.get("gym_id") || staff.gym_id;

    if (!gymId) {
      return NextResponse.json({ error: "gym_id가 필요합니다." }, { status: 400 });
    }

    // 센터 정보 조회
    const supabase = getSupabaseAdmin();
    const { data: gym } = await supabase
      .from("gyms")
      .select("name")
      .eq("id", gymId)
      .single();

    const gymName = gym?.name || "센터";

    // 운영 지표 수집
    const [churnRisk, renewalOpportunity, noShowRate] = await Promise.all([
      executeAiTool("get_operation_metrics", { metric_type: "churn_risk", period: "week" }, gymId),
      executeAiTool("get_operation_metrics", { metric_type: "renewal_opportunity", period: "month" }, gymId),
      executeAiTool("get_operation_metrics", { metric_type: "no_show_rate", period: "week" }, gymId),
    ]);

    // 매출 통계
    const salesStats = await executeAiTool("get_sales_stats", { period: "this_month" }, gymId);

    // 컨텍스트 구성
    const contextData = {
      churn_risk: churnRisk,
      renewal_opportunity: renewalOpportunity,
      no_show_rate: noShowRate,
      sales: salesStats,
    };

    // Claude로 인사이트 생성
    const claude = getClaudeClient();
    const contextPrompt = buildContextPrompt(gymName, contextData);

    const response = await claude.messages.create({
      model: CLAUDE_MODELS.FAST,
      max_tokens: 1024,
      system: SYSTEM_PROMPTS.INSIGHTS_GENERATOR,
      messages: [
        {
          role: "user",
          content: `${contextPrompt}

위 데이터를 분석하여 3개의 핵심 경영 인사이트를 JSON 배열 형식으로 제공해주세요.
각 인사이트는 다음 필드를 포함해야 합니다:
- type: "opportunity" | "warning" | "info"
- title: 간결한 제목 (15자 이내)
- description: 구체적인 설명과 추천 액션 (100자 이내)
- priority: "high" | "medium" | "low"

JSON 배열만 출력하세요. 다른 텍스트는 포함하지 마세요.`,
        },
      ],
    });

    // 텍스트 응답 추출
    const textContent = response.content.find(
      (block) => block.type === "text"
    );

    let insights: Insight[] = [];
    if (textContent && "text" in textContent) {
      try {
        // JSON 파싱 시도
        const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          insights = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error("[AI Insights] JSON parse error:", parseError);
        // 파싱 실패 시 기본 인사이트 제공
        insights = generateFallbackInsights(contextData);
      }
    } else {
      insights = generateFallbackInsights(contextData);
    }

    return NextResponse.json({
      success: true,
      insights,
      rawData: contextData,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[AI Insights] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "인사이트 생성 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

function generateFallbackInsights(data: Record<string, unknown>): Insight[] {
  const insights: Insight[] = [];

  // 이탈 위험 인사이트
  const churnRisk = data.churn_risk as { value?: number } | undefined;
  if (churnRisk?.value && churnRisk.value > 0) {
    insights.push({
      type: "warning",
      title: "이탈 위험군 감지",
      description: `최근 미출석 회원 ${churnRisk.value}명이 감지되었습니다. 케어 문자 발송을 권장합니다.`,
      priority: churnRisk.value > 5 ? "high" : "medium",
    });
  }

  // 재등록 기회 인사이트
  const renewal = data.renewal_opportunity as { value?: number } | undefined;
  if (renewal?.value && renewal.value > 0) {
    insights.push({
      type: "opportunity",
      title: "재등록 가능성 높은 회원",
      description: `만료 예정 회원 ${renewal.value}명에게 재등록 상담을 제안해보세요.`,
      priority: "high",
    });
  }

  // 노쇼율 인사이트
  const noShow = data.no_show_rate as { value?: number } | undefined;
  if (noShow?.value && noShow.value > 10) {
    insights.push({
      type: "info",
      title: "노쇼율 주의",
      description: `최근 노쇼율이 ${noShow.value}%입니다. 예약 알림 시간 조정을 고려해보세요.`,
      priority: noShow.value > 20 ? "high" : "medium",
    });
  }

  // 최소 하나의 인사이트 보장
  if (insights.length === 0) {
    insights.push({
      type: "info",
      title: "운영 상태 양호",
      description: "현재 특별한 주의가 필요한 지표가 없습니다. 좋은 운영을 유지하고 있습니다.",
      priority: "low",
    });
  }

  return insights;
}
