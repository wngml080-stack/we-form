import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: "토큰이 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 토큰으로 서명 요청 조회
    const { data: signature, error } = await supabase
      .from("signatures")
      .select(
        `
        id,
        schedule_id,
        member_id,
        status,
        expires_at,
        signed_at,
        schedules!inner (
          id,
          member_name,
          type,
          start_time,
          end_time,
          status,
          staff_id
        )
      `
      )
      .eq("token", token)
      .maybeSingle();

    if (error || !signature) {
      return NextResponse.json(
        { error: "유효하지 않은 서명 요청입니다." },
        { status: 404 }
      );
    }

    // 만료 확인
    if (new Date(signature.expires_at) < new Date()) {
      await supabase
        .from("signatures")
        .update({ status: "expired" })
        .eq("id", signature.id);

      return NextResponse.json(
        { error: "서명 요청이 만료되었습니다." },
        { status: 410 }
      );
    }

    // 이미 완료된 경우
    if (signature.status === "completed") {
      return NextResponse.json(
        { error: "이미 서명이 완료되었습니다." },
        { status: 409 }
      );
    }

    // 담당자 이름 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scheduleData = signature.schedules as any;
    const schedule = {
      id: scheduleData?.id || "",
      member_name: scheduleData?.member_name || "",
      type: scheduleData?.type || "",
      start_time: scheduleData?.start_time || "",
      end_time: scheduleData?.end_time || "",
      status: scheduleData?.status || "",
      staff_id: scheduleData?.staff_id || "",
    };

    let staffName = "담당자";
    if (schedule.staff_id) {
      const { data: staff } = await supabase
        .from("staffs")
        .select("name")
        .eq("id", schedule.staff_id)
        .single();
      if (staff) {
        staffName = staff.name;
      }
    }

    return NextResponse.json({
      signatureId: signature.id,
      memberName: schedule.member_name,
      scheduleType: schedule.type,
      staffName,
      startTime: schedule.start_time,
      endTime: schedule.end_time,
      expiresAt: signature.expires_at,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[PublicSignature] 조회 오류:", errorMessage);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
