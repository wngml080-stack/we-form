-- =====================================================
-- staffs 테이블에 company_id 추가
-- =====================================================
-- 작성일: 2025-12-18
-- 설명: staffs 테이블에 company_id 컬럼 추가 (이미 있을 수 있음)

-- company_id 컬럼 추가 (이미 있으면 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'staffs' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE staffs ADD COLUMN company_id UUID REFERENCES companies(id);
    RAISE NOTICE 'staffs.company_id 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'staffs.company_id 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- company_id가 NULL인 레코드를 gym의 company_id로 채우기
UPDATE staffs
SET company_id = gyms.company_id
FROM gyms
WHERE staffs.gym_id = gyms.id
  AND staffs.company_id IS NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_staffs_company_id ON staffs(company_id);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ staffs 테이블 company_id 설정 완료';
END $$;
