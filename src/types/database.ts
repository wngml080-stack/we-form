// 데이터베이스 타입 정의

// 역할 타입
export type StaffRole = "system_admin" | "company_admin" | "admin" | "staff";

// 고용 상태 타입
export type EmploymentStatus = "재직" | "퇴사" | "휴직";

// 회사 상태 타입
export type CompanyStatus = "active" | "pending" | "suspended" | "inactive";

// 지점 상태 타입
export type GymStatus = "active" | "inactive" | "pending";

// 스케줄 상태 타입
export type ScheduleStatus = "scheduled" | "completed" | "cancelled" | "no_show" | "no_show_deducted";

// 보고서 상태 타입
export type ReportStatus = "draft" | "submitted" | "approved" | "rejected";

// 직원 기본 정보
export interface Staff {
  id: string;
  user_id: string;
  company_id: string;
  gym_id: string | null;
  name: string;
  email: string;
  phone?: string;
  job_title?: string;
  role: StaffRole;
  employment_status: EmploymentStatus;
  joined_at?: string;
  created_at: string;
  updated_at: string;
}

// 회사 정보
export interface Company {
  id: string;
  name: string;
  representative_name: string;
  contact_phone?: string;
  business_number?: string;
  status: CompanyStatus;
  created_at: string;
  updated_at: string;
}

// 지점 정보
export interface Gym {
  id: string;
  company_id: string;
  name: string;
  status: GymStatus;
  category?: string;
  size?: string;
  open_date?: string;
  memo?: string;
  fc_bep?: number;
  pt_bep?: number;
  plan?: string;
  created_at: string;
  updated_at: string;
}

// 회원 정보
export interface Member {
  id: string;
  gym_id: string;
  name: string;
  phone?: string;
  email?: string;
  birth_date?: string;
  gender?: "M" | "F";
  status?: string;
  memo?: string;
  created_at: string;
  updated_at: string;
}

// 스케줄 정보
export interface Schedule {
  id: string;
  gym_id: string;
  staff_id: string;
  member_id?: string;
  member_name?: string;
  title?: string;
  schedule_type?: string;
  start_time: string;
  end_time: string;
  status: ScheduleStatus;
  is_locked: boolean;
  report_id?: string;
  created_at: string;
  updated_at: string;
}

// 출석 기록
export interface Attendance {
  id: string;
  gym_id: string;
  schedule_id?: string;
  staff_id: string;
  member_id?: string;
  status_code: string;
  attended_at: string;
  memo?: string;
  created_at: string;
}

// 월간 스케줄 보고서
export interface MonthlyScheduleReport {
  id: string;
  staff_id: string;
  gym_id: string;
  company_id: string;
  year_month: string;
  stats: Record<string, number>;
  status: ReportStatus;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  admin_memo?: string;
  created_at: string;
  updated_at: string;
}

// 급여 설정
export interface SalarySetting {
  id: string;
  gym_id: string;
  attendance_code?: string;
  pay_type: "fixed" | "rate";
  amount?: number;
  rate?: number;
  memo?: string;
  created_at: string;
  updated_at: string;
}

// 회사 이벤트/행사
export interface CompanyEvent {
  id: string;
  company_id: string;
  gym_id?: string;
  title: string;
  content?: string;
  event_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 시스템 공지사항
export interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: "normal" | "important" | "urgent";
  is_active: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
}

// ===== 연차 관리 관련 타입 =====

// 휴가 신청 상태 타입
export type LeaveRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

// 반차 유형
export type HalfDayType = "morning" | "afternoon";

// 휴가 유형
export interface LeaveType {
  id: string;
  company_id: string;
  name: string;
  code: string; // annual, half_am, half_pm, sick, family, other
  deduction_days: number;
  requires_document: boolean;
  is_paid: boolean;
  max_days_per_year: number | null;
  color: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// 연차 부여
export interface LeaveAllowance {
  id: string;
  staff_id: string;
  company_id: string;
  gym_id: string | null;
  year: number;
  total_days: number;
  carried_over: number;
  adjusted_days: number;
  adjustment_reason: string | null;
  created_at: string;
  updated_at: string;
  // 조인된 데이터
  staff?: Staff;
}

// 휴가 신청
export interface LeaveRequest {
  id: string;
  staff_id: string;
  company_id: string;
  gym_id: string | null;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  is_half_day: boolean;
  half_day_type: HalfDayType | null;
  reason: string | null;
  contact_phone: string | null;
  handover_staff_id: string | null;
  handover_note: string | null;
  status: LeaveRequestStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  attachments: Array<{ name: string; url: string; size: number }>;
  created_at: string;
  updated_at: string;
  // 조인된 데이터
  staff?: Staff;
  leave_type?: LeaveType;
  approver?: Staff;
  handover_staff?: Staff;
}

// 연차 현황 요약 (API 응답용)
export interface LeaveSummary {
  staff_id: string;
  staff_name: string;
  gym_id: string | null;
  gym_name: string | null;
  year: number;
  total_days: number; // 총 연차 (부여 + 이월 + 조정)
  used_days: number; // 사용한 연차
  remaining_days: number; // 잔여 연차
  pending_days: number; // 승인 대기 중인 연차
}

// 캘린더 뷰용 휴가 데이터
export interface LeaveCalendarEvent {
  id: string;
  staff_id: string;
  staff_name: string;
  leave_type_name: string;
  leave_type_color: string;
  start_date: string;
  end_date: string;
  total_days: number;
  is_half_day: boolean;
  half_day_type: HalfDayType | null;
  status: LeaveRequestStatus;
}

// API 관련 타입
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    count?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
}

// 인증된 직원 정보 (API 인증용)
export interface AuthenticatedStaff {
  id: string;
  role: StaffRole;
  gym_id: string | null;
  company_id: string;
  employment_status: EmploymentStatus;
}

// 필터 데이터 타입
export interface FilterCompany {
  id: string;
  name: string;
}

export interface FilterGym {
  id: string;
  name: string;
  company_id: string;
}

export interface FilterStaff {
  id: string;
  name: string;
  gym_id: string;
  role: StaffRole;
}
