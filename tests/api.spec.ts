import { test, expect } from "@playwright/test";

test.describe("API 엔드포인트", () => {
  test.describe("공개 API", () => {
    test("API 문서 접근 가능", async ({ request }) => {
      const response = await request.get("/api/docs");

      expect(response.status()).toBe(200);

      const json = await response.json();
      expect(json).toHaveProperty("openapi");
      expect(json).toHaveProperty("info");
      expect(json.info.title).toBe("Weform API");
    });

    test("서명 API - 잘못된 토큰", async ({ request }) => {
      const response = await request.get("/api/public/signature/invalid-token");

      // 404 또는 400 응답 예상
      expect([400, 404]).toContain(response.status());
    });
  });

  test.describe("보호된 API (미인증)", () => {
    test("회원 목록 - 인증 필요", async ({ request }) => {
      const response = await request.get("/api/admin/members");

      expect(response.status()).toBe(401);

      const json = await response.json();
      expect(json).toHaveProperty("error");
    });

    test("급여 설정 - 인증 필요", async ({ request }) => {
      const response = await request.get("/api/salary?gym_id=test");

      expect(response.status()).toBe(401);
    });

    test("AI 채팅 - 인증 필요", async ({ request }) => {
      const response = await request.post("/api/ai/chat", {
        data: { message: "테스트" },
      });

      expect(response.status()).toBe(401);
    });

    test("스케줄 생성 - 인증 필요", async ({ request }) => {
      const response = await request.post("/api/schedule/create", {
        data: { gym_id: "test", start_time: "2025-01-01", end_time: "2025-01-01" },
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe("API 입력 검증", () => {
    test("회원 등록 - 필수 필드 누락", async ({ request }) => {
      const response = await request.post("/api/admin/members", {
        data: {},
      });

      // 인증 에러 또는 검증 에러
      expect([400, 401]).toContain(response.status());
    });

    test("급여 설정 생성 - gym_id 누락", async ({ request }) => {
      const response = await request.post("/api/salary", {
        data: { pay_type: "fixed" },
      });

      expect([400, 401]).toContain(response.status());
    });
  });

  test.describe("보안 헤더", () => {
    test("X-Content-Type-Options 헤더 확인", async ({ request }) => {
      const response = await request.get("/api/docs");

      const headers = response.headers();
      expect(headers["x-content-type-options"]).toBe("nosniff");
    });

    test("X-Frame-Options 헤더 확인", async ({ request }) => {
      const response = await request.get("/");

      const headers = response.headers();
      expect(headers["x-frame-options"]).toBe("DENY");
    });
  });
});
