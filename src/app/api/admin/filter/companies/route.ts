import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin } from "@/lib/api/auth";

export async function GET() {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isAdmin(staff.role)) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // system_admin은 모든 회사 조회, 그 외는 자기 회사만
    if (staff.role === "system_admin") {
      const { data, error } = await supabaseAdmin
        .from("companies")
        .select("id, name")
        .eq("status", "active")
        .order("name");

      if (error) throw error;

      return NextResponse.json({
        success: true,
        companies: data || [],
      });
    } else {
      // company_admin, admin은 자기 회사만 반환
      if (!staff.company_id) {
        return NextResponse.json({
          success: true,
          companies: [],
        });
      }

      const { data, error } = await supabaseAdmin
        .from("companies")
        .select("id, name")
        .eq("id", staff.company_id)
        .eq("status", "active");

      if (error) throw error;

      return NextResponse.json({
        success: true,
        companies: data || [],
      });
    }
  } catch (error: any) {
    console.error("[API] Error fetching companies:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
