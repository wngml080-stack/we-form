-- ============================================
-- 회원권 양도 이력 테이블 생성
-- ============================================

-- 1. member_membership_transfers 테이블 생성
CREATE TABLE IF NOT EXISTS member_membership_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- 양도자 (from) 정보
  from_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  from_membership_id UUID NOT NULL REFERENCES member_memberships(id) ON DELETE CASCADE,

  -- 양수인 (to) 정보
  to_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  to_membership_id UUID REFERENCES member_memberships(id) ON DELETE SET NULL,

  -- 양도 정보
  transferred_sessions INTEGER NOT NULL CHECK (transferred_sessions > 0),
  transfer_fee NUMERIC DEFAULT 0,
  payment_method TEXT,
  transfer_reason TEXT,
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- 원본 회원권 스냅샷 (양도 당시 상태)
  original_membership_data JSONB NOT NULL,

  -- 메타
  created_by UUID REFERENCES staffs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_membership_transfers_gym_id ON member_membership_transfers(gym_id);
CREATE INDEX IF NOT EXISTS idx_membership_transfers_from_member ON member_membership_transfers(from_member_id);
CREATE INDEX IF NOT EXISTS idx_membership_transfers_to_member ON member_membership_transfers(to_member_id);
CREATE INDEX IF NOT EXISTS idx_membership_transfers_from_membership ON member_membership_transfers(from_membership_id);
CREATE INDEX IF NOT EXISTS idx_membership_transfers_created_at ON member_membership_transfers(created_at DESC);

-- 3. RLS 활성화
ALTER TABLE member_membership_transfers ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책: 같은 지점 직원만 조회 가능
CREATE POLICY "같은 지점 직원은 양도 이력 조회 가능" ON member_membership_transfers
  FOR SELECT
  USING (
    gym_id IN (
      SELECT gym_id FROM staffs
      WHERE user_id = auth.uid()
    )
  );

-- 5. RLS 정책: 관리자는 양도 이력 생성 가능
CREATE POLICY "관리자는 양도 이력 생성 가능" ON member_membership_transfers
  FOR INSERT
  WITH CHECK (
    gym_id IN (
      SELECT gym_id FROM staffs
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'director', 'system_admin', 'company_admin', 'staff')
    )
  );

-- 6. member_activity_logs의 action_type 제약 업데이트 (membership_transferred, membership_hold, addon_updated 추가)
ALTER TABLE member_activity_logs DROP CONSTRAINT IF EXISTS member_activity_logs_action_type_check;

ALTER TABLE member_activity_logs ADD CONSTRAINT member_activity_logs_action_type_check
CHECK (action_type IN (
  'member_created',
  'member_updated',
  'membership_created',
  'membership_updated',
  'membership_deleted',
  'membership_hold',
  'membership_transferred',
  'payment_created',
  'status_changed',
  'addon_updated'
));

-- 7. 코멘트 추가
COMMENT ON TABLE member_membership_transfers IS '회원권 양도 이력';
COMMENT ON COLUMN member_membership_transfers.from_member_id IS '양도자 회원 ID';
COMMENT ON COLUMN member_membership_transfers.from_membership_id IS '양도한 회원권 ID';
COMMENT ON COLUMN member_membership_transfers.to_member_id IS '양수인 회원 ID';
COMMENT ON COLUMN member_membership_transfers.to_membership_id IS '양수인에게 생성된 회원권 ID';
COMMENT ON COLUMN member_membership_transfers.transferred_sessions IS '양도된 횟수';
COMMENT ON COLUMN member_membership_transfers.transfer_fee IS '양도 수수료';
COMMENT ON COLUMN member_membership_transfers.payment_method IS '수수료 결제 방법 (card/cash/transfer)';
COMMENT ON COLUMN member_membership_transfers.transfer_date IS '양도일 (양수인 회원권 시작일)';
COMMENT ON COLUMN member_membership_transfers.original_membership_data IS '양도 당시 원본 회원권 정보 스냅샷';
