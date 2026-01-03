import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin, canAccessGym } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/response";

interface DashboardStats {
  members: {
    total: number;
    active: number;
    new_this_month: number;
  };
  schedules: {
    today: number;
    this_week: number;
    pending: number;
    completed: number;
  };
  revenue: {
    today: number;
    this_month: number;
    last_month: number;
  };
  pt: {
    active_memberships: number;
    expiring_soon: number;
    sessions_remaining: number;
  };
}

export async function GET(request: Request) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isAdmin(staff.role)) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const gymId = searchParams.get("gym_id") || staff.gym_id;
    const companyId = searchParams.get("company_id") || staff.company_id;

    if (!gymId) {
      return NextResponse.json(
        { error: "gym_id is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 지점 권한 확인
    const { data: gym, error: gymError } = await supabase
      .from("gyms")
      .select("company_id")
      .eq("id", gymId)
      .maybeSingle();

    if (gymError) {
      console.error("[DashboardStats] 지점 조회 오류:", gymError);
      return NextResponse.json(
        { error: "지점 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    if (!canAccessGym(staff, gymId, gym?.company_id)) {
      return NextResponse.json(
        { error: "해당 지점에 대한 권한이 없습니다." },
        { status: 403 }
      );
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0).toISOString();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // 병렬로 모든 통계 조회
    const [
      membersTotal,
      membersActive,
      membersNewThisMonth,
      schedulesToday,
      schedulesThisWeek,
      schedulesPending,
      schedulesCompleted,
      revenueToday,
      revenueThisMonth,
      revenueLastMonth,
      ptActiveMemberships,
      ptExpiringSoon,
    ] = await Promise.all([
      // 전체 회원 수
      supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("gym_id", gymId),

      // 활성 회원 수
      supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("gym_id", gymId)
        .eq("status", "active"),

      // 이번 달 신규 회원
      supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("gym_id", gymId)
        .gte("created_at", startOfMonth),

      // 오늘 스케줄
      supabase
        .from("schedules")
        .select("*", { count: "exact", head: true })
        .eq("gym_id", gymId)
        .gte("start_time", startOfDay)
        .lt("start_time", endOfDay),

      // 이번 주 스케줄
      supabase
        .from("schedules")
        .select("*", { count: "exact", head: true })
        .eq("gym_id", gymId)
        .gte("start_time", startOfWeek.toISOString()),

      // 대기 중 스케줄
      supabase
        .from("schedules")
        .select("*", { count: "exact", head: true })
        .eq("gym_id", gymId)
        .eq("status", "scheduled")
        .gte("start_time", startOfDay),

      // 완료된 스케줄 (이번 달)
      supabase
        .from("schedules")
        .select("*", { count: "exact", head: true })
        .eq("gym_id", gymId)
        .eq("status", "completed")
        .gte("start_time", startOfMonth),

      // 오늘 매출
      supabase
        .from("payments")
        .select("amount")
        .eq("gym_id", gymId)
        .eq("status", "completed")
        .gte("created_at", startOfDay)
        .lt("created_at", endOfDay),

      // 이번 달 매출
      supabase
        .from("payments")
        .select("amount")
        .eq("gym_id", gymId)
        .eq("status", "completed")
        .gte("created_at", startOfMonth),

      // 지난 달 매출
      supabase
        .from("payments")
        .select("amount")
        .eq("gym_id", gymId)
        .eq("status", "completed")
        .gte("created_at", startOfLastMonth)
        .lte("created_at", endOfLastMonth),

      // 활성 PT 회원권
      supabase
        .from("member_memberships")
        .select("*", { count: "exact", head: true })
        .eq("gym_id", gymId)
        .eq("status", "active")
        .eq("type", "PT"),

      // 만료 임박 회원권 (30일 이내)
      supabase
        .from("member_memberships")
        .select("*", { count: "exact", head: true })
        .eq("gym_id", gymId)
        .eq("status", "active")
        .lte("end_date", thirtyDaysFromNow.toISOString().split("T")[0]),
    ]);

    // 매출 합계 계산
    const sumPayments = (data: { amount: number }[] | null) =>
      data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    const stats: DashboardStats = {
      members: {
        total: membersTotal.count || 0,
        active: membersActive.count || 0,
        new_this_month: membersNewThisMonth.count || 0,
      },
      schedules: {
        today: schedulesToday.count || 0,
        this_week: schedulesThisWeek.count || 0,
        pending: schedulesPending.count || 0,
        completed: schedulesCompleted.count || 0,
      },
      revenue: {
        today: sumPayments(revenueToday.data),
        this_month: sumPayments(revenueThisMonth.data),
        last_month: sumPayments(revenueLastMonth.data),
      },
      pt: {
        active_memberships: ptActiveMemberships.count || 0,
        expiring_soon: ptExpiringSoon.count || 0,
        sessions_remaining: 0, // 추가 쿼리 필요시 구현
      },
    };

    return NextResponse.json({
      success: true,
      stats,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error, "Dashboard stats");
  }
}
