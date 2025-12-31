-- =====================================================
-- WeForm 데이터베이스 정리 및 테이블 생성 스크립트
-- Supabase Dashboard → SQL Editor에서 실행하세요
-- =====================================================

-- 1. clerk_user_id 컬럼 제거 (Clerk → Supabase Auth 전환 후 불필요)
ALTER TABLE staffs DROP COLUMN IF EXISTS clerk_user_id;

-- 2. member_payments 테이블 (매출 관리용)
CREATE TABLE IF NOT EXISTS member_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  phone TEXT,
  sale_type TEXT,
  membership_category TEXT,
  membership_name TEXT,
  amount INTEGER DEFAULT 0,
  method TEXT,
  installment INTEGER DEFAULT 1,
  trainer_id UUID REFERENCES staffs(id) ON DELETE SET NULL,
  trainer_name TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. sale_types 테이블 (판매유형 커스텀)
CREATE TABLE IF NOT EXISTS sale_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. membership_categories 테이블 (회원권 종류)
CREATE TABLE IF NOT EXISTS membership_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. membership_names 테이블 (회원권명)
CREATE TABLE IF NOT EXISTS membership_names (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. payment_methods 테이블 (결제방법)
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. pt_members 테이블 (PT회원)
CREATE TABLE IF NOT EXISTS pt_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES staffs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  total_sessions INTEGER DEFAULT 0,
  remaining_sessions INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. pt_sessions 테이블 (PT세션 기록)
CREATE TABLE IF NOT EXISTS pt_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pt_member_id UUID REFERENCES pt_members(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
  session_date TIMESTAMPTZ,
  status TEXT DEFAULT 'completed',
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. products 테이블 (상품)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  price INTEGER DEFAULT 0,
  duration_days INTEGER,
  session_count INTEGER,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RLS (Row Level Security) 설정
-- =====================================================

-- RLS 활성화
ALTER TABLE member_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE pt_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pt_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자 허용 정책
CREATE POLICY "authenticated_access" ON member_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON sale_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON membership_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON membership_names FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON payment_methods FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON pt_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON pt_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Service Role 전체 접근
CREATE POLICY "service_role_access" ON member_payments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_access" ON sale_types FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_access" ON membership_categories FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_access" ON membership_names FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_access" ON payment_methods FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_access" ON pt_members FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_access" ON pt_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_access" ON products FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- 인덱스 생성 (성능 최적화)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_member_payments_gym ON member_payments(gym_id);
CREATE INDEX IF NOT EXISTS idx_member_payments_created ON member_payments(created_at);
CREATE INDEX IF NOT EXISTS idx_pt_members_gym ON pt_members(gym_id);
CREATE INDEX IF NOT EXISTS idx_pt_members_trainer ON pt_members(trainer_id);
CREATE INDEX IF NOT EXISTS idx_pt_sessions_member ON pt_sessions(pt_member_id);
CREATE INDEX IF NOT EXISTS idx_products_gym ON products(gym_id);

-- =====================================================
-- 완료!
-- =====================================================
