import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Edge runtime 성능 모니터링
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // 개발 환경에서는 비활성화
  enabled: process.env.NODE_ENV === "production",

  // 환경 태그
  environment: process.env.NODE_ENV,
});
