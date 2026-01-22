-- ============================================
-- 스케줄 시스템 (리포트, 타입, 제출/승인)
-- ============================================
-- 통합: monthly_schedule_reports, remove_duplicate_schedules, update_schedule_types, add_schedule_submission_columns

-- ============================================
-- PART 1: 월별 스케줄 보고서 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS monthly_schedule_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staffs(id) ON DELETE CASCADE,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  year_month VARCHAR(7) NOT NULL, -- 'YYYY-MM' 형식

  -- 통계 데이터 (제출 시점의 스냅샷)
  stats JSONB NOT NULL DEFAULT '{}',

  -- 상태 관리
  status VARCHAR(20) NOT NULL DEFAULT 'submitted', -- submitted, approved, rejected
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES staffs(id) ON DELETE SET NULL,

  -- 메모
  staff_memo TEXT,
  admin_memo TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(staff_id, year_month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_reports_staff_month ON monthly_schedule_reports(staff_id, year_month);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_gym_month ON monthly_schedule_reports(gym_id, year_month);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_status ON monthly_schedule_reports(status);

COMMENT ON TABLE monthly_schedule_reports IS '월별 스케줄 보고서 (직원 제출 → 관리자 승인)';
COMMENT ON COLUMN monthly_schedule_reports.status IS 'submitted: 제출됨, approved: 승인됨, rejected: 반려됨';
COMMENT ON COLUMN monthly_schedule_reports.stats IS 'PT/OT 횟수, 출석/노쇼 등 통계 JSON';

-- RLS 정책
ALTER TABLE monthly_schedule_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "직원은 본인 보고서 조회 가능"
  ON monthly_schedule_reports FOR SELECT
  USING (
    staff_id IN (SELECT id FROM staffs WHERE user_id = auth.uid())
  );

CREATE POLICY "직원은 본인 보고서 생성 가능"
  ON monthly_schedule_reports FOR INSERT
  WITH CHECK (
    staff_id IN (SELECT id FROM staffs WHERE user_id = auth.uid())
  );

CREATE POLICY "관리자는 자기 gym 보고서 조회 가능"
  ON monthly_schedule_reports FOR SELECT
  USING (
    gym_id IN (
      SELECT gym_id FROM staffs
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'company_admin', 'system_admin')
    )
  );

CREATE POLICY "관리자는 자기 gym 보고서 수정 가능"
  ON monthly_schedule_reports FOR UPDATE
  USING (
    gym_id IN (
      SELECT gym_id FROM staffs
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'company_admin', 'system_admin')
    )
  );


-- ============================================
-- PART 2: 중복 스케줄 삭제
-- ============================================

-- 중복 스케줄 삭제 (ID가 큰 것을 삭제, 작은 것 유지)
DELETE FROM schedules
WHERE id IN (
  SELECT s2.id
  FROM schedules s1
  JOIN schedules s2 ON
    s1.staff_id = s2.staff_id
    AND s1.gym_id = s2.gym_id
    AND s1.id < s2.id
    AND s1.start_time < s2.end_time
    AND s2.start_time < s1.end_time
);


-- ============================================
-- PART 3: 스케줄 타입 분류 및 업데이트
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
  day_of_week := EXTRACT(DOW FROM schedule_date);

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
    RETURN 'inside';
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
BEGIN
  FOR schedule_record IN
    SELECT id, staff_id, start_time, schedule_type
    FROM schedules
    ORDER BY start_time DESC
  LOOP
    SELECT work_start_time, work_end_time
    INTO staff_record
    FROM staffs
    WHERE id = schedule_record.staff_id;

    new_type := classify_schedule_type(
      schedule_record.start_time,
      staff_record.work_start_time,
      staff_record.work_end_time
    );

    IF schedule_record.schedule_type IS NULL OR schedule_record.schedule_type != new_type THEN
      UPDATE schedules
      SET schedule_type = new_type
      WHERE id = schedule_record.id;
    END IF;
  END LOOP;
END $$;

-- 함수 삭제 (임시 사용)
DROP FUNCTION IF EXISTS classify_schedule_type;


-- ============================================
-- PART 4: 스케줄 제출/승인용 컬럼 추가
-- ============================================

DO $$
BEGIN
  -- report_id 컬럼 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schedules' AND column_name = 'report_id'
  ) THEN
    ALTER TABLE public.schedules
      ADD COLUMN report_id UUID REFERENCES public.monthly_schedule_reports(id) ON DELETE SET NULL;
  END IF;

  -- is_locked 컬럼 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schedules' AND column_name = 'is_locked'
  ) THEN
    ALTER TABLE public.schedules
      ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_schedules_report_id ON public.schedules(report_id);
CREATE INDEX IF NOT EXISTS idx_schedules_is_locked ON public.schedules(is_locked);

COMMENT ON COLUMN public.schedules.report_id IS '월 단위 제출/승인 보고서 연결';
COMMENT ON COLUMN public.schedules.is_locked IS '제출/승인 후 잠금 상태';


-- ============================================
-- PART 5: RLS 정책 재정의
-- ============================================

DROP POLICY IF EXISTS "schedules_select" ON public.schedules;
DROP POLICY IF EXISTS "schedules_insert" ON public.schedules;
DROP POLICY IF EXISTS "schedules_update" ON public.schedules;
DROP POLICY IF EXISTS "schedules_delete" ON public.schedules;

-- SELECT: 같은 지점 직원이면 조회 가능
CREATE POLICY "schedules_select"
ON public.schedules FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.gym_id = schedules.gym_id
      AND s.employment_status <> '퇴사'
  )
);

-- INSERT: 같은 지점 직원/관리자만
CREATE POLICY "schedules_insert"
ON public.schedules FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.gym_id = schedules.gym_id
      AND s.employment_status <> '퇴사'
      AND (
        s.role IN ('system_admin', 'company_admin', 'admin')
        OR (s.role = 'staff' AND schedules.staff_id = s.id)
      )
  )
);

-- UPDATE: staff는 본인 일정 + 잠금 해제일 때만, 관리자는 무관
CREATE POLICY "schedules_update"
ON public.schedules FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.gym_id = schedules.gym_id
      AND s.employment_status <> '퇴사'
      AND (
        s.role IN ('system_admin', 'company_admin', 'admin')
        OR (s.role = 'staff' AND schedules.staff_id = s.id AND schedules.is_locked = FALSE)
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.gym_id = schedules.gym_id
      AND s.employment_status <> '퇴사'
      AND (
        s.role IN ('system_admin', 'company_admin', 'admin')
        OR (s.role = 'staff' AND schedules.staff_id = s.id AND schedules.is_locked = FALSE)
      )
  )
);

-- DELETE: staff는 본인 일정 + 잠금 해제일 때만 삭제 가능
CREATE POLICY "schedules_delete"
ON public.schedules FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.gym_id = schedules.gym_id
      AND s.employment_status <> '퇴사'
      AND (
        s.role IN ('system_admin', 'company_admin', 'admin')
        OR (s.role = 'staff' AND schedules.staff_id = s.id AND schedules.is_locked = FALSE)
      )
  )
);
