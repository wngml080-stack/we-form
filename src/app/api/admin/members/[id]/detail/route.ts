import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

// 회원 상세 정보 조회 (회원권, 결제이력, 활동로그)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id: memberId } = await params;
    const { searchParams } = new URL(request.url);
    const gymId = searchParams.get("gym_id");

    if (!memberId) {
      return NextResponse.json({ error: "회원 ID가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 회원 정보 확인 및 권한 체크
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, gym_id, company_id, phone")
      .eq("id", memberId)
      .maybeSingle();

    if (memberError) {
      console.error("[MemberDetail] 회원 조회 오류:", memberError);
      return NextResponse.json({ error: "회원 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!member) {
      return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    if (!canAccessGym(staff, member.gym_id, member.company_id)) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    // 1. 회원권 조회 (전체 - active + expired)
    const { data: memberships, error: membershipsError } = await supabase
      .from("member_memberships")
      .select("id, name, membership_type, total_sessions, used_sessions, service_sessions, used_service_sessions, start_date, end_date, status, created_at")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });

    if (membershipsError) {
      console.error("[MemberDetail API] membershipsError:", membershipsError);
    }

    // 1-2. member_payments에서도 회원권 정보 조회 (member_memberships가 비어있을 경우 대비)
    let paymentsAsMemberships: Record<string, unknown>[] = [];
    if (member.phone) {
      const normalizedPhone = member.phone.replace(/-/g, "");
      const { data: paymentMemberships } = await supabase
        .from("member_payments")
        .select("id, membership_category, membership_name, service_sessions, bonus_sessions, start_date, created_at, amount")
        .eq("gym_id", member.gym_id)
        .or(`phone.eq.${member.phone},phone.eq.${normalizedPhone}`)
        .order("created_at", { ascending: false });

      if (paymentMemberships && paymentMemberships.length > 0) {
        // member_payments를 회원권 형식으로 변환
        paymentsAsMemberships = paymentMemberships.map(p => {
          const totalSessions = (p.service_sessions || 0) + (p.bonus_sessions || 0);
          const startDate = p.start_date || p.created_at?.split("T")[0];
          // 회원권 기간 계산 (기본 1년)
          const endDate = startDate ? new Date(new Date(startDate).setFullYear(new Date(startDate).getFullYear() + 1)).toISOString().split("T")[0] : null;

          return {
            id: `payment-${p.id}`,
            name: p.membership_name ? `${p.membership_category || ""} ${p.membership_name}`.trim() : (p.membership_category || "회원권"),
            membership_type: p.membership_category,
            total_sessions: totalSessions,
            used_sessions: 0, // member_payments에서는 사용량 추적 안함
            service_sessions: p.bonus_sessions || 0,
            used_service_sessions: 0,
            start_date: startDate,
            end_date: endDate,
            status: "active", // 결제 기록이 있으면 이용중으로 표시
            created_at: p.created_at,
            amount: p.amount
          };
        });
      }
    }

    // member_memberships 데이터가 없으면 payments 데이터 사용
    const finalMemberships = (memberships && memberships.length > 0) ? memberships : paymentsAsMemberships;

    // 2. 결제 이력 조회 - member_payments는 phone 기준으로 연결
    let payments: Record<string, unknown>[] = [];
    let paymentsError: { message: string } | null = null;

    if (member.phone) {
      const normalizedPhone = member.phone.replace(/-/g, "");
      const { data: paymentData, error: paymentErr } = await supabase
        .from("member_payments")
        .select("*")
        .eq("gym_id", member.gym_id)
        .or(`phone.eq.${member.phone},phone.eq.${normalizedPhone}`)
        .order("created_at", { ascending: false });

      payments = paymentData || [];
      paymentsError = paymentErr;

      if (paymentsError) console.error("[MemberDetail API] paymentsError:", paymentsError);
    }

    // 3. 활동 로그 조회 (변경자 정보 포함)
    let activityLogs: Record<string, unknown>[] = [];
    try {
      const { data: logs, error: logsError } = await supabase
        .from("member_activity_logs")
        .select("id, action_type, description, changes, created_at, created_by")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false });

      if (!logsError && logs) {
        // created_by에서 staff 이름 조회
        const staffIds = [...new Set(logs.map(l => l.created_by).filter(Boolean))];
        let staffMap: Record<string, string> = {};

        if (staffIds.length > 0) {
          const { data: staffData } = await supabase
            .from("staffs")
            .select("id, name")
            .in("id", staffIds);

          if (staffData) {
            staffMap = Object.fromEntries(staffData.map(s => [s.id, s.name]));
          }
        }

        activityLogs = logs.map(log => ({
          ...log,
          created_by_name: log.created_by ? staffMap[log.created_by] || null : null
        }));
      }
    } catch (e) {
      console.error("[MemberDetail API] activityLogs error:", e);
      // 테이블이 없을 수 있음
    }

    return NextResponse.json({
      memberships: finalMemberships || [],
      payments: payments,
      activityLogs,
      errors: {
        memberships: membershipsError?.message || null,
        payments: paymentsError?.message || null
      }
    });
  } catch (error: unknown) {
    console.error("[MemberDetail] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
