-- =====================================================
-- We:Form 통합 마이그레이션 - 06. Settings Schema
-- =====================================================
-- 공지: announcements, system_announcements, company_events
-- 지출: gym_expenses, expense_categories
-- 통합: user_google_tokens
-- =====================================================

-- 1. Announcements (지점/회사 공지)
CREATE TABLE IF NOT EXISTS announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,  -- NULL = 회사 전체 공지
    title VARCHAR(255) NOT NULL,
    content TEXT,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('urgent', 'normal', 'low')),
    author_id UUID REFERENCES staffs(id) ON DELETE SET NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. System Announcements (시스템 공지 - 개발자용)
CREATE TABLE IF NOT EXISTS system_announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('urgent', 'normal', 'info', 'update')),
    announcement_type VARCHAR(50) DEFAULT 'general' CHECK (announcement_type IN ('general', 'update', 'maintenance', 'feature', 'notice')),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES staffs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Company Events (회사 행사)
CREATE TABLE IF NOT EXISTS company_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,  -- NULL = 회사 전체
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) DEFAULT 'general' CHECK (event_type IN ('general', 'training', 'meeting', 'holiday', 'celebration')),
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    target_audience VARCHAR(50) DEFAULT 'all' CHECK (target_audience IN ('all', 'management', 'trainers', 'specific')),
    is_active BOOLEAN DEFAULT true,
    color VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Gym Expenses (지출 관리)
CREATE TABLE IF NOT EXISTS gym_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    expense_date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100) DEFAULT '',
    description TEXT,
    amount NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(50) CHECK (payment_method IN ('card', 'cash', 'transfer')),
    account_holder VARCHAR(100),
    receipt_memo TEXT,
    tax_invoice_issued BOOLEAN DEFAULT false,
    tax_invoice_date DATE,
    card_receipt_collected BOOLEAN DEFAULT false,
    created_by UUID REFERENCES staffs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Expense Categories (지출 카테고리)
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. User Google Tokens (Google OAuth)
CREATE TABLE IF NOT EXISTS user_google_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID REFERENCES staffs(id) ON DELETE CASCADE NOT NULL UNIQUE,
    google_email VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    scopes TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_announcements_company_id ON announcements(company_id);
CREATE INDEX IF NOT EXISTS idx_announcements_gym_id ON announcements(gym_id);
CREATE INDEX IF NOT EXISTS idx_announcements_company_gym ON announcements(company_id, gym_id);
CREATE INDEX IF NOT EXISTS idx_announcements_dates ON announcements(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);

CREATE INDEX IF NOT EXISTS idx_system_announcements_dates ON system_announcements(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_system_announcements_is_active ON system_announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_system_announcements_type ON system_announcements(announcement_type);

CREATE INDEX IF NOT EXISTS idx_company_events_company_id ON company_events(company_id);
CREATE INDEX IF NOT EXISTS idx_company_events_gym_id ON company_events(gym_id);
CREATE INDEX IF NOT EXISTS idx_company_events_date ON company_events(event_date);
CREATE INDEX IF NOT EXISTS idx_company_events_is_active ON company_events(is_active);

CREATE INDEX IF NOT EXISTS idx_gym_expenses_gym_id ON gym_expenses(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_expenses_company_id ON gym_expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_gym_expenses_expense_date ON gym_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_gym_expenses_category ON gym_expenses(category);

CREATE INDEX IF NOT EXISTS idx_expense_categories_gym_id ON expense_categories(gym_id);

CREATE INDEX IF NOT EXISTS idx_user_google_tokens_staff_id ON user_google_tokens(staff_id);

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_gym_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gym_expenses_updated_at
    BEFORE UPDATE ON gym_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_gym_expenses_updated_at();

CREATE OR REPLACE FUNCTION update_user_google_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_google_tokens_updated_at
    BEFORE UPDATE ON user_google_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_user_google_tokens_updated_at();
