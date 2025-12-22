import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";

export async function POST(request: Request) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;

    // 시스템 관리자만 회사 수정 가능
    if (!staff || staff.role !== "system_admin") {
      return NextResponse.json(
        { error: "시스템 관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, representative_name, contact_phone, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "회사 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin
      .from("companies")
      .update({ name, representative_name, contact_phone, status })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API] Error updating company:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
