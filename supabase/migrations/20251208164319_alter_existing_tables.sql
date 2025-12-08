-- ============================================
-- 기존 테이블 수정
-- Migration: 20251208164319_alter_existing_tables
-- ============================================

-- 중복 실행 방지
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM migration_history
    WHERE migration_name = '20251208164319_alter_existing_tables'
  ) THEN
    RAISE EXCEPTION '이 마이그레이션은 이미 실행되었습니다.';
  END IF;
END $$;

-- ============================================
-- 1. staffs 테이블 수정
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'staffs' AND column_name = 'work_start_time'
  ) THEN
    ALTER TABLE staffs ADD COLUMN work_start_time TIME;
    RAISE NOTICE 'staffs.work_start_time 추가됨';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'staffs' AND column_name = 'work_end_time'
  ) THEN
    ALTER TABLE staffs ADD COLUMN work_end_time TIME;
    RAISE NOTICE 'staffs.work_end_time 추가됨';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'staffs' AND column_name = 'job_position_code'
  ) THEN
    ALTER TABLE staffs ADD COLUMN job_position_code VARCHAR(50);
    RAISE NOTICE 'staffs.job_position_code 추가됨';
  END IF;
END $$;

COMMENT ON COLUMN staffs.work_start_time IS '근무 시작 시간 (예: 06:00)';
COMMENT ON COLUMN staffs.work_end_time IS '근무 종료 시간 (예: 15:00)';
COMMENT ON COLUMN staffs.job_position_code IS '직무 코드';

-- ============================================
-- 2. schedules 테이블 수정 (존재하는 경우)
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'schedules'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'schedules' AND column_name = 'schedule_type'
    ) THEN
      ALTER TABLE schedules ADD COLUMN schedule_type VARCHAR(20);
      RAISE NOTICE 'schedules.schedule_type 추가됨';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'schedules' AND column_name = 'counted_for_salary'
    ) THEN
      ALTER TABLE schedules ADD COLUMN counted_for_salary BOOLEAN DEFAULT true;
      RAISE NOTICE 'schedules.counted_for_salary 추가됨';
    END IF;

    EXECUTE 'COMMENT ON COLUMN schedules.schedule_type IS ''스케줄 유형: inside, outside, weekend, holiday''';
    EXECUTE 'COMMENT ON COLUMN schedules.counted_for_salary IS ''급여 계산 포함 여부''';
  ELSE
    RAISE NOTICE 'schedules 테이블이 존재하지 않습니다. 건너뜁니다.';
  END IF;
END $$;

-- ============================================
-- 3. member_registrations 테이블 수정 (존재하는 경우)
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'member_registrations'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'member_registrations' AND column_name = 'registration_type'
    ) THEN
      ALTER TABLE member_registrations ADD COLUMN registration_type VARCHAR(20);
      RAISE NOTICE 'member_registrations.registration_type 추가됨';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'member_registrations' AND column_name = 'amount_excl_vat'
    ) THEN
      ALTER TABLE member_registrations ADD COLUMN amount_excl_vat NUMERIC(12, 2);
      RAISE NOTICE 'member_registrations.amount_excl_vat 추가됨';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'member_registrations' AND column_name = 'sales_staff_id'
    ) THEN
      ALTER TABLE member_registrations ADD COLUMN sales_staff_id UUID REFERENCES staffs(id);
      RAISE NOTICE 'member_registrations.sales_staff_id 추가됨';
    END IF;

    EXECUTE 'COMMENT ON COLUMN member_registrations.registration_type IS ''등록 유형: new, renewal, extension''';
    EXECUTE 'COMMENT ON COLUMN member_registrations.amount_excl_vat IS ''부가세 제외 금액''';
    EXECUTE 'COMMENT ON COLUMN member_registrations.sales_staff_id IS ''판매 담당 직원''';
  ELSE
    RAISE NOTICE 'member_registrations 테이블이 존재하지 않습니다. 건너뜁니다.';
  END IF;
END $$;

-- ============================================
-- 마이그레이션 완료 기록
-- ============================================

SELECT execute_migration(
  '20251208164319_alter_existing_tables',
  NULL,
  '기존 테이블 수정: staffs, schedules, member_registrations'
);
