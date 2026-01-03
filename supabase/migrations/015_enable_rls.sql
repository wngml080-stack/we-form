-- =====================================================
-- We:form RLS (Row Level Security) 정책
-- =====================================================
-- 이 마이그레이션을 Supabase SQL Editor에서 실행하세요
-- =====================================================

-- 1. 현재 사용자 정보 조회 함수
-- =====================================================

CREATE OR REPLACE FUNCTION get_current_staff()
RETURNS TABLE(
  id uuid,
  company_id uuid,
  gym_id uuid,
  role text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT s.id, s.company_id, s.gym_id, s.role
  FROM staffs s
  WHERE s.auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- 편의 함수들
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM staffs WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_my_gym_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT gym_id FROM staffs WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM staffs WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_my_staff_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM staffs WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- 권한 체크 함수
CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staffs
    WHERE auth_user_id = auth.uid()
    AND role = 'system_admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_company_admin_or_above()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staffs
    WHERE auth_user_id = auth.uid()
    AND role IN ('system_admin', 'company_admin')
  );
$$;

CREATE OR REPLACE FUNCTION is_admin_or_above()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staffs
    WHERE auth_user_id = auth.uid()
    AND role IN ('system_admin', 'company_admin', 'admin')
  );
$$;


-- =====================================================
-- 2. 테이블별 RLS 활성화 및 정책
-- =====================================================

-- =====================================================
-- COMPANIES 테이블
-- =====================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_select" ON companies;
CREATE POLICY "companies_select" ON companies FOR SELECT USING (
  is_system_admin()
  OR id = get_my_company_id()
);

DROP POLICY IF EXISTS "companies_insert" ON companies;
CREATE POLICY "companies_insert" ON companies FOR INSERT WITH CHECK (
  is_system_admin()
);

DROP POLICY IF EXISTS "companies_update" ON companies;
CREATE POLICY "companies_update" ON companies FOR UPDATE USING (
  is_system_admin()
  OR (is_company_admin_or_above() AND id = get_my_company_id())
);


-- =====================================================
-- GYMS 테이블
-- =====================================================
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gyms_select" ON gyms;
CREATE POLICY "gyms_select" ON gyms FOR SELECT USING (
  is_system_admin()
  OR company_id = get_my_company_id()
);

DROP POLICY IF EXISTS "gyms_insert" ON gyms;
CREATE POLICY "gyms_insert" ON gyms FOR INSERT WITH CHECK (
  is_system_admin()
  OR (is_company_admin_or_above() AND company_id = get_my_company_id())
);

DROP POLICY IF EXISTS "gyms_update" ON gyms;
CREATE POLICY "gyms_update" ON gyms FOR UPDATE USING (
  is_system_admin()
  OR (is_company_admin_or_above() AND company_id = get_my_company_id())
  OR (is_admin_or_above() AND id = get_my_gym_id())
);


-- =====================================================
-- STAFFS 테이블
-- =====================================================
ALTER TABLE staffs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staffs_select" ON staffs;
CREATE POLICY "staffs_select" ON staffs FOR SELECT USING (
  is_system_admin()
  OR company_id = get_my_company_id()
);

DROP POLICY IF EXISTS "staffs_insert" ON staffs;
CREATE POLICY "staffs_insert" ON staffs FOR INSERT WITH CHECK (
  is_system_admin()
  OR (is_admin_or_above() AND company_id = get_my_company_id())
);

DROP POLICY IF EXISTS "staffs_update" ON staffs;
CREATE POLICY "staffs_update" ON staffs FOR UPDATE USING (
  is_system_admin()
  OR id = get_my_staff_id()  -- 본인 정보 수정
  OR (is_admin_or_above() AND company_id = get_my_company_id())
);


-- =====================================================
-- MEMBERS 테이블
-- =====================================================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_select" ON members;
CREATE POLICY "members_select" ON members FOR SELECT USING (
  is_system_admin()
  OR company_id = get_my_company_id()
);

DROP POLICY IF EXISTS "members_insert" ON members;
CREATE POLICY "members_insert" ON members FOR INSERT WITH CHECK (
  is_system_admin()
  OR (company_id = get_my_company_id() AND (
    is_admin_or_above()
    OR gym_id = get_my_gym_id()
  ))
);

DROP POLICY IF EXISTS "members_update" ON members;
CREATE POLICY "members_update" ON members FOR UPDATE USING (
  is_system_admin()
  OR (company_id = get_my_company_id() AND (
    is_admin_or_above()
    OR gym_id = get_my_gym_id()
  ))
);


