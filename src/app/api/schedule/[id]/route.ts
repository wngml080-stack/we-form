import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Next.js 16: params는 Promise
    const { id: scheduleId } = await params;
    if (!scheduleId) {
      return NextResponse.json({ error: "스케줄 ID가 필요합니다." }, { status: 400 });
    }

    // Clerk에서 현재 사용자 정보 가져오기
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 2) staff 정보
    const { data: staff, error: staffError } = await supabase
      .from("staffs")
      .select("id, role, gym_id, employment_status")
      .eq("clerk_user_id", userId)
      .single();

    if (staffError || !staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }
    if (staff.employment_status === "퇴사") {
      return NextResponse.json({ error: "퇴사한 계정은 사용할 수 없습니다." }, { status: 403 });
    }

    // 3) 스케줄 조회
    const { data: schedule, error: scheduleError } = await supabase
      .from("schedules")
      .select("id, staff_id, gym_id, is_locked, report_id")
      .eq("id", scheduleId)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json({ error: "스케줄을 찾을 수 없습니다." }, { status: 404 });
    }

    const isAdmin = ["system_admin", "company_admin", "admin"].includes(staff.role);
    const sameGym = staff.gym_id === schedule.gym_id;
    const isOwner = staff.id === schedule.staff_id;

    // 4) 권한 체크
    if (isAdmin) {
      if (!sameGym && staff.role === "admin") {
        return NextResponse.json({ error: "이 지점 스케줄을 삭제할 권한이 없습니다." }, { status: 403 });
      }
      // system/company admin은 통과
    } else {
      // staff는 본인 스케줄 + 잠금 해제 상태만 삭제 가능
      if (!isOwner) {
        return NextResponse.json({ error: "본인 스케줄만 삭제할 수 있습니다." }, { status: 403 });
      }
      if (schedule.is_locked) {
        return NextResponse.json({ error: "제출/승인 대기 또는 승인된 스케줄은 삭제할 수 없습니다." }, { status: 403 });
      }
    }

    // 5) 삭제
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
