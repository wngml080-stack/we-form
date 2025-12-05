import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const body = await request.json();

    const { attendance_code, pay_type, amount, rate, memo } = body;

    const updateData: any = {};
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
    const supabase = await createClient();
    const { id } = await context.params;

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
