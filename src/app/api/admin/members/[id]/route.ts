import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

// 회원 정보 수정
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

    if (!memberId) {
      return NextResponse.json({ error: "회원 ID가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 회원 정보 확인 및 권한 체크
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, gym_id, company_id, name, phone, birth_date, gender, trainer_id")
      .eq("id", memberId)
      .maybeSingle();

    if (memberError) {
      console.error("[MemberUpdate] 회원 조회 오류:", memberError);
      return NextResponse.json({ error: "회원 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!member) {
      return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    if (!canAccessGym(staff, member.gym_id, member.company_id)) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    // 업데이트 데이터 구성
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.birth_date !== undefined) updateData.birth_date = body.birth_date || null;
    if (body.gender !== undefined) updateData.gender = body.gender || null;
    if (body.trainer_id !== undefined) updateData.trainer_id = body.trainer_id || null;

    // 회원 정보 업데이트
    const { data: updatedMember, error: updateError } = await supabase
      .from("members")
      .update(updateData)
      .eq("id", memberId)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error("[MemberUpdate] 수정 에러:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!updatedMember) {
      return NextResponse.json({ error: "회원 정보 수정에 실패했습니다." }, { status: 500 });
    }

    // 변경 이력 로그 기록
    const changes: string[] = [];
    if (member.name !== updateData.name && updateData.name !== undefined)
      changes.push(`이름: ${member.name || '-'} → ${updateData.name || '-'}`);
    if (member.phone !== updateData.phone && updateData.phone !== undefined)
      changes.push(`연락처: ${member.phone || '-'} → ${updateData.phone || '-'}`);
    if (member.gender !== updateData.gender && updateData.gender !== undefined)
      changes.push(`성별: ${member.gender === 'male' ? '남성' : member.gender === 'female' ? '여성' : '-'} → ${updateData.gender === 'male' ? '남성' : updateData.gender === 'female' ? '여성' : '-'}`);
    if (member.birth_date !== updateData.birth_date && updateData.birth_date !== undefined)
      changes.push(`생년월일 변경`);
    if (member.trainer_id !== updateData.trainer_id && updateData.trainer_id !== undefined)
      changes.push(`담당 트레이너 변경`);

    if (changes.length > 0) {
      try {
        await supabase.from("member_activity_logs").insert({
          gym_id: member.gym_id,
          company_id: member.company_id,
          member_id: memberId,
          action_type: "member_updated",
          description: `회원 정보 수정: ${changes.join(", ")}`,
          changes: { before: member, after: updateData },
          created_by: staff.id
        });
      } catch (logError) {
        console.error("[MemberUpdate] 로그 기록 실패:", logError);
        // 로그 실패는 무시
      }
    }

    return NextResponse.json({ success: true, data: updatedMember });
  } catch (error: unknown) {
    console.error("[MemberUpdate] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 회원 삭제 (RLS 우회)
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

    if (!memberId) {
      return NextResponse.json({ error: "회원 ID가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 회원 정보 확인 및 권한 체크
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, name, gym_id, company_id")
      .eq("id", memberId)
      .maybeSingle();

    if (memberError) {
      console.error("[MemberDelete] 회원 조회 오류:", memberError);
      return NextResponse.json({ error: "회원 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!member) {
      return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    if (!canAccessGym(staff, member.gym_id, member.company_id)) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    // 관련 데이터 삭제 (CASCADE가 설정되어 있지 않은 경우를 대비)
    // 1. 회원권 삭제
    const { error: membershipDeleteError } = await supabase.from("member_memberships").delete().eq("member_id", memberId);
    if (membershipDeleteError) {
      console.error("[MemberDelete] 회원권 삭제 오류:", membershipDeleteError);
    }

    // 2. 결제 내역 삭제
    const { error: paymentDeleteError } = await supabase.from("member_payments").delete().eq("member_id", memberId);
    if (paymentDeleteError) {
      console.error("[MemberDelete] 결제 내역 삭제 오류:", paymentDeleteError);
    }

    // 3. 활동 로그 삭제
    const { error: logDeleteError } = await supabase.from("member_activity_logs").delete().eq("member_id", memberId);
    if (logDeleteError) {
      console.error("[MemberDelete] 활동 로그 삭제 오류:", logDeleteError);
    }

    // 4. 스케줄 삭제
    const { error: scheduleDeleteError } = await supabase.from("schedules").delete().eq("member_id", memberId);
    if (scheduleDeleteError) {
      console.error("[MemberDelete] 스케줄 삭제 오류:", scheduleDeleteError);
    }

    // 5. 회원 삭제
    const { error: deleteError } = await supabase
      .from("members")
      .delete()
      .eq("id", memberId);

    if (deleteError) {
      console.error("[MemberDelete] 삭제 에러:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: member.name });
  } catch (error: unknown) {
    console.error("[MemberDelete] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
