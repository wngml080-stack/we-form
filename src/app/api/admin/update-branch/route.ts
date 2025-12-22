import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessCompany } from "@/lib/api/auth";

export async function POST(request: Request) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;

    // 지점 수정은 company_admin 이상만 가능
    if (!staff || !["system_admin", "company_admin"].includes(staff.role)) {
      return NextResponse.json(
        { error: "회사 관리자 이상의 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { gymId, gymName, status, newManagerId, category, size, open_date, memo } = body;

    if (!gymId) {
      return NextResponse.json(
        { error: "gymId는 필수입니다." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 지점의 회사 확인
    const { data: gym } = await supabaseAdmin
      .from("gyms")
      .select("company_id")
      .eq("id", gymId)
      .single();

    if (gym?.company_id && !canAccessCompany(staff, gym.company_id)) {
      return NextResponse.json(
        { error: "해당 지점에 대한 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 지점 정보 업데이트
    const { error: gymError } = await supabaseAdmin
      .from("gyms")
      .update({
        name: gymName,
        status: status,
        category,
        size,
        open_date,
        memo
      })
      .eq("id", gymId);

    if (gymError) throw new Error("지점 수정 실패: " + gymError.message);

    // 관리자 변경 로직
    if (newManagerId && newManagerId !== "none") {
      const { error: staffError } = await supabaseAdmin
        .from("staffs")
        .update({ role: "admin", job_title: "지점장" })
        .eq("id", newManagerId);
      if (staffError) throw new Error("관리자 권한 부여 실패");
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("[API] Error updating branch:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
