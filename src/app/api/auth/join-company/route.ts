import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, companyName, repName, phone, businessNum } = body;

    const supabaseAdmin = getSupabaseAdmin();

    // 유저(대표 계정) 생성
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: repName },
    });

    if (authError) {
      throw new Error("계정 생성 실패: " + authError.message);
    }

    // 회사(Company) 생성
    const { data: companyData, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert({
        name: companyName,
        representative_name: repName,
        contact_phone: phone,
        business_number: businessNum,
        status: "pending",
      })
      .select()
      .single();

    if (companyError) {
      // 실패 시 유저 삭제 (롤백)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error("회사 정보 저장 실패: " + companyError.message);
    }

    // 대표자(Staff) 정보 생성 (회사와 연결)
    const { error: staffError } = await supabaseAdmin
      .from("staffs")
      .insert({
        user_id: authData.user.id,
        company_id: companyData.id,
        name: repName,
        email: email,
        phone: phone,
        job_title: "대표",
        role: "company_admin",
        employment_status: "재직",
      });

    if (staffError) {
      throw new Error("대표자 정보 저장 실패: " + staffError.message);
    }

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    console.error("회사 가입 실패:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
