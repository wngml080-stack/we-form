-- ============================================
-- 회원/회원권 수정 로그 테이블 생성
-- ============================================

-- 1. member_activity_logs 테이블 생성
CREATE TABLE IF NOT EXISTS member_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES member_memberships(id) ON DELETE SET NULL,

  -- 로그 정보
  action_type TEXT NOT NULL CHECK (action_type IN (
    'member_created',      -- 회원 생성
    'member_updated',      -- 회원 정보 수정
    'membership_created',  -- 회원권 생성
    'membership_updated',  -- 회원권 수정
    'membership_deleted',  -- 회원권 삭제
    'payment_created',     -- 결제 생성
    'status_changed'       -- 상태 변경
  )),

  -- 변경 상세 내용
  description TEXT NOT NULL,
  changes JSONB,  -- 이전값/이후값 저장 { before: {...}, after: {...} }

  -- 처리자 정보
  created_by UUID REFERENCES staffs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_member_id ON member_activity_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_gym_id ON member_activity_logs(gym_id);
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_created_at ON member_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_action_type ON member_activity_logs(action_type);

-- 3. RLS 활성화
ALTER TABLE member_activity_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책: 같은 지점 직원만 조회 가능
CREATE POLICY "같은 지점 직원은 로그 조회 가능" ON member_activity_logs
  FOR SELECT
  USING (
    gym_id IN (
      SELECT gym_id FROM staffs
      WHERE user_id = auth.uid()
    )
  );

-- 5. RLS 정책: 관리자는 로그 생성 가능
CREATE POLICY "관리자는 로그 생성 가능" ON member_activity_logs
  FOR INSERT
  WITH CHECK (
    gym_id IN (
      SELECT gym_id FROM staffs
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'director', 'system_admin', 'company_admin', 'staff')
    )
  );

-- 6. 코멘트 추가
COMMENT ON TABLE member_activity_logs IS '회원 및 회원권 변경 이력 로그';
COMMENT ON COLUMN member_activity_logs.action_type IS '작업 유형: member_created/member_updated/membership_created/membership_updated/membership_deleted/payment_created/status_changed';
COMMENT ON COLUMN member_activity_logs.description IS '변경 내용 요약 (한국어)';
COMMENT ON COLUMN member_activity_logs.changes IS '변경 전/후 값 JSON: { before: {...}, after: {...} }';
