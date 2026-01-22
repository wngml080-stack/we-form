-- ============================================
-- 시스템 공지사항 (개발자/관리자용)
-- ============================================

-- 시스템 전체 공지사항 테이블 (system_admin만 관리 가능)
CREATE TABLE IF NOT EXISTS system_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 공지사항 내용
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('urgent', 'normal', 'info', 'update')),

  -- 공지 유형
  announcement_type VARCHAR(50) DEFAULT 'general' CHECK (announcement_type IN ('general', 'update', 'maintenance', 'feature', 'notice')),

  -- 표시 기간
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE, -- NULL이면 무기한

  -- 메타
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,

  -- 작성자 정보
  created_by UUID REFERENCES staffs(id) ON DELETE SET NULL,

  -- 타임스탬프
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_system_announcements_dates ON system_announcements(start_date, end_date);
CREATE INDEX idx_system_announcements_active ON system_announcements(is_active, priority);
CREATE INDEX idx_system_announcements_type ON system_announcements(announcement_type);

-- RLS 정책
ALTER TABLE system_announcements ENABLE ROW LEVEL SECURITY;

-- 모든 로그인한 사용자가 조회 가능
CREATE POLICY "모든 사용자 시스템 공지 조회 가능" ON system_announcements
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 시스템 관리자만 관리 가능
CREATE POLICY "시스템 관리자만 시스템 공지 관리 가능" ON system_announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM staffs
      WHERE user_id = auth.uid()
      AND role = 'system_admin'
    )
  );

-- 코멘트
COMMENT ON TABLE system_announcements IS '시스템 공지사항 - 개발자/시스템 관리자가 전체 사용자에게 알리는 공지';
