import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin, canAccessGym } from "@/lib/api/auth";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 통합 인증
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    // 관리자 권한 확인
    if (!isAdmin(staff.role)) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { id } = await context.params;

    // 해당 설정의 gym_id 조회하여 권한 확인
    const { data: existingSetting } = await supabase
      .from("salary_settings")
      .select("gym_id")
      .eq("id", id)
      .single();

    if (!existingSetting) {
      return NextResponse.json({ error: "급여 설정을 찾을 수 없습니다." }, { status: 404 });
    }

    // 지점 접근 권한 확인
    if (!canAccessGym(staff, existingSetting.gym_id)) {
      return NextResponse.json({ error: "해당 지점에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { attendance_code, pay_type, amount, rate, memo } = body;

    const updateData: Record<string, string | number | null> = {};
    if (attendance_code !== undefined) updateData.attendance_code = attendance_code;
    if (pay_type !== undefined) updateData.pay_type = pay_type;
    if (amount !== undefined) updateData.amount = amount;
    if (rate !== undefined) updateData.rate = rate;
    if (memo !== undefined) updateData.memo = memo;

    const { data, error } = await supabase
      .from("salary_settings")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("급여 설정 수정 실패:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 통합 인증
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    // 관리자 권한 확인
    if (!isAdmin(staff.role)) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { id } = await context.params;

    // 해당 설정의 gym_id 조회하여 권한 확인
    const { data: existingSetting } = await supabase
      .from("salary_settings")
      .select("gym_id")
      .eq("id", id)
      .single();

    if (!existingSetting) {
      return NextResponse.json({ error: "급여 설정을 찾을 수 없습니다." }, { status: 404 });
    }

    // 지점 접근 권한 확인
    if (!canAccessGym(staff, existingSetting.gym_id)) {
      return NextResponse.json({ error: "해당 지점에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    const { error } = await supabase
      .from("salary_settings")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("급여 설정 삭제 실패:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
