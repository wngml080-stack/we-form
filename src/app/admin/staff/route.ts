import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, job_title, gym_id } = body;

    console.log("🚀 직원 생성 요청:", { email, name, gym_id });

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
      email_confirm: true, // 👈 이메일 인증 건너뛰기 (바로 로그인 가능)
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
        gym_id: gym_id,
        name: name,
        job_title: job_title,
        role: "staff", // 기본 권한은 staff
        employment_status: "재직",
      });

    if (dbError) {
      // DB 넣다 실패하면 아까 만든 유저도 지워야 깔끔함 (롤백)
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