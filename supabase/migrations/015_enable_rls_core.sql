-- =====================================================
-- We:form RLS (Row Level Security) 정책 - 핵심 테이블만
-- =====================================================

-- 1. 헬퍼 함수들
-- =====================================================

CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM staffs WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_my_gym_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT gym_id FROM staffs WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM staffs WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_my_staff_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM staffs WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staffs
    WHERE user_id = auth.uid()
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
    WHERE user_id = auth.uid()
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
    WHERE user_id = auth.uid()
    AND role IN ('system_admin', 'company_admin', 'admin')
  );
$$;


-- =====================================================
-- 2. COMPANIES 테이블
-- =====================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_select" ON companies;
CREATE POLICY "companies_select" ON companies FOR SELECT USING (
  is_system_admin() OR id = get_my_company_id()
);

DROP POLICY IF EXISTS "companies_insert" ON companies;
CREATE POLICY "companies_insert" ON companies FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "companies_update" ON companies;
CREATE POLICY "companies_update" ON companies FOR UPDATE USING (
  is_system_admin() OR (is_company_admin_or_above() AND id = get_my_company_id())
);


-- =====================================================
-- 3. GYMS 테이블
-- =====================================================
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gyms_select" ON gyms;
CREATE POLICY "gyms_select" ON gyms FOR SELECT USING (
  is_system_admin() OR company_id = get_my_company_id()
);

DROP POLICY IF EXISTS "gyms_insert" ON gyms;
CREATE POLICY "gyms_insert" ON gyms FOR INSERT WITH CHECK (
  is_system_admin() OR (is_company_admin_or_above() AND company_id = get_my_company_id())
);

DROP POLICY IF EXISTS "gyms_update" ON gyms;
CREATE POLICY "gyms_update" ON gyms FOR UPDATE USING (
  is_system_admin()
  OR (is_company_admin_or_above() AND company_id = get_my_company_id())
  OR (is_admin_or_above() AND id = get_my_gym_id())
);


-- =====================================================
-- 4. STAFFS 테이블
-- =====================================================
ALTER TABLE staffs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staffs_select" ON staffs;
CREATE POLICY "staffs_select" ON staffs FOR SELECT USING (
  is_system_admin() OR company_id = get_my_company_id()
);

DROP POLICY IF EXISTS "staffs_insert" ON staffs;
CREATE POLICY "staffs_insert" ON staffs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "staffs_update" ON staffs;
CREATE POLICY "staffs_update" ON staffs FOR UPDATE USING (
  is_system_admin()
  OR id = get_my_staff_id()
  OR (is_admin_or_above() AND company_id = get_my_company_id())
);


-- =====================================================
-- 5. 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_staffs_user_id ON staffs(user_id);
CREATE INDEX IF NOT EXISTS idx_staffs_company_id ON staffs(company_id);
CREATE INDEX IF NOT EXISTS idx_staffs_gym_id ON staffs(gym_id);
