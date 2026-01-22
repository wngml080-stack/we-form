-- 회원 성별/생년월일 업데이트 함수 (스키마 캐시 우회)
CREATE OR REPLACE FUNCTION update_member_gender_birthdate(
  p_gym_id UUID,
  p_phone TEXT,
  p_gender TEXT DEFAULT NULL,
  p_birth_date DATE DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE members
  SET
    gender = COALESCE(p_gender, gender),
    birth_date = COALESCE(p_birth_date, birth_date)
  WHERE gym_id = p_gym_id
    AND (phone = p_phone OR phone = REPLACE(p_phone, '-', ''));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 회원 정보 조회 함수 (성별/생년월일 포함)
CREATE OR REPLACE FUNCTION get_members_by_phones(
  p_gym_id UUID,
  p_phones TEXT[]
)
RETURNS TABLE (
  phone TEXT,
  gender TEXT,
  birth_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT m.phone, m.gender, m.birth_date
  FROM members m
  WHERE m.gym_id = p_gym_id
    AND m.phone = ANY(p_phones);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
