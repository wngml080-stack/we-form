// ============================================
// 에러 핸들링 유틸리티
// ============================================

import { getErrorMessage } from "@/types/common";

/**
 * 에러를 안전하게 처리하고 사용자에게 표시
 * 
 * @param error 에러 객체
 * @param defaultMessage 기본 에러 메시지
 * @returns 에러 메시지 문자열
 */
export function handleError(error: unknown, defaultMessage = "오류가 발생했습니다."): string {
  const message = getErrorMessage(error);
  return message || defaultMessage;
}

/**
 * 에러를 콘솔에 로깅하고 메시지 반환
 * 
 * @param error 에러 객체
 * @param context 에러 발생 컨텍스트 (예: "회원 등록", "급여 계산")
 * @returns 에러 메시지 문자열
 */
export function logAndGetError(error: unknown, context?: string): string {
  const message = getErrorMessage(error);
  const logMessage = context ? `[${context}] ${message}` : message;
  console.error(logMessage, error);
  return message;
}

/**
 * 성공 메시지 표시 (향후 Toast로 교체 가능)
 * 
 * @param message 성공 메시지
 */
export function showSuccess(message: string): void {
  // 현재는 alert 사용, 향후 Toast 컴포넌트로 교체 가능
  alert(message);
}

/**
 * 에러 메시지 표시 (향후 Toast로 교체 가능)
 * 
 * @param error 에러 객체 또는 메시지
 * @param context 에러 발생 컨텍스트
 */
export function showError(error: unknown, context?: string): void {
  const message = logAndGetError(error, context);
  // 현재는 alert 사용, 향후 Toast 컴포넌트로 교체 가능
  alert(message);
}

/**
 * 확인 다이얼로그 표시
 * 
 * @param message 확인 메시지
 * @returns 사용자가 확인했는지 여부
 */
export function showConfirm(message: string): boolean {
  return confirm(message);
}

