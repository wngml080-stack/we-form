import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin, canAccessCompany } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

export async function GET(request: Request) {
  try {
    // 인증 및 관리자 권한 확인
    const { staff, error: authError } = await requireAdmin();
    if (authError) return authError;
    if (!staff) return NextResponse.json({ error: "인증 오류" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("company_id");

    if (!companyId) {
      return NextResponse.json(
        { error: "company_id is required" },
        { status: 400 }
      );
    }

    // 권한 확인
    if (!canAccessCompany(staff, companyId)) {
      return NextResponse.json(
        { error: "해당 회사에 대한 접근 권한이 없습니다." },
        { status: 403 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // admin 역할은 자기 지점만 반환
    if (staff.role === "admin" && staff.gym_id) {
      const { data, error } = await supabaseAdmin
        .from("gyms")
        .select("id, name")
        .eq("id", staff.gym_id);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        gyms: data || [],
      });
    }

    // system_admin, company_admin은 해당 회사의 모든 지점
    const { data, error } = await supabaseAdmin
      .from("gyms")
      .select("id, name")
      .eq("company_id", companyId)
      .order("name");

    if (error) throw error;

    return NextResponse.json({
      success: true,
      gyms: data || [],
    });
  } catch (error: unknown) {
    console.error("[API] Error fetching gyms:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
