-- ============================================
-- 급여 시스템 (테이블, RLS, 기본 데이터)
-- ============================================
-- 통합: salary_system_tables, alter_existing_tables, salary_rls_policies, seed_basic_data

-- ============================================
-- PART 1: 급여 시스템 테이블 생성
-- ============================================

-- 1. 직무 정의
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

-- 2. 급여 변수 정의
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

-- 3. 급여 구성요소
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

-- 4. 계산 규칙
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

-- 5. 인바디 측정 기록
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

-- 6. 월별 실적 데이터
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

-- 7. 계산된 급여
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

-- 8. FC 레벨 할당
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
-- PART 2: 기존 테이블 수정
-- ============================================

-- staffs 테이블 수정
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'staffs' AND column_name = 'work_start_time'
  ) THEN
    ALTER TABLE staffs ADD COLUMN work_start_time TIME;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'staffs' AND column_name = 'work_end_time'
  ) THEN
    ALTER TABLE staffs ADD COLUMN work_end_time TIME;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'staffs' AND column_name = 'job_position_code'
  ) THEN
    ALTER TABLE staffs ADD COLUMN job_position_code VARCHAR(50);
  END IF;
END $$;

COMMENT ON COLUMN staffs.work_start_time IS '근무 시작 시간 (예: 06:00)';
COMMENT ON COLUMN staffs.work_end_time IS '근무 종료 시간 (예: 15:00)';
COMMENT ON COLUMN staffs.job_position_code IS '직무 코드';

-- schedules 테이블 수정 (존재하는 경우만)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schedules') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'schedules' AND column_name = 'schedule_type'
    ) THEN
      ALTER TABLE schedules ADD COLUMN schedule_type VARCHAR(20);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'schedules' AND column_name = 'counted_for_salary'
    ) THEN
      ALTER TABLE schedules ADD COLUMN counted_for_salary BOOLEAN DEFAULT true;
    END IF;
  END IF;
END $$;

-- member_registrations 테이블 수정 (존재하는 경우만)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_registrations') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'member_registrations' AND column_name = 'registration_type'
    ) THEN
      ALTER TABLE member_registrations ADD COLUMN registration_type VARCHAR(20);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'member_registrations' AND column_name = 'amount_excl_vat'
    ) THEN
      ALTER TABLE member_registrations ADD COLUMN amount_excl_vat NUMERIC(12, 2);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'member_registrations' AND column_name = 'sales_staff_id'
    ) THEN
      ALTER TABLE member_registrations ADD COLUMN sales_staff_id UUID REFERENCES staffs(id);
    END IF;
  END IF;
END $$;


-- ============================================
-- PART 3: RLS 정책
-- ============================================

-- job_positions RLS
ALTER TABLE job_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for admins" ON job_positions;
CREATE POLICY "Enable all for admins" ON job_positions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM staffs
    WHERE user_id = auth.uid()
    AND gym_id = job_positions.gym_id
    AND role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staffs
    WHERE user_id = auth.uid()
    AND gym_id = job_positions.gym_id
    AND role IN ('admin', 'manager')
  )
);

-- salary_variables RLS
ALTER TABLE salary_variables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for admins" ON salary_variables;
CREATE POLICY "Enable all for admins" ON salary_variables FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM staffs
    WHERE user_id = auth.uid()
    AND gym_id = salary_variables.gym_id
    AND role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staffs
    WHERE user_id = auth.uid()
    AND gym_id = salary_variables.gym_id
    AND role IN ('admin', 'manager')
  )
);

-- salary_components RLS
ALTER TABLE salary_components ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for admins" ON salary_components;
CREATE POLICY "Enable all for admins" ON salary_components FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM staffs
    WHERE user_id = auth.uid()
    AND gym_id = salary_components.gym_id
    AND role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staffs
    WHERE user_id = auth.uid()
    AND gym_id = salary_components.gym_id
    AND role IN ('admin', 'manager')
  )
);

-- calculation_rules RLS
ALTER TABLE calculation_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for admins" ON calculation_rules;
CREATE POLICY "Enable all for admins" ON calculation_rules FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM salary_components sc
    JOIN staffs s ON s.gym_id = sc.gym_id
    WHERE sc.id = calculation_rules.component_id
    AND s.user_id = auth.uid()
    AND s.role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM salary_components sc
    JOIN staffs s ON s.gym_id = sc.gym_id
    WHERE sc.id = calculation_rules.component_id
    AND s.user_id = auth.uid()
    AND s.role IN ('admin', 'manager')
  )
);

