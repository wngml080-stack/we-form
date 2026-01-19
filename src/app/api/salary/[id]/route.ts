import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin, canAccessGym } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

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
    const { data: existingSetting, error: existingError } = await supabase
      .from("salary_settings")
      .select("gym_id")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      console.error("[SalarySettings] 조회 오류:", existingError);
      return NextResponse.json({ error: "급여 설정 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

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
      .maybeSingle();

    if (error) {
      console.error("[SalarySettings] 수정 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "급여 설정 수정에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error("[SalarySettings] PATCH Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
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
    const { data: existingSetting, error: existingError } = await supabase
      .from("salary_settings")
      .select("gym_id")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      console.error("[SalarySettings] 삭제용 조회 오류:", existingError);
      return NextResponse.json({ error: "급여 설정 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

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
  } catch (error: unknown) {
    console.error("[SalarySettings] DELETE Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
