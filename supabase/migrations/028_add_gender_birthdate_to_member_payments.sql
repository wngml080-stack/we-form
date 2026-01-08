-- member_payments 테이블에 gender, birth_date 컬럼 추가
-- 회원명, 전화번호처럼 매출 테이블에 직접 저장

ALTER TABLE member_payments ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE member_payments ADD COLUMN IF NOT EXISTS birth_date TEXT;

COMMENT ON COLUMN member_payments.gender IS '성별 (male/female)';
COMMENT ON COLUMN member_payments.birth_date IS '생년월일';

-- 스키마 캐시 리프레시
NOTIFY pgrst, 'reload schema';
