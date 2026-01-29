import { z, ZodError, ZodSchema } from "zod";
import { NextResponse } from "next/server";

// 스키마 내보내기
export * from "./member";
export * from "./schedule";
export * from "./salary";
export * from "./sales";

/**
 * API 요청 본문 검증 유틸리티
 * @param schema - Zod 스키마
 * @param data - 검증할 데이터
 * @returns 검증된 데이터 또는 에러 응답
 */
export function validateBody<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: NextResponse } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues.map((e) => e.message).join(", ");
      return {
        success: false,
        error: NextResponse.json(
          { error: messages, details: error.issues },
          { status: 400 }
        ),
      };
    }
    return {
      success: false,
      error: NextResponse.json(
        { error: "입력값 검증 실패" },
        { status: 400 }
      ),
    };
  }
}

/**
 * URL 쿼리 파라미터 검증 유틸리티
 * @param schema - Zod 스키마
 * @param searchParams - URL 검색 파라미터
 */
export function validateQuery<T>(
  schema: ZodSchema<T>,
  searchParams: URLSearchParams
): { success: true; data: T } | { success: false; error: NextResponse } {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return validateBody(schema, params);
}

/**
 * 공통 ID 스키마
 */
export const idSchema = z.object({
  id: z.string().uuid("유효한 ID가 필요합니다"),
});

/**
 * 페이지네이션 스키마
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

/**
 * 날짜 범위 스키마
 */
export const dateRangeSchema = z.object({
  start_date: z.string().date("유효한 시작일이 필요합니다"),
  end_date: z.string().date("유효한 종료일이 필요합니다"),
}).refine(
  (data) => new Date(data.start_date) <= new Date(data.end_date),
  { message: "종료일은 시작일 이후여야 합니다" }
);
