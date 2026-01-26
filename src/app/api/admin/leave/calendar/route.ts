import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";
import { LeaveCalendarEvent } from "@/types/database";

// 캘린더용 휴가 데이터
export async function GET(request: Request) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const gymId = searchParams.get("gym_id");
    const staffId = searchParams.get("staff_id");

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "시작일과 종료일은 필수입니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("leave_requests")
      .select(`
        id,
        staff_id,
        start_date,
        end_date,
        total_days,
        is_half_day,
        half_day_type,
        status,
        staff:staffs(id, name),
        leave_type:leave_types(id, name, color)
      `)
      .neq("status", "cancelled")
      .neq("status", "rejected")
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

    // 권한에 따른 필터링
    if (staff.role === "system_admin") {
      // 시스템 관리자: 모든 회사
    } else if (staff.role === "company_admin") {
      query = query.eq("company_id", staff.company_id);
    } else if (staff.role === "admin") {
      query = query.eq("gym_id", staff.gym_id);
    } else {
      // 일반 직원: 같은 지점 직원들 (휴가 현황 공유)
      query = query.eq("gym_id", staff.gym_id);
    }

    if (gymId) {
      query = query.eq("gym_id", gymId);
    }
    if (staffId) {
      query = query.eq("staff_id", staffId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 캘린더 이벤트 형식으로 변환
    const events: LeaveCalendarEvent[] = (data || []).map(req => {
      // Supabase 조인 결과는 단일 객체 또는 배열일 수 있음
      const staffData = req.staff as unknown as { id: string; name: string } | null;
      const leaveTypeData = req.leave_type as unknown as { id: string; name: string; color: string } | null;

      return {
        id: req.id,
        staff_id: req.staff_id,
        staff_name: staffData?.name || "Unknown",
        leave_type_name: leaveTypeData?.name || "Unknown",
        leave_type_color: leaveTypeData?.color || "#3B82F6",
        start_date: req.start_date,
        end_date: req.end_date,
        total_days: req.total_days,
        is_half_day: req.is_half_day,
        half_day_type: req.half_day_type,
        status: req.status,
      };
    });

    return NextResponse.json({ events });
  } catch (error: unknown) {
    console.error("[LeaveCalendar GET] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
