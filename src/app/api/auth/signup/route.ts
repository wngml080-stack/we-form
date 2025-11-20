import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, phone, job_title, joined_at } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. 유저 생성
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError) throw authError;

    // 2. Staff 테이블에 저장 (gym_id 없이! role은 'pending')
    const { error: dbError } = await supabaseAdmin
      .from("staffs")
      .insert({
        user_id: authData.user.id,
        name: name,
        email: email,
        phone: phone,
        job_title: job_title,
        joined_at: joined_at,
        role: "pending",          // 👈 아직 권한 없음
        employment_status: "가입대기",
        gym_id: null              // 👈 아직 소속 없음 (본사가 정해줄 예정)
      });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}