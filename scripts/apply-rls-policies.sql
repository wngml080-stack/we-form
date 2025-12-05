-- ============================================
-- Supabase RLS 정책 적용 스크립트
-- 목적: 멀티테넌시 데이터 격리 및 역할 기반 접근 제어
-- ============================================

-- ============================================
-- 1. companies 테이블
-- ============================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_select" ON public.companies;
CREATE POLICY "companies_select"
ON public.companies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.employment_status <> '퇴사'
      AND (
        s.role = 'system_admin' -- 마스터: 모든 회사
        OR s.company_id = companies.id -- 소속 회사만
      )
  )
);

DROP POLICY IF EXISTS "companies_write" ON public.companies;
CREATE POLICY "companies_write"
ON public.companies
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.employment_status <> '퇴사'
      AND s.role = 'system_admin' -- 마스터만 수정 가능
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.employment_status <> '퇴사'
      AND s.role = 'system_admin'
  )
);

-- ============================================
-- 2. gyms 테이블
-- ============================================

ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gyms_select" ON public.gyms;
CREATE POLICY "gyms_select"
ON public.gyms
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.employment_status <> '퇴사'
      AND (
        s.role = 'system_admin' -- 마스터: 모든 지점
        OR (s.role = 'company_admin' AND s.company_id = gyms.company_id) -- 본사: 자기 회사 지점
        OR s.gym_id = gyms.id -- 지점장/직원: 자기 지점만
      )
  )
);

DROP POLICY IF EXISTS "gyms_write" ON public.gyms;
CREATE POLICY "gyms_write"
ON public.gyms
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.employment_status <> '퇴사'
      AND (
        s.role = 'system_admin'
        OR (s.role = 'company_admin' AND s.company_id = gyms.company_id) -- 본사도 지점 생성/수정 가능
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.employment_status <> '퇴사'
      AND (
        s.role = 'system_admin'
        OR (s.role = 'company_admin' AND s.company_id = gyms.company_id)
      )
  )
);

-- ============================================
-- 3. staffs 테이블
-- ============================================

ALTER TABLE public.staffs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staffs_select" ON public.staffs;
CREATE POLICY "staffs_select"
ON public.staffs
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() -- 자기 자신은 항상 조회 가능
  OR EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.employment_status <> '퇴사'
      AND (
        s.role = 'system_admin' -- 마스터: 모든 직원
        OR (s.role = 'company_admin' AND s.company_id = staffs.company_id) -- 본사: 자기 회사 직원
        OR (s.role = 'admin' AND s.gym_id = staffs.gym_id) -- 지점장: 자기 지점 직원
        OR s.gym_id = staffs.gym_id -- 직원: 같은 지점 직원 조회 가능 (스케줄 등에서 필요)
      )
  )
);

DROP POLICY IF EXISTS "staffs_write" ON public.staffs;
CREATE POLICY "staffs_write"
ON public.staffs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.employment_status <> '퇴사'
      AND (
        s.role = 'system_admin'
        OR (s.role = 'company_admin' AND s.company_id = staffs.company_id)
        OR (s.role = 'admin' AND s.gym_id = staffs.gym_id)
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.employment_status <> '퇴사'
      AND (
        s.role = 'system_admin'
        OR (s.role = 'company_admin' AND s.company_id = staffs.company_id)
        OR (s.role = 'admin' AND s.gym_id = staffs.gym_id)
      )
  )
);

-- ============================================
-- 4. schedules 테이블
-- ============================================

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schedules_select" ON public.schedules;
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

DROP POLICY IF EXISTS "schedules_write" ON public.schedules;
CREATE POLICY "schedules_write"
ON public.schedules
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.gym_id = schedules.gym_id
      AND s.employment_status <> '퇴사'
      AND s.role IN ('system_admin', 'company_admin', 'admin', 'staff') -- 모든 직원이 스케줄 생성 가능
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.gym_id = schedules.gym_id
      AND s.employment_status <> '퇴사'
      AND s.role IN ('system_admin', 'company_admin', 'admin', 'staff')
  )
);

