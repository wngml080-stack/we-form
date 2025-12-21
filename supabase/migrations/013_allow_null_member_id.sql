-- member_payments 테이블의 member_id NULL 허용
-- 회원 이외 (비회원) 결제를 위해 member_id를 NULL로 허용합니다

ALTER TABLE member_payments ALTER COLUMN member_id DROP NOT NULL;

COMMENT ON COLUMN member_payments.member_id IS '회원 ID (NULL 허용 - 회원 이외 결제 지원)';
