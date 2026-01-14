-- ============================================
-- 서명 시스템 (Signature System)
-- ============================================
-- PT 스케줄 완료 후 회원 자필 서명 저장

-- ============================================
-- PART 1: signatures 테이블 생성
-- ============================================

CREATE TABLE IF NOT EXISTS signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES staffs(id) ON DELETE SET NULL,

  -- 서명 데이터
  signature_data TEXT,  -- Base64 Data URL (PNG 이미지)

  -- 토큰 (QR코드용 - 공개 접근)
  token VARCHAR(64) NOT NULL UNIQUE,

  -- 상태 관리
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),

  -- 만료 시간 (서명 요청 후 24시간 유효)
  expires_at TIMESTAMPTZ NOT NULL,

  -- 서명 완료 시간
  signed_at TIMESTAMPTZ,

  -- 메타데이터
  ip_address VARCHAR(45),  -- IPv6 대응
  user_agent TEXT,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE signatures IS 'PT 스케줄 완료 후 회원 자필 서명';
COMMENT ON COLUMN signatures.token IS 'QR코드 접근용 고유 토큰 (공개 접근)';
COMMENT ON COLUMN signatures.signature_data IS 'Base64 인코딩된 서명 이미지 (PNG)';
COMMENT ON COLUMN signatures.status IS 'pending: 서명 대기, completed: 서명 완료, expired: 만료됨';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_signatures_schedule_id ON signatures(schedule_id);
CREATE INDEX IF NOT EXISTS idx_signatures_token ON signatures(token);
CREATE INDEX IF NOT EXISTS idx_signatures_gym_id ON signatures(gym_id);
CREATE INDEX IF NOT EXISTS idx_signatures_status ON signatures(status);
CREATE INDEX IF NOT EXISTS idx_signatures_expires_at ON signatures(expires_at);

-- ============================================
-- PART 2: RLS 정책
-- ============================================

ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- 직원은 자기 gym의 서명 조회 가능
CREATE POLICY "Staff can view gym signatures"
  ON signatures FOR SELECT
  USING (gym_id IN (SELECT gym_id FROM staffs WHERE user_id = auth.uid()));

-- 직원은 자기 gym에 서명 요청 생성 가능
CREATE POLICY "Staff can create gym signatures"
  ON signatures FOR INSERT
  WITH CHECK (gym_id IN (SELECT gym_id FROM staffs WHERE user_id = auth.uid()));

-- 관리자는 자기 gym의 서명 관리 가능
CREATE POLICY "Admin can manage gym signatures"
  ON signatures FOR ALL
  USING (gym_id IN (
    SELECT gym_id FROM staffs
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'company_admin', 'system_admin', 'manager')
  ));

-- ============================================
-- PART 3: updated_at 트리거
-- ============================================

CREATE TRIGGER update_signatures_updated_at
  BEFORE UPDATE ON signatures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
