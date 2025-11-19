import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  // 서버 부팅 시점에만 보이는 로그
  console.error("NEXT_PUBLIC_SUPABASE_URL 환경 변수가 설정되지 않았습니다.");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다.");
}

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "서버 설정이 올바르지 않습니다. 관리자에게 문의해 주세요." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { email, password, name, job_title, gym_id } = body ?? {};

    if (!email || !password || !name || !gym_id) {
      return NextResponse.json(
        { error: "이메일, 비밀번호, 이름, 지점(gym_id)은 필수 값입니다." },
        { status: 400 }
      );
    }

    // 1) Supabase Auth 사용자 생성 (이메일 인증 자동 완료 처리)
    const {
      data: userData,
      error: userError,
    } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (userError || !userData.user) {
      console.error("직원 계정 생성 실패:", userError);
      return NextResponse.json(
        { error: "직원 계정 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    const userId = userData.user.id;

    // 2) staffs 테이블에 직원 정보 등록
    const { data: staffData, error: staffError } = await supabaseAdmin
      .from("staffs")
      .insert({
        gym_id,
        user_id: userId,
        name,
        job_title: job_title ?? null,
        role: "staff",
        is_active: true,
      })
      .select("id")
      .maybeSingle();

    if (staffError || !staffData) {
      console.error("staffs 테이블 insert 실패:", staffError);
      return NextResponse.json(
        { error: "직원 정보를 저장하는 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user_id: userId,
        staff_id: staffData.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("직원 생성 API 오류:", error);
    return NextResponse.json(
      { error: "직원 생성 중 알 수 없는 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


