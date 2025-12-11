-- ============================================
-- 기존 스케줄의 schedule_type 업데이트
-- Migration: 20251211010000_update_schedule_types
-- ============================================

-- 함수: 스케줄 타입 분류
CREATE OR REPLACE FUNCTION classify_schedule_type(
  schedule_start TIMESTAMPTZ,
  work_start TIME,
  work_end TIME
) RETURNS VARCHAR(20) AS $$
DECLARE
  schedule_date DATE;
  schedule_time TIME;
  day_of_week INTEGER;
BEGIN
  schedule_date := schedule_start::DATE;
  schedule_time := schedule_start::TIME;
  day_of_week := EXTRACT(DOW FROM schedule_date); -- 0=일요일, 6=토요일

  -- 1. 공휴일 체크 (2025-2026년)
  IF schedule_date IN (
    '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30',
    '2025-03-01', '2025-03-03', '2025-05-05', '2025-06-06',
    '2025-08-15', '2025-09-06', '2025-09-07', '2025-09-08',
    '2025-10-03', '2025-10-09', '2025-12-25',
    '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18',
    '2026-03-01', '2026-05-05', '2026-05-24', '2026-06-06',
    '2026-08-15', '2026-09-24', '2026-09-25', '2026-09-26',
    '2026-10-03', '2026-10-09', '2026-12-25'
  ) THEN
    RETURN 'holiday';
  END IF;

  -- 2. 주말 체크
  IF day_of_week = 0 OR day_of_week = 6 THEN
    RETURN 'weekend';
  END IF;

  -- 3. 근무시간 체크
  IF work_start IS NULL OR work_end IS NULL THEN
    RETURN 'inside'; -- 기본값
  END IF;

  IF schedule_time >= work_start AND schedule_time < work_end THEN
    RETURN 'inside';
  ELSE
    RETURN 'outside';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 기존 스케줄의 schedule_type 업데이트
DO $$
DECLARE
  schedule_record RECORD;
  staff_record RECORD;
  new_type VARCHAR(20);
  updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE '⏳ 스케줄 타입 업데이트 시작...';

  -- 모든 스케줄을 순회
  FOR schedule_record IN
    SELECT id, staff_id, start_time, schedule_type
    FROM schedules
    ORDER BY start_time DESC
  LOOP
    -- 해당 스케줄의 강사 정보 가져오기
    SELECT work_start_time, work_end_time
    INTO staff_record
    FROM staffs
    WHERE id = schedule_record.staff_id;

    -- 새로운 타입 계산
    new_type := classify_schedule_type(
      schedule_record.start_time,
      staff_record.work_start_time,
      staff_record.work_end_time
    );

    -- 업데이트 (변경된 경우만)
    IF schedule_record.schedule_type IS NULL OR schedule_record.schedule_type != new_type THEN
      UPDATE schedules
      SET schedule_type = new_type
      WHERE id = schedule_record.id;

      updated_count := updated_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ 업데이트 완료: % 건의 스케줄이 업데이트되었습니다', updated_count;
END $$;

-- 함수 삭제 (임시 사용)
DROP FUNCTION IF EXISTS classify_schedule_type;

-- 결과 확인
DO $$
DECLARE
  inside_count INTEGER;
  outside_count INTEGER;
  weekend_count INTEGER;
  holiday_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inside_count FROM schedules WHERE schedule_type = 'inside';
  SELECT COUNT(*) INTO outside_count FROM schedules WHERE schedule_type = 'outside';
  SELECT COUNT(*) INTO weekend_count FROM schedules WHERE schedule_type = 'weekend';
  SELECT COUNT(*) INTO holiday_count FROM schedules WHERE schedule_type = 'holiday';

  RAISE NOTICE '📊 스케줄 분류 현황:';
  RAISE NOTICE '  - 근무내: %건', inside_count;
  RAISE NOTICE '  - 근무외: %건', outside_count;
  RAISE NOTICE '  - 주말: %건', weekend_count;
  RAISE NOTICE '  - 공휴일: %건', holiday_count;
END $$;
