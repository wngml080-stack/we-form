import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 성능 모니터링
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // 개발 환경에서는 비활성화
  enabled: process.env.NODE_ENV === "production",

  // 디버그 모드
  debug: false,

  // 환경 태그
  environment: process.env.NODE_ENV,

  // 앱 버전
  release: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",

  // 서버 에러에서 무시할 패턴
  ignoreErrors: [
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
  ],

  // 민감한 데이터 필터링
  beforeSend(event) {
    // 요청 헤더에서 인증 정보 제거
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
    }
    return event;
  },
});
