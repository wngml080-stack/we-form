import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 권한 확인 (admin, company_admin, system_admin만 접근 가능)
    if (!["admin", "company_admin", "system_admin"].includes(staff.role || "")) {
      return NextResponse.json(
        { error: "접근 권한이 없습니다." },
        { status: 403 }
      );
    }

    const { reportId } = await params;

    if (!reportId) {
      return NextResponse.json(
        { error: "reportId는 필수입니다." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. 보고서 정보 조회 (staff_id, gym_id, year_month 필요)
    const { data: report, error: reportError } = await supabaseAdmin
      .from("monthly_schedule_reports")
      .select("id, staff_id, gym_id, year_month, status")
      .eq("id", reportId)
      .maybeSingle();

    if (reportError) {
      console.error("[ReportSchedules] 보고서 조회 오류:", reportError);
      return NextResponse.json(
        { error: "보고서 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    if (!report) {
      return NextResponse.json(
        { error: "보고서를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 2. 해당 월의 시작/종료일 계산
    const [year, month] = report.year_month.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // 3. 해당 직원의 해당 월 스케줄 조회
    const { data: schedules, error: schedulesError } = await supabaseAdmin
      .from("schedules")
      .select(`
        id,
        member_id,
        member_name,
        type,
        status,
        start_time,
        end_time,
        title,
        schedule_type,
        sub_type,
        inbody_checked,
        counted_for_salary,
        members(id, name)
      `)
      .eq("staff_id", report.staff_id)
      .eq("gym_id", report.gym_id)
      .gte("start_time", startDate.toISOString())
      .lte("start_time", endDate.toISOString())
      .order("start_time", { ascending: true });

    if (schedulesError) {
      throw schedulesError;
    }

    // 4. 스케줄 데이터 가공
    const formattedSchedules = (schedules || []).map((schedule: any) => ({
      id: schedule.id,
      date: new Date(schedule.start_time).toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
        weekday: "short",
      }),
      time: `${new Date(schedule.start_time).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })} - ${new Date(schedule.end_time).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })}`,
      type: schedule.type,
      member_name: schedule.members?.name || schedule.member_name || "-",
      status: schedule.status,
      schedule_type: schedule.schedule_type,
      sub_type: schedule.sub_type,
      inbody_checked: schedule.inbody_checked,
      counted_for_salary: schedule.counted_for_salary,
    }));

    // 5. 상태별 요약
    const statusSummary = {
      completed: 0,
      reserved: 0,
      no_show: 0,
      no_show_deducted: 0,
      cancelled: 0,
      service: 0,
    };

    formattedSchedules.forEach((s: any) => {
      const status = s.status as keyof typeof statusSummary;
      if (statusSummary[status] !== undefined) {
        statusSummary[status]++;
      }
    });

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        staff_id: report.staff_id,
        year_month: report.year_month,
        status: report.status,
      },
      schedules: formattedSchedules,
      summary: {
        total: formattedSchedules.length,
        ...statusSummary,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
