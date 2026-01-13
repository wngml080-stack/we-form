import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessCompany, isAdmin } from "@/lib/api/auth";

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
    const companyId = searchParams.get("company_id");

    if (!companyId) {
      return NextResponse.json(
        { error: "company_id is required" },
        { status: 400 }
      );
    }

    // 권한 확인: 해당 회사에 접근 가능한지
    if (!canAccessCompany(staff, companyId)) {
      return NextResponse.json(
        { error: "해당 회사에 대한 접근 권한이 없습니다." },
        { status: 403 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // 모든 쿼리를 병렬로 실행
    const [
      gymsResult,
      staffsResult,
      membersResult,
      paymentsResult,
      eventsResult,
      totalMembersResult,
      activeMembersResult,
      monthlyPaymentsResult
    ] = await Promise.all([
      // 지점 목록
      supabaseAdmin
        .from("gyms")
        .select("*, staffs(id, name, role, email)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
      // 전체 직원
      supabaseAdmin
        .from("staffs")
        .select("id, name, email, role, job_title, gym_id, employment_status, created_at, gyms(name)")
        .eq("company_id", companyId)
        .order("name", { ascending: true }),
      // 회원 데이터 (필요한 필드만)
      supabaseAdmin
        .from("members")
        .select("id, name, phone, gym_id, status, created_at")
        .eq("company_id", companyId),
      // 결제 데이터 (필요한 필드만)
      supabaseAdmin
        .from("member_payments")
        .select("id, member_id, amount, payment_date")
        .eq("company_id", companyId),
      // 회사 일정/행사
      supabaseAdmin
        .from("company_events")
        .select("*")
        .eq("company_id", companyId)
        .order("event_date", { ascending: true }),
      // 전체 회원 수
      supabaseAdmin
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId),
      // 활성 회원 수
      supabaseAdmin
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("status", "active"),
      // 이번달 매출
      supabaseAdmin
        .from("member_payments")
        .select("amount")
        .eq("company_id", companyId)
        .gte("payment_date", firstDayOfMonth)
    ]);

    // 에러 체크
    if (gymsResult.error) throw gymsResult.error;
    if (staffsResult.error) throw staffsResult.error;
    if (membersResult.error) throw membersResult.error;
    if (paymentsResult.error) throw paymentsResult.error;
    if (eventsResult.error) throw eventsResult.error;

    const gyms = gymsResult.data;
    const allStaffs = staffsResult.data;
    const members = membersResult.data;
    const payments = paymentsResult.data;
    const events = eventsResult.data;

    // 미배정 직원 (gym_id가 null)
    const pendingStaffs = allStaffs?.filter(s => !s.gym_id) || [];

    // 통계 계산
    const totalGymsCount = gyms?.length || 0;
    const totalStaffsCount = allStaffs?.length || 0;
    const totalMembersCount = totalMembersResult.count || 0;
    const activeMembersCount = activeMembersResult.count || 0;
    const monthlySales = monthlyPaymentsResult.data?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

    return NextResponse.json({
      success: true,
      gyms: gyms || [],
      allStaffs: allStaffs || [],
      pendingStaffs: pendingStaffs || [],
      members: members || [],
      payments: payments || [],
      events: events || [],
      stats: {
        totalGyms: totalGymsCount || 0,
        totalStaffs: totalStaffsCount || 0,
        totalMembers: totalMembersCount || 0,
        activeMembers: activeMembersCount || 0,
        monthlySales: monthlySales || 0,
      },
    });
  } catch (error: any) {
    console.error("[API] Error fetching HQ data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
