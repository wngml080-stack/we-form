import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // company_id 추가됨!
    const { email, password, name, phone, job_title, joined_at, company_id } = body;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. 유저 생성
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError) throw authError;

    // 2. Staff 저장 (찾은 회사 ID 연결)
    const { error: dbError } = await supabaseAdmin
      .from("staffs")
      .insert({
        user_id: authData.user.id,
        company_id: company_id, // 👈 핵심: 찾아낸 회사 소속으로 들어감
        gym_id: null,           // 지점은 나중에 본사가 발령
        name: name,
        email: email,
        phone: phone,
        job_title: job_title,
        joined_at: joined_at,
        role: "staff",          // 기본 권한
        employment_status: "가입대기",
      });

    if (dbError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw dbError;
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}