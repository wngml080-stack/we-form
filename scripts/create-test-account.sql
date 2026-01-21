-- ============================================
-- We:form 테스트 계정 생성 스크립트
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- UUID 생성용 변수
DO $$
DECLARE
  v_company_id UUID := gen_random_uuid();
  v_gym_id UUID := gen_random_uuid();
  v_staff_id UUID := gen_random_uuid();
BEGIN
  -- 1. 테스트용 회사 생성
  INSERT INTO companies (id, name, representative_name, business_number, status, branch_count, staff_count)
  VALUES (
    v_company_id,
    '테스트 피트니스',
    '테스트 관리자',
    '123-45-67890',
    'approved',
    1,
    1
  );

  -- 2. 테스트용 지점(Gym) 생성
  INSERT INTO gyms (id, company_id, name, status)
  VALUES (
    v_gym_id,
    v_company_id,
    '테스트 피트니스 강남점',
    'active'
  );

  -- 3. 테스트 관리자 계정 생성 (staffs 테이블)
  INSERT INTO staffs (
    id,
    company_id,
    gym_id,
    name,
    email,
    phone,
    role,
    employment_status,
    job_title
  )
  VALUES (
    v_staff_id,
    v_company_id,
    v_gym_id,
    '테스트 관리자',
    'test@example.com',
    '010-1234-5678',
    'company_admin',
    '재직',
    '대표'
  );

  RAISE NOTICE '테스트 계정 생성 완료!';
  RAISE NOTICE 'Company ID: %', v_company_id;
  RAISE NOTICE 'Gym ID: %', v_gym_id;
  RAISE NOTICE 'Staff ID: %', v_staff_id;
END $$;

-- ============================================
-- 완료! 이제 Supabase Authentication에서 사용자 생성:
--
-- 1. Authentication > Users > "Add user"
-- 2. Email: test@example.com
-- 3. Password: testpassword123
-- 4. "Auto Confirm User" 체크
-- 5. "Create user" 클릭
-- ============================================

-- 확인용 쿼리 (별도로 실행)
SELECT
  s.id,
  s.name,
  s.email,
  s.role,
  s.employment_status,
  c.name as company_name,
  c.status as company_status,
  g.name as gym_name
FROM staffs s
LEFT JOIN companies c ON s.company_id = c.id
LEFT JOIN gyms g ON s.gym_id = g.id
WHERE s.email = 'test@example.com';
