-- =====================================================
-- We:Form 통합 마이그레이션 - 01. Membership Schema
-- =====================================================
-- 회원권 관련: member_memberships, member_payments, membership_products
-- 커스텀 옵션: sale_types, membership_categories, membership_names, payment_methods
-- =====================================================

-- 1. Member Memberships (회원권)
CREATE TABLE IF NOT EXISTS member_memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    membership_type VARCHAR(100) NOT NULL,
    sessions INTEGER DEFAULT 0,
    used_sessions INTEGER DEFAULT 0,
    service_sessions INTEGER DEFAULT 0,
    used_service_sessions INTEGER DEFAULT 0,
    amount BIGINT DEFAULT 0,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired', 'transferred')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Member Payments (매출/결제)
CREATE TABLE IF NOT EXISTS member_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,  -- nullable for non-member sales
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    membership_type VARCHAR(100),
    registration_type VARCHAR(50) CHECK (registration_type IN ('신규', '재등록', '추가', '양도', '환불', '부가상품')),
    amount BIGINT DEFAULT 0,
    total_amount BIGINT,
    payment_method VARCHAR(50),
    visit_route VARCHAR(100),
    registrar VARCHAR(100),
    installment_count INTEGER DEFAULT 1,
    installment_current INTEGER DEFAULT 1,
    bonus_sessions INTEGER DEFAULT 0,
    gender TEXT CHECK (gender IN ('M', 'F')),
    birth_date TEXT,
    created_by UUID REFERENCES staffs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Membership Products (상품 템플릿)
CREATE TABLE IF NOT EXISTS membership_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    membership_type VARCHAR(100) CHECK (membership_type IN ('헬스', '필라테스', 'PT', 'PPT', 'GPT', 'GX', '골프', '하이록스', '러닝', '크로스핏', '부가상품')),
    default_sessions INTEGER,
    default_price NUMERIC(12,2),
    validity_months INTEGER,
    days_per_session INTEGER,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Sale Types (매출 유형 커스텀)
CREATE TABLE IF NOT EXISTS sale_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50) DEFAULT 'bg-gray-100 text-gray-700',
    is_default BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Membership Categories (회원권 카테고리)
CREATE TABLE IF NOT EXISTS membership_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50) DEFAULT 'bg-gray-100 text-gray-700',
    is_default BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Membership Names (회원권 이름)
CREATE TABLE IF NOT EXISTS membership_names (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50) DEFAULT 'bg-gray-100 text-gray-700',
    is_default BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Payment Methods (결제 방법)
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    color VARCHAR(50) DEFAULT 'bg-gray-100 text-gray-700',
    is_default BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_member_memberships_member_id ON member_memberships(member_id);
CREATE INDEX IF NOT EXISTS idx_member_memberships_gym_id ON member_memberships(gym_id);
CREATE INDEX IF NOT EXISTS idx_member_memberships_company_id ON member_memberships(company_id);
CREATE INDEX IF NOT EXISTS idx_member_memberships_status ON member_memberships(status);

CREATE INDEX IF NOT EXISTS idx_member_payments_member_id ON member_payments(member_id);
CREATE INDEX IF NOT EXISTS idx_member_payments_gym_id ON member_payments(gym_id);
CREATE INDEX IF NOT EXISTS idx_member_payments_company_id ON member_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_member_payments_membership_type ON member_payments(membership_type);
CREATE INDEX IF NOT EXISTS idx_member_payments_registration_type ON member_payments(registration_type);
CREATE INDEX IF NOT EXISTS idx_member_payments_created_by ON member_payments(created_by);
CREATE INDEX IF NOT EXISTS idx_member_payments_created_at ON member_payments(created_at);

CREATE INDEX IF NOT EXISTS idx_membership_products_gym_id ON membership_products(gym_id);
CREATE INDEX IF NOT EXISTS idx_membership_products_company_id ON membership_products(company_id);

CREATE INDEX IF NOT EXISTS idx_sale_types_gym_id ON sale_types(gym_id);
CREATE INDEX IF NOT EXISTS idx_membership_categories_gym_id ON membership_categories(gym_id);
CREATE INDEX IF NOT EXISTS idx_membership_names_gym_id ON membership_names(gym_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_gym_id ON payment_methods(gym_id);

-- =====================================================
-- Trigger: updated_at 자동 갱신
-- =====================================================
CREATE OR REPLACE FUNCTION update_membership_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_membership_products_updated_at
    BEFORE UPDATE ON membership_products
    FOR EACH ROW
    EXECUTE FUNCTION update_membership_products_updated_at();
