import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// 출석 기록 조회
export async function GET(request: Request) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 사용자 권한 확인
    const { data: staff } = await supabase
      .from("staffs")
      .select("id, role, gym_id, company_id")
      .eq("clerk_user_id", userId)
      .single();

    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get("schedule_id");
    const gymId = searchParams.get("gym_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let query = supabase
      .from("attendances")
      .select(`
        *,
        member:members(id, name, phone),
        staff:staffs(id, name),
        schedule:schedules(id, title, start_time, end_time),
        status:attendance_statuses(code, label, color)
      `)
      .order("attended_at", { ascending: false });

    // 역할별 필터링
    if (staff.role === "system_admin") {
      // 시스템 관리자: 모두 조회 가능
      if (gymId) {
        query = query.eq("gym_id", gymId);
      }
    } else if (staff.role === "company_admin") {
      // 회사 관리자: 자신의 회사 소속 지점만
      if (gymId) {
        query = query.eq("gym_id", gymId);
      } else {
        // gym_id 없으면 자신 회사의 모든 지점 조회
        const { data: companyGyms } = await supabase
          .from("gyms")
          .select("id")
          .eq("company_id", staff.company_id);
        const gymIds = companyGyms?.map(g => g.id) || [];
        if (gymIds.length > 0) {
          query = query.in("gym_id", gymIds);
        }
      }
    } else if (staff.role === "admin") {
      // 지점 관리자: 자신의 지점만
      query = query.eq("gym_id", staff.gym_id);
    } else {
      // 일반 직원: 자신의 기록만
      query = query.eq("staff_id", staff.id);
    }

    if (scheduleId) {
      query = query.eq("schedule_id", scheduleId);
    }

    if (startDate) {
      query = query.gte("attended_at", startDate);
    }

    if (endDate) {
      query = query.lte("attended_at", endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("❌ 출석 기록 조회 실패:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 출석 기록 생성
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { gym_id, schedule_id, member_id, status_code, memo } = body;

    // 현재 로그인한 직원 정보 조회
    const { data: staff } = await supabase
      .from("staffs")
      .select("id, gym_id")
      .eq("clerk_user_id", userId)
      .single();

    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    // 출석 기록 생성
    const { data, error } = await supabase
      .from("attendances")
      .insert({
        gym_id: gym_id || staff.gym_id,
        schedule_id,
        staff_id: staff.id,
        member_id,
        status_code,
        memo,
        attended_at: new Date().toISOString(),
      })
      .select(`
        *,
        member:members(id, name, phone),
        staff:staffs(id, name),
        schedule:schedules(id, title, start_time, end_time),
        status:attendance_statuses(code, label, color)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("❌ 출석 기록 생성 실패:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
