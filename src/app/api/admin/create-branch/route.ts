import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessCompany } from "@/lib/api/auth";

export async function POST(request: Request) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;

    // 지점 생성은 company_admin 이상만 가능
    if (!staff || !["system_admin", "company_admin"].includes(staff.role)) {
      return NextResponse.json(
        { error: "회사 관리자 이상의 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { gymName, managerId, category, size, open_date, memo, company_id } = body;

    if (!gymName || !managerId) {
      return NextResponse.json(
        { error: "지점명과 지점장(대기자)을 선택해주세요." },
        { status: 400 }
      );
    }

    // 회사 권한 확인
    const targetCompanyId = company_id || staff.company_id;
    if (!canAccessCompany(staff, targetCompanyId)) {
      return NextResponse.json(
        { error: "해당 회사에 대한 권한이 없습니다." },
        { status: 403 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 지점 생성
    const { data: gymData, error: gymError } = await supabaseAdmin
      .from("gyms")
      .insert({
        name: gymName,
        company_id: targetCompanyId,
        plan: "enterprise",
        status: "active",
        category,
        size,
        open_date,
        memo
      })
      .select()
      .maybeSingle();

    if (gymError) {
      console.error("[CreateBranch] 지점 생성 오류:", gymError);
      throw new Error("지점 생성 실패: " + gymError.message);
    }

    if (!gymData) {
      throw new Error("지점 생성에 실패했습니다.");
    }

    // 지점장 연결
    const { error: updateError } = await supabaseAdmin
      .from("staffs")
      .update({
        gym_id: gymData.id,
        role: "admin",
        job_title: "지점장",
        employment_status: "재직"
      })
      .eq("id", managerId);

    if (updateError) {
      // 롤백: 지점 삭제
      await supabaseAdmin.from("gyms").delete().eq("id", gymData.id);
      throw new Error("지점장 임명 실패: " + updateError.message);
    }

    return NextResponse.json({ success: true, gym: gymData });

  } catch (error: any) {
    console.error("[API] Error creating branch:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
