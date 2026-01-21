/**
 * 리뉴얼 관련 타입 정의
 */

// 활동 상태 타입
export type ActivityStatus = 'absent' | 'rejected' | 'will_register' | 'considering' | 'contacted' | 'other';

// 활동 기록 타입
export interface ActivityRecord {
  date: string;
  content: string;
  status?: ActivityStatus;
  staffName?: string;
  reason?: string;
  expectedDate?: string;
}

// 리뉴 대상자 인터페이스
export interface RenewalMember {
  id: string;
  name: string;
  phone: string;
  membershipName: string;
  endDate: string;
  trainerName: string;
  memo?: string;
  activity1?: ActivityRecord;
  activity2?: ActivityRecord;
  activity3?: ActivityRecord;
  activity4?: ActivityRecord;
}

// 만기 분류 타입
export type ExpiryType = 'this_month' | 'next_month' | 'after_next_month' | 'expired';
