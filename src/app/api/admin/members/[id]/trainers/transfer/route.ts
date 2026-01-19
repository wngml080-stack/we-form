import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym, isAdmin } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

// 트레이너 인계
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

    // 관리자 권한 체크
    if (!isAdmin(staff.role)) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const { id: memberId } = await params;
    const body = await request.json();

    if (!memberId) {
      return NextResponse.json({ error: "회원 ID가 필요합니다." }, { status: 400 });
    }

    const {
      member_trainer_id,  // member_trainers 테이블의 ID (종목별 트레이너용)
      category,           // 종목명
      from_trainer_id,
      to_trainer_id,
      reason,
      reason_detail,
      is_pt_transfer      // PT 담당 트레이너 인계 여부
    } = body;

    // 필수 필드 검증
    if (!to_trainer_id || !reason) {
      return NextResponse.json(
        { error: "인계받을 트레이너와 인계 사유를 입력해주세요." },
        { status: 400 }
      );
    }

    // 기타 사유 선택 시 상세 내용 필수
    if (reason === "other" && !reason_detail) {
      return NextResponse.json(
        { error: "기타 사유를 선택한 경우 상세 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 회원 정보 확인 및 권한 체크
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, name, gym_id, company_id, trainer_id")
      .eq("id", memberId)
      .maybeSingle();

    if (memberError || !member) {
      return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
    }

    if (!canAccessGym(staff, member.gym_id, member.company_id)) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    // 트레이너 정보 조회
    const { data: toTrainer } = await supabase
      .from("staffs")
      .select("id, name")
      .eq("id", to_trainer_id)
      .maybeSingle();

    const { data: fromTrainer } = from_trainer_id ? await supabase
      .from("staffs")
      .select("id, name")
      .eq("id", from_trainer_id)
      .maybeSingle() : { data: null };

    // 사유 라벨 매핑
    const reasonLabels: Record<string, string> = {
      resignation: "퇴사",
      leave: "휴가/휴직",
      member_request: "회원 요청",
      workload: "업무 조정",
      other: "기타"
    };

    if (is_pt_transfer) {
      // PT 담당 트레이너 인계 (members.trainer_id 변경)
      const { error: updateError } = await supabase
        .from("members")
        .update({ trainer_id: to_trainer_id })
        .eq("id", memberId);

      if (updateError) {
        console.error("[TrainerTransfer] PT 트레이너 변경 오류:", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // 인계 이력 기록
      await supabase.from("member_trainer_transfers").insert({
        gym_id: member.gym_id,
        company_id: member.company_id,
        member_id: memberId,
        category: "PT",
        from_trainer_id: member.trainer_id,
        to_trainer_id,
        reason,
        reason_detail: reason === "other" ? reason_detail : null,
        transferred_by: staff.id
      });

      // 활동 로그 기록
      const fromName = fromTrainer?.name || "없음";
      const toName = toTrainer?.name || "알 수 없음";
      const reasonText = reasonLabels[reason] || reason;

      await supabase.from("member_activity_logs").insert({
        gym_id: member.gym_id,
        company_id: member.company_id,
        member_id: memberId,
        action_type: "trainer_transferred",
        description: `PT 트레이너 인계: ${fromName} → ${toName} (사유: ${reasonText}${reason === "other" ? ` - ${reason_detail}` : ""})`,
        changes: {
          category: "PT",
          from_trainer_id: member.trainer_id,
          from_trainer_name: fromName,
          to_trainer_id,
          to_trainer_name: toName,
          reason,
          reason_detail
        },
        created_by: staff.id
      });

      return NextResponse.json({
        success: true,
        message: "PT 담당 트레이너가 인계되었습니다."
      });
    } else {
      // 종목별 트레이너 인계
      if (!member_trainer_id || !category) {
        return NextResponse.json(
          { error: "트레이너 배정 정보가 필요합니다." },
          { status: 400 }
        );
      }

      // 기존 배정 상태 변경 (transferred)
      const { error: updateOldError } = await supabase
        .from("member_trainers")
        .update({ status: "transferred" })
        .eq("id", member_trainer_id);

      if (updateOldError) {
        console.error("[TrainerTransfer] 기존 배정 상태 변경 오류:", updateOldError);
        return NextResponse.json({ error: updateOldError.message }, { status: 500 });
      }

      // 새 트레이너 배정
      const { data: newAssignment, error: insertError } = await supabase
        .from("member_trainers")
        .insert({
          gym_id: member.gym_id,
          company_id: member.company_id,
          member_id: memberId,
          trainer_id: to_trainer_id,
          category,
          assigned_by: staff.id,
          status: "active"
        })
        .select(`
          id,
          category,
          trainer_id,
          assigned_at,
          is_primary,
          status,
          trainer:staffs!trainer_id(id, name, role)
        `)
        .single();

      if (insertError) {
        console.error("[TrainerTransfer] 새 트레이너 배정 오류:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      // 인계 이력 기록
      await supabase.from("member_trainer_transfers").insert({
        gym_id: member.gym_id,
        company_id: member.company_id,
        member_id: memberId,
        member_trainer_id,
        category,
        from_trainer_id,
        to_trainer_id,
        reason,
        reason_detail: reason === "other" ? reason_detail : null,
        transferred_by: staff.id
      });

      // 활동 로그 기록
      const fromName = fromTrainer?.name || "없음";
      const toName = toTrainer?.name || "알 수 없음";
      const reasonText = reasonLabels[reason] || reason;

      await supabase.from("member_activity_logs").insert({
        gym_id: member.gym_id,
        company_id: member.company_id,
        member_id: memberId,
        action_type: "trainer_transferred",
        description: `${category} 트레이너 인계: ${fromName} → ${toName} (사유: ${reasonText}${reason === "other" ? ` - ${reason_detail}` : ""})`,
        changes: {
          category,
          from_trainer_id,
          from_trainer_name: fromName,
          to_trainer_id,
          to_trainer_name: toName,
          reason,
          reason_detail
        },
        created_by: staff.id
      });

      return NextResponse.json({
        success: true,
        message: `${category} 트레이너가 인계되었습니다.`,
        data: newAssignment
      });
    }
  } catch (error: unknown) {
    console.error("[TrainerTransfer] POST Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 인계 이력 조회
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

    if (memberError || !member) {
      return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
    }

    if (!canAccessGym(staff, member.gym_id, member.company_id)) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    // 인계 이력 조회
    const { data: transfers, error } = await supabase
      .from("member_trainer_transfers")
      .select(`
        id,
        category,
        reason,
        reason_detail,
        transferred_at,
        from_trainer:staffs!from_trainer_id(id, name),
        to_trainer:staffs!to_trainer_id(id, name),
        transferred_by_staff:staffs!transferred_by(id, name)
      `)
      .eq("member_id", memberId)
      .order("transferred_at", { ascending: false });

    if (error) {
      console.error("[TrainerTransfer] 이력 조회 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transfers: transfers || [] });
  } catch (error: unknown) {
    console.error("[TrainerTransfer] GET Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
