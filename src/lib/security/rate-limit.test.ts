import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "./rate-limit";

describe("Rate Limiting", () => {
  beforeEach(() => {
    // Rate limit store 초기화를 위해 새 모듈 import
    vi.resetModules();
  });

  describe("checkRateLimit", () => {
    it("첫 번째 요청은 항상 성공", () => {
      const result = checkRateLimit("test-ip-1", {
        windowMs: 60000,
        maxRequests: 10,
        prefix: "test",
      });

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it("요청 수 감소 확인", () => {
      const config = { windowMs: 60000, maxRequests: 5, prefix: "test-decrease" };

      const result1 = checkRateLimit("test-ip-2", config);
      expect(result1.remaining).toBe(4);

      const result2 = checkRateLimit("test-ip-2", config);
      expect(result2.remaining).toBe(3);

      const result3 = checkRateLimit("test-ip-2", config);
      expect(result3.remaining).toBe(2);
    });

    it("제한 초과 시 실패", () => {
      const config = { windowMs: 60000, maxRequests: 2, prefix: "test-limit" };

      checkRateLimit("test-ip-3", config);
      checkRateLimit("test-ip-3", config);
      const result = checkRateLimit("test-ip-3", config);

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
    });

    it("다른 IP는 독립적으로 카운트", () => {
      const config = { windowMs: 60000, maxRequests: 2, prefix: "test-ip" };

      checkRateLimit("ip-a", config);
      checkRateLimit("ip-a", config);

      const resultA = checkRateLimit("ip-a", config);
      const resultB = checkRateLimit("ip-b", config);

      expect(resultA.success).toBe(false);
      expect(resultB.success).toBe(true);
    });

    it("다른 prefix는 독립적으로 카운트", () => {
      checkRateLimit("same-ip", { windowMs: 60000, maxRequests: 1, prefix: "api-1" });
      checkRateLimit("same-ip", { windowMs: 60000, maxRequests: 1, prefix: "api-2" });

      const result1 = checkRateLimit("same-ip", { windowMs: 60000, maxRequests: 1, prefix: "api-1" });
      const result2 = checkRateLimit("same-ip", { windowMs: 60000, maxRequests: 1, prefix: "api-2" });

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
    });
  });

  describe("getClientIP", () => {
    it("x-forwarded-for 헤더에서 IP 추출", () => {
      const request = new Request("http://localhost", {
        headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
      });

      const ip = getClientIP(request);
      expect(ip).toBe("1.2.3.4");
    });

    it("x-real-ip 헤더에서 IP 추출", () => {
      const request = new Request("http://localhost", {
        headers: { "x-real-ip": "10.0.0.1" },
      });

      const ip = getClientIP(request);
      expect(ip).toBe("10.0.0.1");
    });

    it("cf-connecting-ip 헤더에서 IP 추출", () => {
      const request = new Request("http://localhost", {
        headers: { "cf-connecting-ip": "192.168.1.1" },
      });

      const ip = getClientIP(request);
      expect(ip).toBe("192.168.1.1");
    });

    it("헤더 없으면 unknown 반환", () => {
      const request = new Request("http://localhost");

      const ip = getClientIP(request);
      expect(ip).toBe("unknown");
    });
  });

  describe("RATE_LIMITS 프리셋", () => {
    it("standard 프리셋 존재", () => {
      expect(RATE_LIMITS.standard).toEqual({ windowMs: 60000, maxRequests: 60 });
    });

    it("auth 프리셋 존재", () => {
      expect(RATE_LIMITS.auth).toEqual({ windowMs: 60000, maxRequests: 10 });
    });

    it("ai 프리셋 존재", () => {
      expect(RATE_LIMITS.ai).toEqual({ windowMs: 60000, maxRequests: 20 });
    });

    it("public 프리셋 존재", () => {
      expect(RATE_LIMITS.public).toEqual({ windowMs: 60000, maxRequests: 30 });
    });

    it("webhook 프리셋 존재", () => {
      expect(RATE_LIMITS.webhook).toEqual({ windowMs: 60000, maxRequests: 100 });
    });
  });
});
