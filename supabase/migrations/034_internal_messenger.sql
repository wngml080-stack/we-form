-- ============================================
-- 사내 메신저 시스템
-- 034_internal_messenger.sql
-- ============================================

-- ============================================
-- PART 1: 채팅방(chat_rooms) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- 채팅방 유형
  room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('dm', 'group')),

  -- 그룹 채팅방 정보 (dm인 경우 null)
  name VARCHAR(100),
  description TEXT,

  -- 생성자
  created_by UUID NOT NULL REFERENCES staffs(id) ON DELETE SET NULL,

  -- 마지막 메시지 정보 (성능 최적화용)
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE chat_rooms IS '사내 메신저 채팅방';
COMMENT ON COLUMN chat_rooms.room_type IS '채팅방 유형: dm(1:1), group(그룹)';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_chat_rooms_company_id ON chat_rooms(company_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message ON chat_rooms(company_id, last_message_at DESC);

-- ============================================
-- PART 2: 채팅방 참여자(chat_room_members) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS chat_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staffs(id) ON DELETE CASCADE,

  -- 참여 상태
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,

  -- 읽음 상태 (마지막으로 읽은 시간)
  last_read_at TIMESTAMPTZ,

  -- 알림 설정
  notifications_enabled BOOLEAN DEFAULT TRUE,

  -- 고유 제약 (같은 방에 같은 사용자 중복 방지)
  UNIQUE(room_id, staff_id)
);

COMMENT ON TABLE chat_room_members IS '채팅방 참여자';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_chat_room_members_staff ON chat_room_members(staff_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room ON chat_room_members(room_id);

-- ============================================
-- PART 3: 채팅 메시지(chat_messages) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES staffs(id) ON DELETE SET NULL,

  -- 메시지 내용
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system')),

  -- 삭제 상태 (soft delete)
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE chat_messages IS '채팅 메시지';
COMMENT ON COLUMN chat_messages.message_type IS 'text: 일반메시지, system: 시스템 알림';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);

-- ============================================
-- PART 4: RLS 정책
-- ============================================

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- chat_rooms RLS: 본사 직원만 접근 가능
CREATE POLICY "HQ staff can view chat rooms"
  ON chat_rooms FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM staffs
    WHERE user_id = auth.uid()
    AND gym_id IS NULL
    AND role IN ('company_admin', 'system_admin')
  ));

CREATE POLICY "HQ staff can create chat rooms"
  ON chat_rooms FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM staffs
    WHERE user_id = auth.uid()
    AND gym_id IS NULL
    AND role IN ('company_admin', 'system_admin')
  ));

CREATE POLICY "HQ staff can update their chat rooms"
  ON chat_rooms FOR UPDATE
  USING (id IN (
    SELECT room_id FROM chat_room_members
    WHERE staff_id IN (
      SELECT id FROM staffs
      WHERE user_id = auth.uid()
      AND gym_id IS NULL
      AND role IN ('company_admin', 'system_admin')
    )
  ));

-- chat_room_members RLS
CREATE POLICY "HQ staff can view room members"
  ON chat_room_members FOR SELECT
  USING (room_id IN (
    SELECT id FROM chat_rooms
    WHERE company_id IN (
      SELECT company_id FROM staffs
      WHERE user_id = auth.uid()
      AND gym_id IS NULL
      AND role IN ('company_admin', 'system_admin')
    )
  ));

CREATE POLICY "HQ staff can insert room members"
  ON chat_room_members FOR INSERT
  WITH CHECK (room_id IN (
    SELECT id FROM chat_rooms
    WHERE company_id IN (
      SELECT company_id FROM staffs
      WHERE user_id = auth.uid()
      AND gym_id IS NULL
      AND role IN ('company_admin', 'system_admin')
    )
  ));

CREATE POLICY "HQ staff can update room members"
  ON chat_room_members FOR UPDATE
  USING (room_id IN (
    SELECT cr.id FROM chat_rooms cr
    JOIN chat_room_members crm ON crm.room_id = cr.id
    WHERE crm.staff_id IN (
      SELECT id FROM staffs
      WHERE user_id = auth.uid()
      AND gym_id IS NULL
      AND role IN ('company_admin', 'system_admin')
    )
  ));

CREATE POLICY "HQ staff can delete room members"
  ON chat_room_members FOR DELETE
  USING (room_id IN (
    SELECT cr.id FROM chat_rooms cr
    JOIN chat_room_members crm ON crm.room_id = cr.id
    WHERE crm.staff_id IN (
      SELECT id FROM staffs
      WHERE user_id = auth.uid()
      AND gym_id IS NULL
      AND role IN ('company_admin', 'system_admin')
    )
  ));

