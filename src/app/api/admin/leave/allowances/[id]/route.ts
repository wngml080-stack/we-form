import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 연차 조정
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isAdmin(staff.role)) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const body = await request.json();
    const { total_days, carried_over, adjusted_days, adjustment_reason } = body;

    const supabase = getSupabaseAdmin();

    // 해당 연차 부여 정보 조회
    const { data: existing } = await supabase
      .from("leave_allowances")
      .select("*, staff:staffs(company_id, gym_id)")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "연차 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    if (staff.role === "company_admin" && existing.company_id !== staff.company_id) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }
    if (staff.role === "admin" && existing.gym_id !== staff.gym_id) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (total_days !== undefined) updateData.total_days = total_days;
    if (carried_over !== undefined) updateData.carried_over = carried_over;
    if (adjusted_days !== undefined) updateData.adjusted_days = adjusted_days;
    if (adjustment_reason !== undefined) updateData.adjustment_reason = adjustment_reason;

    const { data, error } = await supabase
      .from("leave_allowances")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        staff:staffs(id, name, email, job_title, gym_id)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ allowance: data });
  } catch (error: unknown) {
    console.error("[LeaveAllowances PATCH] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
