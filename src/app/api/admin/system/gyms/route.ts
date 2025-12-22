import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessCompany } from "@/lib/api/auth";

export async function GET(request: Request) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;

    // 시스템 관리자 또는 회사 관리자만 접근 가능
    if (!staff || !["system_admin", "company_admin"].includes(staff.role)) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("company_id");

    if (!companyId) {
      return NextResponse.json(
        { error: "company_id is required" },
        { status: 400 }
      );
    }

    // 회사 권한 확인
    if (!canAccessCompany(staff, companyId)) {
      return NextResponse.json(
        { error: "해당 회사에 대한 권한이 없습니다." },
        { status: 403 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from("gyms")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      gyms: data || [],
    });
  } catch (error: any) {
    console.error("[API] Error fetching gyms:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
