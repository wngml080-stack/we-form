-- ============================================
-- 회의록 관리 시스템
-- 038_meeting_system.sql
-- ============================================

-- ============================================
-- PART 1: 회의(meetings) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,

  -- 회의 기본 정보
  title VARCHAR(200) NOT NULL,
  description TEXT,

  -- 회의 유형
  meeting_type VARCHAR(30) NOT NULL DEFAULT 'regular'
    CHECK (meeting_type IN ('regular', 'weekly', 'monthly', 'emergency', 'workshop', 'training', 'other')),

  -- 회의 일시
  scheduled_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,

  -- 회의 장소/방식
  location VARCHAR(200),
  is_online BOOLEAN DEFAULT FALSE,
  online_link VARCHAR(500),

  -- 회의 상태
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed')),

  -- 생성자
  created_by UUID NOT NULL REFERENCES staffs(id) ON DELETE SET NULL,

  -- AI 요약 (회의 완료 후)
  ai_summary TEXT,
  ai_summary_generated_at TIMESTAMPTZ,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE meetings IS '회의 정보';
COMMENT ON COLUMN meetings.meeting_type IS '회의 유형: regular(정기), weekly(주간), monthly(월간), emergency(긴급), workshop(워크샵), training(교육), other(기타)';
COMMENT ON COLUMN meetings.status IS '회의 상태: scheduled(예정), in_progress(진행중), completed(완료), cancelled(취소), postponed(연기)';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_meetings_company_id ON meetings(company_id);
CREATE INDEX IF NOT EXISTS idx_meetings_gym_id ON meetings(gym_id);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_at ON meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON meetings(created_by);

-- ============================================
-- PART 2: 회의 참석자(meeting_participants) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staffs(id) ON DELETE CASCADE,

  -- 참석 역할
  role VARCHAR(20) DEFAULT 'attendee'
    CHECK (role IN ('organizer', 'facilitator', 'note_taker', 'attendee')),

  -- 참석 상태
  attendance_status VARCHAR(20) DEFAULT 'pending'
    CHECK (attendance_status IN ('pending', 'confirmed', 'declined', 'attended', 'absent')),

  -- 참석 확인 시간
  confirmed_at TIMESTAMPTZ,
  attended_at TIMESTAMPTZ,

  -- 메모 (개인별)
  personal_notes TEXT,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 고유 제약
  UNIQUE(meeting_id, staff_id)
);

COMMENT ON TABLE meeting_participants IS '회의 참석자';
COMMENT ON COLUMN meeting_participants.role IS '역할: organizer(주최자), facilitator(진행자), note_taker(서기), attendee(참석자)';
COMMENT ON COLUMN meeting_participants.attendance_status IS '참석 상태: pending(대기), confirmed(확인), declined(거절), attended(참석), absent(불참)';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_staff ON meeting_participants(staff_id);

-- ============================================
-- PART 3: 회의록(meeting_notes) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,

  -- 작성자
  author_id UUID NOT NULL REFERENCES staffs(id) ON DELETE SET NULL,

  -- 회의록 내용
  content TEXT NOT NULL,

  -- 회의록 버전 관리
  version INTEGER DEFAULT 1,
  is_final BOOLEAN DEFAULT FALSE,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE meeting_notes IS '회의록';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_meeting_notes_meeting ON meeting_notes(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_notes_author ON meeting_notes(author_id);

-- ============================================
-- PART 4: 회의 안건(meeting_agendas) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS meeting_agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,

  -- 안건 정보
  title VARCHAR(200) NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,

  -- 예상 소요 시간 (분)
  estimated_minutes INTEGER,

  -- 안건 상태
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),

  -- 담당자
  presenter_id UUID REFERENCES staffs(id) ON DELETE SET NULL,

  -- 결과/결론
  conclusion TEXT,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE meeting_agendas IS '회의 안건';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_meeting_agendas_meeting ON meeting_agendas(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_agendas_order ON meeting_agendas(meeting_id, order_index);

-- ============================================
-- PART 5: 액션 아이템(meeting_action_items) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS meeting_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  agenda_id UUID REFERENCES meeting_agendas(id) ON DELETE SET NULL,

  -- 액션 아이템 정보
  title VARCHAR(300) NOT NULL,
  description TEXT,

  -- 담당자
  assignee_id UUID REFERENCES staffs(id) ON DELETE SET NULL,

  -- 기한
  due_date DATE,

  -- 우선순위
  priority VARCHAR(10) DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- 상태
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE meeting_action_items IS '회의 액션 아이템 (할 일)';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_meeting ON meeting_action_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_assignee ON meeting_action_items(assignee_id);
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_due_date ON meeting_action_items(due_date);
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_status ON meeting_action_items(status);

-- ============================================
-- PART 6: 회의 첨부파일(meeting_attachments) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS meeting_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,

  -- 파일 정보
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(100),

  -- 업로더
  uploaded_by UUID NOT NULL REFERENCES staffs(id) ON DELETE SET NULL,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE meeting_attachments IS '회의 첨부파일';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_meeting_attachments_meeting ON meeting_attachments(meeting_id);

-- ============================================
-- PART 7: RLS 정책
-- ============================================

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_attachments ENABLE ROW LEVEL SECURITY;

-- meetings RLS
CREATE POLICY "Company staff can view meetings"
  ON meetings FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM staffs WHERE user_id = auth.uid()
  ));

