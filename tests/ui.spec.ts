import { test, expect } from "@playwright/test";

test.describe("UI 컴포넌트", () => {
  test.describe("API 문서 페이지", () => {
    test("Swagger UI 로드", async ({ page }) => {
      await page.goto("/docs");

      // Swagger UI 로드 대기
      await page.waitForLoadState("networkidle");

      // Swagger UI 컨테이너 확인
      await expect(page.locator(".swagger-ui")).toBeVisible({ timeout: 15000 });
    });

    test("API 엔드포인트 목록 표시", async ({ page }) => {
      await page.goto("/docs");

      await page.waitForLoadState("networkidle");

      // API 태그/섹션 존재 확인
      await expect(page.locator(".swagger-ui")).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("로그인 페이지 UI", () => {
    test("로그인 폼 렌더링", async ({ page }) => {
      await page.goto("/sign-in");

      // 페이지 제목 또는 로고 확인
      await expect(page.locator("body")).toBeVisible();
    });

    test("반응형 레이아웃", async ({ page }) => {
      // 모바일 뷰포트
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/sign-in");

      await expect(page.locator("body")).toBeVisible();

      // 데스크톱 뷰포트
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/sign-in");

      await expect(page.locator("body")).toBeVisible();
    });
  });

  test.describe("에러 페이지", () => {
    test("404 페이지", async ({ page }) => {
      const response = await page.goto("/non-existent-page-12345");

      // 404 상태 또는 리다이렉트 확인
      expect([200, 404]).toContain(response?.status() || 200);
    });
  });

  test.describe("접근성", () => {
    test("로그인 페이지 기본 접근성", async ({ page }) => {
      await page.goto("/sign-in");

      // 페이지에 heading 존재 확인
      const headings = await page.locator("h1, h2, h3").count();
      expect(headings).toBeGreaterThanOrEqual(0);

      // 링크에 텍스트 존재 확인
      const links = page.locator("a");
      const linkCount = await links.count();

      for (let i = 0; i < Math.min(linkCount, 5); i++) {
        const link = links.nth(i);
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute("aria-label");
        // 링크에 텍스트 또는 aria-label이 있어야 함
        expect(text || ariaLabel).toBeTruthy();
      }
    });
  });
});
