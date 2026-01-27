import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

/**
 * 통합 필터 초기화 API
 * companies, gyms, staffs를 한 번에 가져와서 초기화 속도 향상
 */
export async function GET(request: Request) {
  try {
    const { staff, error: authError } = await requireAuth();
    if (authError) return authError;
    if (!staff) return NextResponse.json({ error: "인증 오류" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("company_id") || staff.company_id;
    const gymId = searchParams.get("gym_id") || staff.gym_id;

    const supabaseAdmin = getSupabaseAdmin();
    const isSystemAdmin = staff.role === "system_admin";
    const isCompanyAdmin = staff.role === "company_admin";

    // 병렬로 모든 데이터 조회
    const [companiesResult, gymsResult, staffsResult] = await Promise.all([
      // Companies (system_admin만)
      isSystemAdmin
        ? supabaseAdmin
            .from("companies")
            .select("id, name")
            .eq("status", "active")
            .order("name")
        : Promise.resolve({ data: [], error: null }),

      // Gyms
      (staff.role === "admin" || staff.role === "staff") && staff.gym_id
        ? supabaseAdmin
            .from("gyms")
            .select("id, name")
            .eq("id", staff.gym_id)
        : companyId
          ? supabaseAdmin
              .from("gyms")
              .select("id, name")
              .eq("company_id", companyId)
              .order("name")
          : Promise.resolve({ data: [], error: null }),

      // Staffs
      gymId
        ? supabaseAdmin
            .from("staffs")
            .select("id, name, job_title, role")
            .eq("gym_id", gymId)
            .neq("employment_status", "퇴사")
            .order("name")
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (companiesResult.error) throw companiesResult.error;
    if (gymsResult.error) throw gymsResult.error;
    if (staffsResult.error) throw staffsResult.error;

    // 기본 gym_id 결정
    const gyms = gymsResult.data || [];
    const defaultGymId = gymId || (gyms.length > 0 ? gyms[0].id : "");

    return NextResponse.json({
      success: true,
      companies: companiesResult.data || [],
      gyms,
      staffs: staffsResult.data || [],
      defaultCompanyId: companyId || "",
      defaultGymId,
    });
  } catch (error: unknown) {
    console.error("[API] Error in filter init:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
