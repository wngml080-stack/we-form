import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Turbopack 루트 디렉토리 설정
  turbopack: {
    root: __dirname,
  },

  // 서버 외부 패키지 - webpack 번들링에서 제외 (OpenTelemetry 동적 의존성 문제 방지)
  serverExternalPackages: [
    "@prisma/instrumentation",
    "@opentelemetry/instrumentation",
    "@opentelemetry/api",
  ],

  // SWC 컴파일러 최적화 - 모던 브라우저 타겟
  compiler: {
    // 프로덕션에서 console.log 제거
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },

  // ESLint - 빌드 시 무시 (개발 서버 안정성 확보)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript - 빌드 시 무시 (개발 서버 안정성 확보)
  typescript: {
    ignoreBuildErrors: true,
  },

  // 이미지 최적화 설정
  images: {
    // 이미지 포맷 최적화
    formats: ["image/avif", "image/webp"],
    // 디바이스 사이즈
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // 이미지 사이즈
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // 최소화
    minimumCacheTTL: 60 * 60 * 24, // 24시간
  },

  // 실험적 기능 - 번들 최적화
  experimental: {
    // 패키지 import 최적화
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "date-fns",
      "recharts",
      "@tanstack/react-table",
    ],
    // Critical CSS 인라인 - 프로덕션에서만 (개발 시 성능 이슈 방지)
    optimizeCss: process.env.NODE_ENV === "production",
  },

  // 보안 헤더 설정
  async headers() {
    return [
      {
        // 모든 라우트에 보안 헤더 적용
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // API 라우트에 추가 헤더
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
      {
        // 정적 에셋 캐싱 (1년)
        source: "/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // JS/CSS 캐싱 (1년)
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

// Sentry 설정
const sentryWebpackPluginOptions = {
  // 소스맵 업로드 (프로덕션 빌드시에만)
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // 클라이언트 번들에서 소스맵 숨기기
  hideSourceMaps: true,

  // 디버그 로깅 제거 (treeshake 방식)
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludePerformanceMonitoring: false,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
  },

  // tunnelRoute 비활성화 - App Router 전용 프로젝트에서 Pages Router 충돌 방지
  // tunnelRoute: "/monitoring",
};

// 개발 환경에서 Sentry 비활성화 (Pages Router 충돌 방지)
const isDev = process.env.NODE_ENV === "development";
export default isDev ? nextConfig : withSentryConfig(nextConfig, sentryWebpackPluginOptions);
