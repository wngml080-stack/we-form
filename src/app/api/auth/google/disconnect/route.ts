import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST() {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError || !staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 토큰 삭제
    const { error: deleteError } = await supabase
      .from("user_google_tokens")
      .delete()
      .eq("staff_id", staff.id);

    if (deleteError) {
      console.error("[Google Disconnect] Delete error:", deleteError);
      return NextResponse.json(
        { error: "Google 연동 해제 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Google Disconnect] Error:", error);
    return NextResponse.json(
      { error: "Google 연동 해제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