-- monthly_performance RLS
ALTER TABLE monthly_performance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for own data and admins" ON monthly_performance;
CREATE POLICY "Enable read for own data and admins" ON monthly_performance FOR SELECT
USING (
  staff_id IN (SELECT id FROM staffs WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM staffs s1
    JOIN staffs s2 ON s1.gym_id = s2.gym_id
    WHERE s1.user_id = auth.uid()
    AND s2.id = monthly_performance.staff_id
    AND s1.role IN ('admin', 'manager')
  )
);

DROP POLICY IF EXISTS "Enable write for admins" ON monthly_performance;
CREATE POLICY "Enable write for admins" ON monthly_performance FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staffs s1
    JOIN staffs s2 ON s1.gym_id = s2.gym_id
    WHERE s1.user_id = auth.uid()
    AND s2.id = monthly_performance.staff_id
    AND s1.role IN ('admin', 'manager')
  )
);

DROP POLICY IF EXISTS "Enable update for admins" ON monthly_performance;
CREATE POLICY "Enable update for admins" ON monthly_performance FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM staffs s1
    JOIN staffs s2 ON s1.gym_id = s2.gym_id
    WHERE s1.user_id = auth.uid()
    AND s2.id = monthly_performance.staff_id
    AND s1.role IN ('admin', 'manager')
  )
);

-- calculated_salaries RLS
ALTER TABLE calculated_salaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for own data and admins" ON calculated_salaries;
CREATE POLICY "Enable read for own data and admins" ON calculated_salaries FOR SELECT
USING (
  staff_id IN (SELECT id FROM staffs WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM staffs s1
    JOIN staffs s2 ON s1.gym_id = s2.gym_id
    WHERE s1.user_id = auth.uid()
    AND s2.id = calculated_salaries.staff_id
    AND s1.role IN ('admin', 'manager')
  )
);

DROP POLICY IF EXISTS "Enable write for admins" ON calculated_salaries;
CREATE POLICY "Enable write for admins" ON calculated_salaries FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM staffs s1
    JOIN staffs s2 ON s1.gym_id = s2.gym_id
    WHERE s1.user_id = auth.uid()
    AND s2.id = calculated_salaries.staff_id
    AND s1.role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staffs s1
    JOIN staffs s2 ON s1.gym_id = s2.gym_id
    WHERE s1.user_id = auth.uid()
    AND s2.id = calculated_salaries.staff_id
    AND s1.role IN ('admin', 'manager')
  )
);

-- inbody_records RLS
ALTER TABLE inbody_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for gym members" ON inbody_records;
CREATE POLICY "Enable all for gym members" ON inbody_records FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM staffs s1
    JOIN staffs s2 ON s1.gym_id = s2.gym_id
    WHERE s1.user_id = auth.uid()
    AND s2.id = inbody_records.staff_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staffs s1
    JOIN staffs s2 ON s1.gym_id = s2.gym_id
    WHERE s1.user_id = auth.uid()
    AND s2.id = inbody_records.staff_id
  )
);

-- fc_level_assignments RLS
ALTER TABLE fc_level_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for admins" ON fc_level_assignments;
CREATE POLICY "Enable all for admins" ON fc_level_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM staffs s1
    JOIN staffs s2 ON s1.gym_id = s2.gym_id
    WHERE s1.user_id = auth.uid()
    AND s2.id = fc_level_assignments.staff_id
    AND s1.role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staffs s1
    JOIN staffs s2 ON s1.gym_id = s2.gym_id
    WHERE s1.user_id = auth.uid()
    AND s2.id = fc_level_assignments.staff_id
    AND s1.role IN ('admin', 'manager')
  )
);


-- ============================================
-- PART 4: 기본 데이터 입력
-- ============================================

DO $$
DECLARE
  gym_record RECORD;
