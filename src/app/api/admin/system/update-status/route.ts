import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";

export async function POST(request: Request) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;

    // 시스템 관리자만 회사 상태 변경 가능
    if (!staff || staff.role !== "system_admin") {
      return NextResponse.json(
        { error: "시스템 관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { companyId, status } = body;

    if (!companyId || !status) {
      return NextResponse.json(
        { error: "companyId and status are required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin
      .from("companies")
      .update({ status })
      .eq("id", companyId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API] Error updating company status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
