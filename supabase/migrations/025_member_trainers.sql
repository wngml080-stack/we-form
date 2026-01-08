-- 회원별 다수 트레이너 배정 테이블 (종목별)
-- PT는 기존 trainer_id 사용, 이 테이블은 헬스, 필라테스, 골프 등 다른 종목용

CREATE TABLE IF NOT EXISTS member_trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES staffs(id) ON DELETE SET NULL,
  category VARCHAR(100) NOT NULL,  -- 수동 입력: 헬스, 필라테스, 골프 등
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES staffs(id) ON DELETE SET NULL,
  is_primary BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active', -- active, transferred
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_member_trainers_member_id ON member_trainers(member_id);
CREATE INDEX IF NOT EXISTS idx_member_trainers_trainer_id ON member_trainers(trainer_id);
CREATE INDEX IF NOT EXISTS idx_member_trainers_gym_id ON member_trainers(gym_id);
CREATE INDEX IF NOT EXISTS idx_member_trainers_status ON member_trainers(status);

-- 코멘트
COMMENT ON TABLE member_trainers IS '회원별 종목 담당 트레이너 (PT 제외)';
COMMENT ON COLUMN member_trainers.category IS '종목 - 수동 입력 (헬스, 필라테스, 골프 등)';
COMMENT ON COLUMN member_trainers.status IS 'active: 활성, transferred: 인계됨';

-- 트레이너 인계 이력 테이블
CREATE TABLE IF NOT EXISTS member_trainer_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  member_trainer_id UUID REFERENCES member_trainers(id) ON DELETE SET NULL,
  category VARCHAR(100),  -- 종목 (null이면 PT 또는 전체)
  from_trainer_id UUID REFERENCES staffs(id) ON DELETE SET NULL,
  to_trainer_id UUID REFERENCES staffs(id) ON DELETE SET NULL,
  reason VARCHAR(50) NOT NULL, -- resignation, leave, member_request, workload, other
  reason_detail TEXT,
  transferred_at TIMESTAMPTZ DEFAULT NOW(),
  transferred_by UUID REFERENCES staffs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_member_trainer_transfers_member_id ON member_trainer_transfers(member_id);
CREATE INDEX IF NOT EXISTS idx_member_trainer_transfers_from_trainer ON member_trainer_transfers(from_trainer_id);
CREATE INDEX IF NOT EXISTS idx_member_trainer_transfers_to_trainer ON member_trainer_transfers(to_trainer_id);

-- 코멘트
COMMENT ON TABLE member_trainer_transfers IS '트레이너 인계 이력';
COMMENT ON COLUMN member_trainer_transfers.reason IS '인계 사유: resignation(퇴사), leave(휴가/휴직), member_request(회원요청), workload(업무조정), other(기타)';
COMMENT ON COLUMN member_trainer_transfers.reason_detail IS '기타 사유 선택 시 상세 내용';

-- RLS 정책 설정
ALTER TABLE member_trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_trainer_transfers ENABLE ROW LEVEL SECURITY;

-- member_trainers RLS 정책
CREATE POLICY "member_trainers_select_policy" ON member_trainers
  FOR SELECT USING (true);

CREATE POLICY "member_trainers_insert_policy" ON member_trainers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "member_trainers_update_policy" ON member_trainers
  FOR UPDATE USING (true);

CREATE POLICY "member_trainers_delete_policy" ON member_trainers
  FOR DELETE USING (true);

-- member_trainer_transfers RLS 정책
CREATE POLICY "member_trainer_transfers_select_policy" ON member_trainer_transfers
  FOR SELECT USING (true);

CREATE POLICY "member_trainer_transfers_insert_policy" ON member_trainer_transfers
  FOR INSERT WITH CHECK (true);
