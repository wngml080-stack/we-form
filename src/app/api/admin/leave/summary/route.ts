import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

// 직원별 연차 현황 요약
export async function GET(request: Request) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const gymId = searchParams.get("gym_id");

    const supabase = getSupabaseAdmin();

    // 연차 부여 조회
    let allowanceQuery = supabase
      .from("leave_allowances")
      .select(`
        *,
        staff:staffs(id, name, gym_id, gyms(name))
      `)
      .eq("year", year);

    if (staff.role === "company_admin") {
      allowanceQuery = allowanceQuery.eq("company_id", staff.company_id);
    } else if (staff.role === "admin") {
      allowanceQuery = allowanceQuery.eq("gym_id", staff.gym_id);
    } else if (staff.role === "staff") {
      allowanceQuery = allowanceQuery.eq("staff_id", staff.id);
    }

    if (gymId) {
      allowanceQuery = allowanceQuery.eq("gym_id", gymId);
    }

    const { data: allowances, error: allowanceError } = await allowanceQuery;

    if (allowanceError) {
      return NextResponse.json({ error: allowanceError.message }, { status: 500 });
    }

    // 각 직원의 사용 연차 계산
    const summaries = await Promise.all(
      (allowances || []).map(async (allowance) => {
        const staffData = allowance.staff as unknown as { id: string; name: string; gym_id: string; gyms: { name: string } | null };

        // 승인된 연차 계산
        const { data: approvedRequests } = await supabase
          .from("leave_requests")
          .select("total_days")
          .eq("staff_id", allowance.staff_id)
          .eq("status", "approved")
          .gte("start_date", `${year}-01-01`)
          .lte("start_date", `${year}-12-31`);

        const usedDays = approvedRequests?.reduce((sum, req) => sum + req.total_days, 0) || 0;

        // 대기 중인 연차 계산
        const { data: pendingRequests } = await supabase
          .from("leave_requests")
          .select("total_days")
          .eq("staff_id", allowance.staff_id)
          .eq("status", "pending")
          .gte("start_date", `${year}-01-01`)
          .lte("start_date", `${year}-12-31`);

        const pendingDays = pendingRequests?.reduce((sum, req) => sum + req.total_days, 0) || 0;

        const totalDays = allowance.total_days + allowance.carried_over + allowance.adjusted_days;
        const remainingDays = totalDays - usedDays;

        return {
          staff_id: allowance.staff_id,
          staff_name: staffData?.name || "Unknown",
          gym_name: staffData?.gyms?.name || null,
          year,
          total_days: totalDays,
          used_days: usedDays,
          remaining_days: remainingDays,
          pending_days: pendingDays,
        };
      })
    );

    return NextResponse.json({ summaries });
  } catch (error: unknown) {
    console.error("[LeaveSummary GET] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
