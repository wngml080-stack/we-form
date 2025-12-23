import { NextResponse, NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";

type YearMonth = `${number}-${"01"|"02"|"03"|"04"|"05"|"06"|"07"|"08"|"09"|"10"|"11"|"12"}`;

function parseYearMonth(yearMonth: string): { start: string; end: string } {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(yearMonth)) {
    throw new Error("yearMonth는 YYYY-MM 형식이어야 합니다.");
  }
  const [year, month] = yearMonth.split("-").map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  };
}

function calculateStats(schedules: { status?: string | null; schedule_type?: string | null }[]) {
  const stats: Record<string, number> = {};
  for (const s of schedules) {
    const statusKey = s.status ?? "unknown_status";
    const typeKey = s.schedule_type ?? "unknown_type";
    stats[`status_${statusKey}`] = (stats[`status_${statusKey}`] ?? 0) + 1;
    stats[`type_${typeKey}`] = (stats[`type_${typeKey}`] ?? 0) + 1;
    stats.total = (stats.total ?? 0) + 1;
  }
  return stats;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const yearMonth = body?.yearMonth as YearMonth | undefined;

    if (!yearMonth) {
      return NextResponse.json({ error: "yearMonth가 필요합니다. (예: 2025-01)" }, { status: 400 });
    }

    // 통합 인증
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    // 퇴사 상태 및 추가 정보 확인
    const { data: staffDetail } = await supabase
      .from("staffs")
      .select("employment_status, company_id")
      .eq("id", staff.id)
      .single();

    if (staffDetail?.employment_status === "퇴사") {
      return NextResponse.json({ error: "퇴사한 계정은 사용할 수 없습니다." }, { status: 403 });
    }

    // 월 범위 계산
    const { start, end } = parseYearMonth(yearMonth);

    // 월간 스케줄 가져와서 통계 계산
    const { data: schedules, error: schedulesError } = await supabase
      .from("schedules")
      .select("id, status, schedule_type")
      .eq("gym_id", staff.gym_id)
      .eq("staff_id", staff.id)
      .gte("start_time", start)
      .lt("start_time", end);

    if (schedulesError) {
      return NextResponse.json({ error: "스케줄 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    const stats = calculateStats(schedules ?? []);

    // monthly_schedule_reports 업서트
    const { data: report, error: reportError } = await supabase
      .from("monthly_schedule_reports")
      .upsert(
        {
          staff_id: staff.id,
          gym_id: staff.gym_id,
          company_id: staffDetail?.company_id || staff.company_id,
          year_month: yearMonth,
          stats,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "staff_id,year_month" }
      )
      .select()
      .single();

    if (reportError || !report) {
      console.error("보고서 생성 에러:", reportError);
      return NextResponse.json({ error: `보고서 생성 중 오류: ${reportError?.message || "알 수 없는 오류"}` }, { status: 500 });
    }

    // 해당 월 스케줄에 report_id 설정 및 잠금
    const { error: updateSchedulesError } = await supabase
      .from("schedules")
      .update({ report_id: report.id, is_locked: true })
      .eq("gym_id", staff.gym_id)
      .eq("staff_id", staff.id)
      .gte("start_time", start)
      .lt("start_time", end);

    if (updateSchedulesError) {
      console.error("스케줄 잠금 에러:", updateSchedulesError);
      return NextResponse.json({ error: `스케줄 잠금 중 오류: ${updateSchedulesError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      report,
      stats,
      message: "월별 스케줄을 제출했습니다. 관리자가 승인할 때까지 잠금 상태입니다.",
    });
  } catch (error: any) {
    console.error("❌ submit 오류:", error?.message ?? error);
    return NextResponse.json({ error: error?.message ?? "제출 중 오류가 발생했습니다." }, { status: 500 });
  }
}
