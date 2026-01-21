import { type OpenAPIV3 } from "openapi-types";

export const swaggerConfig: OpenAPIV3.Document = {
  openapi: "3.0.0",
  info: {
    title: "Weform API",
    version: "1.0.0",
    description: "피트니스 센터 ERP SaaS - Weform API 문서",
    contact: {
      name: "Weform Support",
      email: "support@weform.kr",
    },
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      description: "API Server",
    },
  ],
  tags: [
    { name: "Auth", description: "인증 관련 API" },
    { name: "Members", description: "회원 관리 API" },
    { name: "Schedule", description: "스케줄 관리 API" },
    { name: "Salary", description: "급여 관리 API" },
    { name: "Sales", description: "매출 관리 API" },
    { name: "Attendance", description: "출퇴근 관리 API" },
    { name: "Admin", description: "관리자 전용 API" },
    { name: "AI", description: "AI 기능 API" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Clerk JWT 토큰을 사용한 인증",
      },
    },
    schemas: {
      // Common
      Error: {
        type: "object",
        properties: {
          error: { type: "string", description: "에러 메시지" },
          code: { type: "string", description: "에러 코드" },
        },
        required: ["error"],
      },
      Pagination: {
        type: "object",
        properties: {
          count: { type: "integer", description: "총 개수" },
          totalPages: { type: "integer", description: "총 페이지 수" },
          currentPage: { type: "integer", description: "현재 페이지" },
          pageSize: { type: "integer", description: "페이지당 항목 수" },
        },
      },
      // Member
      Member: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", description: "회원명" },
          phone: { type: "string", description: "전화번호" },
          birth_date: { type: "string", format: "date", description: "생년월일" },
          gender: { type: "string", enum: ["male", "female"], description: "성별" },
          status: { type: "string", enum: ["active", "paused", "expired"], description: "상태" },
          trainer_id: { type: "string", format: "uuid", description: "담당 트레이너 ID" },
          exercise_goal: { type: "string", description: "운동 목표" },
          weight: { type: "number", description: "체중 (kg)" },
          body_fat_mass: { type: "number", description: "체지방량 (kg)" },
          skeletal_muscle_mass: { type: "number", description: "골격근량 (kg)" },
          memo: { type: "string", description: "메모" },
          created_at: { type: "string", format: "date-time" },
        },
        required: ["id", "name"],
      },
      MemberCreate: {
        type: "object",
        properties: {
          company_id: { type: "string", format: "uuid", description: "회사 ID" },
          gym_id: { type: "string", format: "uuid", description: "지점 ID" },
          name: { type: "string", description: "회원명" },
          phone: { type: "string", description: "전화번호" },
          birth_date: { type: "string", format: "date" },
          gender: { type: "string", enum: ["male", "female"] },
          trainer_id: { type: "string", format: "uuid" },
          exercise_goal: { type: "string" },
          weight: { type: "number" },
          membership: { $ref: "#/components/schemas/MembershipCreate" },
          payment: { $ref: "#/components/schemas/PaymentCreate" },
        },
        required: ["company_id", "gym_id", "name"],
      },
      // Membership
      Membership: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", description: "회원권 이름" },
          total_sessions: { type: "integer", description: "총 횟수" },
          used_sessions: { type: "integer", description: "사용 횟수" },
          start_date: { type: "string", format: "date" },
          end_date: { type: "string", format: "date" },
          status: { type: "string", enum: ["active", "paused", "expired"] },
        },
      },
      MembershipCreate: {
        type: "object",
        properties: {
          name: { type: "string", description: "회원권 이름" },
          total_sessions: { type: "integer" },
          start_date: { type: "string", format: "date" },
          end_date: { type: "string", format: "date" },
        },
        required: ["name", "start_date"],
      },
      // Payment
      PaymentCreate: {
        type: "object",
        properties: {
          amount: { type: "number", description: "결제 금액" },
          total_amount: { type: "number", description: "총 금액" },
          method: { type: "string", enum: ["card", "cash", "transfer"], description: "결제 방법" },
          membership_type: { type: "string" },
          membership_name: { type: "string" },
          registration_type: { type: "string", enum: ["신규", "재등록", "추가"] },
          payment_date: { type: "string", format: "date" },
        },
        required: ["amount"],
      },
      // Schedule
      Schedule: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          gym_id: { type: "string", format: "uuid" },
          staff_id: { type: "string", format: "uuid" },
          member_id: { type: "string", format: "uuid" },
          member_name: { type: "string" },
          type: { type: "string", enum: ["PT", "GX", "consultation"] },
          status: { type: "string", enum: ["reserved", "completed", "cancelled", "noshow"] },
          start_time: { type: "string", format: "date-time" },
          end_time: { type: "string", format: "date-time" },
          title: { type: "string" },
          schedule_type: { type: "string", enum: ["inside", "outside"] },
        },
      },
      ScheduleCreate: {
        type: "object",
        properties: {
          gym_id: { type: "string", format: "uuid" },
          member_id: { type: "string", format: "uuid" },
          member_name: { type: "string" },
          type: { type: "string", enum: ["PT", "GX", "consultation"] },
          start_time: { type: "string", format: "date-time" },
          end_time: { type: "string", format: "date-time" },
          title: { type: "string" },
          schedule_type: { type: "string", enum: ["inside", "outside"] },
        },
        required: ["gym_id", "start_time", "end_time"],
      },
      // Salary
      SalarySetting: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          gym_id: { type: "string", format: "uuid" },
          attendance_code: { type: "string" },
          pay_type: { type: "string", enum: ["fixed", "rate"] },
          amount: { type: "number" },
          rate: { type: "number" },
          memo: { type: "string" },
        },
      },
      // Staff
      Staff: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          role: { type: "string", enum: ["system_admin", "company_admin", "admin", "staff"] },
          company_id: { type: "string", format: "uuid" },
          gym_id: { type: "string", format: "uuid" },
          status: { type: "string", enum: ["active", "inactive"] },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: "인증 필요",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { error: "인증이 필요합니다." },
          },
        },
      },
      Forbidden: {
        description: "접근 권한 없음",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { error: "접근 권한이 없습니다." },
          },
        },
      },
      NotFound: {
        description: "리소스를 찾을 수 없음",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { error: "해당 데이터를 찾을 수 없습니다." },
          },
        },
      },
      BadRequest: {
        description: "잘못된 요청",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { error: "필수 필드가 누락되었습니다." },
          },
        },
      },
      ServerError: {
        description: "서버 오류",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { error: "서버 오류가 발생했습니다." },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {},
};
