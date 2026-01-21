-- =====================================================
-- We:Form 통합 마이그레이션 - 08. Functions
-- =====================================================
-- 추가 함수: 회원 정보 업데이트, 전화번호 조회 등
-- =====================================================

-- =====================================================
-- 1. 회원 성별/생년월일 업데이트 함수
-- =====================================================
CREATE OR REPLACE FUNCTION update_member_gender_birthdate(
    p_gym_id UUID,
    p_phone TEXT,
    p_gender TEXT,
    p_birth_date TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_member_id UUID;
    v_result JSONB;
BEGIN
    -- 전화번호로 회원 찾기
    SELECT id INTO v_member_id
    FROM members
    WHERE gym_id = p_gym_id
      AND phone = p_phone
    LIMIT 1;

    IF v_member_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Member not found');
    END IF;

    -- 업데이트
    UPDATE members
    SET gender = p_gender,
        birth_date = p_birth_date::DATE,
        updated_at = NOW()
    WHERE id = v_member_id;

    RETURN jsonb_build_object('success', true, 'member_id', v_member_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. 전화번호 배열로 회원 조회
-- =====================================================
CREATE OR REPLACE FUNCTION get_members_by_phones(
    p_gym_id UUID,
    p_phones TEXT[]
)
RETURNS TABLE(
    id UUID,
    name TEXT,
    phone TEXT,
    gender TEXT,
    birth_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT m.id, m.name::TEXT, m.phone::TEXT, m.gender::TEXT, m.birth_date
    FROM members m
    WHERE m.gym_id = p_gym_id
      AND m.phone = ANY(p_phones);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. 전화번호 포맷팅 함수
-- =====================================================
CREATE OR REPLACE FUNCTION format_phone_number(phone TEXT)
RETURNS TEXT AS $$
BEGIN
    -- 숫자만 추출
    phone := regexp_replace(phone, '[^0-9]', '', 'g');

    -- 010으로 시작하는 11자리
    IF length(phone) = 11 AND phone LIKE '010%' THEN
        RETURN substr(phone, 1, 3) || '-' || substr(phone, 4, 4) || '-' || substr(phone, 8, 4);
    -- 02로 시작하는 서울 지역번호
    ELSIF phone LIKE '02%' THEN
        IF length(phone) = 9 THEN
            RETURN '02-' || substr(phone, 3, 3) || '-' || substr(phone, 6, 4);
        ELSIF length(phone) = 10 THEN
            RETURN '02-' || substr(phone, 3, 4) || '-' || substr(phone, 7, 4);
        END IF;
    -- 기타 지역번호 (3자리)
    ELSIF length(phone) = 10 THEN
        RETURN substr(phone, 1, 3) || '-' || substr(phone, 4, 3) || '-' || substr(phone, 7, 4);
    ELSIF length(phone) = 11 THEN
        RETURN substr(phone, 1, 3) || '-' || substr(phone, 4, 4) || '-' || substr(phone, 8, 4);
    END IF;

    -- 변환 불가시 원본 반환
    RETURN phone;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 4. Generic updated_at 트리거 함수
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. 마이그레이션 트래커
-- =====================================================
CREATE TABLE IF NOT EXISTS migration_history (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    checksum VARCHAR(64),
    notes TEXT
);

CREATE OR REPLACE FUNCTION execute_migration(
    p_migration_name VARCHAR(255),
    p_checksum VARCHAR(64) DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- 이미 실행된 마이그레이션인지 확인
    IF EXISTS (SELECT 1 FROM migration_history WHERE migration_name = p_migration_name) THEN
        RAISE NOTICE 'Migration % already executed, skipping.', p_migration_name;
        RETURN FALSE;
    END IF;

    -- 마이그레이션 기록
    INSERT INTO migration_history (migration_name, checksum, notes)
    VALUES (p_migration_name, p_checksum, p_notes);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 실행된 마이그레이션 뷰
CREATE OR REPLACE VIEW executed_migrations AS
SELECT migration_name, executed_at, notes
FROM migration_history
ORDER BY executed_at DESC;
