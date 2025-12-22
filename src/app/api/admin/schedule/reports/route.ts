import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin, canAccessGym } from "@/lib/api/auth";

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
    const companyId = searchParams.get("company_id");
    const status = searchParams.get("status");
    const yearMonth = searchParams.get("year_month");

    if (!gymId) {
      return NextResponse.json({ error: "gym_id is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 지점 권한 확인
    const { data: gym } = await supabase
      .from("gyms")
      .select("company_id")
      .eq("id", gymId)
      .single();

    if (!canAccessGym(staff, gymId, gym?.company_id)) {
      return NextResponse.json(
        { error: "해당 지점에 대한 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 보고서 조회
    let query = supabase
      .from("monthly_schedule_reports")
      .select("*")
      .eq("gym_id", gymId)
      .order("submitted_at", { ascending: false });

    if (companyId) {
      query = query.eq("company_id", companyId);
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
      .select("id, name, job_title")
      .in("id", staffIds);

    // 보고서에 staff 정보 매핑
    const staffMap = new Map(staffsData?.map(s => [s.id, s]) || []);
    const reportsWithStaff = reportsData.map(report => ({
      ...report,
      staffs: staffMap.get(report.staff_id) || null,
    }));

    return NextResponse.json({ success: true, reports: reportsWithStaff });
  } catch (error: any) {
    console.error("[API] Error fetching schedule reports:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
