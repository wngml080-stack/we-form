import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  MemberSearchResult,
  SalesStatsResult,
  ScheduleInfoResult,
  OperationMetricsResult,
} from "./tools";

interface ToolInput {
  [key: string]: unknown;
}

export async function executeAiTool(
  toolName: string,
  toolInput: ToolInput,
  gymId: string
): Promise<unknown> {
  const supabase = getSupabaseAdmin();

  switch (toolName) {
    case "search_members":
      return await searchMembers(supabase, gymId, toolInput);

    case "get_sales_stats":
      return await getSalesStats(supabase, gymId, toolInput);

    case "get_schedule_info":
      return await getScheduleInfo(supabase, gymId, toolInput);

    case "get_operation_metrics":
      return await getOperationMetrics(supabase, gymId, toolInput);

    default:
      return { error: `알 수 없는 도구: ${toolName}` };
  }
}

async function searchMembers(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  gymId: string,
  input: ToolInput
): Promise<MemberSearchResult[]> {
  let query = supabase
    .from("members")
    .select(
      `
      id,
      name,
      phone,
      status,
      member_memberships!inner(end_date)
    `
    )
    .eq("gym_id", gymId);

  if (input.query) {
    query = query.ilike("name", `%${input.query}%`);
  }

  if (input.status) {
    query = query.eq("status", input.status);
  }

  if (input.expiring_within_days) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + (input.expiring_within_days as number));
    query = query.lte("member_memberships.end_date", futureDate.toISOString().split("T")[0]);
    query = query.gte("member_memberships.end_date", new Date().toISOString().split("T")[0]);
  }

  const { data, error } = await query.limit(20);

  if (error) {
    console.error("[AI Tool] searchMembers error:", error);
    return [];
  }

  return (data || []).map((m) => ({
    id: m.id,
    name: m.name,
    phone: m.phone || "",
    status: m.status,
    membership_end_date: m.member_memberships?.[0]?.end_date || null,
    last_attendance_date: null,
    attendance_rate: 0,
  }));
}

async function getSalesStats(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  gymId: string,
  input: ToolInput
): Promise<SalesStatsResult> {
  const today = new Date();
  let startDate: Date;
  let endDate: Date = today;

  switch (input.period) {
    case "today":
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      break;
    case "this_week":
      startDate = new Date(today);
      startDate.setDate(today.getDate() - today.getDay());
      break;
    case "this_month":
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case "last_month":
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    case "custom":
      startDate = new Date(input.start_date as string);
      endDate = new Date(input.end_date as string);
      break;
    default:
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  const { data: payments, error } = await supabase
    .from("payments")
    .select("amount, payment_type, created_at")
    .eq("gym_id", gymId)
    .eq("status", "completed")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  if (error) {
    console.error("[AI Tool] getSalesStats error:", error);
    return {
      total_revenue: 0,
      transaction_count: 0,
      average_transaction: 0,
      breakdown: [],
    };
  }

  const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const transactionCount = payments?.length || 0;

  // Group by payment_type
  const byType = new Map<string, { amount: number; count: number }>();
  payments?.forEach((p) => {
    const type = p.payment_type || "기타";
    const existing = byType.get(type) || { amount: 0, count: 0 };
    byType.set(type, {
      amount: existing.amount + (p.amount || 0),
      count: existing.count + 1,
    });
  });

  return {
    total_revenue: totalRevenue,
    transaction_count: transactionCount,
    average_transaction: transactionCount > 0 ? Math.round(totalRevenue / transactionCount) : 0,
    breakdown: Array.from(byType.entries()).map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
    })),
  };
}

