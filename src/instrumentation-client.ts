// ============================================
// Next.js Client Instrumentation
// 클라이언트 사이드에서 실행되는 코드
// ============================================

import * as Sentry from "@sentry/nextjs";

// Sentry 네비게이션 추적
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 성능 모니터링 샘플 비율 (0.0 ~ 1.0)
  // 프로덕션에서는 0.1 ~ 0.2 권장
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // 세션 리플레이 설정
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // 개발 환경에서는 비활성화
  enabled: process.env.NODE_ENV === "production",

  // 디버그 모드 (개발시에만)
  debug: false,

  // 환경 태그
  environment: process.env.NODE_ENV,

  // 앱 버전
  release: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",

  // 무시할 에러 패턴
  ignoreErrors: [
    // 브라우저 확장 프로그램 관련
    "ResizeObserver loop",
    "ResizeObserver loop completed with undelivered notifications",
    // 네트워크 에러
    "Failed to fetch",
    "NetworkError",
    "Load failed",
    // 취소된 요청
    "AbortError",
    "The operation was aborted",
  ],

  // 민감한 데이터 필터링
  beforeSend(event) {
    // 비밀번호 등 민감 정보 제거
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>;
      if (typeof data === "object") {
        delete data.password;
        delete data.token;
        delete data.accessToken;
        delete data.refreshToken;
      }
    }
    return event;
  },

  integrations: [
    Sentry.replayIntegration({
      // 민감한 텍스트 마스킹
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
});
