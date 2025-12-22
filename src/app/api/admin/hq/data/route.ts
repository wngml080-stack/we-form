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

    // 지점 목록
    const { data: gyms, error: gymsError } = await supabaseAdmin
      .from("gyms")
      .select("*, staffs(id, name, role, email)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (gymsError) throw gymsError;

    // 전체 직원
    const { data: allStaffs, error: staffsError } = await supabaseAdmin
      .from("staffs")
      .select("id, name, email, role, job_title, gym_id, employment_status, created_at, gyms(name)")
      .eq("company_id", companyId)
      .order("name", { ascending: true });

    if (staffsError) throw staffsError;

    // 미배정 직원 (gym_id가 null)
    const pendingStaffs = allStaffs?.filter(s => !s.gym_id) || [];

    // 회원 데이터
    const { data: members, error: membersError } = await supabaseAdmin
      .from("members")
      .select("id, name, phone, status, created_at, gym_id, gyms(name)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (membersError) throw membersError;

    // 결제 데이터
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from("member_payments")
      .select("id, member_id, amount, membership_type, registration_type, created_at, gym_id, visit_route")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (paymentsError) throw paymentsError;

    // 통계
    const { count: totalGymsCount } = await supabaseAdmin
      .from("gyms")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    const { count: totalStaffsCount } = await supabaseAdmin
      .from("staffs")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    const { count: totalMembersCount } = await supabaseAdmin
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    // 이번 달 신규 회원
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: newMembersThisMonth } = await supabaseAdmin
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .gte("created_at", startOfMonth.toISOString());

    // 회사 일정/행사
    const { data: events, error: eventsError } = await supabaseAdmin
      .from("company_events")
      .select("*")
      .eq("company_id", companyId)
      .order("event_date", { ascending: true });

    if (eventsError) throw eventsError;

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
        newMembersThisMonth: newMembersThisMonth || 0,
      },
    });
  } catch (error: any) {
    console.error("[API] Error fetching HQ data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
