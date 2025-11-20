import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      gym_id,
      staff_name,
      phone,
      joined_at,
      job_title,
    } = body;

    if (!email || !password || !gym_id || !staff_name) {
      return NextResponse.json(
        { error: "이메일, 비밀번호, 지점, 이름은 필수 값입니다." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!serviceRoleKey) {
      throw new Error("서버 설정 오류: 마스터키가 설정되어 있지 않습니다.");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Auth 유저 생성
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: staff_name },
      });

    if (authError) throw authError;
    if (!authData.user) throw new Error("유저 생성에 실패했습니다.");

    // 2. staffs 테이블에 직원 정보 생성 (가입대기 상태)
    const { error: staffError } = await supabaseAdmin.from("staffs").insert({
      user_id: authData.user.id,
      gym_id,
      name: staff_name,
      email,
      phone,
      joined_at,
      job_title: job_title || "트레이너",
      role: "staff",
      employment_status: "가입대기",
    });

    if (staffError) {
      console.error("❌ 직원 레코드 생성 실패, Auth 유저 롤백:", staffError);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error("직원 정보 저장에 실패했습니다.");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ 직원 입사 신청 에러:", error.message);
    return NextResponse.json(
      { error: error.message ?? "입사 신청 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