-- chat_messages RLS
CREATE POLICY "HQ staff can view messages"
  ON chat_messages FOR SELECT
  USING (room_id IN (
    SELECT room_id FROM chat_room_members
    WHERE staff_id IN (
      SELECT id FROM staffs
      WHERE user_id = auth.uid()
      AND gym_id IS NULL
      AND role IN ('company_admin', 'system_admin')
    )
  ));

CREATE POLICY "HQ staff can send messages"
  ON chat_messages FOR INSERT
  WITH CHECK (room_id IN (
    SELECT room_id FROM chat_room_members
    WHERE staff_id IN (
      SELECT id FROM staffs
      WHERE user_id = auth.uid()
      AND gym_id IS NULL
      AND role IN ('company_admin', 'system_admin')
    )
    AND left_at IS NULL
  ));

CREATE POLICY "HQ staff can update own messages"
  ON chat_messages FOR UPDATE
  USING (sender_id IN (
    SELECT id FROM staffs
    WHERE user_id = auth.uid()
    AND gym_id IS NULL
    AND role IN ('company_admin', 'system_admin')
  ));

-- ============================================
-- PART 5: 트리거 함수
-- ============================================

-- updated_at 컬럼 자동 업데이트 함수 (없으면 생성)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 메시지 전송 시 채팅방 last_message 업데이트
CREATE OR REPLACE FUNCTION update_chat_room_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_rooms
  SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    updated_at = NOW()
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_chat_room_last_message ON chat_messages;
CREATE TRIGGER trigger_update_chat_room_last_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_room_last_message();

-- updated_at 자동 업데이트
DROP TRIGGER IF EXISTS update_chat_rooms_updated_at ON chat_rooms;
CREATE TRIGGER update_chat_rooms_updated_at
  BEFORE UPDATE ON chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON chat_messages;
CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 6: 헬퍼 함수
-- ============================================

-- 1:1 DM 채팅방 찾기 또는 생성
CREATE OR REPLACE FUNCTION find_or_create_dm_room(
  p_company_id UUID,
  p_staff_id_1 UUID,
  p_staff_id_2 UUID
) RETURNS UUID AS $$
DECLARE
  v_room_id UUID;
BEGIN
  -- 기존 DM 방 찾기
  SELECT cr.id INTO v_room_id
  FROM chat_rooms cr
  WHERE cr.company_id = p_company_id
    AND cr.room_type = 'dm'
    AND EXISTS (
      SELECT 1 FROM chat_room_members crm1
      WHERE crm1.room_id = cr.id AND crm1.staff_id = p_staff_id_1 AND crm1.left_at IS NULL
    )
    AND EXISTS (
      SELECT 1 FROM chat_room_members crm2
      WHERE crm2.room_id = cr.id AND crm2.staff_id = p_staff_id_2 AND crm2.left_at IS NULL
    )
  LIMIT 1;

  -- 없으면 새로 생성
  IF v_room_id IS NULL THEN
    INSERT INTO chat_rooms (company_id, room_type, created_by)
    VALUES (p_company_id, 'dm', p_staff_id_1)
    RETURNING id INTO v_room_id;

    INSERT INTO chat_room_members (room_id, staff_id)
    VALUES (v_room_id, p_staff_id_1), (v_room_id, p_staff_id_2);
  END IF;

  RETURN v_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 안읽은 메시지 수 조회
CREATE OR REPLACE FUNCTION get_unread_message_count(p_staff_id UUID)
RETURNS TABLE (room_id UUID, unread_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.room_id,
    COUNT(*) as unread_count
  FROM chat_messages cm
  JOIN chat_room_members crm ON crm.room_id = cm.room_id AND crm.staff_id = p_staff_id
  WHERE cm.sender_id != p_staff_id
    AND cm.is_deleted = FALSE
    AND (crm.last_read_at IS NULL OR cm.created_at > crm.last_read_at)
    AND crm.left_at IS NULL
  GROUP BY cm.room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 총 안읽은 메시지 수 조회
CREATE OR REPLACE FUNCTION get_total_unread_count(p_staff_id UUID)
RETURNS BIGINT AS $$
DECLARE
  v_count BIGINT;
BEGIN
  SELECT COALESCE(SUM(unread_count), 0) INTO v_count
  FROM get_unread_message_count(p_staff_id);
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 7: Realtime 활성화
-- ============================================

-- Realtime publication에 테이블 추가
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_room_members;
