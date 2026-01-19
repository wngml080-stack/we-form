import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

// 회원권 삭제
export async function DELETE(
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

    if (!membershipId) {
      return NextResponse.json({ error: "회원권 ID가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 삭제 전 데이터 조회 (로그용)
    const { data: membershipData, error: membershipError } = await supabase
      .from("member_memberships")
      .select("name, member_id, gym_id, total_sessions, used_sessions, start_date, end_date")
      .eq("id", membershipId)
      .eq("member_id", memberId)
      .maybeSingle();

    if (membershipError) {
      console.error("[MembershipDelete] 회원권 조회 오류:", membershipError);
      return NextResponse.json({ error: "회원권 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!membershipData) {
      return NextResponse.json({ error: "회원권을 찾을 수 없습니다." }, { status: 404 });
    }

    // 회원권 삭제
    const { error } = await supabase
      .from("member_memberships")
      .delete()
      .eq("id", membershipId)
      .eq("member_id", memberId);

    if (error) {
      console.error("[MembershipDelete] 삭제 에러:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 회원의 company_id 조회
    const { data: memberData, error: memberDataError } = await supabase
      .from("members")
      .select("company_id")
      .eq("id", memberId)
      .maybeSingle();

    if (memberDataError) {
      console.error("[MembershipDelete] 회원 조회 오류:", memberDataError);
    }

    // 활동 로그 기록
    try {
      await supabase.from("member_activity_logs").insert({
        gym_id: membershipData.gym_id,
        company_id: memberData?.company_id,
        member_id: memberId,
        action_type: "membership_deleted",
        description: `회원권 "${membershipData.name}" 삭제`,
        changes: { before: membershipData, after: {} },
        created_by: staff.id
      });
    } catch (logError) {
      console.error("[MembershipDelete] 로그 기록 실패:", logError);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[MembershipDelete] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 회원권 수정
export async function PUT(
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
    const { membershipId, name, start_date, end_date, total_sessions, used_sessions } = body;

    if (!membershipId) {
      return NextResponse.json({ error: "회원권 ID가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 기존 데이터 조회 (로그용)
    const { data: beforeData, error: beforeDataError } = await supabase
      .from("member_memberships")
      .select("name, start_date, end_date, total_sessions, used_sessions, gym_id")
      .eq("id", membershipId)
      .eq("member_id", memberId)
      .maybeSingle();

    if (beforeDataError) {
      console.error("[MembershipUpdate] 회원권 조회 오류:", beforeDataError);
      return NextResponse.json({ error: "회원권 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!beforeData) {
      return NextResponse.json({ error: "회원권을 찾을 수 없습니다." }, { status: 404 });
    }

    // 회원권 수정
    const updateData = {
      start_date: start_date || null,
      end_date: end_date || null,
      total_sessions: parseInt(total_sessions) || 0,
      used_sessions: parseInt(used_sessions) || 0
    };

    const { data, error } = await supabase
      .from("member_memberships")
      .update(updateData)
      .eq("id", membershipId)
      .eq("member_id", memberId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[MembershipUpdate] 수정 에러:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "회원권 수정에 실패했습니다." }, { status: 500 });
    }

    // 회원의 company_id 조회
    const { data: memberData, error: memberDataError } = await supabase
      .from("members")
      .select("company_id")
      .eq("id", memberId)
      .maybeSingle();

    if (memberDataError) {
      console.error("[MembershipUpdate] 회원 조회 오류:", memberDataError);
    }

    // 활동 로그 기록
    const changes: string[] = [];
    if (beforeData.start_date !== updateData.start_date) changes.push(`시작일: ${beforeData.start_date || '-'} → ${updateData.start_date || '-'}`);
    if (beforeData.end_date !== updateData.end_date) changes.push(`종료일: ${beforeData.end_date || '-'} → ${updateData.end_date || '-'}`);
    if (beforeData.total_sessions !== updateData.total_sessions) changes.push(`총 횟수: ${beforeData.total_sessions}회 → ${updateData.total_sessions}회`);
    if (beforeData.used_sessions !== updateData.used_sessions) changes.push(`사용 횟수: ${beforeData.used_sessions}회 → ${updateData.used_sessions}회`);

    if (changes.length > 0) {
      try {
        await supabase.from("member_activity_logs").insert({
          gym_id: beforeData.gym_id,
          company_id: memberData?.company_id,
          member_id: memberId,
          membership_id: membershipId,
          action_type: "membership_updated",
          description: `회원권 "${name || beforeData.name}" 수정: ${changes.join(", ")}`,
          changes: { before: beforeData, after: updateData },
          created_by: staff.id
        });
      } catch (logError) {
        console.error("[MembershipUpdate] 로그 기록 실패:", logError);
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error("[MembershipUpdate] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
