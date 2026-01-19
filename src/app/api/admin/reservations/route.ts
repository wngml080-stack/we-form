import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";

// 예약 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gym_id = searchParams.get("gym_id");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");
    const status = searchParams.get("status");
    const staff_id = searchParams.get("staff_id");

    if (!gym_id) {
      return NextResponse.json({ error: "gym_id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 권한 확인
    const { data: gym } = await supabase
      .from("gyms")
      .select("company_id")
      .eq("id", gym_id)
      .maybeSingle();

    if (!canAccessGym(staff, gym_id, gym?.company_id)) {
      return NextResponse.json({ error: "해당 지점에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    // 예약 목록 조회
    let query = supabase
      .from("reservations")
      .select("*")
      .eq("gym_id", gym_id)
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true });

    if (start_date) {
      query = query.gte("scheduled_date", start_date);
    }

    if (end_date) {
      query = query.lte("scheduled_date", end_date);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (staff_id) {
      query = query.eq("staff_id", staff_id);
    }

    const { data: reservations, error } = await query;

    if (error) {
      console.error("[Reservations API] Error:", error);
      return NextResponse.json({ error: "예약 조회 실패" }, { status: 500 });
    }

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error("[Reservations API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// 예약 생성
export async function POST(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const {
      gym_id,
      company_id,
      inquiry_id,
      member_id,
      customer_name,
      customer_phone,
      customer_email,
      reservation_type,
      scheduled_date,
      scheduled_time,
      duration_minutes,
      staff_id,
      notes,
      staff_memo,
    } = body;

    if (!gym_id || !company_id || !customer_name || !customer_phone || !reservation_type || !scheduled_date || !scheduled_time) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 권한 확인
    const { data: gym } = await supabase
      .from("gyms")
      .select("company_id")
      .eq("id", gym_id)
      .maybeSingle();

    if (!canAccessGym(staff, gym_id, gym?.company_id)) {
      return NextResponse.json({ error: "해당 지점에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    // 예약 생성
    const { data: reservation, error } = await supabase
      .from("reservations")
      .insert({
        gym_id,
        company_id,
        inquiry_id,
        member_id,
        customer_name,
        customer_phone,
        customer_email,
        reservation_type,
        scheduled_date,
        scheduled_time,
        duration_minutes: duration_minutes || 60,
        staff_id,
        notes,
        staff_memo,
        status: "confirmed",
      })
      .select()
      .single();

    if (error) {
      console.error("[Reservations API] Create error:", error);
      return NextResponse.json({ error: "예약 생성 실패" }, { status: 500 });
    }

    // 문의와 연결된 경우 문의의 reservation_id 업데이트
    if (inquiry_id) {
      await supabase
        .from("inquiries")
        .update({ reservation_id: reservation.id })
        .eq("id", inquiry_id);
    }

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    console.error("[Reservations API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
