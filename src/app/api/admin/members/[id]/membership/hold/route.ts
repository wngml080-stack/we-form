import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";

// 회원권 홀딩 (일시 중단)
// 홀딩 기간만큼 종료일이 자동으로 연장됨
export async function POST(
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
    const body = await request.json();
    const { membershipId, holdDays, holdStartDate, holdReason } = body;

    if (!membershipId) {
      return NextResponse.json({ error: "회원권 ID가 필요합니다." }, { status: 400 });
    }
    if (!holdDays || holdDays < 1) {
      return NextResponse.json({ error: "홀딩 기간은 1일 이상이어야 합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 회원 정보 확인 및 권한 체크
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, gym_id, company_id, name")
      .eq("id", memberId)
      .maybeSingle();

    if (memberError) {
      console.error("[MembershipHold] 회원 조회 오류:", memberError);
      return NextResponse.json({ error: "회원 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!member) {
      return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    if (!canAccessGym(staff, member.gym_id, member.company_id)) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    // 회원권 조회
    const { data: membership, error: membershipError } = await supabase
      .from("member_memberships")
      .select("id, name, start_date, end_date, status, total_sessions, used_sessions")
      .eq("id", membershipId)
      .eq("member_id", memberId)
      .maybeSingle();

    if (membershipError) {
      console.error("[MembershipHold] 회원권 조회 오류:", membershipError);
      return NextResponse.json({ error: "회원권 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!membership) {
      return NextResponse.json({ error: "회원권을 찾을 수 없습니다." }, { status: 404 });
    }

    if (membership.status !== "active") {
      return NextResponse.json({ error: "활성 상태의 회원권만 홀딩할 수 있습니다." }, { status: 400 });
    }

    // 기존 종료일에 홀딩 기간만큼 추가
    const currentEndDate = membership.end_date ? new Date(membership.end_date) : new Date();
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + parseInt(holdDays));
    const newEndDateStr = newEndDate.toISOString().split("T")[0];

    // 홀딩 시작일 (기본값: 오늘)
    const holdStart = holdStartDate || new Date().toISOString().split("T")[0];
    // 홀딩 종료일 계산
    const holdEnd = new Date(holdStart);
    holdEnd.setDate(holdEnd.getDate() + parseInt(holdDays) - 1);
    const holdEndStr = holdEnd.toISOString().split("T")[0];

    // 회원권 종료일 업데이트
    const { error: updateError } = await supabase
      .from("member_memberships")
      .update({
        end_date: newEndDateStr,
      })
      .eq("id", membershipId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 회원 상태를 "paused" (홀딩)으로 변경
    await supabase
      .from("members")
      .update({ status: "paused" })
      .eq("id", memberId);

    // 홀딩 기록 저장 (member_membership_holds 테이블)
    try {
      await supabase.from("member_membership_holds").insert({
        gym_id: member.gym_id,
        company_id: member.company_id,
        member_id: memberId,
        membership_id: membershipId,
        hold_days: parseInt(holdDays),
        hold_start_date: holdStart,
        hold_end_date: holdEndStr,
        hold_reason: holdReason || null,
        original_end_date: membership.end_date,
        new_end_date: newEndDateStr,
        created_by: staff.id,
      });
    } catch (holdError) {
      // 홀딩 테이블이 없는 경우 무시 (테이블 생성 필요)
      console.log("[MembershipHold] 홀딩 기록 저장 실패 (테이블 없음):", holdError);
    }

    // 활동 로그 기록
    try {
      await supabase.from("member_activity_logs").insert({
        gym_id: member.gym_id,
        company_id: member.company_id,
        member_id: memberId,
        membership_id: membershipId,
        action_type: "membership_hold",
        description: `회원권 "${membership.name}" 홀딩: ${holdDays}일 (${holdStart} ~ ${holdEndStr}), 종료일 ${membership.end_date} → ${newEndDateStr}`,
        changes: {
          before: { end_date: membership.end_date },
          after: { end_date: newEndDateStr, hold_days: holdDays, hold_start: holdStart, hold_end: holdEndStr }
        },
        created_by: staff.id
      });
    } catch (logError) {
      console.error("[MembershipHold] 로그 기록 실패:", logError);
    }

    return NextResponse.json({
      success: true,
      data: {
        membershipId,
        holdDays: parseInt(holdDays),
        holdStartDate: holdStart,
        holdEndDate: holdEndStr,
        originalEndDate: membership.end_date,
        newEndDate: newEndDateStr
      }
    });
  } catch (error: any) {
    console.error("회원권 홀딩 API 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 홀딩 이력 조회
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
    const membershipId = searchParams.get("membershipId");

    const supabase = getSupabaseAdmin();

    // 회원권별 홀딩 이력 조회
    let query = supabase
      .from("member_membership_holds")
      .select("*")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });

    if (membershipId) {
      query = query.eq("membership_id", membershipId);
    }

    const { data: holds, error } = await query;

    if (error) {
      // 테이블이 없는 경우 빈 배열 반환
      console.log("[MembershipHold] 홀딩 이력 조회 실패:", error);
      return NextResponse.json({ holds: [] });
    }

    return NextResponse.json({ holds: holds || [] });
  } catch (error: any) {
    console.error("홀딩 이력 조회 API 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
