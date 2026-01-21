-- =====================================================
-- We:Form 통합 마이그레이션 - 00. Core Schema
-- =====================================================
-- 기본 테이블: companies, gyms, staffs, members, attendance_statuses
-- =====================================================

-- 1. Companies (회사)
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    representative_name VARCHAR(100),
    contact_phone VARCHAR(20),
    business_number VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Gyms (지점)
CREATE TABLE IF NOT EXISTS gyms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    category VARCHAR(100),
    size VARCHAR(50),
    open_date DATE,
    memo TEXT,
    fc_bep NUMERIC(10,2),
    pt_bep NUMERIC(10,2),
    plan VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Staffs (직원)
CREATE TABLE IF NOT EXISTS staffs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    job_title VARCHAR(100),
    job_position_code VARCHAR(50),
    role VARCHAR(50) DEFAULT 'staff' CHECK (role IN ('system_admin', 'company_admin', 'admin', 'manager', 'staff', 'director')),
    employment_status VARCHAR(20) DEFAULT '재직' CHECK (employment_status IN ('재직', '퇴사', '휴직')),
    work_start_time TIME,
    work_end_time TIME,
    joined_at DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 4. Members (회원)
CREATE TABLE IF NOT EXISTS members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    trainer_id UUID REFERENCES staffs(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    gender TEXT CHECK (gender IN ('M', 'F')),
    birth_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    memo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Attendance Statuses (출석 상태 코드)
CREATE TABLE IF NOT EXISTS attendance_statuses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_gyms_company_id ON gyms(company_id);
CREATE INDEX IF NOT EXISTS idx_staffs_user_id ON staffs(user_id);
CREATE INDEX IF NOT EXISTS idx_staffs_company_id ON staffs(company_id);
CREATE INDEX IF NOT EXISTS idx_staffs_gym_id ON staffs(gym_id);
CREATE INDEX IF NOT EXISTS idx_members_gym_id ON members(gym_id);
CREATE INDEX IF NOT EXISTS idx_members_company_id ON members(company_id);
CREATE INDEX IF NOT EXISTS idx_members_trainer_id ON members(trainer_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_created_at ON members(created_at);

-- Text search 인덱스 (pg_trgm 필요)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_members_name_trgm ON members USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_members_phone_trgm ON members USING gin(phone gin_trgm_ops);

-- =====================================================
-- 기본 출석 상태 코드 삽입
-- =====================================================
INSERT INTO attendance_statuses (code, name, description) VALUES
    ('PT', 'PT 수업', 'PT 수업 완료'),
    ('OT', 'OT 수업', 'OT 수업 완료'),
    ('BC', '바디챌린지', '바디챌린지 수업'),
    ('NO_SHOW', '노쇼', '예약 불참'),
    ('CANCEL', '취소', '수업 취소')
ON CONFLICT (code) DO NOTHING;
