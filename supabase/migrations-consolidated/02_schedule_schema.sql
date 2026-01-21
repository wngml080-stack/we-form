-- =====================================================
-- We:Form 통합 마이그레이션 - 02. Schedule Schema
-- =====================================================
-- 스케줄: schedules, monthly_schedule_reports, attendances
-- =====================================================

-- 1. Monthly Schedule Reports (월간 스케줄 보고서)
CREATE TABLE IF NOT EXISTS monthly_schedule_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID REFERENCES staffs(id) ON DELETE CASCADE NOT NULL,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    year_month VARCHAR(7) NOT NULL,  -- YYYY-MM format
    stats JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES staffs(id),
    staff_memo TEXT,
    admin_memo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(staff_id, year_month)
);

-- 2. Schedules (스케줄)
CREATE TABLE IF NOT EXISTS schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID REFERENCES staffs(id) ON DELETE CASCADE NOT NULL,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    member_name VARCHAR(100),
    title VARCHAR(255),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    schedule_type VARCHAR(50) CHECK (schedule_type IN ('inside', 'outside', 'weekend', 'holiday', 'bc', 'body_challenge')),
    sub_type VARCHAR(50),  -- sales/info/status/other for PT, lunch/meeting/rest/workout/other for personal
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show', 'no_show_deducted')),
    counted_for_salary BOOLEAN DEFAULT true,
    is_locked BOOLEAN DEFAULT false,
    report_id UUID REFERENCES monthly_schedule_reports(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Attendances (출석 기록)
CREATE TABLE IF NOT EXISTS attendances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES staffs(id) ON DELETE SET NULL,
    attendance_date DATE NOT NULL,
    attendance_status VARCHAR(50) REFERENCES attendance_statuses(code),
    memo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_monthly_schedule_reports_staff_id ON monthly_schedule_reports(staff_id);
CREATE INDEX IF NOT EXISTS idx_monthly_schedule_reports_gym_id ON monthly_schedule_reports(gym_id);
CREATE INDEX IF NOT EXISTS idx_monthly_schedule_reports_company_id ON monthly_schedule_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_monthly_schedule_reports_year_month ON monthly_schedule_reports(year_month);
CREATE INDEX IF NOT EXISTS idx_monthly_schedule_reports_status ON monthly_schedule_reports(status);

CREATE INDEX IF NOT EXISTS idx_schedules_staff_id ON schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_schedules_gym_id ON schedules(gym_id);
CREATE INDEX IF NOT EXISTS idx_schedules_company_id ON schedules(company_id);
CREATE INDEX IF NOT EXISTS idx_schedules_member_id ON schedules(member_id);
CREATE INDEX IF NOT EXISTS idx_schedules_start_time ON schedules(start_time);
CREATE INDEX IF NOT EXISTS idx_schedules_schedule_type ON schedules(schedule_type);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);
CREATE INDEX IF NOT EXISTS idx_schedules_report_id ON schedules(report_id);
CREATE INDEX IF NOT EXISTS idx_schedules_is_locked ON schedules(is_locked);

CREATE INDEX IF NOT EXISTS idx_attendances_member_id ON attendances(member_id);
CREATE INDEX IF NOT EXISTS idx_attendances_gym_id ON attendances(gym_id);
CREATE INDEX IF NOT EXISTS idx_attendances_company_id ON attendances(company_id);
CREATE INDEX IF NOT EXISTS idx_attendances_schedule_id ON attendances(schedule_id);
CREATE INDEX IF NOT EXISTS idx_attendances_date ON attendances(attendance_date);

-- =====================================================
-- Function: 스케줄 타입 분류
-- =====================================================
CREATE OR REPLACE FUNCTION classify_schedule_type(
    p_start_time TIMESTAMPTZ,
    p_work_start TIME,
    p_work_end TIME
)
RETURNS TEXT AS $$
DECLARE
    v_date DATE;
    v_time TIME;
    v_day_of_week INTEGER;
BEGIN
    v_date := p_start_time::DATE;
    v_time := p_start_time::TIME;
    v_day_of_week := EXTRACT(DOW FROM p_start_time);

    -- 주말 체크 (0=일요일, 6=토요일)
    IF v_day_of_week IN (0, 6) THEN
        RETURN 'weekend';
    END IF;

    -- 근무시간 내/외 체크
    IF p_work_start IS NOT NULL AND p_work_end IS NOT NULL THEN
        IF v_time >= p_work_start AND v_time < p_work_end THEN
            RETURN 'inside';
        ELSE
            RETURN 'outside';
        END IF;
    END IF;

    RETURN 'inside';  -- 기본값
END;
$$ LANGUAGE plpgsql;
