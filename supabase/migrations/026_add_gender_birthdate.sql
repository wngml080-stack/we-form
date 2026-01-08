-- Add gender and birth_date columns to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Add comment for columns
COMMENT ON COLUMN members.gender IS '성별 (male/female)';
COMMENT ON COLUMN members.birth_date IS '생년월일';
