import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin, canAccessGym } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  try {
    // 통합 인증 (clerk_user_id + 이메일 fallback)
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const searchParams = request.nextUrl.searchParams;
    const gymId = searchParams.get("gym_id");

    if (!gymId) {
      return NextResponse.json({ error: "gym_id is required" }, { status: 400 });
    }

    // 지점 접근 권한 확인
    if (!canAccessGym(staff, gymId)) {
      return NextResponse.json({ error: "해당 지점에 대한 접근 권한이 없습니다." }, { status: 403 });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 통합 인증
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    // 관리자 권한 확인
    if (!isAdmin(staff.role)) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { gym_id, attendance_code, pay_type, amount, rate, memo } = body;

    if (!gym_id) {
      return NextResponse.json({ error: "gym_id is required" }, { status: 400 });
    }

    // 지점 접근 권한 확인
    if (!canAccessGym(staff, gym_id)) {
      return NextResponse.json({ error: "해당 지점에 대한 접근 권한이 없습니다." }, { status: 403 });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
