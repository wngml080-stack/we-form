-- ============================================
-- 회원권에 서비스 세션 필드 추가
-- ============================================
-- service_sessions: 서비스(보너스) 세션 총 횟수
-- used_service_sessions: 사용된 서비스 세션 횟수

-- member_memberships 테이블에 서비스 세션 컬럼 추가
ALTER TABLE member_memberships
ADD COLUMN IF NOT EXISTS service_sessions INTEGER DEFAULT 0;

ALTER TABLE member_memberships
ADD COLUMN IF NOT EXISTS used_service_sessions INTEGER DEFAULT 0;

COMMENT ON COLUMN member_memberships.service_sessions IS '서비스(보너스) 세션 총 횟수';
COMMENT ON COLUMN member_memberships.used_service_sessions IS '사용된 서비스 세션 횟수';

-- member_payments 테이블에도 bonus_sessions 컬럼 추가 (서비스 세션 기록용)
ALTER TABLE member_payments
ADD COLUMN IF NOT EXISTS bonus_sessions INTEGER DEFAULT 0;

COMMENT ON COLUMN member_payments.bonus_sessions IS '서비스(보너스) 세션 횟수';
