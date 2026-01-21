import { test, expect } from "@playwright/test";

test.describe("인증 플로우", () => {
  test("로그인 페이지 접근", async ({ page }) => {
    await page.goto("/sign-in");

    // 로그인 페이지 로드 확인
    await expect(page).toHaveURL(/sign-in/);

    // 로그인 폼 요소 확인
    await expect(page.locator('input[type="email"], input[name="identifier"]')).toBeVisible({ timeout: 10000 });
  });

  test("미인증 사용자 admin 접근 시 리다이렉트", async ({ page }) => {
    // 보호된 라우트 접근 시도
    await page.goto("/admin");

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/sign-in/);
  });

  test("미인증 사용자 staff 접근 시 리다이렉트", async ({ page }) => {
    await page.goto("/staff");

    await expect(page).toHaveURL(/sign-in/);
  });

  test("회원가입 페이지 접근", async ({ page }) => {
    await page.goto("/sign-up");

    await expect(page).toHaveURL(/sign-up/);
  });
});

test.describe("공개 페이지", () => {
  test("랜딩 페이지 로드", async ({ page }) => {
    await page.goto("/");

    // 페이지 로드 성공 확인
    await expect(page).toHaveURL("/");
  });

  test("온보딩 페이지 접근", async ({ page }) => {
    await page.goto("/onboarding");

    // 온보딩 페이지 또는 리다이렉트 확인
    const url = page.url();
    expect(url).toMatch(/onboarding|sign/);
  });
});