async function getScheduleInfo(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  gymId: string,
  input: ToolInput
): Promise<ScheduleInfoResult> {
  const targetDate = input.date
    ? new Date(input.date as string)
    : new Date();

  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  let query = supabase
    .from("schedules")
    .select(
      `
      id,
      start_time,
      status,
      staff:staff_id(name),
      member:member_id(name)
    `
    )
    .eq("gym_id", gymId)
    .gte("start_time", startOfDay.toISOString())
    .lt("start_time", endOfDay.toISOString())
    .order("start_time");

  if (input.status) {
    query = query.eq("status", input.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[AI Tool] getScheduleInfo error:", error);
    return {
      date: targetDate.toISOString().split("T")[0],
      total_sessions: 0,
      completed: 0,
      scheduled: 0,
      cancelled: 0,
      no_show: 0,
      sessions: [],
    };
  }

  const sessions = data || [];
  const completed = sessions.filter((s) => s.status === "completed").length;
  const scheduled = sessions.filter((s) => s.status === "scheduled").length;
  const cancelled = sessions.filter((s) => s.status === "cancelled").length;
  const noShow = sessions.filter((s) => s.status === "no_show").length;

  // Helper to extract name from relation (could be object or array)
  const getName = (relation: unknown): string => {
    if (!relation) return "미지정";
    if (Array.isArray(relation) && relation.length > 0) {
      return (relation[0] as { name?: string })?.name || "미지정";
    }
    return (relation as { name?: string })?.name || "미지정";
  };

  return {
    date: targetDate.toISOString().split("T")[0],
    total_sessions: sessions.length,
    completed,
    scheduled,
    cancelled,
    no_show: noShow,
    sessions: sessions.slice(0, 10).map((s) => ({
      time: new Date(s.start_time).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      trainer: getName(s.staff),
      member: getName(s.member),
      status: s.status,
    })),
  };
}

async function getOperationMetrics(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  gymId: string,
  input: ToolInput
): Promise<OperationMetricsResult> {
  const today = new Date();
  const periodDays = input.period === "week" ? 7 : input.period === "month" ? 30 : 90;
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - periodDays);

  switch (input.metric_type) {
    case "churn_risk": {
      // 최근 N일간 미출석 회원 조회
      const { data: inactiveMembers } = await supabase
        .from("members")
        .select("id, name")
        .eq("gym_id", gymId)
        .eq("status", "active");

      // 최근 출석 기록이 있는 회원 ID 조회
      const { data: recentAttendance } = await supabase
        .from("schedules")
        .select("member_id")
        .eq("gym_id", gymId)
        .eq("status", "completed")
        .gte("start_time", startDate.toISOString());

      const recentMemberIds = new Set(recentAttendance?.map((a) => a.member_id) || []);
      const churnRiskMembers =
        inactiveMembers?.filter((m) => !recentMemberIds.has(m.id)) || [];

      return {
        metric_type: "churn_risk",
        value: churnRiskMembers.length,
        trend: "stable",
        details: {
          members: churnRiskMembers.slice(0, 10).map((m) => m.name),
          period_days: periodDays,
        },
      };
    }

    case "renewal_opportunity": {
      // 30일 이내 만료 + 출석률 높은 회원
      const thirtyDaysLater = new Date(today);
      thirtyDaysLater.setDate(today.getDate() + 30);

      const { data: expiringMembers } = await supabase
        .from("member_memberships")
        .select(
          `
          member:member_id(id, name, status),
          end_date
        `
        )
        .eq("gym_id", gymId)
        .eq("status", "active")
        .gte("end_date", today.toISOString().split("T")[0])
        .lte("end_date", thirtyDaysLater.toISOString().split("T")[0]);

      // Helper to get member property from relation
      const getMemberProp = (member: unknown, prop: "status" | "name"): string | undefined => {
        if (!member) return undefined;
        if (Array.isArray(member) && member.length > 0) {
          return (member[0] as Record<string, unknown>)?.[prop] as string | undefined;
        }
        return (member as Record<string, unknown>)?.[prop] as string | undefined;
      };

      const opportunities = expiringMembers?.filter(
        (m) => getMemberProp(m.member, "status") === "active"
      ) || [];

      return {
        metric_type: "renewal_opportunity",
        value: opportunities.length,
        trend: "up",
        details: {
          members: opportunities.slice(0, 10).map((m) => ({
            name: getMemberProp(m.member, "name") || "Unknown",
            end_date: m.end_date,
          })),
        },
      };
    }

    case "no_show_rate": {
      const { data: schedules } = await supabase
        .from("schedules")
        .select("status")
        .eq("gym_id", gymId)
        .gte("start_time", startDate.toISOString())
        .in("status", ["completed", "no_show"]);

      const total = schedules?.length || 0;
      const noShows = schedules?.filter((s) => s.status === "no_show").length || 0;
      const rate = total > 0 ? Math.round((noShows / total) * 100) : 0;

      return {
        metric_type: "no_show_rate",
        value: rate,
        trend: rate > 10 ? "up" : "stable",
        details: {
          total_sessions: total,
          no_shows: noShows,
          period_days: periodDays,
        },
      };
    }

    default:
      return {
        metric_type: input.metric_type as string,
        value: 0,
        trend: "stable",
        details: {},
      };
  }
}
