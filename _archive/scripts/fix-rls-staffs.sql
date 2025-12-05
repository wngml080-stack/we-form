-- ============================================
-- staffs 테이블 RLS 정책 수정 (무한 재귀 문제 해결)
-- ============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "staffs_select" ON public.staffs;
DROP POLICY IF EXISTS "staffs_write" ON public.staffs;

-- 새로운 SELECT 정책: 무한 재귀를 피하기 위해 단순화
CREATE POLICY "staffs_select"
ON public.staffs
FOR SELECT
TO authenticated
USING (
  -- 자기 자신은 항상 조회 가능 (재귀 없음)
  user_id = auth.uid()
);

-- 새로운 WRITE 정책: system_admin, company_admin, admin만 가능
CREATE POLICY "staffs_write"
ON public.staffs
FOR ALL
TO authenticated
USING (
  -- 자기 자신의 레코드 수정은 role 체크 후 허용
  user_id = auth.uid()
  AND role IN ('system_admin', 'company_admin', 'admin')
  AND employment_status <> '퇴사'
)
WITH CHECK (
  -- 새 레코드 생성 시에도 동일한 체크
  user_id = auth.uid()
  AND role IN ('system_admin', 'company_admin', 'admin')
  AND employment_status <> '퇴사'
);

-- 참고: 다른 직원 조회가 필요한 경우 (staff 리스트 등)에는
-- 애플리케이션 레벨에서 service role key를 사용하거나
-- 별도의 함수를 만들어서 처리해야 합니다.
