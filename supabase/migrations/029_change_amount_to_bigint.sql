-- amount 컬럼을 bigint로 변경 (큰 금액 지원)
-- PostgreSQL integer 최대값: 2,147,483,647 (약 21억)
-- PostgreSQL bigint 최대값: 9,223,372,036,854,775,807 (약 922경)

-- member_payments 테이블
ALTER TABLE member_payments
ALTER COLUMN amount TYPE BIGINT;

-- member_memberships 테이블
ALTER TABLE member_memberships
ALTER COLUMN amount TYPE BIGINT;

-- 스키마 캐시 리프레시
NOTIFY pgrst, 'reload schema';
