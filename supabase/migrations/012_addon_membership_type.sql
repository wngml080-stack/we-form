-- member_payments 테이블의 membership_type 체크 제약조건 제거
-- 커스텀 회원권 유형을 자유롭게 추가할 수 있도록 제약조건을 삭제합니다

-- 기존 체크 제약조건 삭제 (더 이상 고정된 목록으로 제한하지 않음)
ALTER TABLE member_payments DROP CONSTRAINT IF EXISTS member_payments_membership_type_check;

COMMENT ON COLUMN member_payments.membership_type IS '회원권 유형 (제한 없음 - 커스텀 유형 지원)';
