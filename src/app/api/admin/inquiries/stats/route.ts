import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";

// 문의 통계 조회
export async function GET(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gym_id = searchParams.get("gym_id");

    if (!gym_id) {
      return NextResponse.json({ error: "gym_id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 권한 확인
    const { data: gym } = await supabase
      .from("gyms")
      .select("company_id")
      .eq("id", gym_id)
      .maybeSingle();

    if (!canAccessGym(staff, gym_id, gym?.company_id)) {
      return NextResponse.json({ error: "해당 지점에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // 이번 주 시작일 (월요일)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    // 이번 달 시작일
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().split("T")[0];

    // 오늘 문의 수
    const { count: todayCount } = await supabase
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .eq("gym_id", gym_id)
      .gte("created_at", `${todayStr}T00:00:00`)
      .lte("created_at", `${todayStr}T23:59:59`);

    // 이번 주 문의 수
    const { count: weekCount } = await supabase
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .eq("gym_id", gym_id)
      .gte("created_at", `${weekStartStr}T00:00:00`);

    // 이번 달 문의 수
    const { count: monthCount } = await supabase
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .eq("gym_id", gym_id)
      .gte("created_at", `${monthStartStr}T00:00:00`);

    // 미처리 문의 수 (new, in_progress 상태)
    const { count: pendingCount } = await supabase
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .eq("gym_id", gym_id)
      .in("status", ["new", "in_progress"]);

    // 채널별 통계
    const { data: channelStats } = await supabase
      .from("inquiries")
      .select("channel")
      .eq("gym_id", gym_id)
      .gte("created_at", `${monthStartStr}T00:00:00`);

    const channelCounts: Record<string, number> = {};
    channelStats?.forEach((item) => {
      channelCounts[item.channel] = (channelCounts[item.channel] || 0) + 1;
    });

    // 상태별 통계
    const { data: statusStats } = await supabase
      .from("inquiries")
      .select("status")
      .eq("gym_id", gym_id)
      .gte("created_at", `${monthStartStr}T00:00:00`);

    const statusCounts: Record<string, number> = {};
    statusStats?.forEach((item) => {
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
    });

    // 전환율 (converted / total)
    const totalMonth = monthCount || 0;
    const convertedCount = statusCounts["converted"] || 0;
    const conversionRate = totalMonth > 0 ? (convertedCount / totalMonth) * 100 : 0;

    return NextResponse.json({
      stats: {
        today: todayCount || 0,
        week: weekCount || 0,
        month: monthCount || 0,
        pending: pendingCount || 0,
        conversionRate: Math.round(conversionRate * 10) / 10,
      },
      byChannel: channelCounts,
      byStatus: statusCounts,
    });
  } catch (error) {
    console.error("[Inquiry Stats API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
