/**
 * 급여 계산 유틸리티 함수
 */

/**
 * 계산 타입 라벨 반환
 */
export function getCalculationTypeLabel(type: string): string {
  switch (type) {
    case 'base_salary':
      return '기본급';
    case 'allowance':
      return '지원금';
    case 'hourly':
      return '시급';
    case 'class_fee':
      return '수업료';
    case 'sales_incentive':
      return '매출인센티브';
    case 'personal_incentive':
      return '개인인센티브';
    case 'bonus':
      return '상금';
    case 'etc':
      return '기타';
    case 'tax_deduction':
      return '세금공제';
    case 'fixed':
      return '고정급';
    case 'percentage_total':
      return '매출인센티브';
    case 'percentage_personal':
      return '개인인센티브';
    default:
      return type;
  }
}

/**
 * 금액 포맷팅 (천 단위 콤마)
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString();
}

/**
 * 퍼센트 포맷팅
 */
export function formatPercentage(rate: number): string {
  return `${rate}%`;
}
