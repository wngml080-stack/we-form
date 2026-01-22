-- =====================================================
-- user_google_tokens 테이블 외래키 및 RLS 정책 수정
-- 1. staff(id) → staffs(id) 외래키 수정
-- 2. RLS 정책의 auth.uid() 비교 로직 수정
-- =====================================================

-- 기존 테이블이 있으면 외래키 제약 조건 삭제 후 재생성
DO $$
BEGIN
  -- 기존 외래키 제약 조건 삭제 (있는 경우)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_google_tokens_staff_id_fkey'
    AND table_name = 'user_google_tokens'
  ) THEN
    ALTER TABLE user_google_tokens DROP CONSTRAINT user_google_tokens_staff_id_fkey;
  END IF;
END $$;

-- 올바른 외래키 제약 조건 추가 (staffs 테이블 참조)
ALTER TABLE user_google_tokens
ADD CONSTRAINT user_google_tokens_staff_id_fkey
FOREIGN KEY (staff_id) REFERENCES staffs(id) ON DELETE CASCADE;

-- =====================================================
-- RLS 정책 수정 (staff_id와 auth.uid() 비교 문제 해결)
-- =====================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own google tokens" ON user_google_tokens;
DROP POLICY IF EXISTS "Users can insert own google tokens" ON user_google_tokens;
DROP POLICY IF EXISTS "Users can update own google tokens" ON user_google_tokens;
DROP POLICY IF EXISTS "Users can delete own google tokens" ON user_google_tokens;

-- 새 정책: staff_id는 staffs 테이블의 id이므로, staffs.user_id와 auth.uid() 비교 필요

-- SELECT: 자신의 토큰만 조회 가능
CREATE POLICY "user_google_tokens_select" ON user_google_tokens
  FOR SELECT USING (
    is_system_admin()
    OR staff_id = get_my_staff_id()
  );

-- INSERT: 자신의 토큰만 생성 가능
CREATE POLICY "user_google_tokens_insert" ON user_google_tokens
  FOR INSERT WITH CHECK (
    staff_id = get_my_staff_id()
  );

-- UPDATE: 자신의 토큰만 수정 가능
CREATE POLICY "user_google_tokens_update" ON user_google_tokens
  FOR UPDATE USING (
    staff_id = get_my_staff_id()
  );

-- DELETE: 자신의 토큰만 삭제 가능
CREATE POLICY "user_google_tokens_delete" ON user_google_tokens
  FOR DELETE USING (
    staff_id = get_my_staff_id()
  );

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'user_google_tokens 외래키 및 RLS 정책이 수정되었습니다.';
END $$;
