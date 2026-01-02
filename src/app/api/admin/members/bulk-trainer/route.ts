import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin } from "@/lib/api/auth";

// 대량 트레이너 할당 API
export async function POST(request: Request) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isAdmin(staff.role)) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const body = await request.json();
    const { memberIds, trainerId } = body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: "회원 ID 목록이 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 트레이너 할당 업데이트
    const { data, error } = await supabase
      .from("members")
      .update({ trainer_id: trainerId || null })
      .in("id", memberIds)
      .select("id, name, trainer_id");

    if (error) {
      console.error("트레이너 할당 실패:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updated: data?.length || 0,
      members: data
    });
  } catch (error: any) {
    console.error("대량 트레이너 할당 API 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
