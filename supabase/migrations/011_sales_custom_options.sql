-- 회원권 유형 커스텀 테이블
CREATE TABLE IF NOT EXISTS membership_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50) DEFAULT 'bg-gray-100 text-gray-700',
    is_default BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 결제 방법 커스텀 테이블
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    color VARCHAR(50) DEFAULT 'bg-gray-100 text-gray-700',
    is_default BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_membership_types_gym ON membership_types(gym_id);
CREATE INDEX IF NOT EXISTS idx_membership_types_company ON membership_types(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_gym ON payment_methods(gym_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_company ON payment_methods(company_id);

-- 기존 지점들에 기본 데이터 삽입
DO $$
DECLARE
    gym_record RECORD;
BEGIN
    FOR gym_record IN SELECT id, company_id FROM gyms LOOP
        -- 회원권 유형 기본값
        IF NOT EXISTS (SELECT 1 FROM membership_types WHERE gym_id = gym_record.id) THEN
            INSERT INTO membership_types (gym_id, company_id, name, color, is_default, display_order)
            VALUES
                (gym_record.id, gym_record.company_id, '헬스', 'bg-blue-100 text-blue-700', TRUE, 1),
                (gym_record.id, gym_record.company_id, '필라테스', 'bg-pink-100 text-pink-700', TRUE, 2),
                (gym_record.id, gym_record.company_id, 'PT', 'bg-purple-100 text-purple-700', TRUE, 3),
                (gym_record.id, gym_record.company_id, 'PPT', 'bg-violet-100 text-violet-700', TRUE, 4),
                (gym_record.id, gym_record.company_id, 'GPT', 'bg-indigo-100 text-indigo-700', TRUE, 5),
                (gym_record.id, gym_record.company_id, '골프', 'bg-green-100 text-green-700', TRUE, 6),
                (gym_record.id, gym_record.company_id, 'GX', 'bg-orange-100 text-orange-700', TRUE, 7);
        END IF;
        -- 결제 방법 기본값
        IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE gym_id = gym_record.id) THEN
            INSERT INTO payment_methods (gym_id, company_id, name, code, color, is_default, display_order)
            VALUES
                (gym_record.id, gym_record.company_id, '카드', 'card', 'bg-blue-100 text-blue-700', TRUE, 1),
                (gym_record.id, gym_record.company_id, '현금', 'cash', 'bg-emerald-100 text-emerald-700', TRUE, 2),
                (gym_record.id, gym_record.company_id, '계좌이체', 'transfer', 'bg-purple-100 text-purple-700', TRUE, 3);
        END IF;
    END LOOP;
END $$;

-- RLS 정책
ALTER TABLE membership_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "membership_types_select" ON membership_types FOR SELECT USING (true);
CREATE POLICY "membership_types_insert" ON membership_types FOR INSERT WITH CHECK (true);
CREATE POLICY "membership_types_update" ON membership_types FOR UPDATE USING (true);
CREATE POLICY "membership_types_delete" ON membership_types FOR DELETE USING (true);

CREATE POLICY "payment_methods_select" ON payment_methods FOR SELECT USING (true);
CREATE POLICY "payment_methods_insert" ON payment_methods FOR INSERT WITH CHECK (true);
CREATE POLICY "payment_methods_update" ON payment_methods FOR UPDATE USING (true);
CREATE POLICY "payment_methods_delete" ON payment_methods FOR DELETE USING (true);
