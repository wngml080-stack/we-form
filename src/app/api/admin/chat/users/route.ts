import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { isHQStaff } from "@/lib/api/chat-auth";

/**
 * GET /api/admin/chat/users
 * 메신저 사용 가능 직원 목록 조회
 * (같은 회사의 모든 직원)
 */
export async function GET(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isHQStaff(staff)) {
      return NextResponse.json(
        { error: "본사 직원만 접근 가능합니다." },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 같은 회사의 모든 직원 조회 (퇴사자 제외)
    const { data: users, error } = await supabase
      .from("staffs")
      .select("id, name, email, role, job_title, gym_id, gyms(name)")
      .eq("company_id", staff.company_id)
      .neq("employment_status", "퇴사")
      .order("name");

    if (error) throw error;

    // gym 정보 포함하여 반환
    const formattedUsers = users?.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      job_title: u.job_title,
      gym_id: u.gym_id,
      gym_name: u.gyms?.name || null,
    }));

    return NextResponse.json({ users: formattedUsers || [] });
  } catch (error) {
    console.error("[Chat Users API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
