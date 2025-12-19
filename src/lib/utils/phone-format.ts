/**
 * 전화번호 포맷 유틸리티
 * 모든 전화번호를 000-0000-0000 형식으로 통일
 */

/**
 * 전화번호를 000-0000-0000 형식으로 포맷팅
 * @param phone - 입력된 전화번호 (다양한 형식 가능)
 * @returns 포맷팅된 전화번호
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";

  // 숫자만 추출
  const numbers = phone.replace(/\D/g, "");

  // 11자리 (010-0000-0000)
  if (numbers.length === 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  }

  // 10자리 (02-0000-0000 또는 031-000-0000)
  if (numbers.length === 10) {
    // 02로 시작하면 서울 지역번호
    if (numbers.startsWith("02")) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  }

  // 9자리 (02-000-0000)
  if (numbers.length === 9 && numbers.startsWith("02")) {
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`;
  }

  // 그 외 경우 원본 반환 (또는 숫자만)
  return phone;
}

/**
 * 입력 중인 전화번호에 자동으로 하이픈 추가 (onChange 핸들러용)
 * @param value - 현재 입력값
 * @returns 하이픈이 추가된 전화번호
 */
export function formatPhoneNumberOnChange(value: string): string {
  // 숫자만 추출
  const numbers = value.replace(/\D/g, "");

  // 최대 11자리로 제한
  const limited = numbers.slice(0, 11);

  // 길이에 따라 포맷팅
  if (limited.length <= 3) {
    return limited;
  }
  if (limited.length <= 7) {
    return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  }
  return `${limited.slice(0, 3)}-${limited.slice(3, 7)}-${limited.slice(7)}`;
}
