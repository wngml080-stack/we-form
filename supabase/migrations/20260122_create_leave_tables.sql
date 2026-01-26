-- 연차 관리 시스템 테이블 생성

-- 1. 휴가 유형 테이블
CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(20) NOT NULL,
  deduction_days DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  requires_document BOOLEAN DEFAULT FALSE,
  is_paid BOOLEAN DEFAULT TRUE,
  max_days_per_year INTEGER,
  color VARCHAR(7) DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, code)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_leave_types_company ON leave_types(company_id);
CREATE INDEX IF NOT EXISTS idx_leave_types_active ON leave_types(company_id, is_active);

-- 2. 연차 부여 테이블
CREATE TABLE IF NOT EXISTS leave_allowances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staffs(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,
  year INTEGER NOT NULL,
  total_days DECIMAL(4,1) NOT NULL DEFAULT 15.0,
  carried_over DECIMAL(4,1) DEFAULT 0.0,
  adjusted_days DECIMAL(4,1) DEFAULT 0.0,
  adjustment_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, year)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_leave_allowances_staff ON leave_allowances(staff_id);
CREATE INDEX IF NOT EXISTS idx_leave_allowances_company_year ON leave_allowances(company_id, year);
CREATE INDEX IF NOT EXISTS idx_leave_allowances_gym ON leave_allowances(gym_id, year);

-- 3. 휴가 신청 테이블
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staffs(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days DECIMAL(4,1) NOT NULL,
  is_half_day BOOLEAN DEFAULT FALSE,
  half_day_type VARCHAR(10),
  reason TEXT,
  contact_phone VARCHAR(20),
  handover_staff_id UUID REFERENCES staffs(id),
  handover_note TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  approved_by UUID REFERENCES staffs(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_leave_requests_staff ON leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_company ON leave_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_gym ON leave_requests(gym_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_pending ON leave_requests(company_id, status) WHERE status = 'pending';

-- 4. RLS 정책 설정
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_allowances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "leave_types_select_policy" ON leave_types;
DROP POLICY IF EXISTS "leave_types_all_policy" ON leave_types;
DROP POLICY IF EXISTS "leave_allowances_select_own" ON leave_allowances;
DROP POLICY IF EXISTS "leave_allowances_admin_select" ON leave_allowances;
DROP POLICY IF EXISTS "leave_allowances_admin_all" ON leave_allowances;
DROP POLICY IF EXISTS "leave_requests_select_own" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_admin_select" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_insert_own" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_update_own_pending" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_admin_all" ON leave_requests;

-- leave_types RLS
CREATE POLICY "leave_types_select_policy" ON leave_types FOR SELECT
  USING (company_id IN (SELECT company_id FROM staffs WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "leave_types_all_policy" ON leave_types FOR ALL
  USING (company_id IN (SELECT company_id FROM staffs WHERE email = auth.jwt() ->> 'email' AND role IN ('system_admin', 'company_admin', 'admin')));

-- leave_allowances RLS
CREATE POLICY "leave_allowances_select_own" ON leave_allowances FOR SELECT
  USING (staff_id IN (SELECT id FROM staffs WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "leave_allowances_admin_select" ON leave_allowances FOR SELECT
  USING (company_id IN (SELECT company_id FROM staffs WHERE email = auth.jwt() ->> 'email' AND role IN ('system_admin', 'company_admin', 'admin')));

CREATE POLICY "leave_allowances_admin_all" ON leave_allowances FOR ALL
  USING (company_id IN (SELECT company_id FROM staffs WHERE email = auth.jwt() ->> 'email' AND role IN ('system_admin', 'company_admin', 'admin')));

-- leave_requests RLS
CREATE POLICY "leave_requests_select_own" ON leave_requests FOR SELECT
  USING (staff_id IN (SELECT id FROM staffs WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "leave_requests_admin_select" ON leave_requests FOR SELECT
  USING (company_id IN (SELECT company_id FROM staffs WHERE email = auth.jwt() ->> 'email' AND role IN ('system_admin', 'company_admin', 'admin')));

CREATE POLICY "leave_requests_insert_own" ON leave_requests FOR INSERT
  WITH CHECK (staff_id IN (SELECT id FROM staffs WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "leave_requests_update_own_pending" ON leave_requests FOR UPDATE
  USING (staff_id IN (SELECT id FROM staffs WHERE email = auth.jwt() ->> 'email') AND status = 'pending');

CREATE POLICY "leave_requests_admin_all" ON leave_requests FOR ALL
  USING (company_id IN (SELECT company_id FROM staffs WHERE email = auth.jwt() ->> 'email' AND role IN ('system_admin', 'company_admin', 'admin')));

-- 5. 기본 휴가 유형 삽입 함수
CREATE OR REPLACE FUNCTION create_default_leave_types()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO leave_types (company_id, name, code, deduction_days, color, display_order) VALUES
    (NEW.id, '연차', 'annual', 1.0, '#3B82F6', 1),
    (NEW.id, '반차 (오전)', 'half_am', 0.5, '#60A5FA', 2),
    (NEW.id, '반차 (오후)', 'half_pm', 0.5, '#60A5FA', 3),
    (NEW.id, '병가', 'sick', 1.0, '#EF4444', 4),
    (NEW.id, '경조사', 'family', 1.0, '#8B5CF6', 5),
    (NEW.id, '기타', 'other', 1.0, '#6B7280', 6);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (이미 존재하면 무시)
DROP TRIGGER IF EXISTS trigger_create_default_leave_types ON companies;
CREATE TRIGGER trigger_create_default_leave_types
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION create_default_leave_types();

-- 6. 기존 회사들에 대해 기본 휴가 유형 삽입
INSERT INTO leave_types (company_id, name, code, deduction_days, color, display_order)
SELECT c.id, '연차', 'annual', 1.0, '#3B82F6', 1
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM leave_types lt WHERE lt.company_id = c.id AND lt.code = 'annual');

INSERT INTO leave_types (company_id, name, code, deduction_days, color, display_order)
SELECT c.id, '반차 (오전)', 'half_am', 0.5, '#60A5FA', 2
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM leave_types lt WHERE lt.company_id = c.id AND lt.code = 'half_am');

INSERT INTO leave_types (company_id, name, code, deduction_days, color, display_order)
SELECT c.id, '반차 (오후)', 'half_pm', 0.5, '#60A5FA', 3
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM leave_types lt WHERE lt.company_id = c.id AND lt.code = 'half_pm');

INSERT INTO leave_types (company_id, name, code, deduction_days, color, display_order)
SELECT c.id, '병가', 'sick', 1.0, '#EF4444', 4
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM leave_types lt WHERE lt.company_id = c.id AND lt.code = 'sick');

INSERT INTO leave_types (company_id, name, code, deduction_days, color, display_order)
SELECT c.id, '경조사', 'family', 1.0, '#8B5CF6', 5
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM leave_types lt WHERE lt.company_id = c.id AND lt.code = 'family');

INSERT INTO leave_types (company_id, name, code, deduction_days, color, display_order)
SELECT c.id, '기타', 'other', 1.0, '#6B7280', 6
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM leave_types lt WHERE lt.company_id = c.id AND lt.code = 'other');
