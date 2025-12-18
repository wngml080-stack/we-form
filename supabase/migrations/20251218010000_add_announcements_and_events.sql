-- 공지사항 및 회사 행사 테이블 생성

-- 1. 공지사항 테이블
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE, -- NULL이면 전사 공지, 값이 있으면 해당 지점만

  -- 공지사항 내용
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('urgent', 'normal', 'low')),

  -- 작성자 정보
  author_id UUID REFERENCES staffs(id) ON DELETE SET NULL,

  -- 표시 기간
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE, -- NULL이면 무기한

  -- 메타
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,

  -- 타임스탬프
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 회사 행사 일정 테이블
CREATE TABLE IF NOT EXISTS company_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE, -- NULL이면 전사 행사

  -- 행사 정보
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) DEFAULT 'general' CHECK (event_type IN ('general', 'training', 'meeting', 'holiday', 'celebration')),

  -- 일정
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location VARCHAR(200),

  -- 참석 대상
  target_audience VARCHAR(50) DEFAULT 'all' CHECK (target_audience IN ('all', 'management', 'trainers', 'specific')),

  -- 메타
  is_active BOOLEAN DEFAULT true,
  color VARCHAR(20) DEFAULT 'blue', -- 캘린더 표시 색상

  -- 타임스탬프
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_announcements_company_gym ON announcements(company_id, gym_id);
CREATE INDEX idx_announcements_dates ON announcements(start_date, end_date);
CREATE INDEX idx_announcements_active ON announcements(is_active, priority);

CREATE INDEX idx_company_events_company_gym ON company_events(company_id, gym_id);
CREATE INDEX idx_company_events_date ON company_events(event_date);
CREATE INDEX idx_company_events_active ON company_events(is_active);

-- RLS 정책
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_events ENABLE ROW LEVEL SECURITY;

-- 공지사항 정책
CREATE POLICY "직원은 자신의 회사/지점 공지 조회 가능" ON announcements
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM staffs WHERE user_id = auth.uid())
    AND (
      gym_id IS NULL -- 전사 공지
      OR gym_id IN (SELECT gym_id FROM staffs WHERE user_id = auth.uid()) -- 지점 공지
    )
  );

CREATE POLICY "관리자는 공지 작성 가능" ON announcements
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM staffs
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'company_admin', 'system_admin')
    )
  );

-- 행사 일정 정책
CREATE POLICY "직원은 자신의 회사/지점 행사 조회 가능" ON company_events
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM staffs WHERE user_id = auth.uid())
    AND (
      gym_id IS NULL -- 전사 행사
      OR gym_id IN (SELECT gym_id FROM staffs WHERE user_id = auth.uid()) -- 지점 행사
    )
  );

CREATE POLICY "관리자는 행사 관리 가능" ON company_events
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM staffs
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'company_admin', 'system_admin')
    )
  );

-- 코멘트
COMMENT ON TABLE announcements IS '공지사항 - 전사/지점별 공지 관리';
COMMENT ON TABLE company_events IS '회사 행사 일정 - 전사/지점별 행사 관리';
