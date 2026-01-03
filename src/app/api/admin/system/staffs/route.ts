import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";

export async function GET(request: Request) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;

    // 시스템/회사/지점 관리자만 접근 가능
    if (!staff || !["system_admin", "company_admin", "admin"].includes(staff.role)) {
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

    // 지점의 회사 확인 및 권한 체크
    const { data: gym, error: gymError } = await supabaseAdmin
      .from("gyms")
      .select("company_id")
      .eq("id", gymId)
      .maybeSingle();

    if (gymError) {
      console.error("[SystemStaffs] 지점 조회 오류:", gymError);
      return NextResponse.json(
        { error: "지점 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    if (!canAccessGym(staff, gymId, gym?.company_id)) {
      return NextResponse.json(
        { error: "해당 지점에 대한 권한이 없습니다." },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("staffs")
      .select("id, name, email, phone, job_title, role, employment_status")
      .eq("gym_id", gymId)
      .order("name", { ascending: true });

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
