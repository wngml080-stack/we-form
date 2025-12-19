-- ============================================
-- 스케줄 서브타입 컬럼 추가
-- ============================================
-- 상담 분류: sales, info, status, other
-- 개인일정 분류: lunch, meeting, rest, workout, other

DO $$
BEGIN
  -- sub_type 컬럼 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schedules' AND column_name = 'sub_type'
  ) THEN
    ALTER TABLE public.schedules
      ADD COLUMN sub_type VARCHAR(50);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_schedules_sub_type ON public.schedules(sub_type);

COMMENT ON COLUMN public.schedules.sub_type IS '스케줄 세부 분류 (상담: sales/info/status/other, 개인: lunch/meeting/rest/workout/other)';
