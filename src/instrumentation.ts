// ============================================
// Next.js Instrumentation
// 서버 시작 시 실행되는 코드
// ============================================

import * as Sentry from "@sentry/nextjs";

export async function register() {
  // 서버 사이드에서만 실행
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { checkEnvOnStartup } = await import("@/lib/env");
    checkEnvOnStartup();

    // Sentry 서버 설정 로드
    await import("../sentry.server.config");
  }

  // Edge 런타임 Sentry 설정
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Sentry onRequestError 훅 - RSC 에러 캡처
export const onRequestError = Sentry.captureRequestError;
