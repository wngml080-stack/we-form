import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin, canAccessCompany, canAccessGym } from "@/lib/api/auth";

/**
 * 직원 등록 API (Supabase Auth 방식)
 * - staffs 테이블에만 직원 정보 등록
 * - 직원이 Supabase Auth로 로그인하면 이메일로 자동 매칭
 */
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
    const { email, name, job_title, gym_id, phone, joined_at, company_id } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "이메일과 이름은 필수입니다." },
        { status: 400 }
      );
    }

    // 회사/지점 권한 확인
    const targetCompanyId = company_id || staff.company_id;
    const targetGymId = gym_id || staff.gym_id;

    if (!canAccessCompany(staff, targetCompanyId)) {
      return NextResponse.json(
        { error: "해당 회사에 대한 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 지점이 지정된 경우 지점 권한도 확인
    if (targetGymId && staff.role !== "system_admin" && staff.role !== "company_admin") {
      if (!canAccessGym(staff, targetGymId)) {
        return NextResponse.json(
          { error: "해당 지점에 대한 권한이 없습니다." },
          { status: 403 }
        );
      }
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 이메일 중복 확인
    const { data: existingStaff, error: existingError } = await supabaseAdmin
      .from("staffs")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingError) {
      console.error("[CreateStaff] 이메일 중복 확인 오류:", existingError);
      return NextResponse.json(
        { error: "이메일 확인 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    if (existingStaff) {
      return NextResponse.json(
        { error: "이미 등록된 이메일입니다." },
        { status: 400 }
      );
    }

    // staffs 테이블에 직원 정보 등록 (로그인 시 이메일로 자동 매칭)
    const { error: dbError } = await supabaseAdmin
      .from("staffs")
      .insert({
        company_id: targetCompanyId,
        gym_id: targetGymId,
        name: name,
        email: email,
        job_title: job_title,
        role: "staff",
        employment_status: "재직",
        phone: phone,
        joined_at: joined_at || new Date().toISOString().split('T')[0],
      });

    if (dbError) throw dbError;

    return NextResponse.json({
      success: true,
      message: "직원이 등록되었습니다. 해당 이메일로 로그인 시 자동 연결됩니다."
    });

  } catch (error: any) {
    console.error("[API] Error creating staff:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
