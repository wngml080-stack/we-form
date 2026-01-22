-- ============================================
-- 문의 관리 시스템
-- ============================================
-- 문의, 예약, 자동응답 설정 테이블

-- ============================================
-- PART 1: 문의(inquiries) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- 문의 채널 정보
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('kakao', 'naver', 'phone', 'walk_in', 'website', 'instagram', 'other')),
  channel_id VARCHAR(255), -- 카카오 채널 사용자 ID, 네이버 예약 ID 등

  -- 문의자 정보
  customer_name VARCHAR(100),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),

  -- 문의 내용
  inquiry_type VARCHAR(50) NOT NULL CHECK (inquiry_type IN (
    'price', 'schedule', 'location', 'trial', 'membership', 'pt', 'cancel', 'etc', 'other'
  )),
  subject VARCHAR(255),
  content TEXT,

  -- 상태 관리
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN (
    'new', 'in_progress', 'waiting', 'resolved', 'converted', 'cancelled'
  )),
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- 담당자
  assigned_staff_id UUID REFERENCES staffs(id) ON DELETE SET NULL,

  -- AI 자동 응대 정보
  ai_responded BOOLEAN DEFAULT FALSE,
  ai_response_content TEXT,
  ai_responded_at TIMESTAMPTZ,

  -- 전환 정보 (회원 전환 시)
  converted_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,

  -- 예약 연결
  reservation_id UUID,

  -- 메타데이터
  source_data JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

COMMENT ON TABLE inquiries IS '문의 관리 테이블';
COMMENT ON COLUMN inquiries.channel IS '문의 채널: kakao/naver/phone/walk_in/website/instagram/other';
COMMENT ON COLUMN inquiries.inquiry_type IS '문의 유형: price/schedule/location/trial/membership/pt/cancel/etc/other';
COMMENT ON COLUMN inquiries.status IS '상태: new/in_progress/waiting/resolved/converted/cancelled';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_inquiries_gym_id_status ON inquiries(gym_id, status);
CREATE INDEX IF NOT EXISTS idx_inquiries_gym_id_channel ON inquiries(gym_id, channel);
CREATE INDEX IF NOT EXISTS idx_inquiries_gym_id_created ON inquiries(gym_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_assigned_staff ON inquiries(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_customer_phone ON inquiries(customer_phone);
CREATE INDEX IF NOT EXISTS idx_inquiries_company_id ON inquiries(company_id);

-- ============================================
-- PART 2: 문의 메시지(inquiry_messages) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS inquiry_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,

  -- 메시지 정보
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('customer', 'staff', 'ai')),
  sender_id UUID REFERENCES staffs(id) ON DELETE SET NULL,

  -- 내용
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'template')),

  -- 메타데이터
  channel_message_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',

  -- 상태
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE inquiry_messages IS '문의 대화 내역';

CREATE INDEX IF NOT EXISTS idx_inquiry_messages_inquiry_id ON inquiry_messages(inquiry_id, created_at);

-- ============================================
-- PART 3: 예약(reservations) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- 연결 정보
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE SET NULL,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,

  -- 예약자 정보
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),

  -- 예약 종류
  reservation_type VARCHAR(30) NOT NULL CHECK (reservation_type IN (
    'consultation', 'trial', 'ot', 'pt_consultation', 'tour', 'other'
  )),

  -- 일정
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,

  -- 담당자
  staff_id UUID REFERENCES staffs(id) ON DELETE SET NULL,

  -- 상태
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN (
    'pending', 'confirmed', 'completed', 'no_show', 'cancelled', 'rescheduled'
  )),

  -- Google Calendar 연동
  google_calendar_event_id VARCHAR(255),
  google_calendar_synced_at TIMESTAMPTZ,

  -- 메모
  notes TEXT,
  staff_memo TEXT,

  -- 알림 발송 상태
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE reservations IS '예약 관리 테이블';
COMMENT ON COLUMN reservations.reservation_type IS '예약 유형: consultation/trial/ot/pt_consultation/tour/other';
COMMENT ON COLUMN reservations.status IS '상태: pending/confirmed/completed/no_show/cancelled/rescheduled';

