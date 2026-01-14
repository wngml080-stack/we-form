import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json(
        { error: "직원 정보를 찾을 수 없습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { scheduleId } = body;

    if (!scheduleId) {
      return NextResponse.json(
        { error: "스케줄 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 스케줄 조회
    const { data: schedule, error: scheduleError } = await supabase
      .from("schedules")
      .select("id, gym_id, staff_id, member_id, member_name, type, status")
      .eq("id", scheduleId)
      .maybeSingle();

    if (scheduleError || !schedule) {
      return NextResponse.json(
        { error: "스케줄을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 지점 접근 권한 확인
    if (!canAccessGym(staff, schedule.gym_id)) {
      return NextResponse.json(
        { error: "이 지점 스케줄에 대한 권한이 없습니다." },
        { status: 403 }
      );
    }

    // PT/OT 스케줄만 서명 요청 가능
    const scheduleType = (schedule.type || "").toLowerCase();
    if (!["pt", "ot"].includes(scheduleType)) {
      return NextResponse.json(
        { error: "PT 또는 OT 스케줄만 서명 요청이 가능합니다." },
        { status: 400 }
      );
    }

    // 기존 pending 서명 요청이 있는지 확인
    const { data: existingSignature } = await supabase
      .from("signatures")
      .select("id, token, status, expires_at")
      .eq("schedule_id", scheduleId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (existingSignature) {
      const signUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign/${existingSignature.token}`;
      return NextResponse.json({
        success: true,
        token: existingSignature.token,
        signUrl,
        expiresAt: existingSignature.expires_at,
        isExisting: true,
      });
    }

    // 고유 토큰 생성
    const token = randomBytes(32).toString("hex");

    // 만료 시간 설정 (24시간 후)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // 서명 요청 생성
    const { data: signature, error: insertError } = await supabase
      .from("signatures")
      .insert({
        gym_id: schedule.gym_id,
        schedule_id: scheduleId,
        member_id: schedule.member_id,
        staff_id: schedule.staff_id,
        token,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("[SignatureRequest] 서명 요청 생성 오류:", insertError);
      return NextResponse.json(
        { error: "서명 요청 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    const signUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign/${token}`;

    return NextResponse.json({
      success: true,
      signatureId: signature.id,
      token,
      signUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[SignatureRequest] 서명 요청 오류:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
