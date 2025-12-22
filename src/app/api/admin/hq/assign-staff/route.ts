import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin, canAccessCompany } from "@/lib/api/auth";

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
    const { staffId, gymId, role } = body;

    if (!staffId || !gymId || !role) {
      return NextResponse.json(
        { error: "staffId, gymId, role are required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 대상 직원과 지점의 회사 확인
    const [staffResult, gymResult] = await Promise.all([
      supabaseAdmin.from("staffs").select("company_id").eq("id", staffId).single(),
      supabaseAdmin.from("gyms").select("company_id").eq("id", gymId).single(),
    ]);

    // 권한 확인: 같은 회사 소속인지
    const targetCompanyId = staffResult.data?.company_id || gymResult.data?.company_id;
    if (targetCompanyId && !canAccessCompany(staff, targetCompanyId)) {
      return NextResponse.json(
        { error: "해당 회사에 대한 권한이 없습니다." },
        { status: 403 }
      );
    }

    const { error } = await supabaseAdmin
      .from("staffs")
      .update({
        gym_id: gymId,
        role: role,
        employment_status: "재직"
      })
      .eq("id", staffId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "발령 완료!",
    });
  } catch (error: any) {
    console.error("[API] Error assigning staff:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