CREATE POLICY "Company admin can create meetings"
  ON meetings FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM staffs
    WHERE user_id = auth.uid()
    AND role IN ('company_admin', 'system_admin', 'admin')
  ));

CREATE POLICY "Meeting creator or admin can update meetings"
  ON meetings FOR UPDATE
  USING (
    created_by IN (SELECT id FROM staffs WHERE user_id = auth.uid())
    OR company_id IN (
      SELECT company_id FROM staffs
      WHERE user_id = auth.uid()
      AND role IN ('company_admin', 'system_admin')
    )
  );

CREATE POLICY "Meeting creator or admin can delete meetings"
  ON meetings FOR DELETE
  USING (
    created_by IN (SELECT id FROM staffs WHERE user_id = auth.uid())
    OR company_id IN (
      SELECT company_id FROM staffs
      WHERE user_id = auth.uid()
      AND role IN ('company_admin', 'system_admin')
    )
  );

-- meeting_participants RLS
CREATE POLICY "Company staff can view participants"
  ON meeting_participants FOR SELECT
  USING (meeting_id IN (
    SELECT id FROM meetings
    WHERE company_id IN (
      SELECT company_id FROM staffs WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Meeting organizer can manage participants"
  ON meeting_participants FOR INSERT
  WITH CHECK (meeting_id IN (
    SELECT m.id FROM meetings m
    WHERE m.created_by IN (SELECT id FROM staffs WHERE user_id = auth.uid())
    OR m.company_id IN (
      SELECT company_id FROM staffs
      WHERE user_id = auth.uid()
      AND role IN ('company_admin', 'system_admin', 'admin')
    )
  ));

CREATE POLICY "Participant can update own status"
  ON meeting_participants FOR UPDATE
  USING (
    staff_id IN (SELECT id FROM staffs WHERE user_id = auth.uid())
    OR meeting_id IN (
      SELECT m.id FROM meetings m
      WHERE m.created_by IN (SELECT id FROM staffs WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Meeting organizer can delete participants"
  ON meeting_participants FOR DELETE
  USING (meeting_id IN (
    SELECT m.id FROM meetings m
    WHERE m.created_by IN (SELECT id FROM staffs WHERE user_id = auth.uid())
    OR m.company_id IN (
      SELECT company_id FROM staffs
      WHERE user_id = auth.uid()
      AND role IN ('company_admin', 'system_admin')
    )
  ));

-- meeting_notes RLS
CREATE POLICY "Meeting participants can view notes"
  ON meeting_notes FOR SELECT
  USING (meeting_id IN (
    SELECT mp.meeting_id FROM meeting_participants mp
    JOIN staffs s ON s.id = mp.staff_id
    WHERE s.user_id = auth.uid()
  ) OR meeting_id IN (
    SELECT id FROM meetings
    WHERE company_id IN (
      SELECT company_id FROM staffs
      WHERE user_id = auth.uid()
      AND role IN ('company_admin', 'system_admin')
    )
  ));

CREATE POLICY "Meeting participants can create notes"
  ON meeting_notes FOR INSERT
  WITH CHECK (meeting_id IN (
    SELECT mp.meeting_id FROM meeting_participants mp
    JOIN staffs s ON s.id = mp.staff_id
    WHERE s.user_id = auth.uid()
  ));

CREATE POLICY "Note author can update notes"
  ON meeting_notes FOR UPDATE
  USING (author_id IN (SELECT id FROM staffs WHERE user_id = auth.uid()));

-- meeting_agendas RLS
CREATE POLICY "Company staff can view agendas"
  ON meeting_agendas FOR SELECT
  USING (meeting_id IN (
    SELECT id FROM meetings
    WHERE company_id IN (
      SELECT company_id FROM staffs WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Meeting organizer can manage agendas"
  ON meeting_agendas FOR ALL
  USING (meeting_id IN (
    SELECT m.id FROM meetings m
    WHERE m.created_by IN (SELECT id FROM staffs WHERE user_id = auth.uid())
    OR m.company_id IN (
      SELECT company_id FROM staffs
      WHERE user_id = auth.uid()
      AND role IN ('company_admin', 'system_admin', 'admin')
    )
  ));

-- meeting_action_items RLS
CREATE POLICY "Company staff can view action items"
  ON meeting_action_items FOR SELECT
  USING (meeting_id IN (
    SELECT id FROM meetings
    WHERE company_id IN (
      SELECT company_id FROM staffs WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Meeting participants can create action items"
  ON meeting_action_items FOR INSERT
  WITH CHECK (meeting_id IN (
    SELECT mp.meeting_id FROM meeting_participants mp
    JOIN staffs s ON s.id = mp.staff_id
    WHERE s.user_id = auth.uid()
  ));

CREATE POLICY "Assignee or organizer can update action items"
  ON meeting_action_items FOR UPDATE
  USING (
    assignee_id IN (SELECT id FROM staffs WHERE user_id = auth.uid())
    OR meeting_id IN (
      SELECT m.id FROM meetings m
      WHERE m.created_by IN (SELECT id FROM staffs WHERE user_id = auth.uid())
    )
  );

-- meeting_attachments RLS
CREATE POLICY "Company staff can view attachments"
  ON meeting_attachments FOR SELECT
  USING (meeting_id IN (
    SELECT id FROM meetings
    WHERE company_id IN (
      SELECT company_id FROM staffs WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Meeting participants can upload attachments"
  ON meeting_attachments FOR INSERT
  WITH CHECK (meeting_id IN (
    SELECT mp.meeting_id FROM meeting_participants mp
    JOIN staffs s ON s.id = mp.staff_id
    WHERE s.user_id = auth.uid()
  ));

CREATE POLICY "Uploader can delete attachments"
  ON meeting_attachments FOR DELETE
  USING (uploaded_by IN (SELECT id FROM staffs WHERE user_id = auth.uid()));

-- ============================================
-- PART 8: 트리거 함수
-- ============================================

-- updated_at 자동 업데이트
DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_participants_updated_at ON meeting_participants;
CREATE TRIGGER update_meeting_participants_updated_at
  BEFORE UPDATE ON meeting_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_notes_updated_at ON meeting_notes;
CREATE TRIGGER update_meeting_notes_updated_at
  BEFORE UPDATE ON meeting_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_agendas_updated_at ON meeting_agendas;
CREATE TRIGGER update_meeting_agendas_updated_at
  BEFORE UPDATE ON meeting_agendas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_action_items_updated_at ON meeting_action_items;
CREATE TRIGGER update_meeting_action_items_updated_at
  BEFORE UPDATE ON meeting_action_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 회의 완료 시 duration 자동 계산
CREATE OR REPLACE FUNCTION calculate_meeting_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_meeting_duration ON meetings;
CREATE TRIGGER trigger_calculate_meeting_duration
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  WHEN (NEW.ended_at IS DISTINCT FROM OLD.ended_at)
  EXECUTE FUNCTION calculate_meeting_duration();

-- ============================================
-- PART 9: 헬퍼 함수
-- ============================================

-- 특정 직원의 예정된 회의 목록 조회
CREATE OR REPLACE FUNCTION get_upcoming_meetings(
  p_staff_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  meeting_id UUID,
  title VARCHAR,
  scheduled_at TIMESTAMPTZ,
  meeting_type VARCHAR,
  participant_role VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id as meeting_id,
    m.title,
    m.scheduled_at,
    m.meeting_type,
    mp.role as participant_role
  FROM meetings m
  JOIN meeting_participants mp ON mp.meeting_id = m.id
  WHERE mp.staff_id = p_staff_id
    AND m.status = 'scheduled'
    AND m.scheduled_at >= NOW()
  ORDER BY m.scheduled_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 특정 직원의 미완료 액션 아이템 조회
CREATE OR REPLACE FUNCTION get_pending_action_items(
  p_staff_id UUID
)
RETURNS TABLE (
  action_item_id UUID,
  title VARCHAR,
  due_date DATE,
  priority VARCHAR,
  meeting_title VARCHAR,
  meeting_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mai.id as action_item_id,
    mai.title,
    mai.due_date,
    mai.priority,
    m.title as meeting_title,
    m.id as meeting_id
  FROM meeting_action_items mai
  JOIN meetings m ON m.id = mai.meeting_id
  WHERE mai.assignee_id = p_staff_id
    AND mai.status IN ('pending', 'in_progress')
  ORDER BY
    CASE WHEN mai.due_date IS NULL THEN 1 ELSE 0 END,
    mai.due_date ASC,
    CASE mai.priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 회의 통계 조회
CREATE OR REPLACE FUNCTION get_meeting_statistics(
  p_company_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_meetings BIGINT,
  completed_meetings BIGINT,
  cancelled_meetings BIGINT,
  total_duration_minutes BIGINT,
  total_action_items BIGINT,
  completed_action_items BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT m.id) as total_meetings,
    COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) as completed_meetings,
    COUNT(DISTINCT CASE WHEN m.status = 'cancelled' THEN m.id END) as cancelled_meetings,
    COALESCE(SUM(m.duration_minutes), 0) as total_duration_minutes,
    COUNT(mai.id) as total_action_items,
    COUNT(CASE WHEN mai.status = 'completed' THEN mai.id END) as completed_action_items
  FROM meetings m
  LEFT JOIN meeting_action_items mai ON mai.meeting_id = m.id
  WHERE m.company_id = p_company_id
    AND m.scheduled_at >= p_start_date
    AND m.scheduled_at < p_end_date + INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
