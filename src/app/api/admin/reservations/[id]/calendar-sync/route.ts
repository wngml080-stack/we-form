import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";
import { refreshAccessToken } from "@/lib/google/config";
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  reservationToCalendarEvent,
} from "@/lib/google/calendar";
import { decrypt, encrypt } from "@/lib/utils/encryption";

// Google Calendar 동기화
export async function POST(
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
    const { action } = await request.json(); // 'sync' | 'delete'

    const supabase = getSupabaseAdmin();

    // 예약 조회
    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .select(`
        *,
        gym:gyms(id, name, company_id)
      `)
      .eq("id", id)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    if (!canAccessGym(staff, reservation.gym_id, reservation.gym?.company_id)) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    // 사용자의 Google 토큰 조회
    const { data: tokenData, error: tokenError } = await supabase
      .from("user_google_tokens")
      .select("*")
      .eq("user_id", staff.user_id)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: "Google 계정이 연결되지 않았습니다. 설정에서 Google 계정을 연결해주세요." },
        { status: 400 }
      );
    }

    // 암호화된 토큰 복호화
    let accessToken = decrypt(tokenData.access_token);
    const refreshToken = tokenData.refresh_token ? decrypt(tokenData.refresh_token) : null;
    const tokenExpiry = new Date(tokenData.expires_at);

    if (tokenExpiry < new Date()) {
      // 토큰 갱신
      if (!refreshToken) {
        return NextResponse.json(
          { error: "Google 인증이 만료되었습니다. 다시 연결해주세요." },
          { status: 401 }
        );
      }

      try {
        const newTokens = await refreshAccessToken(refreshToken);
        accessToken = newTokens.access_token;

        // 새 토큰 저장 (암호화)
        await supabase
          .from("user_google_tokens")
          .update({
            access_token: encrypt(newTokens.access_token),
            expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
          })
          .eq("user_id", staff.user_id);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        return NextResponse.json(
          { error: "Google 인증이 만료되었습니다. 다시 연결해주세요." },
          { status: 401 }
        );
      }
    }

    if (action === "delete") {
      // 캘린더 이벤트 삭제
      if (reservation.google_calendar_event_id) {
        try {
          await deleteCalendarEvent(accessToken, reservation.google_calendar_event_id);
        } catch (error) {
          console.error("Failed to delete calendar event:", error);
        }

        // DB 업데이트
        await supabase
          .from("reservations")
          .update({
            google_calendar_event_id: null,
            google_calendar_synced_at: null,
          })
          .eq("id", id);
      }

      return NextResponse.json({ success: true, message: "캘린더 이벤트가 삭제되었습니다." });
    }

    // 캘린더 이벤트 생성 또는 업데이트
    const calendarEvent = reservationToCalendarEvent(reservation, reservation.gym?.name);

    let eventResult;
    if (reservation.google_calendar_event_id) {
      // 기존 이벤트 업데이트
      try {
        eventResult = await updateCalendarEvent(
          accessToken,
          reservation.google_calendar_event_id,
          calendarEvent
        );
      } catch {
        // 이벤트가 없으면 새로 생성
        eventResult = await createCalendarEvent(accessToken, calendarEvent);
      }
    } else {
      // 새 이벤트 생성
      eventResult = await createCalendarEvent(accessToken, calendarEvent);
    }

    // DB 업데이트
    await supabase
      .from("reservations")
      .update({
        google_calendar_event_id: eventResult.id,
        google_calendar_synced_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({
      success: true,
      event: {
        id: eventResult.id,
        link: eventResult.htmlLink,
      },
      message: "Google Calendar에 동기화되었습니다.",
    });
  } catch (error) {
    console.error("[Calendar Sync API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "동기화 실패" },
      { status: 500 }
    );
  }
}
