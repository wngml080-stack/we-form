// ============================================
// 공통 타입 정의
// ============================================

/**
 * 에러 타입
 * catch 블록에서 사용하는 안전한 에러 타입
 */
export type AppError = Error & {
  message: string;
  code?: string;
  status?: number;
};

/**
 * 에러를 안전하게 처리하는 헬퍼 함수
 * @param error unknown 타입의 에러
 * @returns 에러 메시지 문자열
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return '알 수 없는 오류가 발생했습니다.';
}

/**
 * API 응답 타입
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 로딩 상태 타입
 */
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// ============================================
// 도메인 공통 타입
// ============================================

/**
 * 직원 역할 타입
 */
export type StaffRole = 
  | 'system_admin' 
  | 'company_admin' 
  | 'admin' 
  | 'manager' 
  | 'staff';

/**
 * 재직 상태 타입
 */
export type EmploymentStatus = 
  | '재직' 
  | '퇴사' 
  | '가입대기' 
  | '휴직';

/**
 * 센터 상태 타입
 */
export type GymStatus = 
  | 'active' 
  | 'pending' 
  | 'inactive';

/**
 * 회사 상태 타입
 */
export type CompanyStatus = 
  | 'active' 
  | 'pending' 
  | 'inactive';

/**
 * 출석 상태 코드 타입
 */
export type AttendanceStatus = 
  | 'completed' 
  | 'no_show' 
  | 'no_show_deducted' 
  | 'service' 
  | 'cancelled';

/**
 * 스케줄 상태 타입
 */
export type ScheduleStatus = 
  | 'scheduled' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show';

/**
 * 회원 상태 타입
 */
export type MemberStatus = 
  | 'active' 
  | 'inactive' 
  | 'expired' 
  | 'cancelled';

// ============================================
// Supabase 관련 타입
// ============================================

/**
 * Supabase 테이블 기본 구조
 */
export interface BaseTable {
  id: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Gym ID를 가진 테이블 (멀티 테넌시)
 */
export interface GymTable extends BaseTable {
  gym_id: string;
}

/**
 * Company ID를 가진 테이블
 */
export interface CompanyTable extends BaseTable {
  company_id: string;
}

