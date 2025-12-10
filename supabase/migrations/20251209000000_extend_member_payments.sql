-- =====================================================
-- 매출 관리 확장: member_payments 테이블 컬럼 추가
-- =====================================================
-- 작성일: 2025-12-09
-- 설명: 회원권 유형, 등록 타입, 방문루트, 분할결제 정보 추가

-- 1. 회원권 유형 추가
ALTER TABLE member_payments
ADD COLUMN IF NOT EXISTS membership_type TEXT
CHECK (membership_type IN ('헬스', '필라테스', 'PT', 'PPT', 'GPT', '골프', 'GX'));

COMMENT ON COLUMN member_payments.membership_type IS '회원권 유형: 헬스/필라테스/PT/PPT/GPT/골프/GX';

-- 2. 등록 타입 추가
ALTER TABLE member_payments
ADD COLUMN IF NOT EXISTS registration_type TEXT
CHECK (registration_type IN ('신규', '리뉴', '기간변경', '부가상품'));

COMMENT ON COLUMN member_payments.registration_type IS '등록 타입: 신규/리뉴/기간변경/부가상품';

-- 3. 방문루트 추가
ALTER TABLE member_payments
ADD COLUMN IF NOT EXISTS visit_route TEXT;

COMMENT ON COLUMN member_payments.visit_route IS '회원 유입 경로 (예: 인터넷 검색, 지인 추천, 전단지 등)';

-- 4. 분할 결제 정보 추가
ALTER TABLE member_payments
ADD COLUMN IF NOT EXISTS installment_count INTEGER DEFAULT 1;

COMMENT ON COLUMN member_payments.installment_count IS '분할 결제 총 횟수';

ALTER TABLE member_payments
ADD COLUMN IF NOT EXISTS installment_current INTEGER DEFAULT 1;

COMMENT ON COLUMN member_payments.installment_current IS '현재 분할 결제 회차';

ALTER TABLE member_payments
ADD COLUMN IF NOT EXISTS total_amount NUMERIC;

COMMENT ON COLUMN member_payments.total_amount IS '분할 결제 시 전체 금액 (amount는 회차별 금액)';

-- 5. 기존 데이터에 대한 기본값 설정
-- 기존 데이터의 total_amount를 amount와 동일하게 설정
UPDATE member_payments
SET total_amount = amount
WHERE total_amount IS NULL;

-- 6. 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_member_payments_membership_type ON member_payments(membership_type);
CREATE INDEX IF NOT EXISTS idx_member_payments_registration_type ON member_payments(registration_type);
CREATE INDEX IF NOT EXISTS idx_member_payments_visit_route ON member_payments(visit_route);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ member_payments 테이블 확장 완료';
  RAISE NOTICE '   - membership_type (회원권 유형) 추가';
  RAISE NOTICE '   - registration_type (등록 타입) 추가';
  RAISE NOTICE '   - visit_route (방문루트) 추가';
  RAISE NOTICE '   - installment_count, installment_current, total_amount (분할결제) 추가';
END $$;
