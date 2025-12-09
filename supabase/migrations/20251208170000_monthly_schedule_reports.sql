-- ============================================
-- 월별 스케줄 마감 및 승인 시스템
-- Migration: 20251208170000_monthly_schedule_reports
-- ============================================

-- 중복 실행 방지
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM migration_history
    WHERE migration_name = '20251208170000_monthly_schedule_reports'
  ) THEN
    RAISE EXCEPTION '이 마이그레이션은 이미 실행되었습니다.';
  END IF;
END $$;

-- ============================================
-- 1. 월별 스케줄 보고서 (직원이 제출, 관리자가 승인)
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
  reviewed_by UUID REFERENCES staffs(id) ON DELETE SET NULL, -- 승인/반려한 관리자

  -- 메모
  staff_memo TEXT, -- 직원이 작성한 메모
  admin_memo TEXT, -- 관리자가 작성한 메모

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

-- ============================================
-- 2. RLS 정책
-- ============================================

ALTER TABLE monthly_schedule_reports ENABLE ROW LEVEL SECURITY;

-- 직원: 본인 것만 조회/생성
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

-- 관리자: 자기 gym의 보고서 조회/수정
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
-- 마이그레이션 완료 기록
-- ============================================

SELECT execute_migration(
  '20251208170000_monthly_schedule_reports',
  NULL,
  '월별 스케줄 보고서 테이블 생성 (직원 제출 → 관리자 승인 시스템)'
);
