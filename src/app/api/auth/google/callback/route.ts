import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getGoogleUserInfo, GOOGLE_CONFIG } from "@/lib/google/config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { encrypt } from "@/lib/utils/encryption";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // 에러 처리
    if (error) {
      console.error("[Google Callback] OAuth error:", error);
      return NextResponse.redirect(
        new URL("/admin?google_error=access_denied", request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/admin?google_error=invalid_request", request.url)
      );
    }

    // state 디코딩
    let stateData: { staffId: string; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state, "base64").toString());
    } catch {
      return NextResponse.redirect(
        new URL("/admin?google_error=invalid_state", request.url)
      );
    }

    // 타임스탬프 검증 (10분 이내)
    if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
      return NextResponse.redirect(
        new URL("/admin?google_error=expired", request.url)
      );
    }

    // 토큰 교환
    const tokens = await exchangeCodeForTokens(code);

    // 사용자 정보 조회
    const userInfo = await getGoogleUserInfo(tokens.access_token);

    // Supabase에 토큰 저장
    const supabase = getSupabaseAdmin();
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const { error: upsertError } = await supabase
      .from("user_google_tokens")
      .upsert(
        {
          staff_id: stateData.staffId,
          google_email: userInfo.email,
          access_token: encrypt(tokens.access_token),
          refresh_token: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
          token_expires_at: expiresAt.toISOString(),
          scopes: GOOGLE_CONFIG.scopes,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "staff_id",
        }
      );

    if (upsertError) {
      console.error("[Google Callback] Upsert error:", upsertError);
      return NextResponse.redirect(
        new URL("/admin?google_error=save_failed", request.url)
      );
    }

    // 성공 리다이렉트
    return NextResponse.redirect(
      new URL(`/admin?google_connected=true&google_email=${encodeURIComponent(userInfo.email)}`, request.url)
    );
  } catch (error) {
    console.error("[Google Callback] Error:", error);
    return NextResponse.redirect(
      new URL("/admin?google_error=unknown", request.url)
    );
  }
}
