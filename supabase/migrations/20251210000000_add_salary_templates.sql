-- ============================================
-- 급여 템플릿 시스템 추가
-- Migration: 20251210000000_add_salary_templates
-- 설명: 직무 기반이 아닌 템플릿 기반으로 유연하게 급여를 설정하기 위한 테이블 추가
-- ============================================

-- 1. 급여 템플릿
CREATE TABLE IF NOT EXISTS salary_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE salary_templates IS '급여 설정 템플릿 (예: 정규직 트레이너 A형)';

-- 2. 급여 규칙 (템플릿에 들어갈 개별 항목)
-- 기존 calculation_rules 와 비슷하지만, 템플릿 시스템에 맞게 재정의
CREATE TABLE IF NOT EXISTS salary_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  component_id UUID REFERENCES salary_components(id) ON DELETE SET NULL, -- 선택적 연결
  name VARCHAR(100) NOT NULL,
  calculation_type VARCHAR(50) NOT NULL, -- fixed, hourly, percentage_total, percentage_personal, tiered
  default_parameters JSONB DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE salary_rules IS '급여 계산 규칙 정의';

-- 3. 템플릿 - 규칙 매핑 (N:M)
CREATE TABLE IF NOT EXISTS salary_template_items (
  template_id UUID REFERENCES salary_templates(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES salary_rules(id) ON DELETE CASCADE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (template_id, rule_id)
);

COMMENT ON TABLE salary_template_items IS '템플릿에 포함된 급여 규칙들';

-- 4. 직원별 급여 설정 (템플릿 할당)
CREATE TABLE IF NOT EXISTS staff_salary_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staffs(id) ON DELETE CASCADE,
  template_id UUID REFERENCES salary_templates(id) ON DELETE SET NULL,
  personal_parameters JSONB DEFAULT '{}', -- 템플릿 기본값을 덮어쓸 개인별 파라미터
  valid_from TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(staff_id) -- 직원당 하나의 활성 설정 (이력 관리는 별도 테이블 필요 시 추가)
);

COMMENT ON TABLE staff_salary_settings IS '직원에게 할당된 급여 템플릿 및 개인화 설정';

-- RLS 정책 추가 (기본적으로 admin 이상 관리)

ALTER TABLE salary_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_salary_settings ENABLE ROW LEVEL SECURITY;

-- 정책: 같은 지점(gym_id)의 관리자만 수정 가능, 직원은 본인 설정 조회 가능

-- 1) salary_templates
CREATE POLICY "지점 관리자는 템플릿 조회 가능" ON salary_templates
  FOR SELECT USING (
    gym_id IN (SELECT gym_id FROM staffs WHERE user_id = auth.uid())
  );

CREATE POLICY "지점 관리자는 템플릿 관리 가능" ON salary_templates
  FOR ALL USING (
    gym_id IN (SELECT gym_id FROM staffs WHERE user_id = auth.uid() AND role IN ('admin', 'manager', 'director', 'system_admin'))
  );

-- 2) salary_rules
CREATE POLICY "지점 관리자는 규칙 조회 가능" ON salary_rules
  FOR SELECT USING (
    gym_id IN (SELECT gym_id FROM staffs WHERE user_id = auth.uid())
  );

CREATE POLICY "지점 관리자는 규칙 관리 가능" ON salary_rules
  FOR ALL USING (
    gym_id IN (SELECT gym_id FROM staffs WHERE user_id = auth.uid() AND role IN ('admin', 'manager', 'director', 'system_admin'))
  );

-- 3) salary_template_items
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

-- 4) staff_salary_settings
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




