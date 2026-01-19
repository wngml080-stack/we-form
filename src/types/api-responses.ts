// ============================================
// API 응답 타입 정의
// ============================================

import { ApiResponse } from "./common";
import { Staff, Company, Gym, Member, Schedule } from "./database";

// ============================================
// 필터 API 응답 타입
// ============================================

/**
 * 회사 목록 응답
 */
export interface CompanyListItem {
  id: string;
  name: string;
}

export type CompaniesResponse = ApiResponse<{
  companies: CompanyListItem[];
}>;

/**
 * 지점 목록 응답
 */
export interface GymListItem {
  id: string;
  name: string;
}

export type GymsResponse = ApiResponse<{
  gyms: GymListItem[];
}>;

/**
 * 직원 목록 응답
 */
export interface StaffListItem {
  id: string;
  name: string;
  job_title?: string;
  role: string;
}

export type StaffsResponse = ApiResponse<{
  staffs: StaffListItem[];
}>;

// ============================================
// 회원 API 응답 타입
// ============================================

/**
 * 회원 등록 응답
 */
export type MemberCreateResponse = ApiResponse<{
  member: Member;
  membership_id?: string;
  payment_id?: string;
}>;

/**
 * 회원 목록 응답
 */
export interface MemberWithMembership extends Member {
  memberships?: {
    id: string;
    name: string;
    total_sessions: number;
    used_sessions: number;
    status: string;
    end_date: string;
  }[];
  trainer?: {
    id: string;
    name: string;
  };
}

export type MembersResponse = ApiResponse<{
  members: MemberWithMembership[];
  total_count?: number;
}>;

/**
 * 회원 상세 응답
 */
export type MemberDetailResponse = ApiResponse<{
  member: MemberWithMembership;
}>;

// ============================================
// 스케줄 API 응답 타입
// ============================================

/**
 * 스케줄 생성 응답
 */
export type ScheduleCreateResponse = ApiResponse<{
  schedule: Schedule;
}>;

/**
 * 스케줄 상태 업데이트 응답
 */
export type ScheduleUpdateResponse = ApiResponse<{
  schedule?: Schedule;
  membership_info?: string;
}>;

/**
 * 스케줄 목록 응답
 */
export interface ScheduleWithDetails extends Schedule {
  staff?: {
    id: string;
    name: string;
  };
  member?: {
    id: string;
    name: string;
    phone?: string;
  };
}

export type SchedulesResponse = ApiResponse<{
  schedules: ScheduleWithDetails[];
}>;

// ============================================
// 매출 API 응답 타입
// ============================================

/**
 * 매출 데이터
 */
export interface Payment {
  id: string;
  gym_id: string;
  company_id: string;
  member_name: string;
  phone?: string;
  amount: number;
  method?: string;
  sale_type?: string;
  membership_category?: string;
  membership_name?: string;
  trainer_id?: string;
  trainer_name?: string;
  memo?: string;
  created_at: string;
}

/**
 * 매출 생성 응답
 */
export type PaymentCreateResponse = ApiResponse<{
  payment: Payment;
  membership?: {
    id: string;
    name: string;
  };
  member_id?: string;
}>;

/**
 * 매출 목록 응답
 */
export type PaymentsResponse = ApiResponse<{
  payments: Payment[];
  stats?: {
    total_amount: number;
    count: number;
  };
}>;

// ============================================
// HQ (본사) API 응답 타입
// ============================================

/**
 * HQ 데이터 응답
 */
export interface HqStats {
  totalGyms: number;
  totalStaffs: number;
  totalMembers: number;
  activeMembers: number;
  monthlySales: number;
}

export type HqDataResponse = ApiResponse<{
  gyms: Gym[];
  allStaffs: Staff[];
  pendingStaffs: Staff[];
  members: Member[];
  payments: Payment[];
  events: unknown[];
  stats: HqStats;
}>;

// ============================================
// 인증 API 응답 타입
// ============================================

/**
 * 인증 응답
 */
export type AuthResponse = ApiResponse<{
  staff: Staff;
  company?: Company;
  gym?: Gym;
}>;

// ============================================
// 공통 삭제/업데이트 응답 타입
// ============================================

/**
 * 삭제 응답
 */
export type DeleteResponse = ApiResponse<{
  deleted_id?: string;
}>;

/**
 * 업데이트 응답
 */
export type UpdateResponse = ApiResponse<{
  updated_id?: string;
}>;

// ============================================
// 페이지네이션 응답 타입
// ============================================

/**
 * 페이지네이션 메타데이터
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * 페이지네이션 응답
 */
export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: PaginationMeta;
}
