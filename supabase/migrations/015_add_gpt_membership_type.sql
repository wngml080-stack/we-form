-- ============================================
-- GPT 및 부가상품 회원권 유형 추가 및 RLS 정책 수정
-- ============================================

-- 1. membership_products 테이블의 CHECK 제약조건 업데이트 (GPT, 부가상품 추가)
ALTER TABLE membership_products
DROP CONSTRAINT IF EXISTS membership_products_membership_type_check;

ALTER TABLE membership_products
ADD CONSTRAINT membership_products_membership_type_check
CHECK (membership_type IN ('헬스', '필라테스', 'PT', 'PPT', 'GPT', 'GX', '골프', '하이록스', '러닝', '크로스핏', '부가상품', '기타'));

-- 2. member_payments 테이블의 CHECK 제약조건 업데이트 (부가상품 추가)
ALTER TABLE member_payments
DROP CONSTRAINT IF EXISTS member_payments_membership_type_check;

ALTER TABLE member_payments
ADD CONSTRAINT member_payments_membership_type_check
CHECK (membership_type IN ('헬스', '필라테스', 'PT', 'PPT', 'GPT', 'GX', '골프', '하이록스', '러닝', '크로스핏', '부가상품', '기타'));

-- 3. RLS 정책 수정 (INSERT를 위한 WITH CHECK 추가)
-- 기존 정책 삭제
DROP POLICY IF EXISTS "지점 관리자는 상품 관리 가능" ON membership_products;

-- 새 정책 추가 (WITH CHECK 포함)
CREATE POLICY "지점 관리자는 상품 관리 가능" ON membership_products
  FOR ALL
  USING (
    gym_id IN (
      SELECT gym_id FROM staffs
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'director', 'system_admin', 'company_admin')
    )
  )
  WITH CHECK (
    gym_id IN (
      SELECT gym_id FROM staffs
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'director', 'system_admin', 'company_admin')
    )
  );

-- 코멘트 업데이트
COMMENT ON COLUMN membership_products.membership_type IS '회원권 유형: 헬스/필라테스/PT/PPT/GPT/GX/골프/하이록스/러닝/크로스핏/부가상품/기타';
COMMENT ON COLUMN member_payments.membership_type IS '회원권 유형: 헬스/필라테스/PT/PPT/GPT/GX/골프/하이록스/러닝/크로스핏/부가상품/기타';
