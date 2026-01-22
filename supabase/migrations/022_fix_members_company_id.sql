-- ============================================
-- 회원 테이블 company_id 수정
-- ============================================
-- 기존 회원들 중 company_id가 없는 레코드를
-- gym의 company_id로 업데이트

-- 1. 기존 회원들의 company_id를 gym 테이블에서 가져와서 업데이트
UPDATE members m
SET company_id = g.company_id
FROM gyms g
WHERE m.gym_id = g.id
  AND m.company_id IS NULL;

-- 2. company_id가 설정된 회원 수 확인 (로그용)
DO $$
DECLARE
  updated_count INTEGER;
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count FROM members WHERE company_id IS NOT NULL;
  SELECT COUNT(*) INTO null_count FROM members WHERE company_id IS NULL;

  RAISE NOTICE 'Members with company_id: %, Members without company_id: %', updated_count, null_count;
END $$;

-- 3. 향후 members 테이블에 company_id NOT NULL 제약 추가 고려
-- 현재는 기존 데이터 호환성을 위해 NULL 허용 유지
COMMENT ON COLUMN members.company_id IS 'RLS 정책에 필수 - gym의 company_id와 동일해야 함';
