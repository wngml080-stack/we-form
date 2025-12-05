-- ============================================
-- 테스트 계정 생성 스크립트
-- ============================================

-- 1. 기존 테스트 회사/지점 확인
SELECT id, name FROM public.companies WHERE name = '테스트 헬스장';
SELECT id, name, company_id FROM public.gyms WHERE name = '본점';

-- 위 결과를 확인하고 아래 변수에 넣으세요
-- 또는 아래 WITH 절로 자동으로 가져옵니다

-- ============================================
-- 2. 회사 "부티크짐" 생성 및 지점 "강남점" 생성
-- ============================================

WITH boutique_company AS (
  INSERT INTO public.companies (name, status, created_at)
  VALUES ('부티크짐', 'active', now())
  RETURNING id
),
gangnam_gym AS (
  INSERT INTO public.gyms (company_id, name, created_at)
  SELECT id, '강남점', now()
  FROM boutique_company
  RETURNING id, company_id
),
-- 3-1. loo920@naver.com - 본사 권한 (company_admin)
hq_user AS (
  SELECT id FROM auth.users WHERE email = 'loo920@naver.com'
),
insert_hq_staff AS (
  INSERT INTO public.staffs (
    user_id,
    company_id,
    gym_id,
    name,
    email,
    role,
    job_title,
    employment_status,
    created_at
  )
  SELECT
    hu.id,
    gc.company_id,
    gc.id,  -- 강남점에 소속
    '본사담당자',
    'loo920@naver.com',
    'company_admin',
    '이사',
    '재직',
    now()
  FROM hq_user hu, gangnam_gym gc
  WHERE hu.id IS NOT NULL
  RETURNING id
),
-- 3-2. kongkong9922@naver.com - 지점 관리자 (admin)
admin_user AS (
  SELECT id FROM auth.users WHERE email = 'kongkong9922@naver.com'
),
insert_admin_staff AS (
  INSERT INTO public.staffs (
    user_id,
    company_id,
    gym_id,
    name,
    email,
    role,
    job_title,
    employment_status,
    created_at
  )
  SELECT
    au.id,
    gc.company_id,
    gc.id,
    '지점장',
    'kongkong9922@naver.com',
    'admin',
    '지점장',
    '재직',
    now()
  FROM admin_user au, gangnam_gym gc
  WHERE au.id IS NOT NULL
  RETURNING id
),
-- 3-3. thdus545@naver.com - 직원 (staff)
staff_user AS (
  SELECT id FROM auth.users WHERE email = 'thdus545@naver.com'
)
INSERT INTO public.staffs (
  user_id,
  company_id,
  gym_id,
  name,
  email,
  role,
  job_title,
  employment_status,
  created_at
)
SELECT
  su.id,
  gc.company_id,
  gc.id,
  '트레이너소연',
  'thdus545@naver.com',
  'staff',
  '필라전임',
  '재직',
  now()
FROM staff_user su, gangnam_gym gc
WHERE su.id IS NOT NULL;

-- 완료 메시지
SELECT '✅ 테스트 계정 생성 완료!' as status;
