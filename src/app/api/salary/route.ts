import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin, canAccessGym } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

export async function GET(request: NextRequest) {
  try {
    // Supabase Auth 인증
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
  } catch (error: unknown) {
    console.error("[SalarySettings] GET Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Supabase Auth 인증
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
      .maybeSingle();

    if (error) {
      console.error("[SalarySettings] 생성 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "급여 설정 생성에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error("[SalarySettings] POST Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
