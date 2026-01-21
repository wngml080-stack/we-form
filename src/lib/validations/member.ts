import { z } from "zod";

// 전화번호 정규식 (한국 형식)
const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;

// 회원 생성 스키마
export const memberCreateSchema = z.object({
  company_id: z.string().uuid("유효한 회사 ID가 필요합니다"),
  gym_id: z.string().uuid("유효한 지점 ID가 필요합니다"),
  name: z.string().min(1, "이름은 필수입니다").max(50, "이름은 50자 이하여야 합니다"),
  phone: z.string().regex(phoneRegex, "유효한 전화번호 형식이 아닙니다").optional().nullable(),
  birth_date: z.string().date("유효한 날짜 형식이 아닙니다").optional().nullable(),
  gender: z.enum(["male", "female"]).optional().nullable(),
  trainer_id: z.string().uuid().optional().nullable(),
  registered_by: z.string().uuid().optional(),
  exercise_goal: z.string().max(500).optional().nullable(),
  weight: z.number().positive().max(500).optional().nullable(),
  body_fat_mass: z.number().positive().max(200).optional().nullable(),
  skeletal_muscle_mass: z.number().positive().max(200).optional().nullable(),
  memo: z.string().max(2000).optional().nullable(),
  status: z.enum(["active", "paused", "expired"]).default("active"),
  created_at: z.string().datetime().optional(),
  membership: z.object({
    name: z.string().min(1),
    total_sessions: z.number().int().positive().optional().nullable(),
    start_date: z.string().date(),
    end_date: z.string().date().optional().nullable(),
  }).optional(),
  payment: z.object({
    amount: z.number().positive("금액은 0보다 커야 합니다"),
    total_amount: z.number().positive().optional(),
    method: z.enum(["card", "cash", "transfer"]).default("card"),
    membership_type: z.string().optional(),
    membership_name: z.string().optional(),
    registration_type: z.enum(["신규", "재등록", "추가"]).default("신규"),
    payment_date: z.string().date().optional(),
    memo: z.string().max(500).optional(),
  }).optional(),
});

// 회원 수정 스키마
export const memberUpdateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  phone: z.string().regex(phoneRegex).optional().nullable(),
  birth_date: z.string().date().optional().nullable(),
  gender: z.enum(["male", "female"]).optional().nullable(),
  trainer_id: z.string().uuid().optional().nullable(),
  exercise_goal: z.string().max(500).optional().nullable(),
  weight: z.number().positive().max(500).optional().nullable(),
  body_fat_mass: z.number().positive().max(200).optional().nullable(),
  skeletal_muscle_mass: z.number().positive().max(200).optional().nullable(),
  memo: z.string().max(2000).optional().nullable(),
  status: z.enum(["active", "paused", "expired"]).optional(),
});

// 회원 조회 쿼리 스키마
export const memberQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  search: z.string().max(100).optional(),
  status: z.enum(["all", "active", "paused", "expired"]).default("all"),
  gym_id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  trainer_id: z.string().uuid().optional(),
});

export type MemberCreateInput = z.infer<typeof memberCreateSchema>;
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;
export type MemberQueryInput = z.infer<typeof memberQuerySchema>;
