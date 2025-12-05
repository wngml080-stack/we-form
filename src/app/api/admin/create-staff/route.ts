import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 👇 phone, joined_at, company_id 추가됨!
    const { email, password, name, job_title, gym_id, phone, joined_at, company_id } = body;

    console.log("🚀 직원 생성 요청:", { email, name, gym_id, company_id, phone });

    // 1. 마스터키 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!serviceRoleKey) {
      throw new Error("서버에 마스터키(SERVICE_ROLE_KEY)가 없습니다.");
    }

    // 2. 관리자 권한으로 Supabase 접속
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 3. 유저 생성 (이메일 인증 자동 완료 처리)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("유저 생성 실패");

    console.log("✅ Auth 유저 생성 완료 ID:", authData.user.id);

    // 4. staffs 테이블에 정보 입력
    const { error: dbError } = await supabaseAdmin
      .from("staffs")
      .insert({
        user_id: authData.user.id,
        company_id: company_id, // 👈 company_id 추가
        gym_id: gym_id,
        name: name,
        email: email,
        job_title: job_title,
        role: "staff",
        employment_status: "재직",
        // 👇 여기가 핵심! 추가된 필드 저장
        phone: phone,
        joined_at: joined_at || new Date().toISOString().split('T')[0], // 없으면 오늘 날짜
      });

    if (dbError) {
      console.error("❌ DB 저장 실패, 유저 생성 취소:", dbError.message);
      // DB 실패 시 Auth 유저도 같이 삭제 (롤백)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw dbError;
    }

    console.log("✅ DB 입력 완료");
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ 직원 생성 에러:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}