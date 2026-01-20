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

// ApiResponse는 database.ts에 정의되어 있습니다

/**
 * 로딩 상태 타입
 */
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// 도메인 공통 타입은 database.ts에 정의되어 있습니다 (StaffRole, EmploymentStatus, GymStatus, CompanyStatus)

/**
 * 출석 상태 코드 타입
 */
export type AttendanceStatus = 
  | 'completed' 
  | 'no_show' 
  | 'no_show_deducted' 
  | 'service' 
  | 'cancelled';

// ScheduleStatus는 database.ts에 정의되어 있습니다

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

