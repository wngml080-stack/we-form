import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";

// PT 카테고리 판별
const PT_CATEGORIES = ["PT", "Personal", "개인"];
const isPTMembership = (category: string): boolean => {
  return PT_CATEGORIES.some(pt => category.toLowerCase().includes(pt.toLowerCase()));
};

export async function GET(request: NextRequest) {
  // 인증 확인
  const { staff, error: authError } = await authenticateRequest();
  if (authError) return authError;
  if (!staff) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const gymId = searchParams.get("gym_id");
  const companyId = searchParams.get("company_id");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const trainerId = searchParams.get("trainer_id"); // staff 역할용

  if (!gymId || !companyId) {
    return NextResponse.json({ error: "gym_id, company_id required" }, { status: 400 });
  }

  // 지점 접근 권한 확인
  if (!canAccessGym(staff, gymId, companyId)) {
    return NextResponse.json({ error: "해당 지점에 대한 접근 권한이 없습니다." }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();

  try {
    // 1. 병렬로 기본 데이터 조회
    const [paymentsResult, membershipsResult, staffsResult] = await Promise.all([
      // 결제 내역
      supabase
        .from("member_payments")
        .select(`
          id, amount, created_at, membership_category, membership_name,
          memo, trainer_id, trainer_name, member_name, phone, sale_type,
          service_sessions, bonus_sessions
        `)
        .eq("gym_id", gymId)
        .eq("company_id", companyId)
        .gte("created_at", startDate || "1900-01-01")
        .lte("created_at", endDate || "2100-12-31")
        .order("created_at", { ascending: false }),

      // 회원권 정보
      supabase
        .from("member_memberships")
        .select("member_id, name, total_sessions, used_sessions, service_sessions, used_service_sessions, status")
        .eq("gym_id", gymId),

      // 스태프 목록
      supabase
        .from("staffs")
        .select("id, name, role")
        .eq("gym_id", gymId)
        .eq("status", "active")
        .order("name")
    ]);

    if (paymentsResult.error) throw paymentsResult.error;
    if (membershipsResult.error) throw membershipsResult.error;

    const payments = paymentsResult.data || [];
    const memberships = membershipsResult.data || [];
    const staffList = staffsResult.data || [];

    // 2. 회원별 활성 회원권 매핑
    const membershipMap: Record<string, typeof memberships[0]> = {};
    memberships.forEach((m) => {
      const isActive = m.status?.toLowerCase() === "active" || m.status === "이용중";
      if (isActive && !membershipMap[m.member_id]) {
        membershipMap[m.member_id] = m;
      }
    });

    // 3. phone으로 member 정보 조회
    const phones = [...new Set(payments.map(p => p.phone).filter(Boolean))];
    const normalizedPhones = phones.map(p => p!.replace(/-/g, ""));
    const allPhones = [...new Set([...phones, ...normalizedPhones])];

    const { data: memberData } = await supabase
      .from("members")
      .select("id, phone, trainer_id")
      .eq("gym_id", gymId)
      .in("phone", allPhones);

    const phoneToMember: Record<string, { id: string; trainer_id: string | null }> = {};
    (memberData || []).forEach(m => {
      if (m.phone) {
        phoneToMember[m.phone] = { id: m.id, trainer_id: m.trainer_id };
        phoneToMember[m.phone.replace(/-/g, "")] = { id: m.id, trainer_id: m.trainer_id };
      }
    });

    // 4. 결제 데이터 변환
    const ptMembers = payments.map(p => {
      const category = p.membership_category || "";
      const isPT = isPTMembership(category);
      const memberInfo = p.phone ? phoneToMember[p.phone] : null;
      const memberId = memberInfo?.id || p.id;
      const membership = memberId ? membershipMap[memberId] : null;

      let remainingSessions: number | undefined;
      let totalSessions: number | undefined;

      if (isPT && membership && membership.total_sessions !== 9999) {
        const total = membership.total_sessions || 0;
        totalSessions = total;
        remainingSessions = total - (membership.used_sessions || 0);
      }

      return {
        id: memberId,
        payment_id: p.id,
        member_name: p.member_name || "Unknown",
        phone: p.phone,
        membership_category: isPT ? category : (category || "OT"),
        membership_name: p.membership_name || "",
        sale_type: p.sale_type || "",
        amount: typeof p.amount === "string" ? parseFloat(p.amount) : (p.amount || 0),
        trainer_id: memberInfo?.trainer_id || p.trainer_id || "",
        trainer_name: p.trainer_name || "미배정",
        remaining_sessions: remainingSessions,
        total_sessions: totalSessions,
        service_sessions: membership?.service_sessions || p.bonus_sessions || 0,
        status: "active",
        created_at: p.created_at,
        memo: p.memo,
        registration_type: p.sale_type || ""
      };
    });

    // 5. phone 기준 중복 제거 (최신 기준, 금액 합산)
    const phoneMap = new Map<string, typeof ptMembers[0] & { totalAmount: number }>();
    ptMembers.forEach(m => {
      const key = m.phone || m.id;
      const existing = phoneMap.get(key);
      if (!existing) {
        phoneMap.set(key, { ...m, totalAmount: m.amount });
      } else {
        existing.totalAmount += m.amount;
      }
    });

    let members = Array.from(phoneMap.values()).map(m => ({
      ...m,
      amount: m.totalAmount
    }));

    // 6. trainerId 필터링 (staff 역할)
    if (trainerId) {
      members = members.filter(m => m.trainer_id === trainerId);
    }

    // 7. 기본 통계 계산
    const ptCount = members.filter(m => isPTMembership(m.membership_category)).length;
    const otCount = members.filter(m => !isPTMembership(m.membership_category)).length;
    const totalRevenue = members.reduce((sum, m) => sum + m.amount, 0);
    const totalSessions = members.reduce((sum, m) => sum + (m.total_sessions || 0), 0);
    const remainingSessionsTotal = members.reduce((sum, m) => sum + (m.remaining_sessions || 0), 0);

    // 8. 트레이너별 그룹핑
    const membersByTrainer: Record<string, typeof members> = {};
    members.forEach(m => {
      const key = m.trainer_id || "unassigned";
      if (!membersByTrainer[key]) membersByTrainer[key] = [];
      membersByTrainer[key].push(m);
    });

    return NextResponse.json({
      success: true,
      members,
      staffList,
      membersByTrainer,
      stats: {
        totalMembers: members.length,
        ptCount,
        otCount,
        totalRevenue,
        totalSessions,
        remainingSessions: remainingSessionsTotal,
        avgSessionsRemaining: members.length > 0
          ? Math.round(remainingSessionsTotal / members.length)
          : 0
      }
    });
  } catch (error) {
    console.error("PT Members API Error:", error);
    return NextResponse.json({ error: "데이터 조회 실패" }, { status: 500 });
  }
}