-- =====================================================
-- MEMBER_MEMBERSHIPS 테이블
-- =====================================================
ALTER TABLE member_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member_memberships_select" ON member_memberships;
CREATE POLICY "member_memberships_select" ON member_memberships FOR SELECT USING (
  is_system_admin()
  OR company_id = get_my_company_id()
);

DROP POLICY IF EXISTS "member_memberships_insert" ON member_memberships;
CREATE POLICY "member_memberships_insert" ON member_memberships FOR INSERT WITH CHECK (
  is_system_admin()
  OR (company_id = get_my_company_id() AND (
    is_admin_or_above()
    OR gym_id = get_my_gym_id()
  ))
);

DROP POLICY IF EXISTS "member_memberships_update" ON member_memberships;
CREATE POLICY "member_memberships_update" ON member_memberships FOR UPDATE USING (
  is_system_admin()
  OR (company_id = get_my_company_id() AND is_admin_or_above())
);

DROP POLICY IF EXISTS "member_memberships_delete" ON member_memberships;
CREATE POLICY "member_memberships_delete" ON member_memberships FOR DELETE USING (
  is_system_admin()
  OR (company_id = get_my_company_id() AND is_admin_or_above())
);


-- =====================================================
-- MEMBERSHIP_PRODUCTS 테이블
-- =====================================================
ALTER TABLE membership_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "membership_products_select" ON membership_products;
CREATE POLICY "membership_products_select" ON membership_products FOR SELECT USING (
  is_system_admin()
  OR company_id = get_my_company_id()
);

DROP POLICY IF EXISTS "membership_products_insert" ON membership_products;
CREATE POLICY "membership_products_insert" ON membership_products FOR INSERT WITH CHECK (
  is_system_admin()
  OR (company_id = get_my_company_id() AND is_admin_or_above())
);

DROP POLICY IF EXISTS "membership_products_update" ON membership_products;
CREATE POLICY "membership_products_update" ON membership_products FOR UPDATE USING (
  is_system_admin()
  OR (company_id = get_my_company_id() AND is_admin_or_above())
);


-- =====================================================
-- SCHEDULES 테이블
-- =====================================================
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schedules_select" ON schedules;
CREATE POLICY "schedules_select" ON schedules FOR SELECT USING (
  is_system_admin()
  OR company_id = get_my_company_id()
);

DROP POLICY IF EXISTS "schedules_insert" ON schedules;
CREATE POLICY "schedules_insert" ON schedules FOR INSERT WITH CHECK (
  is_system_admin()
  OR (company_id = get_my_company_id() AND (
    is_admin_or_above()
    OR (gym_id = get_my_gym_id() AND staff_id = get_my_staff_id())
  ))
);

DROP POLICY IF EXISTS "schedules_update" ON schedules;
CREATE POLICY "schedules_update" ON schedules FOR UPDATE USING (
  is_system_admin()
  OR (company_id = get_my_company_id() AND (
    is_admin_or_above()
    OR (gym_id = get_my_gym_id() AND staff_id = get_my_staff_id() AND NOT is_locked)
  ))
);

DROP POLICY IF EXISTS "schedules_delete" ON schedules;
CREATE POLICY "schedules_delete" ON schedules FOR DELETE USING (
  is_system_admin()
  OR (company_id = get_my_company_id() AND is_admin_or_above())
);


-- =====================================================
-- ATTENDANCES 테이블
-- =====================================================
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendances_select" ON attendances;
CREATE POLICY "attendances_select" ON attendances FOR SELECT USING (
  is_system_admin()
  OR company_id = get_my_company_id()
);

DROP POLICY IF EXISTS "attendances_insert" ON attendances;
CREATE POLICY "attendances_insert" ON attendances FOR INSERT WITH CHECK (
  is_system_admin()
  OR (company_id = get_my_company_id() AND (
    is_admin_or_above()
    OR gym_id = get_my_gym_id()
  ))
);

DROP POLICY IF EXISTS "attendances_update" ON attendances;
CREATE POLICY "attendances_update" ON attendances FOR UPDATE USING (
  is_system_admin()
  OR (company_id = get_my_company_id() AND is_admin_or_above())
);


-- =====================================================
-- MONTHLY_SCHEDULE_REPORTS 테이블
-- =====================================================
ALTER TABLE monthly_schedule_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "monthly_schedule_reports_select" ON monthly_schedule_reports;
CREATE POLICY "monthly_schedule_reports_select" ON monthly_schedule_reports FOR SELECT USING (
  is_system_admin()
  OR company_id = get_my_company_id()
);

