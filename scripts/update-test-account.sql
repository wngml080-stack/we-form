-- ============================================
-- 테스트 계정을 We:form 본사에 연결
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 1. 먼저 We:form 본사 회사/짐 정보 확인
SELECT
  c.id as company_id,
  c.name as company_name,
  c.business_number,
  g.id as gym_id,
  g.name as gym_name
FROM companies c
LEFT JOIN gyms g ON g.company_id = c.id
WHERE c.business_number = '1234567890'
   OR c.name LIKE '%We:form%'
   OR c.name LIKE '%위폼%'
LIMIT 5;

-- 2. 테스트 계정의 company_id, gym_id 업데이트
-- (위 쿼리 결과에서 company_id, gym_id를 확인 후 아래에 입력)

-- 예시: 실제 company_id, gym_id로 교체하세요
/*
UPDATE staffs
SET
  company_id = '여기에_실제_company_id',
  gym_id = '여기에_실제_gym_id',
  role = 'company_admin',
  employment_status = '재직'
WHERE email = 'test@example.com';
*/

-- 3. 업데이트 확인
SELECT
  s.id,
  s.name,
  s.email,
  s.role,
  c.name as company_name,
  g.name as gym_name
FROM staffs s
LEFT JOIN companies c ON s.company_id = c.id
LEFT JOIN gyms g ON s.gym_id = g.id
WHERE s.email = 'test@example.com';
