-- ============================================
-- 마이그레이션 추적 시스템
-- 이 파일을 가장 먼저 실행하세요
-- ============================================

-- 마이그레이션 이력 테이블 생성
CREATE TABLE IF NOT EXISTS migration_history (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMP DEFAULT NOW(),
  checksum VARCHAR(64), -- 파일 변경 감지용
  notes TEXT
);

COMMENT ON TABLE migration_history IS '마이그레이션 실행 이력 추적';

-- 마이그레이션 실행 함수
CREATE OR REPLACE FUNCTION execute_migration(
  p_migration_name VARCHAR,
  p_checksum VARCHAR DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_already_executed BOOLEAN;
BEGIN
  -- 이미 실행되었는지 확인
  SELECT EXISTS(
    SELECT 1 FROM migration_history
    WHERE migration_name = p_migration_name
  ) INTO v_already_executed;

  IF v_already_executed THEN
    RAISE NOTICE '마이그레이션 [%]는 이미 실행되었습니다. 건너뜁니다.', p_migration_name;
    RETURN FALSE;
  ELSE
    -- 실행 기록 저장
    INSERT INTO migration_history (migration_name, checksum, notes)
    VALUES (p_migration_name, p_checksum, p_notes);

    RAISE NOTICE '마이그레이션 [%] 실행 완료', p_migration_name;
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 실행된 마이그레이션 목록 조회 뷰
CREATE OR REPLACE VIEW executed_migrations AS
SELECT
  migration_name,
  executed_at,
  notes
FROM migration_history
ORDER BY id;

COMMENT ON VIEW executed_migrations IS '실행된 마이그레이션 목록';

-- 초기 기록
SELECT execute_migration('00_migration_tracker', NULL, '마이그레이션 추적 시스템 초기화');
