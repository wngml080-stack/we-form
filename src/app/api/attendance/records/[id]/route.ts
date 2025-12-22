import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// 출석 기록 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 사용자 권한 확인
    const { data: staff } = await supabase
      .from("staffs")
      .select("id, role, gym_id")
      .eq("clerk_user_id", userId)
      .single();

    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { status_code, memo } = body;

    // Next.js 16: params는 Promise
    const { id } = await params;

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
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("❌ 출석 기록 수정 실패:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 출석 기록 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 사용자 권한 확인
    const { data: staff } = await supabase
      .from("staffs")
      .select("id, role, gym_id")
      .eq("clerk_user_id", userId)
      .single();

    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    // Next.js 16: params는 Promise
    const { id } = await params;

    const { error } = await supabase
      .from("attendances")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ 출석 기록 삭제 실패:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
