import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 휴가 유형 수정
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isAdmin(staff.role)) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const body = await request.json();
    const { name, deduction_days, requires_document, is_paid, max_days_per_year, color, is_active, display_order } = body;

    const supabase = getSupabaseAdmin();

    // 해당 휴가 유형이 본인 회사 것인지 확인
    const { data: existing } = await supabase
      .from("leave_types")
      .select("id, company_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "휴가 유형을 찾을 수 없습니다." }, { status: 404 });
    }

    if (staff.role !== "system_admin" && existing.company_id !== staff.company_id) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (deduction_days !== undefined) updateData.deduction_days = deduction_days;
    if (requires_document !== undefined) updateData.requires_document = requires_document;
    if (is_paid !== undefined) updateData.is_paid = is_paid;
    if (max_days_per_year !== undefined) updateData.max_days_per_year = max_days_per_year;
    if (color !== undefined) updateData.color = color;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (display_order !== undefined) updateData.display_order = display_order;

    const { data, error } = await supabase
      .from("leave_types")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leaveType: data });
  } catch (error: unknown) {
    console.error("[LeaveTypes PATCH] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 휴가 유형 삭제
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isAdmin(staff.role)) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    // 해당 휴가 유형이 본인 회사 것인지 확인
    const { data: existing } = await supabase
      .from("leave_types")
      .select("id, company_id, code")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "휴가 유형을 찾을 수 없습니다." }, { status: 404 });
    }

    if (staff.role !== "system_admin" && existing.company_id !== staff.company_id) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    // 기본 휴가 유형은 삭제 불가
    const defaultCodes = ["annual", "half_am", "half_pm", "sick", "family", "other"];
    if (defaultCodes.includes(existing.code)) {
      return NextResponse.json({ error: "기본 휴가 유형은 삭제할 수 없습니다." }, { status: 400 });
    }

    // 해당 유형을 사용한 휴가 신청이 있는지 확인
    const { count } = await supabase
      .from("leave_requests")
      .select("id", { count: "exact", head: true })
      .eq("leave_type_id", id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: "이 휴가 유형을 사용한 신청 내역이 있어 삭제할 수 없습니다. 비활성화를 권장합니다." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("leave_types")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[LeaveTypes DELETE] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
