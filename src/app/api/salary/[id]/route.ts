import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { id } = await context.params;
    const body = await request.json();

    // 사용자 권한 확인 (관리자만 수정 가능)
    const { data: staff } = await supabase
      .from("staffs")
      .select("id, role, gym_id")
      .eq("clerk_user_id", userId)
      .single();

    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    const adminRoles = ["system_admin", "company_admin", "admin"];
    if (!adminRoles.includes(staff.role)) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

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
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { id } = await context.params;

    // 사용자 권한 확인 (관리자만 삭제 가능)
    const { data: staff } = await supabase
      .from("staffs")
      .select("id, role, gym_id")
      .eq("clerk_user_id", userId)
      .single();

    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    const adminRoles = ["system_admin", "company_admin", "admin"];
    if (!adminRoles.includes(staff.role)) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { error } = await supabase
      .from("salary_settings")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("급여 설정 삭제 실패:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
