-- ============================================
-- 테스트를 위한 데이터 초기화 + 마이그레이션 통합 스크립트
-- ============================================

-- 1단계: 기존 데이터 삭제 (CASCADE로 연결된 데이터도 함께 삭제)
DELETE FROM public.attendances;
DELETE FROM public.payments;
DELETE FROM public.schedules;
DELETE FROM public.member_memberships;
DELETE FROM public.members;
DELETE FROM public.memberships;
DELETE FROM public.staffs;
DELETE FROM public.gyms;
DELETE FROM public.companies;

-- 2단계: members 테이블에 새 컬럼 추가
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS registered_by uuid REFERENCES public.staffs(id),
  ADD COLUMN IF NOT EXISTS trainer_id uuid REFERENCES public.staffs(id),
  ADD COLUMN IF NOT EXISTS exercise_goal text,
  ADD COLUMN IF NOT EXISTS weight numeric,
  ADD COLUMN IF NOT EXISTS body_fat_mass numeric,
  ADD COLUMN IF NOT EXISTS skeletal_muscle_mass numeric;

-- 3단계: schedules 테이블에 member_id 추가
ALTER TABLE public.schedules
  ADD COLUMN IF NOT EXISTS member_id uuid REFERENCES public.members(id);

-- 4단계: permission_requests 테이블 생성
CREATE TABLE IF NOT EXISTS public.permission_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staffs(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  requested_permission text NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.staffs(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5단계: RLS 정책 활성화
ALTER TABLE public.permission_requests ENABLE ROW LEVEL SECURITY;

-- 완료 메시지
SELECT '✅ 데이터 초기화 및 마이그레이션 완료!' as status;
