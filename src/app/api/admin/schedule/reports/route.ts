import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

export async function GET(request: Request) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isAdmin(staff.role)) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const gymId = searchParams.get("gym_id");
    const allGyms = searchParams.get("all_gyms") === "true";
    const status = searchParams.get("status");
    const yearMonth = searchParams.get("year_month");

    const supabase = getSupabaseAdmin();

    // 보고서 조회 쿼리 생성
    let query = supabase
      .from("monthly_schedule_reports")
      .select("*")
      .order("submitted_at", { ascending: false });

    // 역할별 필터링
    if (staff.role === "system_admin") {
      // system_admin: 전체 또는 특정 지점
      if (gymId && !allGyms) {
        query = query.eq("gym_id", gymId);
      }
      // allGyms면 필터 없음 (전체 조회)
    } else if (staff.role === "company_admin") {
      // company_admin: 자기 회사만
      query = query.eq("company_id", staff.company_id);
      if (gymId && !allGyms) {
        query = query.eq("gym_id", gymId);
      }
    } else if (staff.role === "admin") {
      // admin: 자기 지점만
      query = query.eq("gym_id", staff.gym_id);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (yearMonth) {
      query = query.eq("year_month", yearMonth);
    }

    const { data: reportsData, error: reportsError } = await query;
    if (reportsError) {
      return NextResponse.json({ error: reportsError.message }, { status: 500 });
    }

    if (!reportsData || reportsData.length === 0) {
      return NextResponse.json({ success: true, reports: [] });
    }

    // 관련된 staff 정보 별도 조회
    const staffIds = [...new Set(reportsData.map(r => r.staff_id))];
    const { data: staffsData } = await supabase
      .from("staffs")
      .select("id, name, email, job_title")
      .in("id", staffIds);

    // 보고서에 staff 정보 매핑
    const staffMap = new Map(staffsData?.map(s => [s.id, s]) || []);
    const reportsWithStaff = reportsData.map(report => ({
      ...report,
      staffs: staffMap.get(report.staff_id) || null,
    }));

    return NextResponse.json({ success: true, reports: reportsWithStaff });
  } catch (error: unknown) {
    console.error("[ScheduleReports] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
