// 종목별 색상 규칙
// PT: 파랑 (blue)
// 헬스/회원권: 노랑 (yellow/amber)
// 필라테스: 분홍 (pink)
// 요가: 주황 (orange)
// 수영: 남색 (indigo)
// 골프: 초록 (green)
// GX: 보라 (purple)

export type CategoryType = "PT" | "헬스" | "회원권" | "필라테스" | "요가" | "수영" | "골프" | "GX" | string;

export interface CategoryColorSet {
  bg: string;
  bgLight: string;
  text: string;
  border: string;
  gradient: string;
  hex: string;
}

export const categoryColors: Record<string, CategoryColorSet> = {
  // PT - 파랑
  PT: {
    bg: "bg-blue-600",
    bgLight: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
    gradient: "from-blue-500 to-blue-600",
    hex: "#2563eb",
  },
  // 헬스/회원권 - 노랑
  헬스: {
    bg: "bg-amber-500",
    bgLight: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
    gradient: "from-amber-400 to-amber-500",
    hex: "#f59e0b",
  },
  회원권: {
    bg: "bg-amber-500",
    bgLight: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
    gradient: "from-amber-400 to-amber-500",
    hex: "#f59e0b",
  },
  // 필라테스 - 분홍
  필라테스: {
    bg: "bg-pink-500",
    bgLight: "bg-pink-50",
    text: "text-pink-600",
    border: "border-pink-200",
    gradient: "from-pink-400 to-pink-500",
    hex: "#ec4899",
  },
  // 요가 - 주황
  요가: {
    bg: "bg-orange-500",
    bgLight: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-200",
    gradient: "from-orange-400 to-orange-500",
    hex: "#f97316",
  },
  // 수영 - 남색
  수영: {
    bg: "bg-indigo-600",
    bgLight: "bg-indigo-50",
    text: "text-indigo-600",
    border: "border-indigo-200",
    gradient: "from-indigo-500 to-indigo-600",
    hex: "#4f46e5",
  },
  // 골프 - 초록
  골프: {
    bg: "bg-green-600",
    bgLight: "bg-green-50",
    text: "text-green-600",
    border: "border-green-200",
    gradient: "from-green-500 to-green-600",
    hex: "#16a34a",
  },
  // GX - 보라
  GX: {
    bg: "bg-purple-600",
    bgLight: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-200",
    gradient: "from-purple-500 to-purple-600",
    hex: "#9333ea",
  },
};

// 기본 색상 (매칭되지 않는 종목용)
export const defaultCategoryColor: CategoryColorSet = {
  bg: "bg-slate-500",
  bgLight: "bg-slate-50",
  text: "text-slate-600",
  border: "border-slate-200",
  gradient: "from-slate-400 to-slate-500",
  hex: "#64748b",
};

// 종목명으로 색상 가져오기
export function getCategoryColor(category: string | undefined | null): CategoryColorSet {
  if (!category) return defaultCategoryColor;

  const normalizedCategory = category.toUpperCase().trim();

  // PT 관련
  if (normalizedCategory.includes("PT") || normalizedCategory.includes("퍼스널")) {
    return categoryColors.PT;
  }

  // 헬스/회원권 관련
  if (normalizedCategory.includes("헬스") || normalizedCategory.includes("회원권") || normalizedCategory.includes("FC") || normalizedCategory.includes("피트니스")) {
    return categoryColors.헬스;
  }

  // 필라테스 관련
  if (normalizedCategory.includes("필라테스") || normalizedCategory.includes("PILATES")) {
    return categoryColors.필라테스;
  }

  // 요가 관련
  if (normalizedCategory.includes("요가") || normalizedCategory.includes("YOGA")) {
    return categoryColors.요가;
  }

  // 수영 관련
  if (normalizedCategory.includes("수영") || normalizedCategory.includes("SWIM") || normalizedCategory.includes("아쿠아")) {
    return categoryColors.수영;
  }

  // 골프 관련
  if (normalizedCategory.includes("골프") || normalizedCategory.includes("GOLF")) {
    return categoryColors.골프;
  }

  // GX 관련
  if (normalizedCategory.includes("GX") || normalizedCategory.includes("그룹")) {
    return categoryColors.GX;
  }

  return defaultCategoryColor;
}

// 차트용 색상 배열 (hex 값)
export function getCategoryChartColors(): string[] {
  return [
    categoryColors.PT.hex,
    categoryColors.헬스.hex,
    categoryColors.필라테스.hex,
    categoryColors.요가.hex,
    categoryColors.수영.hex,
    categoryColors.골프.hex,
    categoryColors.GX.hex,
  ];
}

// 종목 목록에서 색상 배열 가져오기
export function getColorsForCategories(categories: string[]): string[] {
  return categories.map(cat => getCategoryColor(cat).hex);
}
