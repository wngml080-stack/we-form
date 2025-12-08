// ============================================
// 급여 시스템 타입 정의
// ============================================

export type JobPositionCode =
  | 'trainer'
  | 'pt_lead'
  | 'fc_staff'
  | 'fc_junior'
  | 'fc_lead'
  | 'manager'
  | 'director'
  | 'pilates_trainer'
  | 'pilates_lead'
  | 'pilates_director';

export type SalaryCategory = 'base' | 'allowance' | 'lesson' | 'incentive' | 'bonus';

export type ScheduleType = 'inside' | 'outside' | 'weekend' | 'holiday';

export type RegistrationType = 'new' | 'renewal' | 'extension';

export type DataType = 'number' | 'boolean' | 'string';

// ============================================
// 직무 정의
// ============================================

export interface JobPosition {
  id: string;
  gym_id: string;
  code: JobPositionCode;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// 급여 변수
// ============================================

export interface SalaryVariable {
  id: string;
  gym_id: string;
  variable_name: string;
  display_name: string;
  data_type: DataType;
  data_source?: string;
  aggregation_method?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// 급여 구성요소
// ============================================

export interface SalaryComponent {
  id: string;
  gym_id: string;
  name: string;
  category: SalaryCategory;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// 조건식 타입
// ============================================

export type ConditionType = 'and' | 'or' | 'comparison' | 'always' | 'else';

export type ComparisonOperator = '>=' | '<=' | '=' | '!=' | '>' | '<' | 'in' | 'not_in';

export interface ComparisonCondition {
  type: 'comparison';
  field: string;
  operator: ComparisonOperator;
  value: any;
}

export interface LogicalCondition {
  type: 'and' | 'or';
  conditions: Condition[];
}

export interface AlwaysCondition {
  type: 'always';
}

export interface ElseCondition {
  type: 'else';
}

export type Condition =
  | ComparisonCondition
  | LogicalCondition
  | AlwaysCondition
  | ElseCondition;

// ============================================
// 계산식 타입
// ============================================

export type CalculationType = 'fixed' | 'formula' | 'tiered' | 'conditional';

export interface FixedCalculation {
  type: 'fixed';
  amount: number;
}

export interface FormulaCalculation {
  type: 'formula';
  formula: string; // 예: "count * rate", "pt_total_count * 13500"
}

export interface TieredCalculation {
  type: 'tiered';
  tiers: Array<{
    min?: number;
    max?: number;
    level?: number;
    value?: number;
    amount?: number;
    rate?: number;
  }>;
}

export interface ConditionalCalculation {
  type: 'conditional';
  cases: Array<{
    condition: Condition;
    formula?: string;
    amount?: number;
  }>;
  default?: number | string;
}

export type Calculation =
  | FixedCalculation
  | FormulaCalculation
  | TieredCalculation
  | ConditionalCalculation;

// ============================================
// 계산 규칙
// ============================================

export interface CalculationRule {
  id: string;
  component_id: string;
  job_position_code: JobPositionCode;
  priority: number;
  condition: Condition;
  calculation: Calculation;
  enabled: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// 월별 실적 데이터
// ============================================

export interface MonthlyMetrics {
  // 매출 관련
  personal_sales?: number;
  personal_sales_excl_vat?: number;
  new_member_sales?: number;
  renewal_sales?: number;
  extension_sales?: number;
  fc_total_sales?: number;
  fc_total_sales_excl_vat?: number;
  gym_total_sales?: number;

  // PT 수업 관련
  pt_total_count?: number;
  pt_inside_count?: number;
  pt_outside_count?: number;
  pt_weekend_count?: number;
  pt_holiday_count?: number;

  // 활동 지표
  ot_count?: number;
  inbody_count?: number;

  // FC 레벨
  fc_level?: number;

  // 기타
  working_days?: number;

  // 확장 가능 (회사별 커스텀 변수)
  [key: string]: any;
}

export interface MonthlyPerformance {
  id: string;
  staff_id: string;
  year_month: string; // 'YYYY-MM'
  metrics: MonthlyMetrics;
  auto_calculated: boolean;
  calculated_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// 계산된 급여
// ============================================

export interface SalaryBreakdown {
  [componentName: string]: number;
}

export interface CalculatedSalary {
  id: string;
  staff_id: string;
  year_month: string;
  breakdown: SalaryBreakdown;
  total_amount: number;
  previous_month_total?: number;
  diff_amount?: number;
  diff_rate?: number; // 퍼센트
  calculated_at: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// FC 레벨
// ============================================

export interface FCLevelAssignment {
  id: string;
  staff_id: string;
  year_month: string;
  level: number; // 1~5
  assigned_by?: string;
  notes?: string;
  assigned_at: string;
  created_at: string;
}

// ============================================
// 인바디 기록
// ============================================

export interface InbodyRecord {
  id: string;
  member_id: string;
  staff_id: string;
  measured_at: string;
  notes?: string;
  created_at: string;
}

// ============================================
// 스케줄 (기존 타입 확장)
// ============================================

export interface Schedule {
  id: string;
  staff_id: string;
  member_id?: string;
  title: string;
  start_time: string;
  end_time: string;
  date: string;
  schedule_type?: ScheduleType;
  counted_for_salary: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// 회원 등록 (기존 타입 확장)
// ============================================

export interface MemberRegistration {
  id: string;
  member_id: string;
  sales_staff_id?: string;
  registration_type?: RegistrationType;
  amount: number;
  amount_excl_vat?: number;
  registered_at: string;
  created_at: string;
}

// ============================================
// UI 전용 타입
// ============================================

// 규칙 빌더용 임시 상태
export interface RuleBuilderState {
  component_id: string;
  job_position_code: JobPositionCode;
  priority: number;
  condition: Condition;
  calculation: Calculation;
  description?: string;
}

// 급여 명세서 (상세)
export interface SalaryStatement {
  staff: {
    id: string;
    name: string;
    job_position: string;
    job_position_code: JobPositionCode;
  };
  year_month: string;
  performance: MonthlyMetrics;
  breakdown: SalaryBreakdown;
  total_amount: number;
  comparison?: {
    previous_month: number;
    diff_amount: number;
    diff_rate: number;
  };
}

// 월별 급여 요약 (관리자용)
export interface MonthlySalarySummary {
  year_month: string;
  total_staff_count: number;
  total_salary_amount: number;
  by_position: Array<{
    position_name: string;
    staff_count: number;
    total_amount: number;
    avg_amount: number;
  }>;
}
