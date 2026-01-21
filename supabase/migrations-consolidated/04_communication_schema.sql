-- =====================================================
-- We:Form 통합 마이그레이션 - 04. Communication Schema
-- =====================================================
-- 문의: inquiries, inquiry_messages, reservations, gym_auto_response_settings
-- 채팅: chat_rooms, chat_room_members, chat_messages
-- 카카오: gym_kakao_channels
-- =====================================================

-- 1. Inquiries (문의)
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    channel VARCHAR(50) CHECK (channel IN ('kakao', 'naver', 'phone', 'walk_in', 'website', 'instagram', 'other')),
    channel_id VARCHAR(255),
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    inquiry_type VARCHAR(50) CHECK (inquiry_type IN ('price', 'schedule', 'location', 'trial', 'membership', 'pt', 'cancel', 'etc', 'other')),
    subject VARCHAR(255),
    content TEXT,
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'waiting', 'resolved', 'converted', 'cancelled')),
    priority INTEGER DEFAULT 0,
    assigned_staff_id UUID REFERENCES staffs(id) ON DELETE SET NULL,
    ai_responded BOOLEAN DEFAULT false,
    ai_response_content TEXT,
    ai_responded_at TIMESTAMPTZ,
    converted_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    converted_at TIMESTAMPTZ,
    reservation_id UUID,  -- circular reference, set later
    source_data JSONB DEFAULT '{}',
    tags TEXT[],
    notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Inquiry Messages (문의 메시지)
CREATE TABLE IF NOT EXISTS inquiry_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE NOT NULL,
    direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound')),
    sender_type VARCHAR(20) CHECK (sender_type IN ('customer', 'staff', 'ai')),
    sender_id UUID REFERENCES staffs(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'template')),
    channel_message_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Reservations (예약)
CREATE TABLE IF NOT EXISTS reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    inquiry_id UUID REFERENCES inquiries(id) ON DELETE SET NULL,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    reservation_type VARCHAR(50) CHECK (reservation_type IN ('consultation', 'trial', 'ot', 'pt_consultation', 'tour', 'other')),
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    staff_id UUID REFERENCES staffs(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'no_show', 'cancelled', 'rescheduled')),
    google_calendar_event_id VARCHAR(255),
    google_calendar_synced_at TIMESTAMPTZ,
    notes TEXT,
    staff_memo TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update inquiries to reference reservations
ALTER TABLE inquiries ADD CONSTRAINT fk_inquiries_reservation
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL;

-- 4. Gym Auto Response Settings (자동응답 설정)
CREATE TABLE IF NOT EXISTS gym_auto_response_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL UNIQUE,
    business_hours JSONB DEFAULT '{}',
    location_info TEXT,
    parking_info TEXT,
    pricing JSONB DEFAULT '{}',
    auto_response_enabled BOOLEAN DEFAULT false,
    auto_response_hours JSONB DEFAULT '{}',
    greeting_message TEXT,
    out_of_hours_message TEXT,
    ai_model VARCHAR(50) DEFAULT 'gpt-4',
    ai_max_tokens INTEGER DEFAULT 500,
    ai_temperature NUMERIC(3,2) DEFAULT 0.7,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Gym Kakao Channels (카카오 채널)
CREATE TABLE IF NOT EXISTS gym_kakao_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL UNIQUE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    channel_id VARCHAR(100),
    channel_public_id VARCHAR(100),
    channel_name VARCHAR(255),
    rest_api_key VARCHAR(255),
    admin_key VARCHAR(255),
    webhook_secret VARCHAR(255),
    chatbot_enabled BOOLEAN DEFAULT false,
    skill_server_url TEXT,
    alimtalk_enabled BOOLEAN DEFAULT false,
    alimtalk_sender_key VARCHAR(255),
    alimtalk_sender_number VARCHAR(20),
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    last_webhook_received_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Chat Rooms (사내 메신저 - 채팅방)
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    room_type VARCHAR(20) DEFAULT 'dm' CHECK (room_type IN ('dm', 'group')),
    name VARCHAR(255),
    description TEXT,
    created_by UUID REFERENCES staffs(id) ON DELETE SET NULL,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Chat Room Members (채팅방 멤버)
CREATE TABLE IF NOT EXISTS chat_room_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
    staff_id UUID REFERENCES staffs(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    last_read_at TIMESTAMPTZ,
    notifications_enabled BOOLEAN DEFAULT true,
    UNIQUE(room_id, staff_id)
);

