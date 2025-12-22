import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const searchParams = request.nextUrl.searchParams;
    const gymId = searchParams.get("gym_id");

    if (!gymId) {
      return NextResponse.json(
        { error: "gym_id is required" },
        { status: 400 }
      );
    }

    // 사용자 권한 확인
    const { data: staff } = await supabase
      .from("staffs")
      .select("id, role, gym_id")
      .eq("clerk_user_id", userId)
      .single();

    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("salary_settings")
      .select("*")
      .eq("gym_id", gymId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("급여 설정 조회 실패:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const body = await request.json();

    const { gym_id, attendance_code, pay_type, amount, rate, memo } = body;

    if (!gym_id) {
      return NextResponse.json(
        { error: "gym_id is required" },
        { status: 400 }
      );
    }

    // 사용자 권한 확인 (관리자만 설정 생성 가능)
    const { data: staff } = await supabase
      .from("staffs")
      .select("id, role, gym_id")
      .eq("clerk_user_id", userId)
      .single();

    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    const adminRoles = ["system_admin", "company_admin", "admin"];
    if (!adminRoles.includes(staff.role)) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("salary_settings")
      .insert({
        gym_id,
        attendance_code: attendance_code || null,
        pay_type: pay_type || "fixed",
        amount: amount || null,
        rate: rate || null,
        memo: memo || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("급여 설정 생성 실패:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
