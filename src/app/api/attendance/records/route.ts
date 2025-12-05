import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// 출석 기록 조회
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
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

    if (scheduleId) {
      query = query.eq("schedule_id", scheduleId);
    }

    if (gymId) {
      query = query.eq("gym_id", gymId);
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
    const supabase = await createClient();
    const body = await request.json();
    const { gym_id, schedule_id, member_id, status_code, memo } = body;

    // 현재 로그인한 직원 정보 조회
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { data: staff } = await supabase
      .from("staffs")
      .select("id, gym_id")
      .eq("user_id", user.id)
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
