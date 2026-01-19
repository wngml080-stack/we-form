import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

interface TypeStats {
  type: string;
  count: number;
  amount: number;
}

interface RouteStats {
  route: string;
  count: number;
  amount: number;
}

interface TrendData {
  date: string;
  count: number;
  amount: number;
}

// 리뉴/재등록 통계 조회
export async function GET(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gymId = searchParams.get("gym_id");
    const companyId = searchParams.get("company_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const groupBy = searchParams.get("group_by") || "day";

    if (!gymId || !companyId) {
      return NextResponse.json({ error: "gym_id와 company_id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: gym } = await supabase
      .from("gyms")
      .select("company_id")
      .eq("id", gymId)
      .maybeSingle();

    if (!canAccessGym(staff, gymId, gym?.company_id)) {
      return NextResponse.json({ error: "해당 지점에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    // 기본 날짜 범위 설정 (이번 달)
    const now = new Date();
    const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const defaultEndDate = endDate || now.toISOString().split("T")[0];

    // 리뉴/재등록 관련 유형만 필터 (재등록, 연장, 리뉴)
    const renewalTypes = ["재등록", "연장", "리뉴"];

    // 현재 기간 데이터 조회
    const { data: currentData, error: currentError } = await supabase
      .from("member_payments")
      .select("id, sale_type, visit_route, amount, membership_category, created_at")
      .eq("gym_id", gymId)
      .eq("company_id", companyId)
      .in("sale_type", renewalTypes)
      .gte("created_at", `${defaultStartDate}T00:00:00`)
      .lte("created_at", `${defaultEndDate}T23:59:59`);

    if (currentError) {
      console.error("[RenewalStats] 현재 데이터 조회 오류:", currentError);
      return NextResponse.json({ error: currentError.message }, { status: 500 });
    }

    // 이전 기간 계산
    const currentStartDate = new Date(defaultStartDate);
    const currentEndDate = new Date(defaultEndDate);
    const periodLength = currentEndDate.getTime() - currentStartDate.getTime();
    const prevEndDate = new Date(currentStartDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - periodLength);

    // 이전 기간 데이터 조회
    const { data: prevData } = await supabase
      .from("member_payments")
      .select("id, sale_type, amount")
      .eq("gym_id", gymId)
      .eq("company_id", companyId)
      .in("sale_type", renewalTypes)
      .gte("created_at", `${prevStartDate.toISOString().split("T")[0]}T00:00:00`)
      .lte("created_at", `${prevEndDate.toISOString().split("T")[0]}T23:59:59`);

    const payments = currentData || [];

    // 요약 통계
    const totalCount = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const avgAmount = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;

    // 이전 기간 통계
    const prevPayments = prevData || [];
    const prevTotalCount = prevPayments.length;
    const prevTotalAmount = prevPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // 증감률 계산
    const countChangeRate = prevTotalCount > 0
      ? Math.round(((totalCount - prevTotalCount) / prevTotalCount) * 100)
      : totalCount > 0 ? 100 : 0;
    const amountChangeRate = prevTotalAmount > 0
      ? Math.round(((totalAmount - prevTotalAmount) / prevTotalAmount) * 100)
      : totalAmount > 0 ? 100 : 0;

    // 유형별 집계 (sale_type)
    const typeMap = new Map<string, { count: number; amount: number }>();
    payments.forEach(p => {
      const type = p.sale_type || "기타";
      const current = typeMap.get(type) || { count: 0, amount: 0 };
      typeMap.set(type, {
        count: current.count + 1,
        amount: current.amount + (p.amount || 0)
      });
    });

    const byType: TypeStats[] = Array.from(typeMap.entries())
      .map(([type, stats]) => ({ type, ...stats }))
      .sort((a, b) => b.count - a.count);

    // 회원권 카테고리별 집계
    const categoryMap = new Map<string, { count: number; amount: number }>();
    payments.forEach(p => {
      const category = p.membership_category || "미지정";
      const current = categoryMap.get(category) || { count: 0, amount: 0 };
      categoryMap.set(category, {
        count: current.count + 1,
        amount: current.amount + (p.amount || 0)
      });
    });

    const byCategory: RouteStats[] = Array.from(categoryMap.entries())
      .map(([route, stats]) => ({ route, ...stats }))
      .sort((a, b) => b.count - a.count);

    // 기간별 트렌드
    const trendMap = new Map<string, { count: number; amount: number }>();
    payments.forEach(p => {
      const date = new Date(p.created_at);
      let key: string;

      if (groupBy === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else if (groupBy === "month") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      } else {
        key = date.toISOString().split("T")[0];
      }

      const current = trendMap.get(key) || { count: 0, amount: 0 };
      trendMap.set(key, {
        count: current.count + 1,
        amount: current.amount + (p.amount || 0)
      });
    });

    const trend: TrendData[] = Array.from(trendMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      summary: {
        total_count: totalCount,
        total_amount: totalAmount,
        avg_amount: avgAmount,
      },
      by_type: byType,
      by_category: byCategory,
      trend,
      comparison: {
        prev_period_count: prevTotalCount,
        prev_period_amount: prevTotalAmount,
        count_change_rate: countChangeRate,
        amount_change_rate: amountChangeRate,
      },
      period: {
        start_date: defaultStartDate,
        end_date: defaultEndDate,
      }
    });
  } catch (error: unknown) {
    console.error("[RenewalStats] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
