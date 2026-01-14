import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { headers } from "next/headers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { signatureData } = body;

    if (!token) {
      return NextResponse.json({ error: "토큰이 필요합니다." }, { status: 400 });
    }

    if (!signatureData || !signatureData.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "유효한 서명 데이터가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 토큰으로 서명 요청 조회
    const { data: signature, error } = await supabase
      .from("signatures")
      .select("id, status, expires_at, schedule_id")
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

    // 클라이언트 정보 수집
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    // 서명 데이터 저장
    const { error: updateError } = await supabase
      .from("signatures")
      .update({
        signature_data: signatureData,
        status: "completed",
        signed_at: new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .eq("id", signature.id);

    if (updateError) {
      console.error("[SubmitSignature] 서명 저장 오류:", updateError);
      return NextResponse.json(
        { error: "서명 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "서명이 완료되었습니다.",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[SubmitSignature] 서명 제출 오류:", errorMessage);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
