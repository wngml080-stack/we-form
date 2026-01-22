-- Google OAuth 토큰 저장 테이블
CREATE TABLE IF NOT EXISTS user_google_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  google_email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_google_tokens_staff_id ON user_google_tokens(staff_id);

-- RLS 정책
ALTER TABLE user_google_tokens ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 토큰만 조회/수정 가능
CREATE POLICY "Users can view own google tokens"
  ON user_google_tokens FOR SELECT
  USING (staff_id = auth.uid());

CREATE POLICY "Users can insert own google tokens"
  ON user_google_tokens FOR INSERT
  WITH CHECK (staff_id = auth.uid());

CREATE POLICY "Users can update own google tokens"
  ON user_google_tokens FOR UPDATE
  USING (staff_id = auth.uid());

CREATE POLICY "Users can delete own google tokens"
  ON user_google_tokens FOR DELETE
  USING (staff_id = auth.uid());

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_user_google_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_google_tokens_updated_at
  BEFORE UPDATE ON user_google_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_user_google_tokens_updated_at();
