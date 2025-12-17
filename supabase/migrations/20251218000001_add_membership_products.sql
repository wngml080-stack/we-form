-- 회원권 상품 템플릿 테이블 생성
-- 각 지점에서 사용할 회원권 상품을 미리 등록하여 매출 등록 시 선택할 수 있도록 함

CREATE TABLE IF NOT EXISTS membership_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,

  -- 상품 정보
  name VARCHAR(100) NOT NULL,
  membership_type TEXT NOT NULL
    CHECK (membership_type IN ('헬스', '필라테스', 'PT', 'PPT', 'GX', '골프', '하이록스', '러닝', '크로스핏', '기타')),

  -- 기본값 (조건부 필수)
  default_sessions INTEGER CHECK (default_sessions IS NULL OR default_sessions > 0),  -- PT/PPT만 필수
  default_price NUMERIC NOT NULL CHECK (default_price >= 0),
  validity_months INTEGER CHECK (validity_months IS NULL OR validity_months > 0),  -- 헬스/필라테스 등만 필수
  days_per_session INTEGER CHECK (days_per_session IS NULL OR days_per_session > 0),  -- PT/PPT만 사용 (1회당 며칠)

  -- 메타 정보
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  -- 타임스탬프
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- 같은 지점 내 동일 상품명 방지
  UNIQUE(gym_id, name)
);

-- 인덱스: 지점별 활성 상품 조회 최적화
CREATE INDEX idx_membership_products_gym_id_active
  ON membership_products(gym_id, is_active, display_order);

-- 인덱스: 회원권 유형별 조회 최적화
CREATE INDEX idx_membership_products_gym_id_type
  ON membership_products(gym_id, membership_type);

-- 인덱스: 상품명 검색 최적화
CREATE INDEX idx_membership_products_gym_id_name
  ON membership_products(gym_id, name);

-- RLS (Row Level Security) 활성화
ALTER TABLE membership_products ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 지점 직원은 자신의 지점 상품 조회 가능
CREATE POLICY "지점 직원은 상품 조회 가능" ON membership_products
  FOR SELECT USING (
    gym_id IN (SELECT gym_id FROM staffs WHERE user_id = auth.uid())
  );

-- RLS 정책: 지점 관리자는 상품 관리 가능 (생성, 수정, 삭제)
CREATE POLICY "지점 관리자는 상품 관리 가능" ON membership_products
  FOR ALL USING (
    gym_id IN (
      SELECT gym_id FROM staffs
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'director', 'system_admin', 'company_admin')
    )
  );

-- 업데이트 시간 자동 갱신 트리거
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

-- 코멘트 추가
COMMENT ON TABLE membership_products IS '회원권 상품 템플릿 - 각 지점에서 판매하는 회원권 상품을 미리 등록';
COMMENT ON COLUMN membership_products.name IS '상품명 (예: PT 30회, 헬스 3개월)';
COMMENT ON COLUMN membership_products.membership_type IS '회원권 유형 (헬스/필라테스/PT/PPT/GX/골프/하이록스/러닝/크로스핏/기타)';
COMMENT ON COLUMN membership_products.default_sessions IS '기본 횟수 (PT/PPT만 사용)';
COMMENT ON COLUMN membership_products.default_price IS '기본 가격';
COMMENT ON COLUMN membership_products.validity_months IS '유효기간(개월) - 헬스/필라테스 등에서 사용, NULL이면 무기한';
COMMENT ON COLUMN membership_products.days_per_session IS '1회당 며칠 (PT/PPT만 사용) - 총 유효일수 = 횟수 × 1회당 며칠';
COMMENT ON COLUMN membership_products.is_active IS '활성 상태 - false면 매출 등록 시 선택 불가';
COMMENT ON COLUMN membership_products.display_order IS '표시 순서 - 낮은 숫자가 먼저 표시됨';