DROP POLICY IF EXISTS "monthly_schedule_reports_insert" ON monthly_schedule_reports;
CREATE POLICY "monthly_schedule_reports_insert" ON monthly_schedule_reports FOR INSERT WITH CHECK (
  is_system_admin()
  OR (company_id = get_my_company_id() AND (
    is_admin_or_above()
    OR staff_id = get_my_staff_id()
  ))
);

DROP POLICY IF EXISTS "monthly_schedule_reports_update" ON monthly_schedule_reports;
CREATE POLICY "monthly_schedule_reports_update" ON monthly_schedule_reports FOR UPDATE USING (
  is_system_admin()
  OR (company_id = get_my_company_id() AND (
    is_admin_or_above()
    OR (staff_id = get_my_staff_id() AND status = 'draft')
  ))
);


-- =====================================================
-- MEMBER_PAYMENTS 테이블
-- =====================================================
ALTER TABLE member_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member_payments_select" ON member_payments;
CREATE POLICY "member_payments_select" ON member_payments FOR SELECT USING (
  is_system_admin()
  OR company_id = get_my_company_id()
);

DROP POLICY IF EXISTS "member_payments_insert" ON member_payments;
CREATE POLICY "member_payments_insert" ON member_payments FOR INSERT WITH CHECK (
  is_system_admin()
  OR (company_id = get_my_company_id() AND (
    is_admin_or_above()
    OR gym_id = get_my_gym_id()
  ))
);

DROP POLICY IF EXISTS "member_payments_update" ON member_payments;
CREATE POLICY "member_payments_update" ON member_payments FOR UPDATE USING (
  is_system_admin()
  OR (company_id = get_my_company_id() AND is_admin_or_above())
);


-- =====================================================
-- SALARY 관련 테이블들
-- =====================================================

-- SALARY_VARIABLES
ALTER TABLE salary_variables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "salary_variables_select" ON salary_variables;
CREATE POLICY "salary_variables_select" ON salary_variables FOR SELECT USING (
  is_system_admin()
  OR company_id = get_my_company_id()
);

DROP POLICY IF EXISTS "salary_variables_all" ON salary_variables;
CREATE POLICY "salary_variables_all" ON salary_variables FOR ALL USING (
  is_system_admin()
  OR (company_id = get_my_company_id() AND is_admin_or_above())
);

-- SALARY_COMPONENTS
ALTER TABLE salary_components ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "salary_components_select" ON salary_components;
CREATE POLICY "salary_components_select" ON salary_components FOR SELECT USING (
  is_system_admin()
  OR company_id = get_my_company_id()
);

DROP POLICY IF EXISTS "salary_components_all" ON salary_components;
CREATE POLICY "salary_components_all" ON salary_components FOR ALL USING (
  is_system_admin()
  OR (company_id = get_my_company_id() AND is_admin_or_above())
);

-- CALCULATED_SALARIES
ALTER TABLE calculated_salaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calculated_salaries_select" ON calculated_salaries;
CREATE POLICY "calculated_salaries_select" ON calculated_salaries FOR SELECT USING (
  is_system_admin()
  OR (company_id = get_my_company_id() AND (
    is_admin_or_above()
    OR staff_id = get_my_staff_id()  -- 본인 급여만
  ))
);

DROP POLICY IF EXISTS "calculated_salaries_all" ON calculated_salaries;
CREATE POLICY "calculated_salaries_all" ON calculated_salaries FOR ALL USING (
  is_system_admin()
  OR (company_id = get_my_company_id() AND is_admin_or_above())
);

-- SALARY_SETTINGS
ALTER TABLE salary_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "salary_settings_select" ON salary_settings;
CREATE POLICY "salary_settings_select" ON salary_settings FOR SELECT USING (
  is_system_admin()
  OR company_id = get_my_company_id()
);

DROP POLICY IF EXISTS "salary_settings_all" ON salary_settings;
CREATE POLICY "salary_settings_all" ON salary_settings FOR ALL USING (
  is_system_admin()
  OR (company_id = get_my_company_id() AND is_admin_or_above())
);


-- =====================================================
-- COMPANY_EVENTS 테이블
-- =====================================================
ALTER TABLE company_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_events_select" ON company_events;
CREATE POLICY "company_events_select" ON company_events FOR SELECT USING (
  is_system_admin()
  OR company_id = get_my_company_id()
);

