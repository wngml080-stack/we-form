/**
 * In-memory rate limiter for API routes
 * Production에서는 Redis 기반으로 교체 권장
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// 주기적으로 만료된 엔트리 정리 (메모리 누수 방지)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // 1분마다 정리

export interface RateLimitConfig {
  /** 윈도우 기간 (ms) */
  windowMs: number;
  /** 윈도우 내 최대 요청 수 */
  maxRequests: number;
  /** 식별자 접두사 (API별 구분) */
  prefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Rate limit 체크
 * @param identifier - 사용자 식별자 (IP, userId 등)
 * @param config - Rate limit 설정
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const { windowMs, maxRequests, prefix = "default" } = config;
  const key = `${prefix}:${identifier}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  // 새로운 윈도우 시작
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  // 기존 윈도우 내 요청
  if (entry.count >= maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return {
    success: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Request에서 IP 추출
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Vercel/Cloudflare
  const cfIP = request.headers.get("cf-connecting-ip");
  if (cfIP) {
    return cfIP;
  }

  return "unknown";
}

// 사전 정의된 Rate Limit 프로필
export const RATE_LIMITS = {
  /** 일반 API: 분당 60회 */
  standard: { windowMs: 60000, maxRequests: 60 },
  /** 인증 API: 분당 10회 */
  auth: { windowMs: 60000, maxRequests: 10 },
  /** AI API: 분당 20회 */
  ai: { windowMs: 60000, maxRequests: 20 },
  /** Public API: 분당 30회 */
  public: { windowMs: 60000, maxRequests: 30 },
  /** Webhook: 분당 100회 */
  webhook: { windowMs: 60000, maxRequests: 100 },
} as const;
