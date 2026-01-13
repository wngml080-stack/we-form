import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";

// 예약 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // 예약 조회
    const { data: reservation, error } = await supabase
      .from("reservations")
      .select(`
        *,
        staff:staffs(id, name, phone),
        inquiry:inquiries(id, channel, customer_name, content),
        member:members(id, name, phone, status)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("[Reservation API] Error:", error);
      return NextResponse.json({ error: "예약 조회 실패" }, { status: 500 });
    }

    if (!reservation) {
      return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    const { data: gym } = await supabase
      .from("gyms")
      .select("company_id")
      .eq("id", reservation.gym_id)
      .maybeSingle();

    if (!canAccessGym(staff, reservation.gym_id, gym?.company_id)) {
      return NextResponse.json({ error: "해당 예약에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    return NextResponse.json({ reservation });
  } catch (error) {
    console.error("[Reservation API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// 예약 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseAdmin();

    // 기존 예약 조회
    const { data: existing } = await supabase
      .from("reservations")
      .select("gym_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    const { data: gym } = await supabase
      .from("gyms")
      .select("company_id")
      .eq("id", existing.gym_id)
      .maybeSingle();

    if (!canAccessGym(staff, existing.gym_id, gym?.company_id)) {
      return NextResponse.json({ error: "해당 예약에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    // 업데이트 데이터 구성
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "customer_name",
      "customer_phone",
      "customer_email",
      "reservation_type",
      "scheduled_date",
      "scheduled_time",
      "duration_minutes",
      "staff_id",
      "status",
      "notes",
      "staff_memo",
      "google_calendar_event_id",
      "google_calendar_synced_at",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // 예약 수정
    const { data: reservation, error } = await supabase
      .from("reservations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[Reservation API] Update error:", error);
      return NextResponse.json({ error: "예약 수정 실패" }, { status: 500 });
    }

    return NextResponse.json({ reservation });
  } catch (error) {
    console.error("[Reservation API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// 예약 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // 기존 예약 조회
    const { data: existing } = await supabase
      .from("reservations")
      .select("gym_id, inquiry_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    const { data: gym } = await supabase
      .from("gyms")
      .select("company_id")
      .eq("id", existing.gym_id)
      .maybeSingle();

    if (!canAccessGym(staff, existing.gym_id, gym?.company_id)) {
      return NextResponse.json({ error: "해당 예약에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    // 연결된 문의의 reservation_id 초기화
    if (existing.inquiry_id) {
      await supabase
        .from("inquiries")
        .update({ reservation_id: null })
        .eq("id", existing.inquiry_id);
    }

    // 예약 삭제
    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[Reservation API] Delete error:", error);
      return NextResponse.json({ error: "예약 삭제 실패" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Reservation API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
