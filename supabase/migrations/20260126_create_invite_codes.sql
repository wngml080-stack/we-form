-- 초대 코드 테이블 생성
CREATE TABLE IF NOT EXISTS invite_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL UNIQUE,
    created_by UUID NOT NULL REFERENCES staffs(id),
    expires_at TIMESTAMPTZ NOT NULL,
    max_uses INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_invite_codes_company_id ON invite_codes(company_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_expires_at ON invite_codes(expires_at);

-- RLS 활성화
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 회사 관리자만 초대 코드 생성/조회 가능
CREATE POLICY "Company admins can manage invite codes"
ON invite_codes
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM staffs s
        WHERE s.email = auth.jwt()->>'email'
        AND s.company_id = invite_codes.company_id
        AND s.role IN ('system_admin', 'company_admin', 'admin')
    )
);

-- 초대 코드 사용 기록 테이블
CREATE TABLE IF NOT EXISTS invite_code_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invite_code_id UUID NOT NULL REFERENCES invite_codes(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staffs(id) ON DELETE CASCADE,
    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE invite_code_usages ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Company admins can view invite code usages"
ON invite_code_usages
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM staffs s
        JOIN invite_codes ic ON ic.id = invite_code_usages.invite_code_id
        WHERE s.email = auth.jwt()->>'email'
        AND s.company_id = ic.company_id
        AND s.role IN ('system_admin', 'company_admin', 'admin')
    )
);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_invite_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invite_codes_updated_at
    BEFORE UPDATE ON invite_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_invite_codes_updated_at();
