import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { encrypt, isEncrypted } from "@/lib/utils/encryption";

/**
 * POST /api/admin/migrate-encryption
 * 기존 평문 API 키/토큰을 암호화된 형식으로 마이그레이션
 * system_admin만 실행 가능
 */
export async function POST(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;

    if (!staff || staff.role !== "system_admin") {
      return NextResponse.json(
        { error: "시스템 관리자만 실행할 수 있습니다." },
        { status: 403 }
      );
    }

    const { target } = await request.json();
    const supabase = getSupabaseAdmin();
    const results: Record<string, { migrated: number; skipped: number; errors: string[] }> = {};

    // Kakao 채널 키 마이그레이션
    if (!target || target === "kakao") {
      const kakaoResult = { migrated: 0, skipped: 0, errors: [] as string[] };

      const { data: channels, error: channelsError } = await supabase
        .from("gym_kakao_channels")
        .select("id, admin_key, rest_api_key, webhook_secret, alimtalk_sender_key");

      if (channelsError) {
        kakaoResult.errors.push(`조회 오류: ${channelsError.message}`);
      } else if (channels) {
        for (const channel of channels) {
          try {
            const updates: Record<string, string> = {};

            // 이미 암호화되지 않은 값만 암호화
            if (channel.admin_key && !isEncrypted(channel.admin_key)) {
              updates.admin_key = encrypt(channel.admin_key);
            }
            if (channel.rest_api_key && !isEncrypted(channel.rest_api_key)) {
              updates.rest_api_key = encrypt(channel.rest_api_key);
            }
            if (channel.webhook_secret && !isEncrypted(channel.webhook_secret)) {
              updates.webhook_secret = encrypt(channel.webhook_secret);
            }
            if (channel.alimtalk_sender_key && !isEncrypted(channel.alimtalk_sender_key)) {
              updates.alimtalk_sender_key = encrypt(channel.alimtalk_sender_key);
            }

            if (Object.keys(updates).length > 0) {
              const { error: updateError } = await supabase
                .from("gym_kakao_channels")
                .update(updates)
                .eq("id", channel.id);

              if (updateError) {
                kakaoResult.errors.push(`채널 ${channel.id} 업데이트 오류: ${updateError.message}`);
              } else {
                kakaoResult.migrated++;
              }
            } else {
              kakaoResult.skipped++;
            }
          } catch (err) {
            kakaoResult.errors.push(`채널 ${channel.id} 처리 오류: ${err instanceof Error ? err.message : "알 수 없는 오류"}`);
          }
        }
      }

      results.kakao_channels = kakaoResult;
    }

    // Google 토큰 마이그레이션
    if (!target || target === "google") {
      const googleResult = { migrated: 0, skipped: 0, errors: [] as string[] };

      const { data: tokens, error: tokensError } = await supabase
        .from("user_google_tokens")
        .select("id, access_token, refresh_token");

      if (tokensError) {
        googleResult.errors.push(`조회 오류: ${tokensError.message}`);
      } else if (tokens) {
        for (const token of tokens) {
          try {
            const updates: Record<string, string> = {};

            // 이미 암호화되지 않은 값만 암호화
            if (token.access_token && !isEncrypted(token.access_token)) {
              updates.access_token = encrypt(token.access_token);
            }
            if (token.refresh_token && !isEncrypted(token.refresh_token)) {
              updates.refresh_token = encrypt(token.refresh_token);
            }

            if (Object.keys(updates).length > 0) {
              const { error: updateError } = await supabase
                .from("user_google_tokens")
                .update(updates)
                .eq("id", token.id);

              if (updateError) {
                googleResult.errors.push(`토큰 ${token.id} 업데이트 오류: ${updateError.message}`);
              } else {
                googleResult.migrated++;
              }
            } else {
              googleResult.skipped++;
            }
          } catch (err) {
            googleResult.errors.push(`토큰 ${token.id} 처리 오류: ${err instanceof Error ? err.message : "알 수 없는 오류"}`);
          }
        }
      }

      results.google_tokens = googleResult;
    }

    return NextResponse.json({
      success: true,
      message: "암호화 마이그레이션 완료",
      results,
    });
  } catch (error) {
    console.error("[Migrate Encryption API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "마이그레이션 실패" },
      { status: 500 }
    );
  }
}
