import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAuth, canAccessGym } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

export async function GET(request: Request) {
  try {
    // 인증 확인 (staff 포함 모든 역할 허용)
    const { staff, error: authError } = await requireAuth();
    if (authError) return authError;
    if (!staff) return NextResponse.json({ error: "인증 오류" }, { status: 401 });

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
    const { data: gym, error: gymError } = await supabaseAdmin
      .from("gyms")
      .select("company_id")
      .eq("id", gymId)
      .maybeSingle();

    if (gymError) {
      console.error("[FilterStaffs] 지점 조회 오류:", gymError);
      return NextResponse.json(
        { error: "지점 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

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
  } catch (error: unknown) {
    console.error("[API] Error fetching staffs:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
