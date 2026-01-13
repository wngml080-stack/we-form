import Anthropic from "@anthropic-ai/sdk";

// Tool definitions for Claude
export const AI_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_members",
    description:
      "회원 정보를 검색합니다. 이름, 상태, 출석률 등으로 필터링할 수 있습니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "검색할 회원 이름 또는 키워드",
        },
        status: {
          type: "string",
          enum: ["active", "inactive", "expired"],
          description: "회원 상태 필터",
        },
        min_attendance_rate: {
          type: "number",
          description: "최소 출석률 (0-100)",
        },
        expiring_within_days: {
          type: "number",
          description: "N일 이내 만료 예정인 회원만 조회",
        },
        inactive_days: {
          type: "number",
          description: "N일 이상 미출석한 회원만 조회",
        },
      },
      required: [],
    },
  },
  {
    name: "get_sales_stats",
    description: "매출 통계를 조회합니다. 기간별, 강사별 매출을 분석합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        period: {
          type: "string",
          enum: ["today", "this_week", "this_month", "last_month", "custom"],
          description: "조회 기간",
        },
        start_date: {
          type: "string",
          description: "시작 날짜 (YYYY-MM-DD), period가 custom일 때 사용",
        },
        end_date: {
          type: "string",
          description: "종료 날짜 (YYYY-MM-DD), period가 custom일 때 사용",
        },
        group_by: {
          type: "string",
          enum: ["trainer", "product", "day"],
          description: "그룹화 기준",
        },
      },
      required: ["period"],
    },
  },
  {
    name: "get_schedule_info",
    description: "스케줄 및 예약 정보를 조회합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        date: {
          type: "string",
          description: "조회할 날짜 (YYYY-MM-DD), 기본값은 오늘",
        },
        time: {
          type: "string",
          description: "특정 시간대 (HH:MM 형식)",
        },
        trainer_name: {
          type: "string",
          description: "특정 강사의 스케줄만 조회",
        },
        status: {
          type: "string",
          enum: ["scheduled", "completed", "cancelled", "no_show"],
          description: "스케줄 상태 필터",
        },
      },
      required: [],
    },
  },
  {
    name: "get_operation_metrics",
    description:
      "운영 지표를 조회합니다. 출석률, 노쇼율, 시간대별 혼잡도 등을 분석합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        metric_type: {
          type: "string",
          enum: [
            "attendance_rate",
            "no_show_rate",
            "peak_hours",
            "churn_risk",
            "renewal_opportunity",
          ],
          description: "조회할 지표 유형",
        },
        period: {
          type: "string",
          enum: ["week", "month", "quarter"],
          description: "분석 기간",
        },
      },
      required: ["metric_type"],
    },
  },
];

// Tool result types
export interface MemberSearchResult {
  id: string;
  name: string;
  phone: string;
  status: string;
  membership_end_date: string | null;
  last_attendance_date: string | null;
  attendance_rate: number;
}

export interface SalesStatsResult {
  total_revenue: number;
  transaction_count: number;
  average_transaction: number;
  breakdown: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
}

export interface ScheduleInfoResult {
  date: string;
  total_sessions: number;
  completed: number;
  scheduled: number;
  cancelled: number;
  no_show: number;
  sessions: Array<{
    time: string;
    trainer: string;
    member: string;
    status: string;
  }>;
}

export interface OperationMetricsResult {
  metric_type: string;
  value: number;
  trend: "up" | "down" | "stable";
  details: Record<string, unknown>;
}
