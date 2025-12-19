-- ============================================
-- 급여 템플릿 시스템
-- ============================================
-- 통합: add_salary_templates, add_salary_settings

-- ============================================
-- PART 1: 급여 템플릿 테이블
-- ============================================

-- 급여 템플릿
CREATE TABLE IF NOT EXISTS salary_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE salary_templates IS '급여 설정 템플릿 (예: 정규직 트레이너 A형)';

-- 급여 규칙
CREATE TABLE IF NOT EXISTS salary_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  component_id UUID REFERENCES salary_components(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  calculation_type VARCHAR(50) NOT NULL, -- fixed, hourly, percentage_total, percentage_personal, tiered
  default_parameters JSONB DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE salary_rules IS '급여 계산 규칙 정의';

-- 템플릿 - 규칙 매핑
CREATE TABLE IF NOT EXISTS salary_template_items (
  template_id UUID REFERENCES salary_templates(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES salary_rules(id) ON DELETE CASCADE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (template_id, rule_id)
);

COMMENT ON TABLE salary_template_items IS '템플릿에 포함된 급여 규칙들';

-- 직원별 급여 설정
CREATE TABLE IF NOT EXISTS staff_salary_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staffs(id) ON DELETE CASCADE,
  template_id UUID REFERENCES salary_templates(id) ON DELETE SET NULL,
  personal_parameters JSONB DEFAULT '{}',
  valid_from TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(staff_id)
);

COMMENT ON TABLE staff_salary_settings IS '직원에게 할당된 급여 템플릿 및 개인화 설정';

-- RLS 활성화
ALTER TABLE salary_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_salary_settings ENABLE ROW LEVEL SECURITY;

-- salary_templates RLS
CREATE POLICY "지점 관리자는 템플릿 조회 가능" ON salary_templates
  FOR SELECT USING (
    gym_id IN (SELECT gym_id FROM staffs WHERE user_id = auth.uid())
  );

CREATE POLICY "지점 관리자는 템플릿 관리 가능" ON salary_templates
  FOR ALL USING (
    gym_id IN (SELECT gym_id FROM staffs WHERE user_id = auth.uid() AND role IN ('admin', 'manager', 'director', 'system_admin'))
  );

-- salary_rules RLS
CREATE POLICY "지점 관리자는 규칙 조회 가능" ON salary_rules
  FOR SELECT USING (
    gym_id IN (SELECT gym_id FROM staffs WHERE user_id = auth.uid())
  );

CREATE POLICY "지점 관리자는 규칙 관리 가능" ON salary_rules
  FOR ALL USING (
    gym_id IN (SELECT gym_id FROM staffs WHERE user_id = auth.uid() AND role IN ('admin', 'manager', 'director', 'system_admin'))
  );

-- salary_template_items RLS
CREATE POLICY "지점 관리자는 템플릿 항목 조회 가능" ON salary_template_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM salary_templates st
      JOIN staffs s ON s.gym_id = st.gym_id
      WHERE st.id = salary_template_items.template_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "지점 관리자는 템플릿 항목 관리 가능" ON salary_template_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM salary_templates st
      JOIN staffs s ON s.gym_id = st.gym_id
      WHERE st.id = salary_template_items.template_id
      AND s.user_id = auth.uid()
      AND s.role IN ('admin', 'manager', 'director', 'system_admin')
    )
  );

-- staff_salary_settings RLS
CREATE POLICY "직원은 본인 설정을 조회 가능" ON staff_salary_settings
  FOR SELECT USING (
    staff_id IN (SELECT id FROM staffs WHERE user_id = auth.uid())
  );

CREATE POLICY "관리자는 지점 직원 설정 조회 가능" ON staff_salary_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staffs s
      WHERE s.id = staff_salary_settings.staff_id
      AND s.gym_id IN (SELECT gym_id FROM staffs WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "관리자는 지점 직원 설정 관리 가능" ON staff_salary_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM staffs s
      WHERE s.id = staff_salary_settings.staff_id
      AND s.gym_id IN (SELECT gym_id FROM staffs WHERE user_id = auth.uid() AND role IN ('admin', 'manager', 'director', 'system_admin'))
    )
  );


-- ============================================
-- PART 2: salary_settings 테이블 (출석 코드별 급여)
-- ============================================

CREATE TABLE IF NOT EXISTS salary_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  attendance_code VARCHAR(50),
  pay_type VARCHAR(20) DEFAULT 'fixed' CHECK (pay_type IN ('fixed', 'hourly', 'percentage')),
  amount NUMERIC(12, 2),
  rate NUMERIC(5, 2),
  memo TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE salary_settings IS '지점별 급여 설정 (출석 코드별 급여 규칙)';
COMMENT ON COLUMN salary_settings.attendance_code IS '출석 코드 (PT완료, 노쇼 등)';
COMMENT ON COLUMN salary_settings.pay_type IS '급여 유형: fixed(고정), hourly(시급), percentage(비율)';
COMMENT ON COLUMN salary_settings.amount IS '고정 금액 또는 시급';
COMMENT ON COLUMN salary_settings.rate IS '비율 (percentage 타입일 때 사용)';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_salary_settings_gym_id ON salary_settings(gym_id);
CREATE INDEX IF NOT EXISTS idx_salary_settings_attendance_code ON salary_settings(gym_id, attendance_code);

-- RLS
ALTER TABLE salary_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "지점 관리자는 급여 설정 조회 가능" ON salary_settings
  FOR SELECT USING (
    gym_id IN (SELECT gym_id FROM staffs WHERE user_id = auth.uid())
  );

CREATE POLICY "지점 관리자는 급여 설정 관리 가능" ON salary_settings
  FOR ALL USING (
    gym_id IN (
      SELECT gym_id FROM staffs
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'director', 'system_admin', 'company_admin')
    )
  );

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_salary_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_salary_settings_updated_at ON salary_settings;
CREATE TRIGGER trigger_update_salary_settings_updated_at
  BEFORE UPDATE ON salary_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_salary_settings_updated_at();
