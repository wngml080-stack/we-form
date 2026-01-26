import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 휴가 승인
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isAdmin(staff.role)) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "휴가 신청을 찾을 수 없습니다." }, { status: 404 });
    }

    if (existing.status !== "pending") {
      return NextResponse.json({ error: "대기 중인 신청만 승인할 수 있습니다." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("leave_requests")
      .update({
        status: "approved",
        approved_by: staff.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ request: data });
  } catch (error: unknown) {
    console.error("[LeaveRequests Approve] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
