-- ============================================
-- 스케줄 제출/승인용 컬럼 및 RLS 보강
-- Migration: 20251211020000_add_schedule_submission_columns
-- ============================================

-- 1) schedules 테이블 컬럼 추가
DO $$
BEGIN
  -- monthly_schedule_reports 연결 (월 단위 제출/승인)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schedules' AND column_name = 'report_id'
  ) THEN
    ALTER TABLE public.schedules
      ADD COLUMN report_id UUID REFERENCES public.monthly_schedule_reports(id) ON DELETE SET NULL;
    RAISE NOTICE 'schedules.report_id 추가됨';
  ELSE
    RAISE NOTICE 'schedules.report_id 이미 존재함';
  END IF;

  -- 제출/승인 후 잠금 플래그
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schedules' AND column_name = 'is_locked'
  ) THEN
    ALTER TABLE public.schedules
      ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT FALSE;
    RAISE NOTICE 'schedules.is_locked 추가됨';
  ELSE
    RAISE NOTICE 'schedules.is_locked 이미 존재함';
  END IF;
END $$;

-- 2) 인덱스
CREATE INDEX IF NOT EXISTS idx_schedules_report_id ON public.schedules(report_id);
CREATE INDEX IF NOT EXISTS idx_schedules_is_locked ON public.schedules(is_locked);

-- 3) 코멘트
COMMENT ON COLUMN public.schedules.report_id IS '월 단위 제출/승인 보고서 연결 (monthly_schedule_reports.id)';
COMMENT ON COLUMN public.schedules.is_locked IS '제출/승인 후 잠금 상태. true면 직원 수정/삭제 불가, 관리자만 가능';

-- 4) RLS 정책 재정의 (제출/잠금 반영)
-- 기존 정책 제거
DROP POLICY IF EXISTS "schedules_select" ON public.schedules;
DROP POLICY IF EXISTS "schedules_insert" ON public.schedules;
DROP POLICY IF EXISTS "schedules_update" ON public.schedules;
DROP POLICY IF EXISTS "schedules_delete" ON public.schedules;

-- SELECT: 같은 지점 직원이면 조회 가능 (퇴사 제외)
CREATE POLICY "schedules_select"
ON public.schedules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.gym_id = schedules.gym_id
      AND s.employment_status <> '퇴사'
  )
);

-- INSERT: 같은 지점 직원/관리자만. staff는 자신의 일정만 등록 가능.
CREATE POLICY "schedules_insert"
ON public.schedules
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.gym_id = schedules.gym_id
      AND s.employment_status <> '퇴사'
      AND (
        s.role IN ('system_admin', 'company_admin', 'admin')
        OR (s.role = 'staff' AND schedules.staff_id = s.id)
      )
  )
);

-- UPDATE: 
-- - staff: 본인 일정 + 잠금 해제(is_locked = false)일 때만
-- - 관리자: 같은 지점이면 잠금 여부와 무관하게 가능
CREATE POLICY "schedules_update"
ON public.schedules
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
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
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.gym_id = schedules.gym_id
      AND s.employment_status <> '퇴사'
      AND (
        s.role IN ('system_admin', 'company_admin', 'admin')
        OR (s.role = 'staff' AND schedules.staff_id = s.id AND schedules.is_locked = FALSE)
      )
  )
);

-- DELETE:
-- - staff: 본인 일정 + 잠금 해제(is_locked = false)일 때만 삭제 가능
-- - 관리자: 같은 지점이면 잠금 여부와 무관하게 가능
CREATE POLICY "schedules_delete"
ON public.schedules
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.gym_id = schedules.gym_id
      AND s.employment_status <> '퇴사'
      AND (
        s.role IN ('system_admin', 'company_admin', 'admin')
        OR (s.role = 'staff' AND schedules.staff_id = s.id AND schedules.is_locked = FALSE)
      )
  )
);

-- 참고: SELECT/INSERT/UPDATE/DELETE 분리 정책 사용. 기존 WITH CHECK 없는 ALL 정책을 역할/잠금 조건으로 재구성.

