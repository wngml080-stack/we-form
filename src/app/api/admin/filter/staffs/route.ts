import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym, isAdmin } from "@/lib/api/auth";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const gymId = searchParams.get("gym_id");

    if (!gymId) {
      return NextResponse.json(
        { error: "gym_id is required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 지점의 회사 정보 조회하여 권한 확인
    const { data: gym } = await supabaseAdmin
      .from("gyms")
      .select("company_id")
      .eq("id", gymId)
      .single();

    if (!canAccessGym(staff, gymId, gym?.company_id)) {
      return NextResponse.json(
        { error: "해당 지점에 대한 접근 권한이 없습니다." },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("staffs")
      .select("id, name, job_title, role")
      .eq("gym_id", gymId)
      .eq("employment_status", "재직")
      .order("name");

    if (error) throw error;

    return NextResponse.json({
      success: true,
      staffs: data || [],
    });
  } catch (error: any) {
    console.error("[API] Error fetching staffs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
