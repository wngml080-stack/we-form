import { NextResponse } from "next/server";
import { getGoogleAuthUrl, GOOGLE_CONFIG } from "@/lib/google/config";
import { authenticateRequest } from "@/lib/api/auth";

export async function GET() {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError || !staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    // Google OAuth 설정 확인
    if (!GOOGLE_CONFIG.clientId || !GOOGLE_CONFIG.clientSecret) {
      return NextResponse.json(
        { error: "Google OAuth가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // state에 사용자 ID 포함 (CSRF 방지 및 사용자 식별)
    const state = Buffer.from(
      JSON.stringify({
        staffId: staff.id,
        timestamp: Date.now(),
      })
    ).toString("base64");

    const authUrl = getGoogleAuthUrl(state);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("[Google Connect] Error:", error);
    return NextResponse.json(
      { error: "Google 연동 시작 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
