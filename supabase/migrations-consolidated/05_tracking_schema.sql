-- =====================================================
-- We:Form 통합 마이그레이션 - 05. Tracking Schema
-- =====================================================
-- 이력 추적: member_activity_logs, member_membership_transfers
-- 트레이너: member_trainers, member_trainer_transfers
-- 서명: signatures
-- =====================================================

-- 1. Member Activity Logs (회원 활동 이력)
CREATE TABLE IF NOT EXISTS member_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
    membership_id UUID REFERENCES member_memberships(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'member_created', 'member_updated',
        'membership_created', 'membership_updated', 'membership_deleted', 'membership_hold', 'membership_transferred',
        'payment_created', 'status_changed', 'addon_updated'
    )),
    description TEXT,
    changes JSONB DEFAULT '{}',  -- {before: {}, after: {}}
    created_by UUID REFERENCES staffs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Member Membership Transfers (회원권 양도 이력)
CREATE TABLE IF NOT EXISTS member_membership_transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    from_member_id UUID REFERENCES members(id) ON DELETE SET NULL NOT NULL,
    from_membership_id UUID REFERENCES member_memberships(id) ON DELETE SET NULL NOT NULL,
    to_member_id UUID REFERENCES members(id) ON DELETE SET NULL NOT NULL,
    to_membership_id UUID REFERENCES member_memberships(id) ON DELETE SET NULL,
    transferred_sessions INTEGER,
    transfer_fee NUMERIC(12,2),
    payment_method VARCHAR(50),
    transfer_reason TEXT,
    transfer_date DATE DEFAULT CURRENT_DATE,
    original_membership_data JSONB,  -- snapshot of original membership
    created_by UUID REFERENCES staffs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Member Trainers (종목별 담당 트레이너)
CREATE TABLE IF NOT EXISTS member_trainers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
    trainer_id UUID REFERENCES staffs(id) ON DELETE CASCADE NOT NULL,
    category VARCHAR(100) NOT NULL,  -- 헬스, 필라테스, 골프 등
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES staffs(id) ON DELETE SET NULL,
    is_primary BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'transferred')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Member Trainer Transfers (트레이너 인계 이력)
CREATE TABLE IF NOT EXISTS member_trainer_transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
    member_trainer_id UUID REFERENCES member_trainers(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL,
    from_trainer_id UUID REFERENCES staffs(id) ON DELETE SET NULL NOT NULL,
    to_trainer_id UUID REFERENCES staffs(id) ON DELETE SET NULL NOT NULL,
    reason VARCHAR(50) CHECK (reason IN ('resignation', 'leave', 'member_request', 'workload', 'other')),
    reason_detail TEXT,
    transferred_at TIMESTAMPTZ DEFAULT NOW(),
    transferred_by UUID REFERENCES staffs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Signatures (PT 서명)
CREATE TABLE IF NOT EXISTS signatures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE NOT NULL,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES staffs(id) ON DELETE SET NULL,
    signature_data TEXT,  -- Base64 PNG
    token VARCHAR(255) UNIQUE NOT NULL,  -- QR code access token
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    signed_at TIMESTAMPTZ,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_member_id ON member_activity_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_gym_id ON member_activity_logs(gym_id);
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_created_at ON member_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_action_type ON member_activity_logs(action_type);

CREATE INDEX IF NOT EXISTS idx_member_membership_transfers_gym_id ON member_membership_transfers(gym_id);
CREATE INDEX IF NOT EXISTS idx_member_membership_transfers_from_member_id ON member_membership_transfers(from_member_id);
CREATE INDEX IF NOT EXISTS idx_member_membership_transfers_to_member_id ON member_membership_transfers(to_member_id);
CREATE INDEX IF NOT EXISTS idx_member_membership_transfers_created_at ON member_membership_transfers(created_at);

CREATE INDEX IF NOT EXISTS idx_member_trainers_member_id ON member_trainers(member_id);
CREATE INDEX IF NOT EXISTS idx_member_trainers_trainer_id ON member_trainers(trainer_id);
CREATE INDEX IF NOT EXISTS idx_member_trainers_gym_id ON member_trainers(gym_id);
CREATE INDEX IF NOT EXISTS idx_member_trainers_status ON member_trainers(status);

CREATE INDEX IF NOT EXISTS idx_member_trainer_transfers_member_id ON member_trainer_transfers(member_id);
CREATE INDEX IF NOT EXISTS idx_member_trainer_transfers_from_trainer_id ON member_trainer_transfers(from_trainer_id);
CREATE INDEX IF NOT EXISTS idx_member_trainer_transfers_to_trainer_id ON member_trainer_transfers(to_trainer_id);

CREATE INDEX IF NOT EXISTS idx_signatures_schedule_id ON signatures(schedule_id);
CREATE INDEX IF NOT EXISTS idx_signatures_token ON signatures(token);
CREATE INDEX IF NOT EXISTS idx_signatures_gym_id ON signatures(gym_id);
CREATE INDEX IF NOT EXISTS idx_signatures_status ON signatures(status);
CREATE INDEX IF NOT EXISTS idx_signatures_expires_at ON signatures(expires_at);

-- =====================================================
-- Trigger: updated_at 자동 갱신
-- =====================================================
CREATE OR REPLACE FUNCTION update_signatures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_signatures_updated_at
    BEFORE UPDATE ON signatures
    FOR EACH ROW
    EXECUTE FUNCTION update_signatures_updated_at();