DROP POLICY IF EXISTS "company_events_all" ON company_events;
CREATE POLICY "company_events_all" ON company_events FOR ALL USING (
  is_system_admin()
  OR (company_id = get_my_company_id() AND is_admin_or_above())
);


-- =====================================================
-- SYSTEM_ANNOUNCEMENTS 테이블 (시스템 공지는 모두 읽기 가능)
-- =====================================================
ALTER TABLE system_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_announcements_select" ON system_announcements;
CREATE POLICY "system_announcements_select" ON system_announcements FOR SELECT USING (
  is_active = true  -- 활성 공지만 모두 볼 수 있음
  OR is_system_admin()
);

DROP POLICY IF EXISTS "system_announcements_all" ON system_announcements;
CREATE POLICY "system_announcements_all" ON system_announcements FOR ALL USING (
  is_system_admin()
);


-- =====================================================
-- SALES 커스텀 옵션 테이블들
-- =====================================================

-- SALE_TYPES
ALTER TABLE sale_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sale_types_select" ON sale_types;
CREATE POLICY "sale_types_select" ON sale_types FOR SELECT USING (
  is_system_admin()
  OR company_id = get_my_company_id()
);

DROP POLICY IF EXISTS "sale_types_all" ON sale_types;
CREATE POLICY "sale_types_all" ON sale_types FOR ALL USING (
  is_system_admin()
  OR (company_id = get_my_company_id() AND is_admin_or_above())
);

-- MEMBERSHIP_CATEGORIES
ALTER TABLE membership_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "membership_categories_select" ON membership_categories;
CREATE POLICY "membership_categories_select" ON membership_categories FOR SELECT USING (
  is_system_admin()
  OR company_id = get_my_company_id()
);

DROP POLICY IF EXISTS "membership_categories_all" ON membership_categories;
CREATE POLICY "membership_categories_all" ON membership_categories FOR ALL USING (
  is_system_admin()
  OR (company_id = get_my_company_id() AND is_admin_or_above())
);

-- MEMBERSHIP_NAMES
ALTER TABLE membership_names ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "membership_names_select" ON membership_names;
CREATE POLICY "membership_names_select" ON membership_names FOR SELECT USING (
  is_system_admin()
  OR company_id = get_my_company_id()
);

DROP POLICY IF EXISTS "membership_names_all" ON membership_names;
CREATE POLICY "membership_names_all" ON membership_names FOR ALL USING (
  is_system_admin()
  OR (company_id = get_my_company_id() AND is_admin_or_above())
);

-- PAYMENT_METHODS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_methods_select" ON payment_methods;
CREATE POLICY "payment_methods_select" ON payment_methods FOR SELECT USING (
  is_system_admin()
  OR company_id = get_my_company_id()
);

DROP POLICY IF EXISTS "payment_methods_all" ON payment_methods;
CREATE POLICY "payment_methods_all" ON payment_methods FOR ALL USING (
  is_system_admin()
  OR (company_id = get_my_company_id() AND is_admin_or_above())
);


-- =====================================================
-- ATTENDANCE_STATUSES 테이블 (공통 코드, 모두 읽기 가능)
-- =====================================================
ALTER TABLE attendance_statuses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_statuses_select" ON attendance_statuses;
CREATE POLICY "attendance_statuses_select" ON attendance_statuses FOR SELECT USING (true);

DROP POLICY IF EXISTS "attendance_statuses_all" ON attendance_statuses;
CREATE POLICY "attendance_statuses_all" ON attendance_statuses FOR ALL USING (
  is_system_admin()
);


-- =====================================================
-- 3. 인덱스 추가 (RLS 성능 최적화)
-- =====================================================

-- staffs 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_staffs_auth_user_id ON staffs(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_staffs_company_id ON staffs(company_id);
CREATE INDEX IF NOT EXISTS idx_staffs_gym_id ON staffs(gym_id);

-- 주요 테이블 company_id 인덱스
CREATE INDEX IF NOT EXISTS idx_members_company_id ON members(company_id);
CREATE INDEX IF NOT EXISTS idx_member_memberships_company_id ON member_memberships(company_id);
CREATE INDEX IF NOT EXISTS idx_schedules_company_id ON schedules(company_id);
CREATE INDEX IF NOT EXISTS idx_attendances_company_id ON attendances(company_id);


-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'RLS 정책이 성공적으로 적용되었습니다!';
  RAISE NOTICE '이제 코드에서 .eq("gym_id", ...) 같은 필터 없이도 자동으로 데이터가 필터링됩니다.';
END $$;
