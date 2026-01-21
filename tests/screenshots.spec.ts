import { test } from "@playwright/test";
import path from "path";
import fs from "fs";

// 테스트 계정 정보
const TEST_EMAIL = "test@example.com";
const TEST_PASSWORD = "testpassword123";

// 스크린샷 저장 경로
const SCREENSHOT_DIR = path.join(process.cwd(), "screenshots");

// 스크린샷 저장 디렉토리 생성 및 정리
if (fs.existsSync(SCREENSHOT_DIR)) {
  const files = fs.readdirSync(SCREENSHOT_DIR);
  files.forEach(file => {
    if (file.endsWith('.png')) {
      fs.unlinkSync(path.join(SCREENSHOT_DIR, file));
    }
  });
} else {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// 페이지 로딩 완료 대기
async function waitForPageLoad(page: any, extraWait = 1500) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 15000 });
  } catch {
    // 타임아웃 무시
  }
  await page.waitForTimeout(extraWait);
}

// 전체 페이지 스크린샷 (여백 최소화)
async function takeFullScreenshot(page: any, filename: string) {
  try {
    // 실제 콘텐츠 높이 계산 (여백 제외)
    const contentHeight = await page.evaluate(() => {
      // 메인 콘텐츠 영역 찾기
      const mainContent = document.querySelector('main') || document.querySelector('[class*="main"]') || document.body;
      const allElements = mainContent.querySelectorAll('*');
      let maxBottom = 0;

      allElements.forEach((el: Element) => {
        const rect = el.getBoundingClientRect();
        const bottom = rect.top + rect.height + window.scrollY;
        if (bottom > maxBottom && rect.height > 0) {
          maxBottom = bottom;
        }
      });

      // 최소 높이 1080, 최대 높이 제한 (정수로 반환)
      return Math.floor(Math.min(Math.max(maxBottom + 50, 1080), 5000));
    });

    await page.setViewportSize({ width: 1920, height: contentHeight });
    await page.waitForTimeout(500);

    // fullPage: false로 현재 뷰포트만 캡처 (여백 방지)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, filename),
      fullPage: false,
    });
    console.log(`✅ ${filename}`);

    await page.setViewportSize({ width: 1920, height: 1080 });
  } catch (e) {
    console.log(`⚠️ ${filename} 저장 실패:`, e);
  }
}

// 모달 스크린샷
async function takeModalScreenshot(page: any, filename: string) {
  try {
    await page.setViewportSize({ width: 1920, height: 1200 });
    await page.waitForTimeout(800);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, filename),
      fullPage: false,
    });
    console.log(`✅ ${filename} (모달)`);
  } catch (e) {
    console.log(`⚠️ ${filename} 모달 저장 실패:`, e);
  }
}

// 모달 닫기
async function closeModal(page: any) {
  try {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  } catch {
    // 무시
  }
}

// 안전하게 클릭
async function safeClick(page: any, selector: string, timeout = 5000): Promise<boolean> {
  try {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout })) {
      await element.click();
      return true;
    }
  } catch {
    // 무시
  }
  return false;
}

// 텍스트로 요소 찾아 클릭
async function clickByText(page: any, text: string, exact = false): Promise<boolean> {
  try {
    const element = page.getByText(text, { exact }).first();
    if (await element.isVisible({ timeout: 5000 })) {
      await element.click();
      return true;
    }
  } catch {
    // 무시
  }
  return false;
}

