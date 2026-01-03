import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin, canAccessGym } from "@/lib/api/auth";

export async function POST(request: Request) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isAdmin(staff.role)) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { gym_id, fc_bep, pt_bep } = body;

    if (!gym_id) {
      return NextResponse.json(
        { error: "gym_id는 필수입니다." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 지점의 회사 확인 및 권한 체크
    const { data: gym, error: gymError } = await supabaseAdmin
      .from("gyms")
      .select("company_id")
      .eq("id", gym_id)
      .maybeSingle();

    if (gymError) {
      console.error("[UpdateGymBEP] 지점 조회 오류:", gymError);
      return NextResponse.json(
        { error: "지점 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    if (!canAccessGym(staff, gym_id, gym?.company_id)) {
      return NextResponse.json(
        { error: "해당 지점에 대한 권한이 없습니다." },
        { status: 403 }
      );
    }

    const updateData: Record<string, number> = {};
    if (fc_bep !== undefined) updateData.fc_bep = fc_bep;
    if (pt_bep !== undefined) updateData.pt_bep = pt_bep;

    const { error } = await supabaseAdmin
      .from("gyms")
      .update(updateData)
      .eq("id", gym_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API] Error updating gym BEP:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
