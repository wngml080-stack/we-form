-- ============================================
-- 지점 설정 (BEP, staffs company_id)
-- ============================================
-- 통합: add_gym_bep, add_company_id_to_staffs

-- ============================================
-- PART 1: 지점별 BEP(손익분기점) 설정
-- ============================================

-- FC BEP 추가
ALTER TABLE gyms
ADD COLUMN IF NOT EXISTS fc_bep NUMERIC(12, 2) DEFAULT 75000000;

COMMENT ON COLUMN gyms.fc_bep IS 'FC(회원권) 손익분기점 목표 금액';

-- PT BEP 추가
ALTER TABLE gyms
ADD COLUMN IF NOT EXISTS pt_bep NUMERIC(12, 2) DEFAULT 100000000;

COMMENT ON COLUMN gyms.pt_bep IS 'PT 손익분기점 목표 금액';


-- ============================================
-- PART 2: staffs 테이블에 company_id 추가
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'staffs' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE staffs ADD COLUMN company_id UUID REFERENCES companies(id);
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