-- ============================================
-- 5. members 테이블
-- ============================================

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_select" ON public.members;
CREATE POLICY "members_select"
ON public.members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    JOIN public.companies c ON c.id = s.company_id
    WHERE s.user_id = auth.uid()
      AND s.company_id = members.company_id
      AND s.gym_id = members.gym_id
      AND s.employment_status <> '퇴사'
      AND c.status = 'active'
  )
);

DROP POLICY IF EXISTS "members_write" ON public.members;
CREATE POLICY "members_write"
ON public.members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.company_id = members.company_id
      AND s.gym_id = members.gym_id
      AND s.employment_status <> '퇴사'
      AND s.role IN ('company_admin','admin','system_admin') -- 관리자만 회원 수정 가능
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.company_id = members.company_id
      AND s.gym_id = members.gym_id
      AND s.employment_status <> '퇴사'
      AND s.role IN ('company_admin','admin','system_admin')
  )
);

-- ============================================
-- 6. member_memberships 테이블
-- ============================================

ALTER TABLE public.member_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member_memberships_select" ON public.member_memberships;
CREATE POLICY "member_memberships_select"
ON public.member_memberships
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.gym_id = member_memberships.gym_id
      AND s.employment_status <> '퇴사'
  )
);

DROP POLICY IF EXISTS "member_memberships_write" ON public.member_memberships;
CREATE POLICY "member_memberships_write"
ON public.member_memberships
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.gym_id = member_memberships.gym_id
      AND s.employment_status <> '퇴사'
      AND s.role IN ('company_admin','admin','system_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.gym_id = member_memberships.gym_id
      AND s.employment_status <> '퇴사'
      AND s.role IN ('company_admin','admin','system_admin')
  )
);

-- ============================================
-- 7. member_payments 테이블
-- ============================================

ALTER TABLE public.member_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member_payments_select" ON public.member_payments;
CREATE POLICY "member_payments_select"
ON public.member_payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.company_id = member_payments.company_id
      AND s.gym_id = member_payments.gym_id
      AND s.employment_status <> '퇴사'
  )
);

DROP POLICY IF EXISTS "member_payments_write" ON public.member_payments;
CREATE POLICY "member_payments_write"
ON public.member_payments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.company_id = member_payments.company_id
      AND s.gym_id = member_payments.gym_id
      AND s.employment_status <> '퇴사'
      AND s.role IN ('company_admin','admin','system_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.company_id = member_payments.company_id
      AND s.gym_id = member_payments.gym_id
      AND s.employment_status <> '퇴사'
      AND s.role IN ('company_admin','admin','system_admin')
  )
);

-- ============================================
-- 8. attendance_statuses 테이블 (코드 테이블)
-- ============================================

ALTER TABLE public.attendance_statuses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_statuses_select" ON public.attendance_statuses;
CREATE POLICY "attendance_statuses_select"
ON public.attendance_statuses
FOR SELECT
TO authenticated
USING (true); -- 모든 로그인 사용자가 조회 가능

DROP POLICY IF EXISTS "attendance_statuses_write" ON public.attendance_statuses;
CREATE POLICY "attendance_statuses_write"
ON public.attendance_statuses
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.role IN ('company_admin','admin','system_admin')
      AND s.employment_status <> '퇴사'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.role IN ('company_admin','admin','system_admin')
      AND s.employment_status <> '퇴사'
  )
);

-- ============================================
-- 9. attendances 테이블
-- ============================================

ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendances_select" ON public.attendances;
CREATE POLICY "attendances_select"
ON public.attendances
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.gym_id = attendances.gym_id
      AND s.employment_status <> '퇴사'
  )
);

DROP POLICY IF EXISTS "attendances_write" ON public.attendances;
CREATE POLICY "attendances_write"
ON public.attendances
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.gym_id = attendances.gym_id
      AND s.employment_status <> '퇴사'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.gym_id = attendances.gym_id
      AND s.employment_status <> '퇴사'
  )
);

