import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";

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
      .select("id, gym_id, company_id, name, phone, birth_date, gender, exercise_goal, memo, weight, body_fat_mass, skeletal_muscle_mass, trainer_id")
      .eq("id", memberId)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    if (!canAccessGym(staff, member.gym_id, member.company_id)) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    // 업데이트 데이터 구성
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.birth_date !== undefined) updateData.birth_date = body.birth_date || null;
    if (body.gender !== undefined) updateData.gender = body.gender || null;
    if (body.exercise_goal !== undefined) updateData.exercise_goal = body.exercise_goal || null;
    if (body.memo !== undefined) updateData.memo = body.memo || null;
    if (body.weight !== undefined) updateData.weight = body.weight ? parseFloat(body.weight) : null;
    if (body.body_fat_mass !== undefined) updateData.body_fat_mass = body.body_fat_mass ? parseFloat(body.body_fat_mass) : null;
    if (body.skeletal_muscle_mass !== undefined) updateData.skeletal_muscle_mass = body.skeletal_muscle_mass ? parseFloat(body.skeletal_muscle_mass) : null;
    if (body.trainer_id !== undefined) updateData.trainer_id = body.trainer_id || null;

    // 회원 정보 업데이트
    const { data: updatedMember, error: updateError } = await supabase
      .from("members")
      .update(updateData)
      .eq("id", memberId)
      .select()
      .single();

    if (updateError) {
      console.error("[MemberUpdate] 수정 에러:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
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

    console.log("[MemberUpdate] 수정 성공:", updatedMember?.id);
    return NextResponse.json({ success: true, data: updatedMember });
  } catch (error: any) {
    console.error("회원 수정 API 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
