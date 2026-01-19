import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessCompany } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

export async function DELETE(request: Request) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;

    // 지점 삭제는 company_admin 이상만 가능
    if (!staff || !["system_admin", "company_admin"].includes(staff.role)) {
      return NextResponse.json(
        { error: "회사 관리자 이상의 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const gymId = searchParams.get("id");

    if (!gymId) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 지점의 회사 확인
    const { data: gym, error: gymError } = await supabaseAdmin
      .from("gyms")
      .select("company_id")
      .eq("id", gymId)
      .maybeSingle();

    if (gymError) {
      console.error("[DeleteGym] 지점 조회 오류:", gymError);
      return NextResponse.json(
        { error: "지점 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    if (gym?.company_id && !canAccessCompany(staff, gym.company_id)) {
      return NextResponse.json(
        { error: "해당 지점에 대한 권한이 없습니다." },
        { status: 403 }
      );
    }

    const { error } = await supabaseAdmin
      .from("gyms")
      .delete()
      .eq("id", gymId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "지점이 삭제되었습니다.",
    });
  } catch (error: unknown) {
    console.error("[DeleteGym] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
