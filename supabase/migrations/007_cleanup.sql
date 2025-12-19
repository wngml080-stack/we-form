-- ============================================
-- 미사용 테이블 정리
-- ============================================
-- 설명: 코드에서 사용되지 않는 테이블들 삭제
--       - inbody_records: 인바디 측정 (기능 미구현)
--       - fc_level_assignments: FC 레벨 (템플릿 시스템으로 대체)
--       - calculation_rules: 구버전 계산 규칙 (salary_rules로 대체)
--       - job_positions: 직무 정의 (staffs.job_title로 대체)
--       - salary_variables: 급여 변수 (직접 계산으로 대체)

-- ============================================
-- 1. inbody_records 삭제
-- ============================================
DROP INDEX IF EXISTS idx_inbody_staff_measured;
DROP POLICY IF EXISTS "Enable all for gym members" ON inbody_records;
DROP TABLE IF EXISTS inbody_records;

-- ============================================
-- 2. fc_level_assignments 삭제
-- ============================================
DROP POLICY IF EXISTS "Enable all for admins" ON fc_level_assignments;
DROP TABLE IF EXISTS fc_level_assignments;

-- ============================================
-- 3. calculation_rules 삭제
-- ============================================
DROP POLICY IF EXISTS "Enable all for admins" ON calculation_rules;
DROP TABLE IF EXISTS calculation_rules;

-- ============================================
-- 4. job_positions 삭제
-- ============================================
DROP POLICY IF EXISTS "Enable all for admins" ON job_positions;
DROP TABLE IF EXISTS job_positions;

-- ============================================
-- 5. salary_variables 삭제
-- ============================================
DROP POLICY IF EXISTS "Enable all for admins" ON salary_variables;
DROP TABLE IF EXISTS salary_variables;
