-- ============================================
-- 회원 관리 (결제, 인덱스, 상품)
-- ============================================
-- 통합: extend_member_payments, add_member_indexes, add_membership_products

-- ============================================
-- PART 1: member_payments 테이블 확장
-- ============================================

-- 회원권 유형 추가
ALTER TABLE member_payments
ADD COLUMN IF NOT EXISTS membership_type TEXT
CHECK (membership_type IN ('헬스', '필라테스', 'PT', 'PPT', 'GPT', '골프', 'GX'));

COMMENT ON COLUMN member_payments.membership_type IS '회원권 유형: 헬스/필라테스/PT/PPT/GPT/골프/GX';

-- 등록 타입 추가
ALTER TABLE member_payments
ADD COLUMN IF NOT EXISTS registration_type TEXT
CHECK (registration_type IN ('신규', '리뉴', '기간변경', '부가상품'));

COMMENT ON COLUMN member_payments.registration_type IS '등록 타입: 신규/리뉴/기간변경/부가상품';

-- 방문루트 추가
ALTER TABLE member_payments
ADD COLUMN IF NOT EXISTS visit_route TEXT;

COMMENT ON COLUMN member_payments.visit_route IS '회원 유입 경로';

-- 분할 결제 정보 추가
ALTER TABLE member_payments
ADD COLUMN IF NOT EXISTS installment_count INTEGER DEFAULT 1;

COMMENT ON COLUMN member_payments.installment_count IS '분할 결제 총 횟수';

ALTER TABLE member_payments
ADD COLUMN IF NOT EXISTS installment_current INTEGER DEFAULT 1;

COMMENT ON COLUMN member_payments.installment_current IS '현재 분할 결제 회차';

ALTER TABLE member_payments
ADD COLUMN IF NOT EXISTS total_amount NUMERIC;

COMMENT ON COLUMN member_payments.total_amount IS '분할 결제 시 전체 금액';

-- 기존 데이터 기본값 설정
UPDATE member_payments
SET total_amount = amount
WHERE total_amount IS NULL;

-- member_payments 인덱스
CREATE INDEX IF NOT EXISTS idx_member_payments_membership_type ON member_payments(membership_type);
CREATE INDEX IF NOT EXISTS idx_member_payments_registration_type ON member_payments(registration_type);
CREATE INDEX IF NOT EXISTS idx_member_payments_visit_route ON member_payments(visit_route);


-- ============================================
-- PART 2: 회원 조회 최적화 인덱스
-- ============================================

-- 지점별 회원 조회 + 생성일 정렬
CREATE INDEX IF NOT EXISTS idx_members_gym_id_created_at
ON members(gym_id, created_at DESC);

-- 지점별 + 상태별 필터링
CREATE INDEX IF NOT EXISTS idx_members_gym_id_status
ON members(gym_id, status);

-- 지점별 + 담당 트레이너 필터링
CREATE INDEX IF NOT EXISTS idx_members_gym_id_trainer_id
ON members(gym_id, trainer_id);

-- 지점별 + 이름 검색
CREATE INDEX IF NOT EXISTS idx_members_gym_id_name
ON members(gym_id, name);

-- 지점별 + 전화번호 검색
CREATE INDEX IF NOT EXISTS idx_members_gym_id_phone
ON members(gym_id, phone);

-- 트레이너가 담당 회원 조회 시
CREATE INDEX IF NOT EXISTS idx_members_trainer_id_created_at
ON members(trainer_id, created_at DESC);

-- 회원권 조인 최적화
CREATE INDEX IF NOT EXISTS idx_member_memberships_member_id_status
ON member_memberships(member_id, status);

CREATE INDEX IF NOT EXISTS idx_member_memberships_gym_id_status
ON member_memberships(gym_id, status);

-- pg_trgm 확장 (유사 검색)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 이름/전화번호 검색용 GIN 인덱스
CREATE INDEX IF NOT EXISTS idx_members_name_trgm
ON members USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_members_phone_trgm
ON members USING gin(phone gin_trgm_ops);

-- 인덱스 코멘트
COMMENT ON INDEX idx_members_gym_id_created_at IS '지점별 회원 조회 + 최신순 정렬';
COMMENT ON INDEX idx_members_gym_id_status IS '지점별 상태 필터링';
COMMENT ON INDEX idx_members_gym_id_trainer_id IS '지점별 트레이너 필터링';
COMMENT ON INDEX idx_members_gym_id_name IS '지점별 이름 검색';
COMMENT ON INDEX idx_members_gym_id_phone IS '지점별 전화번호 검색';
COMMENT ON INDEX idx_members_trainer_id_created_at IS '트레이너 담당 회원 조회';
COMMENT ON INDEX idx_member_memberships_member_id_status IS '회원별 회원권 조회';
COMMENT ON INDEX idx_member_memberships_gym_id_status IS '지점별 회원권 조회';


-- ============================================
-- PART 3: 회원권 상품 템플릿 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS membership_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,

  -- 상품 정보
  name VARCHAR(100) NOT NULL,
  membership_type TEXT NOT NULL
    CHECK (membership_type IN ('헬스', '필라테스', 'PT', 'PPT', 'GX', '골프', '하이록스', '러닝', '크로스핏', '기타')),

  -- 기본값
  default_sessions INTEGER CHECK (default_sessions IS NULL OR default_sessions > 0),
  default_price NUMERIC NOT NULL CHECK (default_price >= 0),
  validity_months INTEGER CHECK (validity_months IS NULL OR validity_months > 0),
  days_per_session INTEGER CHECK (days_per_session IS NULL OR days_per_session > 0),

  -- 메타 정보
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  -- 타임스탬프
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(gym_id, name)
);

-- 인덱스
CREATE INDEX idx_membership_products_gym_id_active
  ON membership_products(gym_id, is_active, display_order);

CREATE INDEX idx_membership_products_gym_id_type
  ON membership_products(gym_id, membership_type);

CREATE INDEX idx_membership_products_gym_id_name
  ON membership_products(gym_id, name);

-- RLS
ALTER TABLE membership_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "지점 직원은 상품 조회 가능" ON membership_products
  FOR SELECT USING (
    gym_id IN (SELECT gym_id FROM staffs WHERE user_id = auth.uid())
  );

CREATE POLICY "지점 관리자는 상품 관리 가능" ON membership_products
  FOR ALL USING (
    gym_id IN (
      SELECT gym_id FROM staffs
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'director', 'system_admin', 'company_admin')
    )
  );

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_membership_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_membership_products_updated_at
  BEFORE UPDATE ON membership_products
  FOR EACH ROW
  EXECUTE FUNCTION update_membership_products_updated_at();

-- 코멘트
COMMENT ON TABLE membership_products IS '회원권 상품 템플릿';
COMMENT ON COLUMN membership_products.name IS '상품명 (예: PT 30회, 헬스 3개월)';
COMMENT ON COLUMN membership_products.membership_type IS '회원권 유형';
COMMENT ON COLUMN membership_products.default_sessions IS '기본 횟수 (PT/PPT만 사용)';
COMMENT ON COLUMN membership_products.default_price IS '기본 가격';
COMMENT ON COLUMN membership_products.validity_months IS '유효기간(개월)';
COMMENT ON COLUMN membership_products.days_per_session IS '1회당 며칠 (PT/PPT만 사용)';
COMMENT ON COLUMN membership_products.is_active IS '활성 상태';
COMMENT ON COLUMN membership_products.display_order IS '표시 순서';