-- 8. Chat Messages (채팅 메시지)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES staffs(id) ON DELETE SET NULL NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system')),
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_inquiries_gym_id ON inquiries(gym_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_company_id ON inquiries(company_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_channel ON inquiries(channel);
CREATE INDEX IF NOT EXISTS idx_inquiries_assigned_staff_id ON inquiries(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_customer_phone ON inquiries(customer_phone);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at);

CREATE INDEX IF NOT EXISTS idx_inquiry_messages_inquiry_id ON inquiry_messages(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_messages_created_at ON inquiry_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_reservations_gym_id ON reservations(gym_id);
CREATE INDEX IF NOT EXISTS idx_reservations_company_id ON reservations(company_id);
CREATE INDEX IF NOT EXISTS idx_reservations_inquiry_id ON reservations(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_reservations_staff_id ON reservations(staff_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_scheduled_date ON reservations(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_reservations_gym_date ON reservations(gym_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_reservations_staff_date ON reservations(staff_id, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_gym_kakao_channels_gym_id ON gym_kakao_channels(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_kakao_channels_company_id ON gym_kakao_channels(company_id);
CREATE INDEX IF NOT EXISTS idx_gym_kakao_channels_channel_id ON gym_kakao_channels(channel_id);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_company_id ON chat_rooms(company_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message_at ON chat_rooms(last_message_at);

CREATE INDEX IF NOT EXISTS idx_chat_room_members_staff_id ON chat_room_members(staff_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room_id ON chat_room_members(room_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(room_id, created_at);

-- =====================================================
-- Functions: 채팅 관련
-- =====================================================

-- DM 방 찾기/생성
CREATE OR REPLACE FUNCTION find_or_create_dm_room(
    p_company_id UUID,
    p_staff_id_1 UUID,
    p_staff_id_2 UUID
)
RETURNS UUID AS $$
DECLARE
    v_room_id UUID;
BEGIN
    -- 기존 DM 방 찾기
    SELECT cr.id INTO v_room_id
    FROM chat_rooms cr
    WHERE cr.company_id = p_company_id
      AND cr.room_type = 'dm'
      AND EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = cr.id AND staff_id = p_staff_id_1)
      AND EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = cr.id AND staff_id = p_staff_id_2)
    LIMIT 1;

    IF v_room_id IS NOT NULL THEN
        RETURN v_room_id;
    END IF;

    -- 새 DM 방 생성
    INSERT INTO chat_rooms (company_id, room_type, created_by)
    VALUES (p_company_id, 'dm', p_staff_id_1)
    RETURNING id INTO v_room_id;

    -- 멤버 추가
    INSERT INTO chat_room_members (room_id, staff_id)
    VALUES (v_room_id, p_staff_id_1), (v_room_id, p_staff_id_2);

    RETURN v_room_id;
END;
$$ LANGUAGE plpgsql;

-- 읽지 않은 메시지 수
CREATE OR REPLACE FUNCTION get_unread_message_count(p_staff_id UUID)
RETURNS TABLE(room_id UUID, unread_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT crm.room_id, COUNT(cm.id)::BIGINT as unread_count
    FROM chat_room_members crm
    JOIN chat_messages cm ON cm.room_id = crm.room_id
    WHERE crm.staff_id = p_staff_id
      AND crm.left_at IS NULL
      AND cm.created_at > COALESCE(crm.last_read_at, '1970-01-01')
      AND cm.sender_id != p_staff_id
      AND cm.is_deleted = false
    GROUP BY crm.room_id;
END;
$$ LANGUAGE plpgsql;

-- 전체 읽지 않은 메시지 수
CREATE OR REPLACE FUNCTION get_total_unread_count(p_staff_id UUID)
RETURNS BIGINT AS $$
DECLARE
    v_count BIGINT;
BEGIN
    SELECT COALESCE(SUM(unread_count), 0) INTO v_count
    FROM get_unread_message_count(p_staff_id);
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_chat_room_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_rooms
    SET last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100),
        updated_at = NOW()
    WHERE id = NEW.room_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_chat_room_last_message
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_room_last_message();

CREATE OR REPLACE FUNCTION update_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_reservations_updated_at();

CREATE OR REPLACE FUNCTION update_gym_auto_response_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gym_auto_response_settings_updated_at
    BEFORE UPDATE ON gym_auto_response_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_gym_auto_response_settings_updated_at();

CREATE OR REPLACE FUNCTION update_gym_kakao_channels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gym_kakao_channels_updated_at
    BEFORE UPDATE ON gym_kakao_channels
    FOR EACH ROW
    EXECUTE FUNCTION update_gym_kakao_channels_updated_at();

CREATE OR REPLACE FUNCTION update_chat_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_chat_rooms_updated_at
    BEFORE UPDATE ON chat_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_rooms_updated_at();

CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_chat_messages_updated_at
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_messages_updated_at();
