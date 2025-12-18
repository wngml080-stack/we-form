-- =====================================================
-- 지점별 BEP(손익분기점) 설정 추가
-- =====================================================
-- 작성일: 2025-12-18
-- 설명: 각 지점의 FC와 PT BEP를 관리할 수 있도록 컬럼 추가

-- FC BEP 추가
ALTER TABLE gyms
ADD COLUMN IF NOT EXISTS fc_bep NUMERIC(12, 2) DEFAULT 75000000;

COMMENT ON COLUMN gyms.fc_bep IS 'FC(회원권) 손익분기점 목표 금액';

-- PT BEP 추가
ALTER TABLE gyms
ADD COLUMN IF NOT EXISTS pt_bep NUMERIC(12, 2) DEFAULT 100000000;

COMMENT ON COLUMN gyms.pt_bep IS 'PT 손익분기점 목표 금액';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ gyms 테이블에 BEP 컬럼 추가 완료';
  RAISE NOTICE '   - fc_bep (FC 손익분기점) 추가 (기본값: 75,000,000)';
  RAISE NOTICE '   - pt_bep (PT 손익분기점) 추가 (기본값: 100,000,000)';
END $$;
