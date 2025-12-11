-- ============================================
-- 중복 스케줄 삭제
-- Migration: 20251211000000_remove_duplicate_schedules
-- ============================================

-- 중복 스케줄 확인 (삭제 전 확인용)
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO duplicate_count
  FROM (
    SELECT s2.id
    FROM schedules s1
    JOIN schedules s2 ON
      s1.staff_id = s2.staff_id
      AND s1.gym_id = s2.gym_id
      AND s1.id < s2.id  -- 중복 방지: ID가 작은 것을 유지
      AND s1.start_time < s2.end_time  -- 시간 겹침 체크
      AND s2.start_time < s1.end_time
  ) AS duplicates;

  RAISE NOTICE '중복 스케줄 개수: %', duplicate_count;
END $$;

-- 중복 스케줄 삭제 (ID가 큰 것을 삭제, 작은 것 유지)
DELETE FROM schedules
WHERE id IN (
  SELECT s2.id
  FROM schedules s1
  JOIN schedules s2 ON
    s1.staff_id = s2.staff_id
    AND s1.gym_id = s2.gym_id
    AND s1.id < s2.id  -- ID가 작은 것을 유지
    AND s1.start_time < s2.end_time  -- 시간 겹침 체크
    AND s2.start_time < s1.end_time
);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 중복 스케줄 삭제 완료!';
END $$;
