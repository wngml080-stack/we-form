import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service Role로 RLS 우회해서 모든 직원 조회
export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // URL에서 role, gym_id, company_id 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
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

    // 역할별 필터링
    if (role === 'system_admin') {
      // 모든 직원
    } else if (role === 'company_admin' && companyId) {
      query = query.eq("company_id", companyId);
    } else if (gymId) {
      query = query.eq("gym_id", gymId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      staffs: data,
      count: data?.length || 0,
      filter: { role, gymId, companyId }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
