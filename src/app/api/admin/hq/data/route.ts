import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessCompany, isAdmin } from "@/lib/api/auth";
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

    // 1단계: 지점 목록과 직원, 이벤트 먼저 조회
    const [gymsResult, staffsResult, eventsResult] = await Promise.all([
      supabaseAdmin
        .from("gyms")
        .select("*, staffs(id, name, role, email)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("staffs")
        .select("id, name, email, role, job_title, gym_id, employment_status, created_at, gyms(name)")
        .eq("company_id", companyId)
        .order("name", { ascending: true }),
      supabaseAdmin
        .from("company_events")
        .select("*")
        .eq("company_id", companyId)
        .order("event_date", { ascending: true })
    ]);

    if (gymsResult.error) throw gymsResult.error;
    if (staffsResult.error) throw staffsResult.error;
    if (eventsResult.error) throw eventsResult.error;

    const gyms = gymsResult.data || [];
    const allStaffs = staffsResult.data || [];
    const events = eventsResult.data || [];
    const gymIds = gyms.map(g => g.id);

    // 2단계: gym_id + company_id로 결제 데이터 조회 (통합회원관리와 동일한 방식)
    let payments: any[] = [];
    let monthlySales = 0;
    let activeMembersCount = 0;

    if (gymIds.length > 0) {
      const [paymentsResult, monthlyPaymentsResult, activeMembersResult] = await Promise.all([
        // member_payments에서 회원 정보 조회 (gym_id + company_id 기준 - 통합회원관리와 동일)
        supabaseAdmin
          .from("member_payments")
          .select("id, member_name, phone, amount, created_at, gym_id, membership_category, trainer_name")
          .in("gym_id", gymIds)
          .eq("company_id", companyId),
        // 이번달 매출 (created_at 기준)
        supabaseAdmin
          .from("member_payments")
          .select("amount")
          .in("gym_id", gymIds)
          .eq("company_id", companyId)
          .gte("created_at", firstDayOfMonth),
        // 활성 회원: member_memberships에서 status가 'active' 또는 '이용중'인 회원
        supabaseAdmin
          .from("member_memberships")
          .select("member_id")
          .in("gym_id", gymIds)
          .or("status.eq.active,status.eq.이용중")
      ]);

      if (paymentsResult.error) {
        console.error("[HQ Data] payments 조회 에러:", paymentsResult.error);
        throw paymentsResult.error;
      }

      if (monthlyPaymentsResult.error) {
        console.error("[HQ Data] monthlyPayments 조회 에러:", monthlyPaymentsResult.error);
      }

      if (activeMembersResult.error) {
        console.error("[HQ Data] activeMembersResult 조회 에러:", activeMembersResult.error);
      }

      payments = paymentsResult.data || [];
      monthlySales = monthlyPaymentsResult.data?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

      // 활성 회원 수: 고유한 member_id 개수
      const activeMemberIds = new Set<string>();
      (activeMembersResult.data || []).forEach((m: any) => {
        if (m.member_id) activeMemberIds.add(m.member_id);
      });
      activeMembersCount = activeMemberIds.size;
    }

    // 전화번호 기준 중복 제거하여 회원 수 계산 (통합회원관리 방식)
    const uniquePhones = new Set<string>();
    payments.forEach((p: any) => {
      if (p.phone) {
        uniquePhones.add(p.phone.replace(/-/g, ""));
      }
    });

    // 미배정 직원 (gym_id가 null)
    const pendingStaffs = allStaffs.filter(s => !s.gym_id);

    // 통계 계산 (member_payments 기준)
    const totalGymsCount = gyms.length;
    const totalStaffsCount = allStaffs.length;
    const totalMembersCount = uniquePhones.size;

    // payments에서 고유 회원 목록 생성 (전화번호 기준)
    const memberMap = new Map<string, any>();
    payments.forEach((p: any) => {
      if (p.phone) {
        const normalizedPhone = p.phone.replace(/-/g, "");
        if (!memberMap.has(normalizedPhone)) {
          memberMap.set(normalizedPhone, {
            id: normalizedPhone,
            name: p.member_name,
            phone: p.phone,
            gym_id: p.gym_id,
            payments: []
          });
        }
        memberMap.get(normalizedPhone).payments.push(p);
      }
    });
    const members = Array.from(memberMap.values());

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
  } catch (error: unknown) {
    console.error("[API] Error fetching HQ data:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
