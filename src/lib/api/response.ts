import { NextResponse } from "next/server";

/**
 * 표준 API 응답 타입
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    count?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
}

/**
 * 성공 응답 생성
 */
export function successResponse<T>(
  data: T,
  meta?: ApiResponse["meta"]
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    ...(meta && { meta }),
  });
}

/**
 * 페이지네이션된 성공 응답 생성
 */
export function paginatedResponse<T>(
  data: T,
  count: number,
  page: number,
  pageSize: number
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    },
  });
}

/**
 * 에러 응답 생성
 */
export function errorResponse(
  message: string,
  status: number = 500
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

/**
 * 일반적인 에러 응답들
 */
export const ApiErrors = {
  unauthorized: () => errorResponse("로그인이 필요합니다.", 401),
  forbidden: () => errorResponse("권한이 없습니다.", 403),
  notFound: (resource = "리소스") => errorResponse(`${resource}를 찾을 수 없습니다.`, 404),
  badRequest: (message = "잘못된 요청입니다.") => errorResponse(message, 400),
  internal: (message = "서버 오류가 발생했습니다.") => errorResponse(message, 500),
};

/**
 * API 에러 핸들러 - catch 블록에서 사용
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

  if (context) {
    console.error(`[API] ${context}:`, error);
  } else {
    console.error("[API] Error:", error);
  }

  return errorResponse(message, 500);
}
