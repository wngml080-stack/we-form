import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

export async function GET() {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;

    // 시스템 관리자만 전체 회사 조회 가능
    if (!staff || staff.role !== "system_admin") {
      return NextResponse.json(
        { error: "시스템 관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 모든 회사 조회
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });

    if (companiesError) throw companiesError;

    // 전체 지점 수 조회
    const { count: gymsCount, error: gymsError } = await supabaseAdmin
      .from("gyms")
      .select("*", { count: "exact", head: true });

    if (gymsError) throw gymsError;

    // 전체 직원 수 조회
    const { count: staffsCount, error: staffsError } = await supabaseAdmin
      .from("staffs")
      .select("*", { count: "exact", head: true });

    if (staffsError) throw staffsError;

    return NextResponse.json({
      success: true,
      companies: companies || [],
      totalGymsCount: gymsCount || 0,
      totalStaffsCount: staffsCount || 0,
    });
  } catch (error: unknown) {
    console.error("[SystemCompanies] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
