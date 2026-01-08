-- 지출 관리 테이블
-- 매출관리와 함께 사용할 지출 데이터 저장

-- 지출 테이블
CREATE TABLE IF NOT EXISTS gym_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  amount NUMERIC(12,0) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50) DEFAULT 'card',
  vendor VARCHAR(200),
  receipt_memo TEXT,
  created_by UUID REFERENCES staffs(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 지출 카테고리 커스텀 옵션 테이블
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_gym_expenses_gym_id ON gym_expenses(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_expenses_company_id ON gym_expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_gym_expenses_expense_date ON gym_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_gym_expenses_category ON gym_expenses(category);
CREATE INDEX IF NOT EXISTS idx_expense_categories_gym_id ON expense_categories(gym_id);

-- RLS 정책
ALTER TABLE gym_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

-- gym_expenses RLS 정책
CREATE POLICY "Users can view expenses of their gym" ON gym_expenses
  FOR SELECT USING (
    gym_id IN (SELECT gym_id FROM staffs WHERE id = auth.uid())
    OR company_id IN (SELECT company_id FROM staffs WHERE id = auth.uid() AND role IN ('owner', 'hq_admin'))
  );

CREATE POLICY "Users can insert expenses to their gym" ON gym_expenses
  FOR INSERT WITH CHECK (
    gym_id IN (SELECT gym_id FROM staffs WHERE id = auth.uid())
    OR company_id IN (SELECT company_id FROM staffs WHERE id = auth.uid() AND role IN ('owner', 'hq_admin'))
  );

CREATE POLICY "Users can update expenses of their gym" ON gym_expenses
  FOR UPDATE USING (
    gym_id IN (SELECT gym_id FROM staffs WHERE id = auth.uid())
    OR company_id IN (SELECT company_id FROM staffs WHERE id = auth.uid() AND role IN ('owner', 'hq_admin'))
  );

CREATE POLICY "Users can delete expenses of their gym" ON gym_expenses
  FOR DELETE USING (
    gym_id IN (SELECT gym_id FROM staffs WHERE id = auth.uid())
    OR company_id IN (SELECT company_id FROM staffs WHERE id = auth.uid() AND role IN ('owner', 'hq_admin'))
  );

-- expense_categories RLS 정책
CREATE POLICY "Users can view expense categories of their gym" ON expense_categories
  FOR SELECT USING (
    gym_id IN (SELECT gym_id FROM staffs WHERE id = auth.uid())
    OR company_id IN (SELECT company_id FROM staffs WHERE id = auth.uid() AND role IN ('owner', 'hq_admin'))
  );

CREATE POLICY "Users can manage expense categories of their gym" ON expense_categories
  FOR ALL USING (
    gym_id IN (SELECT gym_id FROM staffs WHERE id = auth.uid())
    OR company_id IN (SELECT company_id FROM staffs WHERE id = auth.uid() AND role IN ('owner', 'hq_admin'))
  );

-- updated_at 자동 업데이트 트리거
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