BEGIN
  FOR gym_record IN (SELECT id, name FROM gyms ORDER BY name)
  LOOP
    -- 직무 정의 (10가지)
    INSERT INTO job_positions (gym_id, code, name, description) VALUES
      (gym_record.id, 'trainer', '트레이너', '개인 PT 수업을 담당하는 트레이너'),
      (gym_record.id, 'pt_lead', 'PT팀장', 'PT팀을 이끄는 팀장급 트레이너'),
      (gym_record.id, 'fc_staff', 'FC사원', '회원 상담 및 관리를 담당하는 FC 사원'),
      (gym_record.id, 'fc_junior', 'FC주임', 'FC 업무를 담당하는 주임급'),
      (gym_record.id, 'fc_lead', 'FC팀장', 'FC팀을 이끄는 팀장'),
      (gym_record.id, 'manager', '지점장', '지점을 관리하는 지점장 (관리자)'),
      (gym_record.id, 'director', '실장', '센터 운영 총괄 실장 (주주, 관리자)'),
      (gym_record.id, 'pilates_trainer', '필라테스 전임', '필라테스 수업 전담 강사'),
      (gym_record.id, 'pilates_lead', '필라테스 팀장', '필라테스팀 팀장'),
      (gym_record.id, 'pilates_director', '필라테스 원장', '필라테스 부문 총괄 원장')
    ON CONFLICT (gym_id, code) DO NOTHING;

    -- 급여 변수 정의
    INSERT INTO salary_variables (gym_id, variable_name, display_name, data_type, data_source, aggregation_method, description) VALUES
      (gym_record.id, 'personal_sales', '개인 매출', 'number', 'member_registrations', 'sum', '직원 개인의 총 매출액'),
      (gym_record.id, 'personal_sales_excl_vat', '개인 매출 (부가세 제외)', 'number', 'member_registrations', 'sum', '부가세를 제외한 개인 매출'),
      (gym_record.id, 'new_member_sales', '신규 회원 매출', 'number', 'member_registrations', 'sum', '신규 등록 회원 매출'),
      (gym_record.id, 'renewal_sales', '재등록 매출', 'number', 'member_registrations', 'sum', '재등록 회원 매출'),
      (gym_record.id, 'extension_sales', '기간변경 매출', 'number', 'member_registrations', 'sum', '기간 변경 매출'),
      (gym_record.id, 'fc_total_sales', 'FC 총매출', 'number', 'member_registrations', 'sum', 'FC 팀 전체 매출'),
      (gym_record.id, 'fc_total_sales_excl_vat', 'FC 총매출 (부가세 제외)', 'number', 'member_registrations', 'sum', 'FC 팀 전체 매출 (부가세 제외)'),
      (gym_record.id, 'pt_total_count', 'PT 전체 횟수', 'number', 'schedules', 'count', '전체 PT 수업 횟수'),
      (gym_record.id, 'pt_inside_count', 'PT 근무내 횟수', 'number', 'schedules', 'count', '근무시간 내 PT 수업 횟수'),
      (gym_record.id, 'pt_outside_count', 'PT 근무외 횟수', 'number', 'schedules', 'count', '근무시간 외 PT 수업 횟수'),
      (gym_record.id, 'pt_weekend_count', 'PT 주말 횟수', 'number', 'schedules', 'count', '주말 PT 수업 횟수'),
      (gym_record.id, 'pt_holiday_count', 'PT 공휴일 횟수', 'number', 'schedules', 'count', '공휴일 PT 수업 횟수'),
      (gym_record.id, 'ot_count', 'OT 횟수', 'number', 'schedules', 'count', 'OT(오리엔테이션) 진행 횟수'),
      (gym_record.id, 'inbody_count', '인바디 측정 횟수', 'number', 'inbody_records', 'count', '인바디 측정 진행 횟수'),
      (gym_record.id, 'fc_level', 'FC 레벨', 'number', 'fc_level_assignments', 'value', 'FC 레벨 (1~5)'),
      (gym_record.id, 'gym_total_sales', '센터 전체 매출', 'number', 'member_registrations', 'sum', '센터 전체 매출'),
      (gym_record.id, 'working_days', '근무 일수', 'number', 'manual', 'value', '월 근무 일수')
    ON CONFLICT (gym_id, variable_name) DO NOTHING;

    -- 급여 구성요소
    INSERT INTO salary_components (gym_id, name, category, description, display_order) VALUES
      (gym_record.id, '기본급', 'base', '월 고정 기본급', 1),
      (gym_record.id, '식대', 'allowance', '식대 지원금', 2),
      (gym_record.id, '영업지원금', 'allowance', '영업 활동 지원금', 3),
      (gym_record.id, '직책수당', 'allowance', '팀장/주임 등 직책 수당', 4),
      (gym_record.id, 'PT 수업료', 'lesson', 'PT 수업에 대한 급여', 10),
      (gym_record.id, 'OT 수업료', 'lesson', 'OT(오리엔테이션) 수업료', 11),
      (gym_record.id, '필라테스 수업료', 'lesson', '필라테스 수업에 대한 급여', 12),
      (gym_record.id, 'FC 인센티브', 'incentive', 'FC 매출 인센티브', 20),
      (gym_record.id, '매출 인센티브', 'incentive', '개인 매출에 따른 인센티브', 21),
      (gym_record.id, '성과급', 'bonus', '특별 성과에 대한 상금', 30),
      (gym_record.id, '기타 수당', 'allowance', '기타 추가 수당', 99)
    ON CONFLICT DO NOTHING;

  END LOOP;
END $$;