CREATE INDEX IF NOT EXISTS idx_reservations_gym_date ON reservations(gym_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_reservations_staff_date ON reservations(staff_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(gym_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_inquiry ON reservations(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_reservations_company ON reservations(company_id);

-- inquiries 테이블에 reservation_id FK 추가
ALTER TABLE inquiries
ADD CONSTRAINT fk_inquiries_reservation
FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL;

-- ============================================
-- PART 4: 자동응답 설정 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS gym_auto_response_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE UNIQUE,

  -- 기본 정보 (AI가 참조)
  business_hours JSONB DEFAULT '{"mon": "06:00-23:00", "tue": "06:00-23:00", "wed": "06:00-23:00", "thu": "06:00-23:00", "fri": "06:00-23:00", "sat": "09:00-18:00", "sun": "09:00-18:00"}',
  location_info TEXT,
  parking_info TEXT,

  -- 가격 정보
  pricing JSONB DEFAULT '{}',

  -- 자동 응답 활성화
  auto_response_enabled BOOLEAN DEFAULT FALSE,
  auto_response_hours JSONB DEFAULT '{}',

  -- 응답 템플릿
  greeting_message TEXT DEFAULT '안녕하세요! 무엇을 도와드릴까요?',
  out_of_hours_message TEXT DEFAULT '현재 영업시간이 아닙니다. 영업시간 내에 다시 연락드리겠습니다.',

  -- AI 설정
  ai_model VARCHAR(50) DEFAULT 'claude-3-5-haiku-20241022',
  ai_max_tokens INTEGER DEFAULT 500,
  ai_temperature NUMERIC(3,2) DEFAULT 0.7,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE gym_auto_response_settings IS '헬스장별 자동 응답 설정';

-- ============================================
-- PART 5: RLS 정책
-- ============================================

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_auto_response_settings ENABLE ROW LEVEL SECURITY;

-- inquiries RLS
CREATE POLICY "Staff can view gym inquiries"
  ON inquiries FOR SELECT
  USING (gym_id IN (SELECT gym_id FROM staffs WHERE user_id = auth.uid()));

CREATE POLICY "Staff can insert gym inquiries"
  ON inquiries FOR INSERT
  WITH CHECK (gym_id IN (SELECT gym_id FROM staffs WHERE user_id = auth.uid()));

CREATE POLICY "Admin can manage gym inquiries"
  ON inquiries FOR ALL
  USING (gym_id IN (
    SELECT gym_id FROM staffs
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'company_admin', 'system_admin', 'manager')
  ));

-- inquiry_messages RLS
CREATE POLICY "Staff can view inquiry messages"
  ON inquiry_messages FOR SELECT
  USING (inquiry_id IN (
    SELECT id FROM inquiries WHERE gym_id IN (
      SELECT gym_id FROM staffs WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Staff can insert inquiry messages"
  ON inquiry_messages FOR INSERT
  WITH CHECK (inquiry_id IN (
    SELECT id FROM inquiries WHERE gym_id IN (
      SELECT gym_id FROM staffs WHERE user_id = auth.uid()
    )
  ));

-- reservations RLS
CREATE POLICY "Staff can view gym reservations"
  ON reservations FOR SELECT
  USING (gym_id IN (SELECT gym_id FROM staffs WHERE user_id = auth.uid()));

CREATE POLICY "Staff can insert gym reservations"
  ON reservations FOR INSERT
  WITH CHECK (gym_id IN (SELECT gym_id FROM staffs WHERE user_id = auth.uid()));

CREATE POLICY "Admin can manage gym reservations"
  ON reservations FOR ALL
  USING (gym_id IN (
    SELECT gym_id FROM staffs
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'company_admin', 'system_admin', 'manager')
  ));

-- gym_auto_response_settings RLS
CREATE POLICY "Admin can manage auto response settings"
  ON gym_auto_response_settings FOR ALL
  USING (gym_id IN (
    SELECT gym_id FROM staffs
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'company_admin', 'system_admin', 'manager')
  ));

-- ============================================
-- PART 6: 트리거 (updated_at 자동 업데이트)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inquiries_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gym_auto_response_settings_updated_at
  BEFORE UPDATE ON gym_auto_response_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
