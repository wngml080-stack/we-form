import { NextResponse } from "next/server";

/**
 * 보안 헤더 적용
 * OWASP 권장 보안 헤더 기반
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // XSS 방지
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Clickjacking 방지
  response.headers.set("X-Frame-Options", "DENY");

  // XSS 필터 활성화 (구형 브라우저용)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // HTTPS 강제 (프로덕션)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  // Referrer 정책
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // 권한 정책 (카메라, 마이크 등 제한)
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

/**
 * Rate limit 헤더 적용
 */
export function applyRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  resetAt: number,
  retryAfter?: number
): NextResponse {
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));

  if (retryAfter !== undefined) {
    response.headers.set("Retry-After", String(retryAfter));
  }

  return response;
}

/**
 * CORS 헤더 적용 (필요시)
 */
export function applyCORSHeaders(
  response: NextResponse,
  allowedOrigins: string[] = []
): NextResponse {
  const origin = allowedOrigins.length > 0 ? allowedOrigins[0] : "*";

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Access-Control-Max-Age", "86400");

  return response;
}
