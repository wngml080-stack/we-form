import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { refreshAccessToken } from "@/lib/google/config";

export async function GET() {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError || !staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 토큰 조회
    const { data: tokenData, error: fetchError } = await supabase
      .from("user_google_tokens")
      .select("google_email, token_expires_at, scopes")
      .eq("staff_id", staff.id)
      .single();

    if (fetchError || !tokenData) {
      return NextResponse.json({
        connected: false,
        email: null,
      });
    }

    // 토큰 만료 확인
    const isExpired = new Date(tokenData.token_expires_at) < new Date();

    return NextResponse.json({
      connected: true,
      email: tokenData.google_email,
      scopes: tokenData.scopes,
      needsRefresh: isExpired,
    });
  } catch (error) {
    console.error("[Google Status] Error:", error);
    return NextResponse.json(
      { error: "Google 연동 상태 확인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 토큰 갱신 (필요시 호출)
export async function POST() {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError || !staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 현재 토큰 조회
    const { data: tokenData, error: fetchError } = await supabase
      .from("user_google_tokens")
      .select("refresh_token")
      .eq("staff_id", staff.id)
      .single();

    if (fetchError || !tokenData?.refresh_token) {
      return NextResponse.json(
        { error: "Google 연동이 필요합니다.", needsReconnect: true },
        { status: 400 }
      );
    }

    // 토큰 갱신
    const newTokens = await refreshAccessToken(tokenData.refresh_token);
    const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000);

    // 새 토큰 저장
    const { error: updateError } = await supabase
      .from("user_google_tokens")
      .update({
        access_token: newTokens.access_token,
        token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("staff_id", staff.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Google Refresh] Error:", error);
    return NextResponse.json(
      { error: "토큰 갱신 중 오류가 발생했습니다.", needsReconnect: true },
      { status: 500 }
    );
  }
}
