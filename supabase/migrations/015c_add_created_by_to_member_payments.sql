-- member_payments 테이블에 created_by (처리자) 컬럼 추가
-- 결제 기록을 누가 생성했는지 추적하기 위함

-- 1. created_by 컬럼 추가
ALTER TABLE public.member_payments
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.staffs(id) ON DELETE SET NULL;

-- 2. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_member_payments_created_by
  ON public.member_payments(created_by);

-- 3. 코멘트 추가
COMMENT ON COLUMN public.member_payments.created_by IS '결제 기록을 생성한 직원 ID';
