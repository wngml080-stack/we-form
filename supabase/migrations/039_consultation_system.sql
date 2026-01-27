-- ============================================
-- 상담 관리 시스템
-- 039_consultation_system.sql
-- ============================================

-- ============================================
-- PART 1: 상담 문의(consultations) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,

  -- 문의자 기본 정보
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  customer_gender VARCHAR(10),
  customer_birthdate DATE,

  -- 문의 채널
  channel VARCHAR(30) NOT NULL DEFAULT 'phone'
    CHECK (channel IN ('naver', 'phone', 'instagram', 'visit', 'kakao', 'website', 'referral', 'etc')),

  -- 문의 유형
  consultation_type VARCHAR(30) NOT NULL DEFAULT 'PT'
    CHECK (consultation_type IN ('PT', 'health', 'pilates', 'GX', 'etc')),

  -- 문의 내용
  content TEXT,
  notes TEXT,

  -- 상태 관리
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'contacted', 'scheduled', 'completed', 'converted', 'canceled', 'no_show')),

  -- 담당자
  assigned_staff_id UUID REFERENCES staffs(id) ON DELETE SET NULL,

  -- 예약 정보 (상담 예약)
  scheduled_date DATE,
  scheduled_time TIME,

  -- 전환 정보 (회원으로 전환 시)
  converted_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,

  -- 우선순위
  priority VARCHAR(10) DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- 소개자 정보 (referral 채널인 경우)
  referrer_name VARCHAR(100),
  referrer_phone VARCHAR(20),

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE consultations IS '상담 문의';
COMMENT ON COLUMN consultations.channel IS '문의 채널: naver, phone, instagram, visit, kakao, website, referral, etc';
COMMENT ON COLUMN consultations.status IS '상태: pending(대기), contacted(연락함), scheduled(예약됨), completed(상담완료), converted(회원전환), canceled(취소), no_show(노쇼)';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_consultations_company ON consultations(company_id);
CREATE INDEX IF NOT EXISTS idx_consultations_gym ON consultations(gym_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_channel ON consultations(channel);
CREATE INDEX IF NOT EXISTS idx_consultations_assigned ON consultations(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_consultations_scheduled ON consultations(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_consultations_created ON consultations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_phone ON consultations(customer_phone);

-- ============================================
-- PART 2: 상담 기록지(consultation_records) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS consultation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,

  -- 기본 정보
  member_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  assigned_trainer_id UUID REFERENCES staffs(id) ON DELETE SET NULL,
  consultation_type VARCHAR(20) DEFAULT '신규',
  first_meeting_date DATE,

  -- 상담 기록 데이터 (JSON으로 저장)
  visit_source JSONB,
  exercise_experiences JSONB,
  dropout_reasons JSONB,
  trainer_memo TEXT,
  pain_areas JSONB,
  medical_history JSONB,
  current_treatment JSONB,
  lifestyle_pattern JSONB,
  meal_pattern JSONB,
  diet_goal JSONB,
  rehab_goal JSONB,
  strength_goal JSONB,
  habit_goal JSONB,
  other_goal JSONB,
  goal_motivation JSONB,
  available_time JSONB,

  -- 추가 메모
  additional_notes TEXT,

  -- 작성자
  created_by UUID NOT NULL REFERENCES staffs(id) ON DELETE SET NULL,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE consultation_records IS '상담 기록지 (상세 상담 내용)';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_consultation_records_consultation ON consultation_records(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_records_member ON consultation_records(member_id);
CREATE INDEX IF NOT EXISTS idx_consultation_records_gym ON consultation_records(gym_id);
CREATE INDEX IF NOT EXISTS idx_consultation_records_trainer ON consultation_records(assigned_trainer_id);

-- ============================================
-- PART 3: 상담 활동 로그(consultation_logs) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS consultation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,

  -- 활동 유형
  action_type VARCHAR(30) NOT NULL
    CHECK (action_type IN ('created', 'status_changed', 'assigned', 'contacted', 'scheduled', 'note_added', 'converted')),

  -- 활동 내용
  description TEXT,
  old_value TEXT,
  new_value TEXT,

  -- 수행자
  performed_by UUID NOT NULL REFERENCES staffs(id) ON DELETE SET NULL,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE consultation_logs IS '상담 활동 로그';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_consultation_logs_consultation ON consultation_logs(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_logs_created ON consultation_logs(created_at DESC);

-- ============================================
-- PART 4: RLS 정책
-- ============================================

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_logs ENABLE ROW LEVEL SECURITY;

-- consultations RLS
CREATE POLICY "Company staff can view consultations"
  ON consultations FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM staffs WHERE user_id = auth.uid()
  ));

CREATE POLICY "Staff can create consultations"
  ON consultations FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM staffs WHERE user_id = auth.uid()
  ));

CREATE POLICY "Staff can update consultations"
  ON consultations FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM staffs WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admin can delete consultations"
  ON consultations FOR DELETE
  USING (company_id IN (
    SELECT company_id FROM staffs
    WHERE user_id = auth.uid()
    AND role IN ('company_admin', 'system_admin', 'admin')
  ));

-- consultation_records RLS
CREATE POLICY "Company staff can view records"
  ON consultation_records FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM staffs WHERE user_id = auth.uid()
  ));

