import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";

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
      .select("id, gym_id, company_id")
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
      .select("id, name, total_sessions, used_sessions, start_date, end_date, status, created_at")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });

    // 2. 결제 이력 조회 (부가상품 시작일/종료일 포함)
    const { data: payments, error: paymentsError } = await supabase
      .from("member_payments")
      .select("*")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });

    if (paymentsError) console.error("[MemberDetail API] paymentsError:", paymentsError);
    if (membershipsError) console.error("[MemberDetail API] membershipsError:", membershipsError);

    // 3. 활동 로그 조회 (변경자 정보 포함)
    let activityLogs: any[] = [];
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
      memberships: memberships || [],
      payments: payments || [],
      activityLogs,
      errors: {
        memberships: membershipsError?.message,
        payments: paymentsError?.message
      }
    });
  } catch (error: any) {
    console.error("회원 상세 조회 API 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
