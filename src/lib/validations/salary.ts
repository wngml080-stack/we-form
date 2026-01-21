import { z } from "zod";

// 급여 설정 생성 스키마
export const salarySettingCreateSchema = z.object({
  gym_id: z.string().uuid("유효한 지점 ID가 필요합니다"),
  attendance_code: z.string().max(50).optional().nullable(),
  pay_type: z.enum(["fixed", "rate"]).default("fixed"),
  amount: z.number().nonnegative("금액은 0 이상이어야 합니다").optional().nullable(),
  rate: z.number().min(0).max(100, "비율은 0-100 사이여야 합니다").optional().nullable(),
  memo: z.string().max(500).optional().nullable(),
}).refine(
  (data) => {
    if (data.pay_type === "fixed") return data.amount !== undefined && data.amount !== null;
    if (data.pay_type === "rate") return data.rate !== undefined && data.rate !== null;
    return true;
  },
  { message: "고정급은 금액이, 비율급은 비율이 필요합니다" }
);

// 급여 설정 수정 스키마
export const salarySettingUpdateSchema = z.object({
  attendance_code: z.string().max(50).optional().nullable(),
  pay_type: z.enum(["fixed", "rate"]).optional(),
  amount: z.number().nonnegative().optional().nullable(),
  rate: z.number().min(0).max(100).optional().nullable(),
  memo: z.string().max(500).optional().nullable(),
});

// 급여 조회 쿼리 스키마
export const salaryQuerySchema = z.object({
  gym_id: z.string().uuid("유효한 지점 ID가 필요합니다"),
});

export type SalarySettingCreateInput = z.infer<typeof salarySettingCreateSchema>;
export type SalarySettingUpdateInput = z.infer<typeof salarySettingUpdateSchema>;
export type SalaryQueryInput = z.infer<typeof salaryQuerySchema>;
