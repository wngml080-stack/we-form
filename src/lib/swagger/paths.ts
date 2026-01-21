import { type OpenAPIV3 } from "openapi-types";

export const apiPaths: OpenAPIV3.PathsObject = {
  // ============ Members API ============
  "/api/admin/members": {
    get: {
      tags: ["Members"],
      summary: "회원 목록 조회",
      description: "페이지네이션과 필터링을 지원하는 회원 목록 조회 API",
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "페이지 번호" },
        { name: "search", in: "query", schema: { type: "string" }, description: "검색어 (이름/전화번호)" },
        { name: "status", in: "query", schema: { type: "string", enum: ["all", "active", "paused", "expired"] }, description: "회원 상태" },
        { name: "gym_id", in: "query", schema: { type: "string", format: "uuid" }, description: "지점 ID" },
        { name: "company_id", in: "query", schema: { type: "string", format: "uuid" }, description: "회사 ID" },
        { name: "trainer_id", in: "query", schema: { type: "string", format: "uuid" }, description: "트레이너 ID" },
      ],
      responses: {
        "200": {
          description: "회원 목록",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  members: { type: "array", items: { $ref: "#/components/schemas/Member" } },
                  count: { type: "integer" },
                  totalPages: { type: "integer" },
                  currentPage: { type: "integer" },
                  pageSize: { type: "integer" },
                  stats: {
                    type: "object",
                    properties: {
                      total: { type: "integer" },
                      active: { type: "integer" },
                      paused: { type: "integer" },
                      expired: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
    post: {
      tags: ["Members"],
      summary: "회원 등록",
      description: "새 회원을 등록합니다. 회원권, 결제 정보도 함께 등록 가능",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/MemberCreate" },
          },
        },
      },
      responses: {
        "200": {
          description: "등록된 회원 정보",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  member: { $ref: "#/components/schemas/Member" },
                  membership: { $ref: "#/components/schemas/Membership" },
                  payment: { type: "object" },
                },
              },
            },
          },
        },
        "400": { $ref: "#/components/responses/BadRequest" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },
  "/api/admin/members/{id}": {
    get: {
      tags: ["Members"],
      summary: "회원 상세 조회",
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "회원 ID" },
      ],
      responses: {
        "200": {
          description: "회원 상세 정보",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Member" } } },
        },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
    patch: {
      tags: ["Members"],
      summary: "회원 정보 수정",
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                phone: { type: "string" },
                status: { type: "string", enum: ["active", "paused", "expired"] },
                trainer_id: { type: "string", format: "uuid" },
                memo: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        "200": { description: "수정된 회원 정보" },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
    delete: {
      tags: ["Members"],
      summary: "회원 삭제",
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      responses: {
        "200": { description: "삭제 성공" },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
  },

  // ============ Schedule API ============
  "/api/schedule/create": {
    post: {
      tags: ["Schedule"],
      summary: "스케줄 생성",
      description: "PT/GX 수업 스케줄을 생성합니다",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ScheduleCreate" },
          },
        },
      },
      responses: {
        "200": {
          description: "생성된 스케줄",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  schedule: { $ref: "#/components/schemas/Schedule" },
                },
              },
            },
          },
        },
        "400": { $ref: "#/components/responses/BadRequest" },
        "403": {
          description: "제출/승인된 달에는 스케줄 생성 불가",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: { error: "제출/승인된 달에는 스케줄을 생성할 수 없습니다." },
            },
          },
        },
      },
    },
  },
  "/api/schedule/{id}": {
    get: {
      tags: ["Schedule"],
      summary: "스케줄 상세 조회",
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      responses: {
        "200": { description: "스케줄 상세", content: { "application/json": { schema: { $ref: "#/components/schemas/Schedule" } } } },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
    patch: {
      tags: ["Schedule"],
      summary: "스케줄 수정",
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                start_time: { type: "string", format: "date-time" },
                end_time: { type: "string", format: "date-time" },
                status: { type: "string", enum: ["reserved", "completed", "cancelled", "noshow"] },
              },
            },
          },
        },
      },
      responses: {
        "200": { description: "수정된 스케줄" },
        "403": { description: "제출/승인된 달은 수정 불가" },
      },
    },
    delete: {
      tags: ["Schedule"],
      summary: "스케줄 삭제",
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      responses: {
        "200": { description: "삭제 성공" },
      },
    },
  },
  "/api/schedule/update-status": {
    post: {
      tags: ["Schedule"],
      summary: "스케줄 상태 변경",
      description: "스케줄의 상태를 변경합니다 (완료, 취소, 노쇼 등)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                schedule_id: { type: "string", format: "uuid" },
                status: { type: "string", enum: ["reserved", "completed", "cancelled", "noshow"] },
              },
              required: ["schedule_id", "status"],
            },
          },
        },
      },
      responses: {
        "200": { description: "상태 변경 성공" },
      },
    },
  },
  "/api/schedule/submit": {
    post: {
      tags: ["Schedule"],
      summary: "월간 스케줄 제출",
      description: "해당 월의 스케줄을 제출합니다",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                year_month: { type: "string", pattern: "^\\d{4}-\\d{2}$", example: "2025-01" },
              },
              required: ["year_month"],
            },
          },
        },
      },
      responses: {
        "200": { description: "제출 성공" },
      },
    },
  },
  "/api/schedule/approve": {
    post: {
      tags: ["Schedule"],
      summary: "스케줄 승인",
      description: "제출된 스케줄을 승인합니다 (관리자 전용)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                report_id: { type: "string", format: "uuid" },
              },
              required: ["report_id"],
            },
          },
        },
      },
      responses: {
        "200": { description: "승인 성공" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },

  // ============ Salary API ============
  "/api/salary": {
    get: {
      tags: ["Salary"],
      summary: "급여 설정 조회",
      parameters: [
        { name: "gym_id", in: "query", required: true, schema: { type: "string", format: "uuid" }, description: "지점 ID" },
      ],
      responses: {
        "200": {
          description: "급여 설정 목록",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  data: { type: "array", items: { $ref: "#/components/schemas/SalarySetting" } },
                },
              },
            },
          },
        },
        "400": { $ref: "#/components/responses/BadRequest" },
      },
    },
    post: {
      tags: ["Salary"],
      summary: "급여 설정 생성",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                gym_id: { type: "string", format: "uuid" },
                attendance_code: { type: "string" },
                pay_type: { type: "string", enum: ["fixed", "rate"] },
                amount: { type: "number" },
                rate: { type: "number" },
                memo: { type: "string" },
              },
              required: ["gym_id"],
            },
          },
        },
      },
      responses: {
        "200": { description: "생성된 급여 설정" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },

  // ============ Attendance API ============
  "/api/attendance/records": {
    get: {
      tags: ["Attendance"],
      summary: "출퇴근 기록 조회",
      parameters: [
        { name: "gym_id", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "staff_id", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "start_date", in: "query", schema: { type: "string", format: "date" } },
        { name: "end_date", in: "query", schema: { type: "string", format: "date" } },
      ],
      responses: {
        "200": { description: "출퇴근 기록 목록" },
      },
    },
    post: {
      tags: ["Attendance"],
      summary: "출퇴근 기록 생성",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                gym_id: { type: "string", format: "uuid" },
                type: { type: "string", enum: ["check_in", "check_out"] },
                timestamp: { type: "string", format: "date-time" },
              },
              required: ["gym_id", "type"],
            },
          },
        },
      },
      responses: {
        "200": { description: "기록 생성 성공" },
      },
    },
  },

  // ============ Sales API ============
  "/api/admin/sales": {
    get: {
      tags: ["Sales"],
      summary: "매출 조회",
      parameters: [
        { name: "gym_id", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "start_date", in: "query", schema: { type: "string", format: "date" } },
        { name: "end_date", in: "query", schema: { type: "string", format: "date" } },
      ],
      responses: {
        "200": { description: "매출 데이터" },
      },
    },
  },
  "/api/admin/sales/stats/renewals": {
    get: {
      tags: ["Sales"],
      summary: "갱신 현황 통계",
      description: "만기 회원 갱신 현황 통계를 조회합니다",
      parameters: [
        { name: "gym_id", in: "query", required: true, schema: { type: "string", format: "uuid" } },
      ],
      responses: {
        "200": {
          description: "갱신 통계",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  thisMonth: { type: "integer", description: "당월 만기" },
                  nextMonth: { type: "integer", description: "익월 만기" },
                  renewed: { type: "integer", description: "갱신 완료" },
                  renewalRate: { type: "number", description: "갱신율 (%)" },
                },
              },
            },
          },
        },
      },
    },
  },

  // ============ Auth API ============
  "/api/auth/find-company": {
    post: {
      tags: ["Auth"],
      summary: "회사 찾기",
      description: "이메일로 소속 회사를 찾습니다",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                email: { type: "string", format: "email" },
              },
              required: ["email"],
            },
          },
        },
      },
      responses: {
        "200": {
          description: "회사 정보",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  company: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      name: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
  },
  "/api/auth/google/status": {
    get: {
      tags: ["Auth"],
      summary: "Google 연동 상태",
      description: "사용자의 Google 계정 연동 상태를 확인합니다",
      responses: {
        "200": {
          description: "연동 상태",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  connected: { type: "boolean" },
                  email: { type: "string", format: "email" },
                },
              },
            },
          },
        },
      },
    },
  },

  // ============ AI API ============
  "/api/ai/chat": {
    post: {
      tags: ["AI"],
      summary: "AI 채팅",
      description: "AI 어시스턴트와 대화합니다",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                message: { type: "string", description: "사용자 메시지" },
                context: { type: "object", description: "컨텍스트 정보" },
              },
              required: ["message"],
            },
          },
        },
      },
      responses: {
        "200": {
          description: "AI 응답",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  response: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/ai/insights": {
    get: {
      tags: ["AI"],
      summary: "AI 인사이트",
      description: "AI 기반 비즈니스 인사이트를 조회합니다",
      parameters: [
        { name: "gym_id", in: "query", required: true, schema: { type: "string", format: "uuid" } },
        { name: "type", in: "query", schema: { type: "string", enum: ["sales", "members", "schedule"] } },
      ],
      responses: {
        "200": { description: "AI 인사이트 결과" },
      },
    },
  },

  // ============ Onboarding API ============
  "/api/onboarding/company": {
    post: {
      tags: ["Admin"],
      summary: "회사 온보딩",
      description: "새 회사 등록 및 초기 설정",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                company_name: { type: "string" },
                owner_name: { type: "string" },
                owner_email: { type: "string", format: "email" },
                owner_phone: { type: "string" },
              },
              required: ["company_name", "owner_name", "owner_email"],
            },
          },
        },
      },
      responses: {
        "200": { description: "회사 등록 성공" },
        "400": { $ref: "#/components/responses/BadRequest" },
      },
    },
  },
  "/api/onboarding/staff": {
    post: {
      tags: ["Admin"],
      summary: "직원 온보딩",
      description: "직원 초기 등록",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string", format: "email" },
                phone: { type: "string" },
                role: { type: "string", enum: ["admin", "staff"] },
              },
              required: ["name", "email"],
            },
          },
        },
      },
      responses: {
        "200": { description: "직원 등록 성공" },
      },
    },
  },

  // ============ Admin Inquiries ============
  "/api/admin/inquiries": {
    get: {
      tags: ["Admin"],
      summary: "문의 목록 조회",
      parameters: [
        { name: "gym_id", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "status", in: "query", schema: { type: "string", enum: ["pending", "contacted", "visited", "registered", "cancelled"] } },
      ],
      responses: {
        "200": { description: "문의 목록" },
      },
    },
    post: {
      tags: ["Admin"],
      summary: "문의 등록",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                gym_id: { type: "string", format: "uuid" },
                name: { type: "string" },
                phone: { type: "string" },
                source: { type: "string" },
                memo: { type: "string" },
              },
              required: ["gym_id", "name"],
            },
          },
        },
      },
      responses: {
        "200": { description: "문의 등록 성공" },
      },
    },
  },

  // ============ Admin Reservations ============
  "/api/admin/reservations": {
    get: {
      tags: ["Admin"],
      summary: "예약 목록 조회",
      parameters: [
        { name: "gym_id", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "date", in: "query", schema: { type: "string", format: "date" } },
      ],
      responses: {
        "200": { description: "예약 목록" },
      },
    },
    post: {
      tags: ["Admin"],
      summary: "예약 등록",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                gym_id: { type: "string", format: "uuid" },
                inquiry_id: { type: "string", format: "uuid" },
                scheduled_at: { type: "string", format: "date-time" },
              },
              required: ["gym_id", "scheduled_at"],
            },
          },
        },
      },
      responses: {
        "200": { description: "예약 등록 성공" },
      },
    },
  },
};
