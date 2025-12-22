import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin } from "@/lib/api/auth";

// Service Role로 RLS 우회해서 모든 직원 조회
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

    const supabase = getSupabaseAdmin();

    // URL에서 gym_id, company_id 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const gymId = searchParams.get('gym_id');
    const companyId = searchParams.get('company_id');

    let query = supabase
      .from("staffs")
      .select(`
        id, user_id, name, job_title, role, gym_id, company_id,
        salary_setting:staff_salary_settings(
          id, template_id, personal_parameters,
          template:salary_templates(name)
        )
      `);

    // 역할별 필터링 (인증된 staff 정보 기반)
    if (staff.role === 'system_admin') {
      // 시스템 관리자: 요청 파라미터에 따라 필터링
      if (companyId) {
        query = query.eq("company_id", companyId);
      }
      if (gymId) {
        query = query.eq("gym_id", gymId);
      }
    } else if (staff.role === 'company_admin') {
      // 회사 관리자: 자신의 회사만
      query = query.eq("company_id", staff.company_id);
      if (gymId) {
        query = query.eq("gym_id", gymId);
      }
    } else {
      // 지점 관리자: 자신의 지점만
      query = query.eq("gym_id", staff.gym_id);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      staffs: data,
      count: data?.length || 0,
    });
  } catch (error: any) {
    console.error("[API] Error fetching staffs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
