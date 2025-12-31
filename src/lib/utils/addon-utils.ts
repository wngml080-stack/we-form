/**
 * 부가상품 관련 유틸리티 함수들
 * 락커, 운동복, 양말 등 부가상품 처리에 공통으로 사용
 */

export interface MemberPayment {
  id: string;
  membership_type?: string;
  registration_type?: string;
  memo?: string;
  start_date?: string;
  end_date?: string;
}

export interface ParsedAddonInfo {
  type: string;
  displayName: string;
  lockerNumber: string | null;
}

export interface ActiveAddon extends ParsedAddonInfo {
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// 부가상품 유형별 색상 정의
export const ADDON_TYPE_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  "개인락커": { bg: "bg-blue-50", text: "text-blue-800", badge: "bg-blue-200 text-blue-800" },
  "물품락커": { bg: "bg-cyan-50", text: "text-cyan-800", badge: "bg-cyan-200 text-cyan-800" },
  "운동복": { bg: "bg-green-50", text: "text-green-800", badge: "bg-green-200 text-green-800" },
  "양말": { bg: "bg-orange-50", text: "text-orange-800", badge: "bg-orange-200 text-orange-800" },
  "기타": { bg: "bg-purple-50", text: "text-purple-800", badge: "bg-purple-200 text-purple-800" },
};

/**
 * 다음날 날짜 계산
 */
export const getNextDay = (dateStr: string): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
};

/**
 * 부가상품 정보 파싱
 * memo 문자열에서 부가상품 유형, 표시명, 락커번호 추출
 */
export const parseAddonInfo = (memo: string | undefined): ParsedAddonInfo => {
  if (!memo) return { type: "기타", displayName: "부가상품", lockerNumber: null };

  let type = "기타";
  let lockerNumber: string | null = null;
  let displayName = memo;

  if (memo.includes("개인락커")) {
    type = "개인락커";
    const match = memo.match(/개인락커\s*(\d+)번?/);
    if (match) lockerNumber = match[1];
    displayName = lockerNumber ? `개인락커 ${lockerNumber}번` : "개인락커";
  } else if (memo.includes("물품락커")) {
    type = "물품락커";
    const match = memo.match(/물품락커\s*(\d+)번?/);
    if (match) lockerNumber = match[1];
    displayName = lockerNumber ? `물품락커 ${lockerNumber}번` : "물품락커";
  } else if (memo.includes("운동복")) {
    type = "운동복";
    displayName = "운동복";
  } else if (memo.includes("양말")) {
    type = "양말";
    displayName = "양말";
  } else {
    // 기타 부가상품: 괄호나 날짜 전까지의 텍스트 추출
    const otherMatch = memo.match(/^([^(]+?)(?:\s*\(|\s*\d{4}-|$)/);
    if (otherMatch) {
      displayName = otherMatch[1].trim();
    }
  }

  return { type, displayName, lockerNumber };
};

/**
 * 락커 유형별 가장 늦은 종료일 가져오기
 * 동일 유형의 활성 락커가 있으면 그 종료일 반환
 */
export const getLatestLockerEndDate = (
  payments: MemberPayment[] | undefined,
  lockerType: string
): string | null => {
  if (!payments || payments.length === 0) return null;

  const lockerPayments = payments.filter(p => {
    // 부가상품인지 확인
    if (p.membership_type !== "부가상품" && p.registration_type !== "부가상품") return false;
    // memo에서 락커 유형 확인 (예: "개인락커 15번 (3개월)")
    return p.memo?.includes(lockerType) && p.end_date;
  });

  if (lockerPayments.length === 0) return null;

  const today = new Date().toISOString().split("T")[0];
  // 오늘 이후 종료되는 락커만 필터링
  const activeLockers = lockerPayments.filter(p => p.end_date && p.end_date >= today);

  if (activeLockers.length === 0) return null;

  // 가장 늦은 종료일 찾기
  return activeLockers.reduce((latest, current) => {
    if (!latest.end_date) return current;
    if (!current.end_date) return latest;
    return new Date(current.end_date) > new Date(latest.end_date) ? current : latest;
  }).end_date || null;
};

/**
 * 결제 내역에서 활성 부가상품 목록 추출
 */
export const getActiveAddons = (payments: MemberPayment[] | undefined): ActiveAddon[] => {
  if (!payments || payments.length === 0) return [];

  const today = new Date().toISOString().split("T")[0];

  // membership_type 또는 registration_type이 "부가상품"인 것 필터링
  const filtered = payments.filter(p => {
    const isAddon = p.membership_type === "부가상품" || p.registration_type === "부가상품";
    const hasValidEndDate = p.end_date && p.end_date >= today;
    return isAddon && hasValidEndDate;
  });

  return filtered
    .map(p => {
      const info = parseAddonInfo(p.memo);
      return {
        ...info,
        startDate: p.start_date || "",
        endDate: p.end_date || "",
        isActive: true,
      };
    })
    .sort((a, b) => a.type.localeCompare(b.type));
};

/**
 * 락커 유형별 최소 시작일 계산
 * 기존 락커가 있으면 그 종료일 다음날 반환
 */
export const getMinStartDate = (
  payments: MemberPayment[] | undefined,
  addonType: string
): string | undefined => {
  if (addonType === "개인락커" || addonType === "물품락커") {
    const latestEndDate = getLatestLockerEndDate(payments, addonType);
    if (latestEndDate) {
      return getNextDay(latestEndDate);
    }
  }
  return undefined;
};
