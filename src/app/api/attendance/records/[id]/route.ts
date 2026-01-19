import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin, canAccessGym } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

// 출석 기록 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 통합 인증
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { id } = await params;

    // 해당 기록 조회
    const { data: existingRecord, error: existingError } = await supabase
      .from("attendances")
      .select("id, gym_id, staff_id")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      console.error("[Attendance] 출석 기록 조회 오류:", existingError);
      return NextResponse.json({ error: "출석 기록 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!existingRecord) {
      return NextResponse.json({ error: "출석 기록을 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인: 관리자이거나 자신의 기록만 수정 가능
    const isOwner = existingRecord.staff_id === staff.id;
    const hasAdminAccess = isAdmin(staff.role) && canAccessGym(staff, existingRecord.gym_id);

    if (!isOwner && !hasAdminAccess) {
      return NextResponse.json({ error: "이 기록을 수정할 권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { status_code, memo } = body;

    const { data, error } = await supabase
      .from("attendances")
      .update({
        status_code,
        memo,
      })
      .eq("id", id)
      .select(`
        *,
        member:members(id, name, phone),
        staff:staffs(id, name),
        schedule:schedules(id, title, start_time, end_time),
        status:attendance_statuses(code, label, color)
      `)
      .maybeSingle();

    if (error) {
      console.error("[Attendance] 출석 기록 수정 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "출석 기록 수정에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error("[AttendanceRecord] PATCH Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 출석 기록 삭제
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 통합 인증
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { id } = await params;

    // 해당 기록 조회
    const { data: existingRecord, error: existingError } = await supabase
      .from("attendances")
      .select("id, gym_id, staff_id")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      console.error("[Attendance] 삭제용 출석 기록 조회 오류:", existingError);
      return NextResponse.json({ error: "출석 기록 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!existingRecord) {
      return NextResponse.json({ error: "출석 기록을 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인: 관리자이거나 자신의 기록만 삭제 가능
    const isOwner = existingRecord.staff_id === staff.id;
    const hasAdminAccess = isAdmin(staff.role) && canAccessGym(staff, existingRecord.gym_id);

    if (!isOwner && !hasAdminAccess) {
      return NextResponse.json({ error: "이 기록을 삭제할 권한이 없습니다." }, { status: 403 });
    }

    const { error } = await supabase
      .from("attendances")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[AttendanceRecord] DELETE Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
