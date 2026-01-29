import { z } from "zod";

// 전화번호 정규식 (한국 형식, 하이픈 포함/미포함 모두 허용)
const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;

// 빈 문자열 또는 유효한 값을 허용하는 유틸리티
const optionalString = (schema: z.ZodString) =>
  z.union([z.literal(""), schema]);

// 문자열 또는 숫자를 숫자로 변환하는 유틸리티
const coerceNumber = z.union([z.string(), z.number()]).transform((val) => {
  if (typeof val === "string") {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  }
  return val;
});

const coerceInt = z.union([z.string(), z.number()]).transform((val) => {
  if (typeof val === "string") {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return Math.floor(val);
});

// 매출 생성 스키마
export const salesCreateSchema = z.object({
  company_id: z.string().uuid("유효한 회사 ID가 필요합니다"),
  gym_id: z.string().uuid("유효한 지점 ID가 필요합니다"),
  member_name: z.string().min(1, "회원 이름은 필수입니다").max(50, "회원 이름은 50자 이하여야 합니다").optional(),
  phone: optionalString(z.string().regex(phoneRegex, "유효한 전화번호 형식이 아닙니다 (예: 010-1234-5678)")).optional().nullable(),
  gender: z.enum(["male", "female"]).optional().nullable(),
  birth_date: z.string().date("유효한 날짜 형식이 아닙니다").optional().nullable(),
  sale_type: z.enum(["신규", "재등록", "추가", "양도"]).optional(),
  membership_category: z.string().max(50).optional(),
  membership_name: z.string().max(100).optional(),
  amount: coerceNumber.optional(),
  method: z.enum(["card", "cash", "transfer", "카드", "현금", "계좌이체"]).optional(),
  installment: coerceInt.optional().nullable(),
  trainer_id: optionalString(z.string().uuid("유효한 트레이너 ID가 필요합니다")).optional().nullable(),
  trainer_name: z.string().max(50).optional(),
  registrar: z.string().max(50).optional(),
  memo: z.string().max(2000).optional().nullable(),
  // PT 전용 필드
  service_sessions: coerceInt.optional().nullable(),
  bonus_sessions: coerceInt.optional().nullable(),
  validity_per_session: z.union([z.string(), z.number()]).optional().nullable(),
  membership_start_date: z.string().optional().nullable(),
  // 신규/재등록 전용 필드
  visit_route: z.string().max(100).optional().nullable(),
  expiry_type: z.string().max(50).optional().nullable(),
});

// 매출 수정 스키마
export const salesUpdateSchema = z.object({
  member_name: z.string().min(1).max(50).optional(),
  phone: z.string().regex(phoneRegex).optional().nullable(),
  gender: z.enum(["male", "female"]).optional().nullable(),
  birth_date: z.string().date().optional().nullable(),
  sale_type: z.enum(["신규", "재등록", "추가", "양도"]).optional(),
  membership_category: z.string().max(50).optional(),
  membership_name: z.string().max(100).optional(),
  amount: z.number().nonnegative().optional(),
  method: z.enum(["card", "cash", "transfer", "카드", "현금", "계좌이체"]).optional(),
  installment: z.number().int().min(0).max(36).optional().nullable(),
  trainer_id: z.string().uuid().optional().nullable(),
  trainer_name: z.string().max(50).optional(),
  registrar: z.string().max(50).optional(),
  memo: z.string().max(2000).optional().nullable(),
  service_sessions: z.number().int().nonnegative().max(9999).optional().nullable(),
  bonus_sessions: z.number().int().nonnegative().max(999).optional().nullable(),
});

// 매출 조회 쿼리 스키마
export const salesQuerySchema = z.object({
  gym_id: z.string().uuid("유효한 지점 ID가 필요합니다"),
  company_id: z.string().uuid("유효한 회사 ID가 필요합니다"),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  sale_type: z.enum(["신규", "재등록", "추가", "양도", "all"]).optional(),
  trainer_id: z.string().uuid().optional(),
});

export type SalesCreateInput = z.infer<typeof salesCreateSchema>;
export type SalesUpdateInput = z.infer<typeof salesUpdateSchema>;
export type SalesQueryInput = z.infer<typeof salesQuerySchema>;
