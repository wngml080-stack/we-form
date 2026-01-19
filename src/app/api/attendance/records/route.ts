import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

// 출석 기록 조회
export async function GET(request: Request) {
  try {
    // 통합 인증
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

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
        // 요청된 지점에 대한 권한 확인
        if (!canAccessGym(staff, gymId)) {
          return NextResponse.json({ error: "해당 지점에 대한 접근 권한이 없습니다." }, { status: 403 });
        }
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
  } catch (error: unknown) {
    console.error("[AttendanceRecords] GET Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 출석 기록 생성
export async function POST(request: Request) {
  try {
    // 통합 인증
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { gym_id, schedule_id, member_id, status_code, memo } = body;

    // 지점 권한 확인 (gym_id가 지정된 경우)
    const targetGymId = gym_id || staff.gym_id;
    if (!canAccessGym(staff, targetGymId)) {
      return NextResponse.json({ error: "해당 지점에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    // 출석 기록 생성
    const { data, error } = await supabase
      .from("attendances")
      .insert({
        gym_id: targetGymId,
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
      .maybeSingle();

    if (error) {
      console.error("[Attendance] 출석 기록 생성 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "출석 기록 생성에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error("[AttendanceRecords] POST Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
