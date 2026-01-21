import { z } from "zod";

// 스케줄 생성 스키마
export const scheduleCreateSchema = z.object({
  gym_id: z.string().uuid("유효한 지점 ID가 필요합니다"),
  member_id: z.string().uuid().optional().nullable(),
  member_name: z.string().max(50).optional().nullable(),
  type: z.enum(["PT", "GX", "consultation"]).default("PT"),
  start_time: z.string().datetime("유효한 시작 시간이 필요합니다"),
  end_time: z.string().datetime("유효한 종료 시간이 필요합니다"),
  title: z.string().max(100).optional(),
  schedule_type: z.enum(["inside", "outside"]).default("inside"),
}).refine(
  (data) => new Date(data.start_time) < new Date(data.end_time),
  { message: "종료 시간은 시작 시간보다 이후여야 합니다" }
);

// 스케줄 수정 스키마
export const scheduleUpdateSchema = z.object({
  member_id: z.string().uuid().optional().nullable(),
  member_name: z.string().max(50).optional().nullable(),
  type: z.enum(["PT", "GX", "consultation"]).optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  title: z.string().max(100).optional(),
  schedule_type: z.enum(["inside", "outside"]).optional(),
  status: z.enum(["reserved", "completed", "cancelled", "noshow"]).optional(),
});

// 스케줄 상태 변경 스키마
export const scheduleStatusSchema = z.object({
  schedule_id: z.string().uuid("유효한 스케줄 ID가 필요합니다"),
  status: z.enum(["reserved", "completed", "cancelled", "noshow"], {
    message: "유효한 상태값이 아닙니다",
  }),
});

// 월간 스케줄 제출 스키마
export const scheduleSubmitSchema = z.object({
  year_month: z.string().regex(/^\d{4}-\d{2}$/, "YYYY-MM 형식이어야 합니다"),
});

// 스케줄 승인 스키마
export const scheduleApproveSchema = z.object({
  report_id: z.string().uuid("유효한 보고서 ID가 필요합니다"),
});

export type ScheduleCreateInput = z.infer<typeof scheduleCreateSchema>;
export type ScheduleUpdateInput = z.infer<typeof scheduleUpdateSchema>;
export type ScheduleStatusInput = z.infer<typeof scheduleStatusSchema>;
export type ScheduleSubmitInput = z.infer<typeof scheduleSubmitSchema>;
