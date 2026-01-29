import { test, Page } from "@playwright/test";
import path from "path";

// 배포된 URL 사용
const BASE_URL = "https://weform-sage.vercel.app";

// 테스트 계정 정보
const TEST_EMAIL = "test@example.com";
const TEST_PASSWORD = "testpassword123";

// 스크린샷 저장 경로 (public 폴더)
const SCREENSHOT_DIR = path.join(process.cwd(), "public");

// 페이지 로딩 완료 대기
async function waitForPageLoad(page: Page, extraWait = 2000) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 15000 });
  } catch {
    // 타임아웃 무시
  }
  await page.waitForTimeout(extraWait);
}

// 스크린샷 촬영 (전체 페이지)
async function takeScreenshot(page: Page, filename: string) {
  try {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, filename),
      fullPage: true,  // 전체 페이지 캡처
    });
    console.log(`✅ ${filename} 저장 완료`);
  } catch (e) {
    console.log(`❌ ${filename} 저장 실패:`, e);
  }
}

// 텍스트로 요소 찾아 클릭
async function clickByText(page: Page, text: string): Promise<boolean> {
  try {
    const element = page.getByText(text).first();
    if (await element.isVisible({ timeout: 5000 })) {
      await element.click();
      return true;
    }
  } catch {
    // 무시
  }
  return false;
}

test.describe("We:form 선택 스크린샷", () => {
  test.setTimeout(300000); // 5분 타임아웃

  test("03, 06-1, 12번 화면 캡처", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // ============================================
    // 로그인
    // ============================================
    console.log("\n🔐 로그인 중...");
    await page.goto(`${BASE_URL}/sign-in`);
    await waitForPageLoad(page);

    await page.fill('input[id="email"]', TEST_EMAIL);
    await page.fill('input[id="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    try {
      await page.waitForURL("**/admin**", { timeout: 30000 });
      console.log("✅ 로그인 성공!");
    } catch {
      console.log("⚠️ 로그인 타임아웃 - 계속 진행");
    }
    await waitForPageLoad(page, 3000);

    // ============================================
    // 03. 센터관리 -> 매출 관리 탭
    // ============================================
    console.log("\n📸 03. 매출 관리...");
    await page.goto(`${BASE_URL}/admin/sales?tab=sales`);
    await waitForPageLoad(page, 3000);

    // 스크롤 컨테이너 높이 제한 해제
    await page.evaluate(() => {
      // 모든 스크롤 컨테이너 찾아서 높이 제한 해제
      const containers = document.querySelectorAll<HTMLElement>('[class*="overflow"], [class*="scroll"], main, [class*="content"]');
      containers.forEach((el) => {
        el.style.maxHeight = 'none';
        el.style.height = 'auto';
        el.style.overflow = 'visible';
      });
      // body와 html도 설정
      document.body.style.overflow = 'visible';
      document.documentElement.style.overflow = 'visible';
    });

    await page.setViewportSize({ width: 1920, height: 3000 });
    await page.waitForTimeout(1500);
    await takeScreenshot(page, "03_sales_main.png");
    await page.setViewportSize({ width: 1920, height: 1080 });

    // ============================================
    // 06-1. 센터관리 -> 신규문의 탭 -> 신규회원관리 탭
    // ============================================
    console.log("\n📸 06-1. 신규 회원 관리...");
    await page.goto(`${BASE_URL}/admin/sales?tab=new_inquiries`);
    await waitForPageLoad(page, 2500);

    // 신규 회원 관리 탭 클릭 (여러 가지 이름 시도)
    const memberMgmtClicked =
      await clickByText(page, "신규 회원 관리") ||
      await clickByText(page, "신규회원관리") ||
      await clickByText(page, "신규 회원관리") ||
      await clickByText(page, "회원 관리");

    if (memberMgmtClicked) {
      await waitForPageLoad(page, 2500);
      console.log("✅ 신규 회원 관리 탭 클릭 성공");
    } else {
      console.log("⚠️ 신규 회원 관리 탭을 찾지 못함 - 현재 화면 캡처");
    }

    await takeScreenshot(page, "06-1_new_member_management.png");

    // ============================================
    // 12. 통합회원관리 메뉴
    // ============================================
    console.log("\n📸 12. 회원 리스트...");
    await page.goto(`${BASE_URL}/admin/pt-members`);
    await waitForPageLoad(page, 3000);
    await takeScreenshot(page, "12_member_list.png");

    // ============================================
    // 완료
    // ============================================
    console.log(`\n🎉 완료! 스크린샷 저장 위치: ${SCREENSHOT_DIR}`);
    console.log("저장된 파일:");
    console.log("  - 03_sales_main.png");
    console.log("  - 06-1_new_member_management.png");
    console.log("  - 12_member_list.png");
  });
});
