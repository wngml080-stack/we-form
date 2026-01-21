-- =====================================================
-- We:Form 통합 마이그레이션 - 03. Salary Schema
-- =====================================================
-- 급여: salary_components, salary_rules, salary_templates,
--      salary_template_items, staff_salary_settings, calculated_salaries, salary_settings
-- =====================================================

-- 1. Salary Components (급여 구성요소)
CREATE TABLE IF NOT EXISTS salary_components (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) CHECK (category IN ('base', 'allowance', 'lesson', 'incentive', 'bonus')),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Salary Rules (계산 규칙)
CREATE TABLE IF NOT EXISTS salary_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    component_id UUID REFERENCES salary_components(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    calculation_type VARCHAR(50) NOT NULL CHECK (calculation_type IN ('fixed', 'hourly', 'percentage_total', 'percentage_personal', 'tiered')),
    default_parameters JSONB DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Salary Templates (급여 템플릿)
CREATE TABLE IF NOT EXISTS salary_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Salary Template Items (템플릿-규칙 매핑)
CREATE TABLE IF NOT EXISTS salary_template_items (
    template_id UUID REFERENCES salary_templates(id) ON DELETE CASCADE NOT NULL,
    rule_id UUID REFERENCES salary_rules(id) ON DELETE CASCADE NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (template_id, rule_id)
);

-- 5. Staff Salary Settings (직원별 급여 설정)
CREATE TABLE IF NOT EXISTS staff_salary_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID REFERENCES staffs(id) ON DELETE CASCADE NOT NULL UNIQUE,
    template_id UUID REFERENCES salary_templates(id) ON DELETE SET NULL,
    personal_parameters JSONB DEFAULT '{}',
    valid_from DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Calculated Salaries (계산된 급여)
CREATE TABLE IF NOT EXISTS calculated_salaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID REFERENCES staffs(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
    year_month VARCHAR(7) NOT NULL,  -- YYYY-MM
    breakdown JSONB DEFAULT '{}',
    total_amount NUMERIC(12,2) DEFAULT 0,
    previous_month_total NUMERIC(12,2),
    diff_amount NUMERIC(12,2),
    diff_rate NUMERIC(5,2),
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(staff_id, year_month)
);

-- 7. Salary Settings (출석 코드별 급여)
CREATE TABLE IF NOT EXISTS salary_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    attendance_code VARCHAR(50),
    pay_type VARCHAR(50) CHECK (pay_type IN ('fixed', 'hourly', 'percentage')),
    amount NUMERIC(12,2),
    rate NUMERIC(5,2),
    memo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_salary_components_gym_id ON salary_components(gym_id);
CREATE INDEX IF NOT EXISTS idx_salary_components_company_id ON salary_components(company_id);

CREATE INDEX IF NOT EXISTS idx_salary_rules_gym_id ON salary_rules(gym_id);
CREATE INDEX IF NOT EXISTS idx_salary_rules_component_id ON salary_rules(component_id);

CREATE INDEX IF NOT EXISTS idx_salary_templates_gym_id ON salary_templates(gym_id);

CREATE INDEX IF NOT EXISTS idx_staff_salary_settings_staff_id ON staff_salary_settings(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_salary_settings_template_id ON staff_salary_settings(template_id);

CREATE INDEX IF NOT EXISTS idx_calculated_salaries_staff_id ON calculated_salaries(staff_id);
CREATE INDEX IF NOT EXISTS idx_calculated_salaries_year_month ON calculated_salaries(year_month);
CREATE INDEX IF NOT EXISTS idx_calculated_salaries_company_id ON calculated_salaries(company_id);

CREATE INDEX IF NOT EXISTS idx_salary_settings_gym_id ON salary_settings(gym_id);

-- =====================================================
-- Trigger: updated_at 자동 갱신
-- =====================================================
CREATE OR REPLACE FUNCTION update_salary_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_salary_settings_updated_at
    BEFORE UPDATE ON salary_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_salary_settings_updated_at();

-- =====================================================
-- 기본 급여 구성요소 (지점 생성 시 삽입 권장)
-- =====================================================
-- 기본급, 식대, 영업지원금, 직책수당
-- PT/OT/필라테스 수업료, FC 인센티브, 매출 인센티브, 성과급, 기타 수당
