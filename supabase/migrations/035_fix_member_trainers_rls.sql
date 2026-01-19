-- =====================================================
-- member_trainers 및 member_trainer_transfers RLS 정책 수정
-- 기존 USING(true) 정책을 적절한 권한 기반 정책으로 변경
-- =====================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "member_trainers_select_policy" ON member_trainers;
DROP POLICY IF EXISTS "member_trainers_insert_policy" ON member_trainers;
DROP POLICY IF EXISTS "member_trainers_update_policy" ON member_trainers;
DROP POLICY IF EXISTS "member_trainers_delete_policy" ON member_trainers;

DROP POLICY IF EXISTS "member_trainer_transfers_select_policy" ON member_trainer_transfers;
DROP POLICY IF EXISTS "member_trainer_transfers_insert_policy" ON member_trainer_transfers;

-- =====================================================
-- MEMBER_TRAINERS 테이블 RLS 정책
-- =====================================================

-- SELECT: 시스템 관리자 또는 같은 회사 직원만 조회 가능
CREATE POLICY "member_trainers_select" ON member_trainers
  FOR SELECT USING (
    is_system_admin()
    OR company_id = get_my_company_id()
  );

-- INSERT: 시스템 관리자 또는 같은 회사의 관리자/같은 지점 직원
CREATE POLICY "member_trainers_insert" ON member_trainers
  FOR INSERT WITH CHECK (
    is_system_admin()
    OR (company_id = get_my_company_id() AND (
      is_admin_or_above()
      OR gym_id = get_my_gym_id()
    ))
  );

-- UPDATE: 시스템 관리자 또는 같은 회사의 관리자/같은 지점 직원
CREATE POLICY "member_trainers_update" ON member_trainers
  FOR UPDATE USING (
    is_system_admin()
    OR (company_id = get_my_company_id() AND (
      is_admin_or_above()
      OR gym_id = get_my_gym_id()
    ))
  );

-- DELETE: 시스템 관리자 또는 같은 회사의 관리자 이상만
CREATE POLICY "member_trainers_delete" ON member_trainers
  FOR DELETE USING (
    is_system_admin()
    OR (company_id = get_my_company_id() AND is_admin_or_above())
  );

-- =====================================================
-- MEMBER_TRAINER_TRANSFERS 테이블 RLS 정책
-- =====================================================

-- SELECT: 시스템 관리자 또는 같은 회사 직원만 조회 가능
CREATE POLICY "member_trainer_transfers_select" ON member_trainer_transfers
  FOR SELECT USING (
    is_system_admin()
    OR company_id = get_my_company_id()
  );

-- INSERT: 시스템 관리자 또는 같은 회사의 관리자/같은 지점 직원
CREATE POLICY "member_trainer_transfers_insert" ON member_trainer_transfers
  FOR INSERT WITH CHECK (
    is_system_admin()
    OR (company_id = get_my_company_id() AND (
      is_admin_or_above()
      OR gym_id = get_my_gym_id()
    ))
  );

-- UPDATE: 인계 이력은 수정 불가 (감사 추적용)
-- 필요시 관리자만 수정 가능하도록 설정
CREATE POLICY "member_trainer_transfers_update" ON member_trainer_transfers
  FOR UPDATE USING (
    is_system_admin()
    OR (company_id = get_my_company_id() AND is_admin_or_above())
  );

-- DELETE: 시스템 관리자만 삭제 가능 (감사 추적 보존)
CREATE POLICY "member_trainer_transfers_delete" ON member_trainer_transfers
  FOR DELETE USING (
    is_system_admin()
  );

-- =====================================================
-- 인덱스 추가 (RLS 성능 최적화)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_member_trainers_company_id ON member_trainers(company_id);
CREATE INDEX IF NOT EXISTS idx_member_trainer_transfers_company_id ON member_trainer_transfers(company_id);

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'member_trainers 및 member_trainer_transfers RLS 정책이 수정되었습니다.';
END $$;
