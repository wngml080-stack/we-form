import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SWC 컴파일러 최적화 - 모던 브라우저 타겟
  compiler: {
    // 프로덕션에서 console.log 제거
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },

  // 실험적 기능 - 번들 최적화
  experimental: {
    // 패키지 import 최적화
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "date-fns",
    ],
    // Critical CSS 인라인 - 렌더 차단 CSS 제거
    optimizeCss: true,
  },
};

export default nextConfig;
