-- ============================================
-- 급여 시스템 테이블 생성
-- Migration: 20251208164318_salary_system_tables
-- ============================================

-- 중복 실행 방지 체크
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM migration_history
    WHERE migration_name = '20251208164318_salary_system_tables'
  ) THEN
    RAISE EXCEPTION '이 마이그레이션은 이미 실행되었습니다.';
  END IF;
END $$;

-- ============================================
-- 1. 직무 정의
-- ============================================

CREATE TABLE IF NOT EXISTS job_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(gym_id, code)
);

COMMENT ON TABLE job_positions IS '직무 정의 (트레이너, PT팀장, FC사원 등)';

-- ============================================
-- 2. 급여 변수 정의
-- ============================================

CREATE TABLE IF NOT EXISTS salary_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  variable_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  data_type VARCHAR(20) NOT NULL,
  data_source VARCHAR(100),
  aggregation_method VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(gym_id, variable_name)
);

COMMENT ON TABLE salary_variables IS '급여 계산에 사용되는 변수 정의';

-- ============================================
-- 3. 급여 구성요소
-- ============================================

CREATE TABLE IF NOT EXISTS salary_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE salary_components IS '급여 구성요소 (영업지원금, PT수업료 등)';

-- ============================================
-- 4. 계산 규칙
-- ============================================

CREATE TABLE IF NOT EXISTS calculation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID REFERENCES salary_components(id) ON DELETE CASCADE,
  job_position_code VARCHAR(50) NOT NULL,
  priority INT DEFAULT 0,
  condition JSONB NOT NULL DEFAULT '{}',
  calculation JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE calculation_rules IS '급여 계산 규칙';

-- ============================================
-- 5. 인바디 측정 기록
-- ============================================

CREATE TABLE IF NOT EXISTS inbody_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staffs(id) ON DELETE SET NULL,
  measured_at TIMESTAMP NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inbody_staff_measured ON inbody_records(staff_id, measured_at);

COMMENT ON TABLE inbody_records IS '인바디 측정 기록';

-- ============================================
-- 6. 월별 실적 데이터
-- ============================================

CREATE TABLE IF NOT EXISTS monthly_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staffs(id) ON DELETE CASCADE,
  year_month VARCHAR(7) NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  auto_calculated BOOLEAN DEFAULT true,
  calculated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(staff_id, year_month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_performance_year_month ON monthly_performance(year_month);

COMMENT ON TABLE monthly_performance IS '월별 실적 집계';

-- ============================================
-- 7. 계산된 급여
-- ============================================

CREATE TABLE IF NOT EXISTS calculated_salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staffs(id) ON DELETE CASCADE,
  year_month VARCHAR(7) NOT NULL,
  breakdown JSONB NOT NULL DEFAULT '{}',
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  previous_month_total NUMERIC(12, 2),
  diff_amount NUMERIC(12, 2),
  diff_rate NUMERIC(5, 2),
  calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(staff_id, year_month)
);

CREATE INDEX IF NOT EXISTS idx_calculated_salaries_year_month ON calculated_salaries(year_month);

COMMENT ON TABLE calculated_salaries IS '계산된 급여 결과';

-- ============================================
-- 8. FC 레벨 할당
-- ============================================

CREATE TABLE IF NOT EXISTS fc_level_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staffs(id) ON DELETE CASCADE,
  year_month VARCHAR(7) NOT NULL,
  level INT NOT NULL CHECK (level >= 1 AND level <= 5),
  assigned_by UUID REFERENCES staffs(id) ON DELETE SET NULL,
  notes TEXT,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(staff_id, year_month)
);

COMMENT ON TABLE fc_level_assignments IS 'FC 레벨 수동 할당';

-- ============================================
-- 마이그레이션 완료 기록
-- ============================================

SELECT execute_migration(
  '20251208164318_salary_system_tables',
  NULL,
  '급여 시스템 테이블 생성: 8개 테이블'
);
