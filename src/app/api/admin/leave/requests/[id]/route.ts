import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 휴가 신청 상세 조회
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { staff: _staff, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("leave_requests")
      .select(`
        *,
        staff:staffs(id, name, email),
        leave_type:leave_types(id, name, code, color)
      `)
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ request: data });
  } catch (error: unknown) {
    console.error("[LeaveRequest GET] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
