import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, companyName, repName, phone, businessNum } = body;

    console.log("🚀 [회사 가입 요청] 시작:", { companyName, email });

    // 1. 마스터키 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!serviceRoleKey) {
      console.error("❌ 서버 에러: SUPABASE_SERVICE_ROLE_KEY가 없습니다.");
      return NextResponse.json({ error: "서버 설정 오류 (마스터키 누락)" }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 2. 유저(대표 계정) 생성
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: repName },
    });

    if (authError) {
      console.error("❌ 유저 생성 실패:", authError.message);
      throw new Error("계정 생성 실패: " + authError.message);
    }

    console.log("✅ 유저 생성 완료 ID:", authData.user.id);

    // 3. 회사(Company) 생성
    const { data: companyData, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert({
        name: companyName,
        representative_name: repName,
        contact_phone: phone,
        business_number: businessNum,
        status: "pending", // 승인 대기
      })
      .select()
      .single();

    if (companyError) {
      // 실패 시 유저 삭제 (롤백)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      console.error("❌ 회사 정보 저장 실패:", companyError.message);
      throw new Error("회사 정보 저장 실패: " + companyError.message);
    }

    console.log("✅ 회사 생성 완료 ID:", companyData.id);

    // 4. 대표자(Staff) 정보 생성 (회사와 연결)
    const { error: staffError } = await supabaseAdmin
      .from("staffs")
      .insert({
        user_id: authData.user.id,
        company_id: companyData.id, // 👈 방금 만든 회사 ID 연결
        name: repName,
        email: email,
        phone: phone,
        job_title: "대표",
        role: "company_admin", // 👈 회사 관리자 권한 부여
        employment_status: "재직",
      });

    if (staffError) {
      console.error("❌ 대표자 정보 저장 실패:", staffError.message);
      throw new Error("대표자 정보 저장 실패");
    }

    console.log("🎉 모든 가입 절차 완료!");
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ 최종 에러:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


