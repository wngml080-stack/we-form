import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

// 휴가 유형 목록 조회
export async function GET(request: Request) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("leave_types")
      .select("*")
      .order("display_order");

    if (staff.role !== "system_admin") {
      query = query.eq("company_id", staff.company_id);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leaveTypes: data });
  } catch (error: unknown) {
    console.error("[LeaveTypes GET] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 휴가 유형 생성
export async function POST(request: Request) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isAdmin(staff.role)) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const body = await request.json();
    const { name, code, deduction_days, requires_document, is_paid, max_days_per_year, color, display_order } = body;

    if (!name || !code || deduction_days === undefined) {
      return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("leave_types")
      .insert({
        company_id: staff.company_id,
        name,
        code,
        deduction_days,
        requires_document: requires_document || false,
        is_paid: is_paid !== undefined ? is_paid : true,
        max_days_per_year,
        color: color || "#3B82F6",
        display_order: display_order || 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leaveType: data });
  } catch (error: unknown) {
    console.error("[LeaveTypes POST] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