CREATE POLICY "Staff can create records"
  ON consultation_records FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM staffs WHERE user_id = auth.uid()
  ));

CREATE POLICY "Creator or admin can update records"
  ON consultation_records FOR UPDATE
  USING (
    created_by IN (SELECT id FROM staffs WHERE user_id = auth.uid())
    OR company_id IN (
      SELECT company_id FROM staffs
      WHERE user_id = auth.uid()
      AND role IN ('company_admin', 'system_admin', 'admin')
    )
  );

-- consultation_logs RLS
CREATE POLICY "Company staff can view logs"
  ON consultation_logs FOR SELECT
  USING (consultation_id IN (
    SELECT id FROM consultations
    WHERE company_id IN (
      SELECT company_id FROM staffs WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Staff can create logs"
  ON consultation_logs FOR INSERT
  WITH CHECK (consultation_id IN (
    SELECT id FROM consultations
    WHERE company_id IN (
      SELECT company_id FROM staffs WHERE user_id = auth.uid()
    )
  ));

-- ============================================
-- PART 5: 트리거 함수
-- ============================================

-- updated_at 자동 업데이트
DROP TRIGGER IF EXISTS update_consultations_updated_at ON consultations;
CREATE TRIGGER update_consultations_updated_at
  BEFORE UPDATE ON consultations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_consultation_records_updated_at ON consultation_records;
CREATE TRIGGER update_consultation_records_updated_at
  BEFORE UPDATE ON consultation_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 상담 상태 변경 시 자동 로그 생성
CREATE OR REPLACE FUNCTION log_consultation_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO consultation_logs (
      consultation_id,
      action_type,
      old_value,
      new_value,
      performed_by
    )
    SELECT
      NEW.id,
      'status_changed',
      OLD.status,
      NEW.status,
      s.id
    FROM staffs s
    WHERE s.user_id = auth.uid()
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_consultation_status ON consultations;
CREATE TRIGGER trigger_log_consultation_status
  AFTER UPDATE ON consultations
  FOR EACH ROW
  EXECUTE FUNCTION log_consultation_status_change();

-- ============================================
-- PART 6: 헬퍼 함수
-- ============================================

-- 상담 통계 조회
CREATE OR REPLACE FUNCTION get_consultation_stats(
  p_gym_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_count BIGINT,
  pending_count BIGINT,
  scheduled_count BIGINT,
  completed_count BIGINT,
  converted_count BIGINT,
  conversion_rate NUMERIC,
  by_channel JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COUNT(*) FILTER (WHERE status = 'converted') as converted
    FROM consultations c
    WHERE c.gym_id = p_gym_id
      AND (p_start_date IS NULL OR c.created_at >= p_start_date)
      AND (p_end_date IS NULL OR c.created_at < p_end_date + INTERVAL '1 day')
  ),
  channel_stats AS (
    SELECT jsonb_object_agg(channel, cnt) as by_channel
    FROM (
      SELECT channel, COUNT(*) as cnt
      FROM consultations c
      WHERE c.gym_id = p_gym_id
        AND (p_start_date IS NULL OR c.created_at >= p_start_date)
        AND (p_end_date IS NULL OR c.created_at < p_end_date + INTERVAL '1 day')
      GROUP BY channel
    ) sub
  )
  SELECT
    s.total as total_count,
    s.pending as pending_count,
    s.scheduled as scheduled_count,
    s.completed as completed_count,
    s.converted as converted_count,
    CASE WHEN s.total > 0 THEN ROUND(s.converted::NUMERIC / s.total * 100, 1) ELSE 0 END as conversion_rate,
    COALESCE(cs.by_channel, '{}'::jsonb) as by_channel
  FROM stats s, channel_stats cs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 오늘 상담 목록 조회
CREATE OR REPLACE FUNCTION get_today_consultations(p_gym_id UUID)
RETURNS TABLE (
  id UUID,
  customer_name VARCHAR,
  customer_phone VARCHAR,
  scheduled_time TIME,
  consultation_type VARCHAR,
  assigned_staff_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.customer_name,
    c.customer_phone,
    c.scheduled_time,
    c.consultation_type,
    s.name as assigned_staff_name
  FROM consultations c
  LEFT JOIN staffs s ON s.id = c.assigned_staff_id
  WHERE c.gym_id = p_gym_id
    AND c.scheduled_date = CURRENT_DATE
    AND c.status = 'scheduled'
  ORDER BY c.scheduled_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