test.describe("We:form 스크린샷", () => {
  test.setTimeout(1200000); // 20분 타임아웃

  test("전체 화면 캡처", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    const shot = async (num: string, name: string, isModal = false) => {
      const filename = `${num}_${name}.png`;
      if (isModal) {
        await takeModalScreenshot(page, filename);
      } else {
        await takeFullScreenshot(page, filename);
      }
    };

    // ============================================
    // 01. 로그인 페이지
    // ============================================
    console.log("\n📸 01. 로그인 페이지...");
    await page.goto("/sign-in");
    await waitForPageLoad(page);
    await shot("01", "login");

    // ============================================
    // 02. 로그인 수행 -> 대시보드
    // ============================================
    console.log("📸 02. 대시보드...");
    await page.fill('input[id="email"]', TEST_EMAIL);
    await page.fill('input[id="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    try {
      await page.waitForURL("**/admin**", { timeout: 30000 });
    } catch {
      console.log("⚠️ 로그인 실패 - 계속 진행");
    }
    await waitForPageLoad(page, 3000);
    await shot("02", "dashboard");

    // ============================================
    // 03. 매출 관리
    // ============================================
    console.log("\n📸 03. 매출 관리...");
    await page.goto("/admin/sales?tab=sales");
    await waitForPageLoad(page, 2500);
    await shot("03", "sales_main");

    // ============================================
    // 04. 비교분석 모달
    // ============================================
    console.log("📸 04. 비교분석 모달...");
    if (await safeClick(page, 'button:has-text("비교분석")')) {
      await page.waitForTimeout(2500);
      await shot("04", "sales_comparison_modal", true);
      await closeModal(page);
      await page.waitForTimeout(500);
    }

    // ============================================
    // 05. 지출 관리
    // ============================================
    console.log("📸 05. 지출 관리...");
    await page.goto("/admin/sales?tab=expenses");
    await waitForPageLoad(page, 2000);
    await shot("05", "expenses_main");

    // ============================================
    // 06. 신규 관리
    // ============================================
    console.log("📸 06. 신규 관리...");
    await page.goto("/admin/sales?tab=new_inquiries");
    await waitForPageLoad(page, 2500);
    await shot("06", "new_inquiry_main");

    // ============================================
    // 06-1. 신규 회원관리 페이지
    // ============================================
    console.log("📸 06-1. 신규 회원관리 페이지...");
    // 탭 클릭: "신규 회원 관리" (띄어쓰기 포함)
    if (await clickByText(page, "신규 회원 관리") || await clickByText(page, "신규회원관리") || await clickByText(page, "신규 회원관리")) {
      await waitForPageLoad(page, 2000);
      await shot("06-1", "new_member_management");
      // 대시보드 탭으로 돌아가기
      await clickByText(page, "대시보드");
      await waitForPageLoad(page, 1500);
    }

    // ============================================
    // 07. 신규 등록 모달
    // ============================================
    console.log("📸 07. 신규 등록 모달...");
    await page.goto("/admin/sales?tab=new_inquiries");
    await waitForPageLoad(page, 2000);
    if (await safeClick(page, 'button:has-text("신규 문의 등록")') ||
        await safeClick(page, 'button:has-text("신규 등록")') ||
        await safeClick(page, 'button:has-text("문의 등록")')) {
      await page.waitForTimeout(2000);
      await shot("07", "new_inquiry_add_modal", true);
      await closeModal(page);
      await page.waitForTimeout(500);
    }

    // ============================================
    // 08. 연동 (카카오) 모달
    // ============================================
    console.log("📸 08. 연동 (카카오) 모달...");
    // "연동" 버튼 직접 클릭 (Settings 아이콘과 함께 있음)
    if (await safeClick(page, 'button:has-text("연동")') ||
        await clickByText(page, "연동", true)) {
      await page.waitForTimeout(2000);
      await shot("08", "kakao_integration_modal", true);
      await closeModal(page);
      await page.waitForTimeout(500);
    }

    // ============================================
    // 09. 리뉴 관리
    // ============================================
    console.log("📸 09. 리뉴 관리...");
    await page.goto("/admin/sales?tab=renewals");
    await waitForPageLoad(page, 2500);
    await shot("09", "renewal_main");

    // ============================================
    // 10. 리뉴 대상자 페이지
    // ============================================
    console.log("📸 10. 리뉴 대상자 페이지...");
    if (await clickByText(page, "리뉴 대상자") || await clickByText(page, "리뉴대상자")) {
      await waitForPageLoad(page, 2000);
      await shot("10", "renewal_targets");
      await page.goBack();
      await waitForPageLoad(page, 1500);
    }

    // ============================================
    // 11. 실적성과표
    // ============================================
    console.log("📸 11. 실적성과표...");
    await page.goto("/admin/sales?tab=analysis");
    await waitForPageLoad(page, 3000);
    await shot("11", "performance_analysis");

    // ============================================
    // 12. 회원 리스트 (회원 상세 모달 -> 회원 리스트로 변경)
    // ============================================
    console.log("\n📸 12. 회원 리스트...");
    await page.goto("/admin/pt-members");
    await waitForPageLoad(page, 2500);
    // 회원 더블클릭해서 상세 모달 열기
    try {
      const memberRow = page.locator("table tbody tr").first();
      if (await memberRow.isVisible({ timeout: 3000 })) {
        await memberRow.dblclick();
        await page.waitForTimeout(2500);
        await shot("12", "member_list", true);
        await closeModal(page);
        await page.waitForTimeout(500);
      }
    } catch {
      // 회원이 없으면 리스트만 캡처
      await shot("12", "member_list");
    }

    // ============================================
    // 13. 코칭 현황
    // ============================================
    console.log("📸 13. 코칭 현황...");
    await page.goto("/admin/pt-members");
    await waitForPageLoad(page, 2000);
    if (await clickByText(page, "코칭 현황") || await clickByText(page, "코칭현황")) {
      await waitForPageLoad(page, 2500);
      await shot("13", "coaching_kanban");
    }

    // ============================================
    // 13-1. 신규 상담 기록지 양식 모달
    // ============================================
    console.log("📸 13-1. 신규 상담 기록지 양식...");
    // 신규 섹션에서 "신규 상담기록지 양식" 클릭
    if (await clickByText(page, "신규 상담기록지 양식") || await clickByText(page, "신규상담기록지")) {
      await page.waitForTimeout(2000);
      await shot("13-1", "new_consultation_form_modal", true);
      await closeModal(page);
      await page.waitForTimeout(500);
    }

    // ============================================
    // 13-2. OT 수업 기록지 양식 모달
    // ============================================
    console.log("📸 13-2. OT 수업 기록지 양식...");
    if (await clickByText(page, "OT 수업 기록지 양식") || await clickByText(page, "OT수업기록지")) {
      await page.waitForTimeout(2000);
      await shot("13-2", "ot_lesson_form_modal", true);
      await closeModal(page);
      await page.waitForTimeout(500);
    }

    // ============================================
    // 13-3. PT 회원 관리 양식 모달
    // ============================================
    console.log("📸 13-3. PT 회원 관리 양식...");
    if (await clickByText(page, "PT 회원 관리 양식") || await clickByText(page, "PT회원관리양식")) {
      await page.waitForTimeout(2000);
      await shot("13-3", "pt_member_management_form_modal", true);
      await closeModal(page);
      await page.waitForTimeout(500);
    }

    // ============================================
    // 13-4. 회원 관리 노션 매뉴얼 모달
    // ============================================
    console.log("📸 13-4. 회원 관리 노션 매뉴얼...");
    if (await clickByText(page, "회원 관리 노션 매뉴얼") || await clickByText(page, "노션 매뉴얼")) {
      await page.waitForTimeout(2000);
      await shot("13-4", "notion_manual_modal", true);
      await closeModal(page);
      await page.waitForTimeout(500);
    }

    // ============================================
    // 13-5. 첫 상담 후 상담 결과(트레이너) 모달
    // ============================================
    console.log("📸 13-5. 첫 상담 후 상담 결과(트레이너)...");
    if (await clickByText(page, "첫 상담 후 상담 결과") || await clickByText(page, "상담 결과(트레이너)")) {
      await page.waitForTimeout(2000);
      await shot("13-5", "consultation_result_modal", true);
      await closeModal(page);
      await page.waitForTimeout(500);
    }

    // ============================================
    // 13-6. PT전 준비물 안내 (회원 전달용) 모달
    // ============================================
    console.log("📸 13-6. PT전 준비물 안내 (회원 전달용)...");
    if (await clickByText(page, "PT 전 준비물 안내") || await clickByText(page, "PT전 준비물") || await clickByText(page, "회원 전달용")) {
      await page.waitForTimeout(2000);
      await shot("13-6", "pt_preparation_guide_modal", true);
      await closeModal(page);
      await page.waitForTimeout(500);
    }

    // ============================================
    // 14. 재등록 관리
    // ============================================
    console.log("📸 14. 재등록 관리...");
    await page.goto("/admin/pt-members");
    await waitForPageLoad(page, 2000);
    if (await clickByText(page, "재등록 관리") || await clickByText(page, "재등록관리")) {
      await waitForPageLoad(page, 2500);
      await shot("14", "re_registration_management");
    }

    // ============================================
    // 14-1. 재등록 성과 데이터 페이지
    // ============================================
    console.log("📸 14-1. 재등록 성과 데이터...");
    if (await clickByText(page, "성과 데이터") || await clickByText(page, "성과데이터")) {
      await waitForPageLoad(page, 2000);
      await shot("14-1", "re_registration_performance_data");
      // 뒤로 돌아가기
      if (await clickByText(page, "집중 관리 대상") || await clickByText(page, "재등록 관리")) {
        await waitForPageLoad(page, 1500);
      }
    }

    // ============================================
    // 14-2. 매니지먼트 루틴 페이지
    // ============================================
    console.log("📸 14-2. 매니지먼트 루틴...");
    if (await clickByText(page, "매니지먼트 루틴") || await clickByText(page, "매니지먼트루틴")) {
      await waitForPageLoad(page, 2000);
      await shot("14-2", "management_routine");
    }

    // ============================================
    // 15. 스케줄 관리 (김소연 코치)
    // ============================================
    console.log("\n📸 15. 스케줄 관리 (김소연 코치)...");
    await page.goto("/admin/schedule");
    await waitForPageLoad(page, 3000);

    // 전체 코치 보기 -> 김소연 코치 선택
    if (await clickByText(page, "전체 코치") || await clickByText(page, "전체코치보기") || await clickByText(page, "전체 코치 보기")) {
      await page.waitForTimeout(1000);
    }
    // 김소연 코치 선택
    if (await clickByText(page, "김소연")) {
      await waitForPageLoad(page, 2000);
    }
    await shot("15", "schedule_timetable_kimsoyeon");

    // ============================================
    // 15-1. 스케줄 관리 월간리포트
    // ============================================
    console.log("📸 15-1. 월간 리포트...");
    if (await clickByText(page, "월간 리포트") || await clickByText(page, "월간리포트")) {
      await waitForPageLoad(page, 2000);
      await shot("15-1", "schedule_monthly_report");
      // 닫기
      await closeModal(page);
      await page.waitForTimeout(500);
    }

    // ============================================
    // 15-2. 스케줄 출석관리
    // ============================================
    console.log("📸 15-2. 스케줄 출석관리...");
    if (await clickByText(page, "스케줄 출석관리") || await clickByText(page, "스케줄출석관리") || await clickByText(page, "출석관리")) {
      await waitForPageLoad(page, 2000);
      await shot("15-2", "schedule_attendance_management");
      await closeModal(page);
      await page.waitForTimeout(500);
    }

    // ============================================
    // 16. 포트폴리오
    // ============================================
    console.log("\n📸 16. 포트폴리오...");
    await page.goto("/admin/portfolio");
    await waitForPageLoad(page, 2500);
    await shot("16", "portfolio_main");

    // ============================================
    // 17. 급여관리
    // ============================================
    console.log("📸 17. 급여관리...");
    await page.goto("/admin/salary");
    await waitForPageLoad(page, 2500);
    await shot("17", "salary_main");

    // ============================================
    // 17-1. 급여 템플릿 설계
    // ============================================
    console.log("📸 17-1. 급여 템플릿 설계...");
    if (await clickByText(page, "급여 템플릿 설계") || await clickByText(page, "급여템플릿설계") || await clickByText(page, "템플릿 설계")) {
      await waitForPageLoad(page, 2000);
      await shot("17-1", "salary_template_design");
      await closeModal(page);
      await page.waitForTimeout(500);
    }

    // ============================================
    // 18. 직원관리
    // ============================================
    console.log("📸 18. 직원관리...");
    await page.goto("/admin/staff");
    await waitForPageLoad(page, 2500);
    await shot("18", "staff_list");

    // ============================================
    // 19. 직원 등록 모달
    // ============================================
    console.log("📸 19. 직원 등록 모달...");
    if (await safeClick(page, 'button:has-text("직원 등록")') ||
        await safeClick(page, 'button:has-text("등록")')) {
      await page.waitForTimeout(2000);
      await shot("19", "staff_add_modal", true);
      await closeModal(page);
      await page.waitForTimeout(500);
    }

    // ============================================
    // 20. 본사관리
    // ============================================
    console.log("📸 20. 본사관리...");
    await page.goto("/admin/hq");
    await waitForPageLoad(page, 2500);
    await shot("20", "hq_main");

    // ============================================
    // 21. 시스템 설정
    // ============================================
    console.log("📸 21. 시스템 설정...");
    await page.goto("/admin/system");
    await waitForPageLoad(page, 2500);
    await shot("21", "system_settings");

    // ============================================
    // 완료
    // ============================================
    console.log(`\n🎉 완료! 스크린샷 저장 위치: ${SCREENSHOT_DIR}`);
  });
});
