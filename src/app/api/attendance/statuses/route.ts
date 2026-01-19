import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getErrorMessage } from "@/types/common";

// 출석 상태 코드 조회 (공개 API - 인증 불필요)
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("attendance_statuses")
      .select("*")
      .order("code");

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error("[AttendanceStatuses] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
