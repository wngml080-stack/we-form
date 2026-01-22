-- 014: registration_type 체크 제약조건 업데이트
-- "회원 이외" 값 추가

-- 기존 체크 제약조건 삭제
ALTER TABLE member_payments
DROP CONSTRAINT IF EXISTS member_payments_registration_type_check;

-- 새로운 체크 제약조건 추가 (회원 이외 포함)
ALTER TABLE member_payments
ADD CONSTRAINT member_payments_registration_type_check
CHECK (registration_type IN ('신규', '리뉴', '기간변경', '부가상품', '회원 이외'));

-- 컬럼 설명 업데이트
COMMENT ON COLUMN member_payments.registration_type IS '등록 타입: 신규/리뉴/기간변경/부가상품/회원 이외';
