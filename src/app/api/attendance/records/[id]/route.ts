import { createClient } from "../../../../../lib/supabase/server";
import { NextResponse } from "next/server";

// 출석 기록 수정
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { status_code, memo } = body;

    const { data, error } = await supabase
      .from("attendances")
      .update({
        status_code,
        memo,
      })
      .eq("id", params.id)
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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("attendances")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ 출석 기록 삭제 실패:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
