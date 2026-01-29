/**
 * 급여 계산 관련 타입 정의
 */

// 근무 통계 타입
export type WorkStats = {
  pt_total_count?: number;
  pt_inside_count?: number;
  pt_outside_count?: number;
  pt_weekend_count?: number;
  pt_holiday_count?: number;
  ot_count?: number;
  ot_inbody_count?: number;
  personal_inside_count?: number;
  personal_outside_count?: number;
  reserved_pt_count?: number;
  reserved_ot_count?: number;
  cancelled_pt_count?: number;
};

// 직원 급여 계산 결과
export type StaffSalaryResult = {
  staff_id: string;
  staff_name: string;
  job_position?: string;
  base_salary: number; // 기본급 합계
  incentive_salary: number; // 인센티브 합계
  class_salary: number; // 수업료 합계
  tax_deduction: number; // 세금 공제 합계 (음수로 저장)
  total_salary: number; // 세전 총 급여
  net_salary: number; // 세후 실수령액 (total_salary - tax_deduction)
  details: SalaryDetail[];
  stats: WorkStats; // 근무 통계
  reportStatus: ReportStatus;
};

export type SalaryDetail = {
  rule_name: string;
  amount: number;
  calculation: string; // "50회 x 20,000원" 등 설명
  isDeduction?: boolean; // 공제 항목 여부
};

export type ReportStatus = 'approved' | 'submitted' | 'rejected' | 'none';

// 급여 템플릿
export type SalaryTemplate = {
  id: string;
  name: string;
  items: SalaryTemplateItem[];
};

export type SalaryTemplateItem = {
  rule: SalaryRule;
};

export type SalaryRule = {
  id: string;
  name: string;
  calculation_type: string;
  default_parameters: Record<string, number | string | boolean>;
};

// 직원별 급여 설정
export type StaffSalarySetting = {
  staff_id: string;
  template_id: string | null;
  template_name?: string;
  personal_parameters: Record<string, number | string | boolean>;
};

// 직원별 실적 통계
export type StaffStats = {
  staff_id: string;
  staff_name: string;
  job_position?: string;
  pt_total_count: number;
  pt_inside_count: number;
  pt_outside_count: number;
  pt_weekend_count: number;
  pt_holiday_count: number;
  ot_count: number;
  ot_inbody_count: number;
  personal_inside_count: number;
  personal_outside_count: number;
  reserved_pt_count: number;
  reserved_ot_count: number;
  cancelled_pt_count: number;
  reportStatus: ReportStatus;
};

// 보고서 승인 상태
export type ReportApprovalStatus = {
  hasReports: boolean;
  allApproved: boolean;
  approvedCount: number;
  totalCount: number;
  staffStatuses: Record<string, ReportStatus>;
};
