-- 지출 테이블에 계정과목(sub_category) 필드 추가
-- 대분류(category)에 따라 세부 계정과목을 저장

ALTER TABLE gym_expenses ADD COLUMN IF NOT EXISTS sub_category VARCHAR(100) DEFAULT '';
