import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin, canAccessGym } from "@/lib/api/auth";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: scheduleId } = await params;
    if (!scheduleId) {
      return NextResponse.json({ error: "스케줄 ID가 필요합니다." }, { status: 400 });
    }

    // 통합 인증
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    // 퇴사 상태 확인
    const { data: staffDetail } = await supabase
      .from("staffs")
      .select("employment_status")
      .eq("id", staff.id)
      .single();

    if (staffDetail?.employment_status === "퇴사") {
      return NextResponse.json({ error: "퇴사한 계정은 사용할 수 없습니다." }, { status: 403 });
    }

    // 스케줄 조회
    const { data: schedule, error: scheduleError } = await supabase
      .from("schedules")
      .select("id, staff_id, gym_id, is_locked, report_id")
      .eq("id", scheduleId)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json({ error: "스케줄을 찾을 수 없습니다." }, { status: 404 });
    }

    const hasAdminRole = isAdmin(staff.role);
    const isOwner = staff.id === schedule.staff_id;

    // 권한 체크
    if (hasAdminRole) {
      // 관리자: 지점 권한 확인
      if (!canAccessGym(staff, schedule.gym_id)) {
        return NextResponse.json({ error: "이 지점 스케줄을 삭제할 권한이 없습니다." }, { status: 403 });
      }
    } else {
      // 일반 직원: 본인 스케줄 + 잠금 해제 상태만 삭제 가능
      if (!isOwner) {
        return NextResponse.json({ error: "본인 스케줄만 삭제할 수 있습니다." }, { status: 403 });
      }
      if (schedule.is_locked) {
        return NextResponse.json({ error: "제출/승인 대기 또는 승인된 스케줄은 삭제할 수 없습니다." }, { status: 403 });
      }
    }

    // 삭제
    const { error: deleteError } = await supabase
      .from("schedules")
      .delete()
      .eq("id", scheduleId);

    if (deleteError) {
      return NextResponse.json({ error: "스케줄 삭제 중 오류가 발생했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "스케줄을 삭제했습니다." });
  } catch (error: any) {
    console.error("❌ delete 오류:", error?.message ?? error);
    return NextResponse.json({ error: error?.message ?? "삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
