-- =====================================================
-- 018: monthly_schedule_reports RLS 정책 수정
-- system_admin: 모든 보고서 조회/수정
-- company_admin: 자기 회사 보고서 조회/수정
-- admin: 자기 지점 보고서만 조회/수정
-- =====================================================

-- 모든 관련 정책 삭제
DROP POLICY IF EXISTS "관리자는 자기 gym 보고서 조회 가능" ON monthly_schedule_reports;
DROP POLICY IF EXISTS "관리자는 자기 회사 보고서 조회 가능" ON monthly_schedule_reports;
DROP POLICY IF EXISTS "관리자는 자기 gym 보고서 수정 가능" ON monthly_schedule_reports;
DROP POLICY IF EXISTS "관리자는 자기 회사 보고서 수정 가능" ON monthly_schedule_reports;
DROP POLICY IF EXISTS "보고서 조회 정책" ON monthly_schedule_reports;
DROP POLICY IF EXISTS "보고서 수정 정책" ON monthly_schedule_reports;

-- 조회 정책
CREATE POLICY "보고서 조회 정책"
  ON monthly_schedule_reports FOR SELECT
  USING (
    -- system_admin(개발자): 모든 보고서
    EXISTS (
      SELECT 1 FROM staffs
      WHERE user_id = auth.uid() AND role = 'system_admin'
    )
    OR
    -- company_admin(본점): 자기 회사 보고서
    (company_id IN (
      SELECT company_id FROM staffs
      WHERE user_id = auth.uid() AND role = 'company_admin'
    ))
    OR
    -- admin(지점관리자): 자기 지점 보고서만
    (gym_id IN (
      SELECT gym_id FROM staffs
      WHERE user_id = auth.uid() AND role = 'admin'
    ))
  );

-- 수정 정책
CREATE POLICY "보고서 수정 정책"
  ON monthly_schedule_reports FOR UPDATE
  USING (
    -- system_admin(개발자): 모든 보고서
    EXISTS (
      SELECT 1 FROM staffs
      WHERE user_id = auth.uid() AND role = 'system_admin'
    )
    OR
    -- company_admin(본점): 자기 회사 보고서
    (company_id IN (
      SELECT company_id FROM staffs
      WHERE user_id = auth.uid() AND role = 'company_admin'
    ))
    OR
    -- admin(지점관리자): 자기 지점 보고서만
    (gym_id IN (
      SELECT gym_id FROM staffs
      WHERE user_id = auth.uid() AND role = 'admin'
    ))
  );

-- 직원 본인 보고서 수정 정책 (반려 시 재제출용)
DROP POLICY IF EXISTS "직원은 본인 보고서 수정 가능" ON monthly_schedule_reports;

CREATE POLICY "직원은 본인 보고서 수정 가능"
  ON monthly_schedule_reports FOR UPDATE
  USING (
    staff_id IN (SELECT id FROM staffs WHERE user_id = auth.uid())
    AND status IN ('rejected', 'submitted')
  );