-- ============================================
-- 10. salary_settings 테이블
-- ============================================

ALTER TABLE public.salary_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "salary_settings_select" ON public.salary_settings;
CREATE POLICY "salary_settings_select"
ON public.salary_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.gym_id = salary_settings.gym_id
      AND s.employment_status <> '퇴사'
  )
);

DROP POLICY IF EXISTS "salary_settings_write" ON public.salary_settings;
CREATE POLICY "salary_settings_write"
ON public.salary_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.gym_id = salary_settings.gym_id
      AND s.employment_status <> '퇴사'
      AND s.role IN ('company_admin','admin','system_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.gym_id = salary_settings.gym_id
      AND s.employment_status <> '퇴사'
      AND s.role IN ('company_admin','admin','system_admin')
  )
);

-- ============================================
-- 11. sales_logs 테이블
-- ============================================

ALTER TABLE public.sales_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_logs_select" ON public.sales_logs;
CREATE POLICY "sales_logs_select"
ON public.sales_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.company_id = sales_logs.company_id
      AND s.gym_id = sales_logs.gym_id
      AND s.employment_status <> '퇴사'
  )
);

DROP POLICY IF EXISTS "sales_logs_write" ON public.sales_logs;
CREATE POLICY "sales_logs_write"
ON public.sales_logs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.company_id = sales_logs.company_id
      AND s.gym_id = sales_logs.gym_id
      AND s.employment_status <> '퇴사'
      AND s.role IN ('company_admin','admin','system_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.company_id = sales_logs.company_id
      AND s.gym_id = sales_logs.gym_id
      AND s.employment_status <> '퇴사'
      AND s.role IN ('company_admin','admin','system_admin')
  )
);

-- ============================================
-- 12. system_logs 테이블
-- ============================================

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_logs_select" ON public.system_logs;
CREATE POLICY "system_logs_select"
ON public.system_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.company_id = system_logs.company_id
      AND (s.gym_id IS NULL OR s.gym_id = system_logs.gym_id)
      AND s.role IN ('company_admin','system_admin') -- 본사/마스터만 시스템 로그 조회
      AND s.employment_status <> '퇴사'
  )
);

DROP POLICY IF EXISTS "system_logs_write" ON public.system_logs;
CREATE POLICY "system_logs_write"
ON public.system_logs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.company_id = system_logs.company_id
      AND s.employment_status <> '퇴사'
  )
);

-- ============================================
-- 13. permission_requests 테이블
-- ============================================

ALTER TABLE public.permission_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "permission_requests_select" ON public.permission_requests;
CREATE POLICY "permission_requests_select"
ON public.permission_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.company_id = permission_requests.company_id
      AND s.employment_status <> '퇴사'
      AND (
        s.role IN ('company_admin','system_admin') -- 본사/마스터는 모든 요청 조회
        OR s.id = permission_requests.staff_id -- 자기 요청은 조회 가능
      )
  )
);

DROP POLICY IF EXISTS "permission_requests_write" ON public.permission_requests;
CREATE POLICY "permission_requests_write"
ON public.permission_requests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.company_id = permission_requests.company_id
      AND s.employment_status <> '퇴사'
      AND (
        s.role IN ('company_admin','system_admin') -- 본사/마스터는 승인 가능
        OR s.id = permission_requests.staff_id -- 자기 요청은 생성 가능
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.staffs s
    WHERE s.user_id = auth.uid()
      AND s.company_id = permission_requests.company_id
      AND s.employment_status <> '퇴사'
      AND (
        s.role IN ('company_admin','system_admin')
        OR s.id = permission_requests.staff_id
      )
  )
);

-- ============================================
-- 완료 메시지
-- ============================================

SELECT
  '✅ RLS 정책 적용 완료!' as status,
  '총 13개 테이블 정책 생성' as summary,
  'companies, gyms, staffs, schedules, members, member_memberships, member_payments, attendance_statuses, attendances, salary_settings, sales_logs, system_logs, permission_requests' as tables;
