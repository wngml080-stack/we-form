import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

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
  } catch (error: any) {
    console.error("❌ 출석 상태 조회 실패:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
