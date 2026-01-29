import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

// 연차 통계 데이터
export async function GET(request: Request) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isAdmin(staff.role)) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const gymId = searchParams.get("gym_id");

    const supabase = getSupabaseAdmin();

    // 기본 쿼리 조건
    let companyCondition = "";
    if (staff.role === "company_admin") {
      companyCondition = staff.company_id || "";
    }
    const gymCondition = gymId || (staff.role === "admin" ? staff.gym_id : null);

    // 1. 전체 연차 부여 통계
    let allowanceQuery = supabase
      .from("leave_allowances")
      .select("total_days, carried_over, adjusted_days")
      .eq("year", year);

    if (companyCondition) {
      allowanceQuery = allowanceQuery.eq("company_id", companyCondition);
    }
    if (gymCondition) {
      allowanceQuery = allowanceQuery.eq("gym_id", gymCondition);
    }

    const { data: allowances } = await allowanceQuery;

    const totalAllowance = allowances?.reduce((sum, a) =>
      sum + a.total_days + a.carried_over + a.adjusted_days, 0) || 0;

    // 2. 승인된 휴가 사용량
    let requestQuery = supabase
      .from("leave_requests")
      .select(`
        total_days,
        status,
        start_date,
        leave_type:leave_types(code, name)
      `)
      .gte("start_date", `${year}-01-01`)
      .lte("start_date", `${year}-12-31`);

    if (companyCondition) {
      requestQuery = requestQuery.eq("company_id", companyCondition);
    }
    if (gymCondition) {
      requestQuery = requestQuery.eq("gym_id", gymCondition);
    }

    const { data: requests } = await requestQuery;

    // 상태별 통계
    const statusStats = {
      approved: 0,
      pending: 0,
      rejected: 0,
      cancelled: 0,
    };

    // 월별 통계
    const monthlyStats: Record<number, number> = {};
    for (let i = 1; i <= 12; i++) {
      monthlyStats[i] = 0;
    }

    // 휴가 유형별 통계
    const typeStats: Record<string, { name: string; days: number; count: number }> = {};

    for (const req of requests || []) {
      statusStats[req.status as keyof typeof statusStats] += req.total_days;

      if (req.status === "approved") {
        const month = new Date(req.start_date).getMonth() + 1;
        monthlyStats[month] += req.total_days;

        const leaveType = req.leave_type as unknown as { code: string; name: string } | null;
        if (leaveType) {
          if (!typeStats[leaveType.code]) {
            typeStats[leaveType.code] = { name: leaveType.name, days: 0, count: 0 };
          }
          typeStats[leaveType.code].days += req.total_days;
          typeStats[leaveType.code].count += 1;
        }
      }
    }

    // 3. 대기 중인 신청 건수
    let pendingQuery = supabase
      .from("leave_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    if (companyCondition) {
      pendingQuery = pendingQuery.eq("company_id", companyCondition);
    }
    if (gymCondition) {
      pendingQuery = pendingQuery.eq("gym_id", gymCondition);
    }

    const { count: pendingCount } = await pendingQuery;

    // 4. 직원 수
    let staffQuery = supabase
      .from("leave_allowances")
      .select("staff_id", { count: "exact", head: true })
      .eq("year", year);

    if (companyCondition) {
      staffQuery = staffQuery.eq("company_id", companyCondition);
    }
    if (gymCondition) {
      staffQuery = staffQuery.eq("gym_id", gymCondition);
    }

    const { count: staffCount } = await staffQuery;

    return NextResponse.json({
      stats: {
        year,
        overview: {
          totalStaff: staffCount || 0,
          totalAllowance,
          usedDays: statusStats.approved,
          pendingDays: statusStats.pending,
          remainingDays: totalAllowance - statusStats.approved,
          utilizationRate: totalAllowance > 0
            ? Math.round((statusStats.approved / totalAllowance) * 100)
            : 0,
        },
        pendingCount: pendingCount || 0,
        monthly: Object.entries(monthlyStats).map(([month, days]) => ({
          month: parseInt(month),
          days,
        })),
        byType: Object.entries(typeStats).map(([code, data]) => ({
          code,
          name: data.name,
          days: data.days,
          count: data.count,
        })),
        byStatus: statusStats,
      },
    });
  } catch (error: unknown) {
    console.error("[LeaveStats GET] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
