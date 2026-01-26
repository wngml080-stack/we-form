import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

// 연차 부여 목록 조회
export async function GET(request: Request) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isAdmin(staff.role)) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("leave_allowances")
      .select(`
        *,
        staff:staffs(id, name, email, job_title, gym_id)
      `)
      .eq("year", year);

    if (staff.role === "company_admin") {
      query = query.eq("company_id", staff.company_id);
    } else if (staff.role === "admin") {
      query = query.eq("gym_id", staff.gym_id);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ allowances: data });
  } catch (error: unknown) {
    console.error("[LeaveAllowances GET] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 연차 부여
export async function POST(request: Request) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isAdmin(staff.role)) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const body = await request.json();
    const { staff_id, year, total_days, carried_over, adjusted_days, adjustment_reason } = body;

    if (!staff_id || !year || total_days === undefined) {
      return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 직원 정보 조회
    const { data: staffData } = await supabase
      .from("staffs")
      .select("gym_id, company_id")
      .eq("id", staff_id)
      .single();

    if (!staffData) {
      return NextResponse.json({ error: "직원을 찾을 수 없습니다." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("leave_allowances")
      .upsert({
        staff_id,
        company_id: staffData.company_id,
        gym_id: staffData.gym_id,
        year,
        total_days,
        carried_over: carried_over || 0,
        adjusted_days: adjusted_days || 0,
        adjustment_reason,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ allowance: data });
  } catch (error: unknown) {
    console.error("[LeaveAllowances POST] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
