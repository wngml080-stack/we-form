-- 매출 테이블에 등록자(registrar) 컬럼 추가
-- 수기로 입력하는 등록자 필드

ALTER TABLE member_payments
ADD COLUMN IF NOT EXISTS registrar TEXT DEFAULT '';

-- 인덱스 추가 (검색용)
CREATE INDEX IF NOT EXISTS idx_member_payments_registrar ON member_payments(registrar);

COMMENT ON COLUMN member_payments.registrar IS '등록자 - 매출 등록 시 수기로 입력';
