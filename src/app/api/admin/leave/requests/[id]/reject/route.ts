import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 휴가 반려
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isAdmin(staff.role)) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const body = await request.json();
    const { rejection_reason } = body;

    if (!rejection_reason) {
      return NextResponse.json({ error: "반려 사유를 입력해주세요." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 기존 신청 조회
    const { data: existing } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "휴가 신청을 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    if (staff.role === "company_admin" && existing.company_id !== staff.company_id) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }
    if (staff.role === "admin" && existing.gym_id !== staff.gym_id) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    if (existing.status !== "pending") {
      return NextResponse.json({ error: "대기 중인 신청만 반려할 수 있습니다." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("leave_requests")
      .update({
        status: "rejected",
        approved_by: staff.id,
        approved_at: new Date().toISOString(),
        rejection_reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        *,
        staff:staffs(id, name, email, job_title),
        leave_type:leave_types(id, name, code, color),
        approver:staffs!leave_requests_approved_by_fkey(id, name)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ request: data });
  } catch (error: unknown) {
    console.error("[LeaveRequests Reject] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
