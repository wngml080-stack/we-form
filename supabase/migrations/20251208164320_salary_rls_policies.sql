-- ============================================
-- 급여 시스템 RLS 정책
-- Migration: 20251208164320_salary_rls_policies
-- ============================================

-- 중복 실행 방지
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM migration_history
    WHERE migration_name = '20251208164320_salary_rls_policies'
  ) THEN
    RAISE EXCEPTION '이 마이그레이션은 이미 실행되었습니다.';
  END IF;
END $$;

-- ============================================
-- 1. job_positions RLS
-- ============================================

ALTER TABLE job_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for admins" ON job_positions;
CREATE POLICY "Enable all for admins" ON job_positions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM staffs
    WHERE user_id = auth.uid()
    AND gym_id = job_positions.gym_id
    AND role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staffs
    WHERE user_id = auth.uid()
    AND gym_id = job_positions.gym_id
    AND role IN ('admin', 'manager')
  )
);

-- ============================================
-- 2. salary_variables RLS
-- ============================================

ALTER TABLE salary_variables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for admins" ON salary_variables;
CREATE POLICY "Enable all for admins" ON salary_variables FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM staffs
    WHERE user_id = auth.uid()
    AND gym_id = salary_variables.gym_id
    AND role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staffs
    WHERE user_id = auth.uid()
    AND gym_id = salary_variables.gym_id
    AND role IN ('admin', 'manager')
  )
);

-- ============================================
-- 3. salary_components RLS
-- ============================================

ALTER TABLE salary_components ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for admins" ON salary_components;
CREATE POLICY "Enable all for admins" ON salary_components FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM staffs
    WHERE user_id = auth.uid()
    AND gym_id = salary_components.gym_id
    AND role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staffs
    WHERE user_id = auth.uid()
    AND gym_id = salary_components.gym_id
    AND role IN ('admin', 'manager')
  )
);

-- ============================================
-- 4. calculation_rules RLS
-- ============================================

ALTER TABLE calculation_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for admins" ON calculation_rules;
CREATE POLICY "Enable all for admins" ON calculation_rules FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM salary_components sc
    JOIN staffs s ON s.gym_id = sc.gym_id
    WHERE sc.id = calculation_rules.component_id
    AND s.user_id = auth.uid()
    AND s.role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM salary_components sc
    JOIN staffs s ON s.gym_id = sc.gym_id
    WHERE sc.id = calculation_rules.component_id
    AND s.user_id = auth.uid()
    AND s.role IN ('admin', 'manager')
  )
);

-- ============================================
-- 5. monthly_performance RLS
-- ============================================

ALTER TABLE monthly_performance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for own data and admins" ON monthly_performance;
CREATE POLICY "Enable read for own data and admins" ON monthly_performance FOR SELECT
USING (
  staff_id IN (SELECT id FROM staffs WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM staffs s1
    JOIN staffs s2 ON s1.gym_id = s2.gym_id
    WHERE s1.user_id = auth.uid()
    AND s2.id = monthly_performance.staff_id
    AND s1.role IN ('admin', 'manager')
  )
);

DROP POLICY IF EXISTS "Enable write for admins" ON monthly_performance;
CREATE POLICY "Enable write for admins" ON monthly_performance FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staffs s1
    JOIN staffs s2 ON s1.gym_id = s2.gym_id
    WHERE s1.user_id = auth.uid()
    AND s2.id = monthly_performance.staff_id
    AND s1.role IN ('admin', 'manager')
  )
);

DROP POLICY IF EXISTS "Enable update for admins" ON monthly_performance;
CREATE POLICY "Enable update for admins" ON monthly_performance FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM staffs s1
    JOIN staffs s2 ON s1.gym_id = s2.gym_id
    WHERE s1.user_id = auth.uid()
    AND s2.id = monthly_performance.staff_id
    AND s1.role IN ('admin', 'manager')
  )
);

-- ============================================
-- 6. calculated_salaries RLS
-- ============================================

ALTER TABLE calculated_salaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for own data and admins" ON calculated_salaries;
CREATE POLICY "Enable read for own data and admins" ON calculated_salaries FOR SELECT
USING (
  staff_id IN (SELECT id FROM staffs WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM staffs s1
    JOIN staffs s2 ON s1.gym_id = s2.gym_id
    WHERE s1.user_id = auth.uid()
    AND s2.id = calculated_salaries.staff_id
    AND s1.role IN ('admin', 'manager')
  )
);

DROP POLICY IF EXISTS "Enable write for admins" ON calculated_salaries;
CREATE POLICY "Enable write for admins" ON calculated_salaries FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM staffs s1
    JOIN staffs s2 ON s1.gym_id = s2.gym_id
    WHERE s1.user_id = auth.uid()
    AND s2.id = calculated_salaries.staff_id
    AND s1.role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staffs s1
    JOIN staffs s2 ON s1.gym_id = s2.gym_id
    WHERE s1.user_id = auth.uid()
    AND s2.id = calculated_salaries.staff_id
    AND s1.role IN ('admin', 'manager')
  )
);

-- ============================================
-- 7. inbody_records RLS
-- ============================================

ALTER TABLE inbody_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for gym members" ON inbody_records;
CREATE POLICY "Enable all for gym members" ON inbody_records FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM staffs s1
    JOIN staffs s2 ON s1.gym_id = s2.gym_id
    WHERE s1.user_id = auth.uid()
    AND s2.id = inbody_records.staff_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staffs s1
    JOIN staffs s2 ON s1.gym_id = s2.gym_id
    WHERE s1.user_id = auth.uid()
    AND s2.id = inbody_records.staff_id
  )
);

-- ============================================
-- 8. fc_level_assignments RLS
-- ============================================

ALTER TABLE fc_level_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for admins" ON fc_level_assignments;
CREATE POLICY "Enable all for admins" ON fc_level_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM staffs s1
    JOIN staffs s2 ON s1.gym_id = s2.gym_id
    WHERE s1.user_id = auth.uid()
    AND s2.id = fc_level_assignments.staff_id
    AND s1.role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staffs s1
    JOIN staffs s2 ON s1.gym_id = s2.gym_id
    WHERE s1.user_id = auth.uid()
    AND s2.id = fc_level_assignments.staff_id
    AND s1.role IN ('admin', 'manager')
  )
);

-- ============================================
-- 마이그레이션 완료 기록
-- ============================================

SELECT execute_migration(
  '20251208164320_salary_rls_policies',
  NULL,
  'RLS 정책 적용: 8개 테이블'
);
