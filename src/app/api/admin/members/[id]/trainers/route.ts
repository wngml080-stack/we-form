import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym, isAdmin } from "@/lib/api/auth";

// 회원의 종목별 트레이너 목록 조회
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

    // 종목별 트레이너 목록 조회
    const { data: trainers, error } = await supabase
      .from("member_trainers")
      .select(`
        id,
        category,
        trainer_id,
        assigned_at,
        is_primary,
        status,
        trainer:staffs!trainer_id(id, name, role)
      `)
      .eq("member_id", memberId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[MemberTrainers] 조회 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ trainers: trainers || [] });
  } catch (error: any) {
    console.error("[MemberTrainers] GET 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 종목별 트레이너 배정
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

    const { category, trainer_id, is_primary } = body;

    if (!category || !trainer_id) {
      return NextResponse.json({ error: "종목과 트레이너를 선택해주세요." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 회원 정보 확인 및 권한 체크
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, name, gym_id, company_id")
      .eq("id", memberId)
      .maybeSingle();

    if (memberError || !member) {
      return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
    }

    if (!canAccessGym(staff, member.gym_id, member.company_id)) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    // 동일 종목에 이미 배정된 트레이너가 있는지 확인
    const { data: existing } = await supabase
      .from("member_trainers")
      .select("id")
      .eq("member_id", memberId)
      .eq("category", category)
      .eq("status", "active")
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `이미 ${category} 종목에 배정된 트레이너가 있습니다. 인계 기능을 사용해주세요.` },
        { status: 400 }
      );
    }

    // 트레이너 배정
    const { data: newTrainer, error: insertError } = await supabase
      .from("member_trainers")
      .insert({
        gym_id: member.gym_id,
        company_id: member.company_id,
        member_id: memberId,
        trainer_id,
        category,
        is_primary: is_primary || false,
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
      console.error("[MemberTrainers] 배정 오류:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 활동 로그 기록
    const trainerName = (newTrainer.trainer as any)?.name || "알 수 없음";
    await supabase.from("member_activity_logs").insert({
      gym_id: member.gym_id,
      company_id: member.company_id,
      member_id: memberId,
      action_type: "trainer_assigned",
      description: `${category} 트레이너 배정: ${trainerName}`,
      changes: { category, trainer_id, trainer_name: trainerName },
      created_by: staff.id
    });

    return NextResponse.json({ success: true, data: newTrainer });
  } catch (error: any) {
    console.error("[MemberTrainers] POST 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 트레이너 배정 삭제
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

    // 관리자 권한 체크
    if (!isAdmin(staff.role)) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const { id: memberId } = await params;
    const { searchParams } = new URL(request.url);
    const trainerId = searchParams.get("trainer_id");

    if (!memberId || !trainerId) {
      return NextResponse.json({ error: "회원 ID와 트레이너 배정 ID가 필요합니다." }, { status: 400 });
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

    // 트레이너 배정 정보 조회
    const { data: trainerAssignment } = await supabase
      .from("member_trainers")
      .select(`
        id,
        category,
        trainer:staffs!trainer_id(id, name)
      `)
      .eq("id", trainerId)
      .eq("member_id", memberId)
      .maybeSingle();

    if (!trainerAssignment) {
      return NextResponse.json({ error: "트레이너 배정을 찾을 수 없습니다." }, { status: 404 });
    }

    // 삭제
    const { error: deleteError } = await supabase
      .from("member_trainers")
      .delete()
      .eq("id", trainerId);

    if (deleteError) {
      console.error("[MemberTrainers] 삭제 오류:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 활동 로그 기록
    const trainerName = (trainerAssignment.trainer as any)?.name || "알 수 없음";
    await supabase.from("member_activity_logs").insert({
      gym_id: member.gym_id,
      company_id: member.company_id,
      member_id: memberId,
      action_type: "trainer_removed",
      description: `${trainerAssignment.category} 트레이너 배정 해제: ${trainerName}`,
      changes: { category: trainerAssignment.category, trainer_name: trainerName },
      created_by: staff.id
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[MemberTrainers] DELETE 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
