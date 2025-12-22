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
    const { staffId, jobTitle, role, employmentStatus } = body;

    if (!staffId) {
      return NextResponse.json(
        { error: "staffId is required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 대상 직원의 회사 확인
    const { data: targetStaff } = await supabaseAdmin
      .from("staffs")
      .select("company_id")
      .eq("id", staffId)
      .single();

    if (targetStaff?.company_id && !canAccessCompany(staff, targetStaff.company_id)) {
      return NextResponse.json(
        { error: "해당 직원에 대한 권한이 없습니다." },
        { status: 403 }
      );
    }

    const { error } = await supabaseAdmin
      .from("staffs")
      .update({
        job_title: jobTitle,
        role: role,
        employment_status: employmentStatus
      })
      .eq("id", staffId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "직원 정보가 수정되었습니다.",
    });
  } catch (error: any) {
    console.error("[API] Error updating staff:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
