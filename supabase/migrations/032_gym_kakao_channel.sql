-- ============================================
-- 지점별 카카오 채널 연동 설정
-- ============================================
-- 각 지점에서 자체 카카오 비즈니스 채널을 연결할 수 있도록 함

CREATE TABLE IF NOT EXISTS gym_kakao_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE UNIQUE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- 카카오 채널 정보
  channel_id VARCHAR(100), -- 카카오 채널 ID
  channel_public_id VARCHAR(100), -- @로 시작하는 공개 ID
  channel_name VARCHAR(100), -- 채널 이름 (표시용)

  -- 카카오 API 키 (암호화 권장 - 실제 운영 시 vault 또는 암호화 사용)
  rest_api_key VARCHAR(255),
  admin_key VARCHAR(255),
  webhook_secret VARCHAR(255),

  -- 챗봇 설정
  chatbot_enabled BOOLEAN DEFAULT FALSE,
  skill_server_url VARCHAR(500), -- 스킬 서버 URL (선택적)

  -- 알림톡 설정
  alimtalk_enabled BOOLEAN DEFAULT FALSE,
  alimtalk_sender_key VARCHAR(255), -- 솔라피/NHN Cloud 등 발신 키
  alimtalk_sender_number VARCHAR(20), -- 발신 번호

  -- 연동 상태
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  last_webhook_received_at TIMESTAMPTZ,

  -- 메타데이터
  settings JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE gym_kakao_channels IS '지점별 카카오 채널 연동 설정';
COMMENT ON COLUMN gym_kakao_channels.channel_id IS '카카오 채널 ID';
COMMENT ON COLUMN gym_kakao_channels.channel_public_id IS '카카오 채널 검색용 ID (@xxx)';
COMMENT ON COLUMN gym_kakao_channels.chatbot_enabled IS '챗봇 자동 응답 활성화';
COMMENT ON COLUMN gym_kakao_channels.is_verified IS '채널 연동 검증 완료 여부';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_gym_kakao_channels_gym ON gym_kakao_channels(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_kakao_channels_channel ON gym_kakao_channels(channel_id);
CREATE INDEX IF NOT EXISTS idx_gym_kakao_channels_company ON gym_kakao_channels(company_id);

-- RLS
ALTER TABLE gym_kakao_channels ENABLE ROW LEVEL SECURITY;

-- 관리자만 카카오 채널 설정 관리 가능
CREATE POLICY "Admin can view kakao channel settings"
  ON gym_kakao_channels FOR SELECT
  USING (gym_id IN (
    SELECT gym_id FROM staffs
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'company_admin', 'system_admin', 'manager')
  ));

CREATE POLICY "Admin can manage kakao channel settings"
  ON gym_kakao_channels FOR ALL
  USING (gym_id IN (
    SELECT gym_id FROM staffs
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'company_admin', 'system_admin', 'manager')
  ));

-- updated_at 트리거
CREATE TRIGGER update_gym_kakao_channels_updated_at
  BEFORE UPDATE ON gym_kakao_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
