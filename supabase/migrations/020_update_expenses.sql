-- 지출 테이블에 새 필드 추가
-- vendor -> account_holder (예금주명)
-- 세금계산서 발행 여부/발행일 (현금, 계좌이체용)
-- 카드영수증 수집 여부 (카드용)

-- 컬럼명 변경: vendor -> account_holder
ALTER TABLE gym_expenses RENAME COLUMN vendor TO account_holder;

-- 세금계산서 발행 여부 (현금/계좌이체 결제 시)
ALTER TABLE gym_expenses ADD COLUMN IF NOT EXISTS tax_invoice_issued BOOLEAN DEFAULT false;

-- 세금계산서 발행일
ALTER TABLE gym_expenses ADD COLUMN IF NOT EXISTS tax_invoice_date DATE;

-- 카드영수증 수집 여부 (카드 결제 시)
ALTER TABLE gym_expenses ADD COLUMN IF NOT EXISTS card_receipt_collected BOOLEAN DEFAULT false;
