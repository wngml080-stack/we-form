"use client";

import { useState, useEffect, useCallback } from "react";

interface TypeStats {
  type: string;
  count: number;
  amount: number;
}

interface CategoryStats {
  route: string;
  count: number;
  amount: number;
}

interface TrendData {
  date: string;
  count: number;
  amount: number;
}

interface RenewalStats {
  summary: {
    total_count: number;
    total_amount: number;
    avg_amount: number;
  };
  by_type: TypeStats[];
  by_category: CategoryStats[];
  trend: TrendData[];
  comparison: {
    prev_period_count: number;
    prev_period_amount: number;
    count_change_rate: number;
    amount_change_rate: number;
  };
  period: {
    start_date: string;
    end_date: string;
  };
}

interface UseRenewalStatsProps {
  selectedGymId: string | null;
  selectedCompanyId: string | null;
  filterInitialized: boolean;
}

export function useRenewalStats({
  selectedGymId,
  selectedCompanyId,
  filterInitialized
}: UseRenewalStatsProps) {
  const [stats, setStats] = useState<RenewalStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 날짜 필터 상태
  const now = new Date();
  const [startDate, setStartDate] = useState<string>(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    now.toISOString().split("T")[0]
  );
  const [quickSelect, setQuickSelect] = useState<string>("thisMonth");
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");

  // 빠른 선택 핸들러
  const handleQuickSelect = useCallback((value: string) => {
    setQuickSelect(value);
    const today = new Date();

    switch (value) {
      case "today":
        const todayStr = today.toISOString().split("T")[0];
        setStartDate(todayStr);
        setEndDate(todayStr);
        setGroupBy("day");
        break;
      case "thisWeek":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        setStartDate(weekStart.toISOString().split("T")[0]);
        setEndDate(today.toISOString().split("T")[0]);
        setGroupBy("day");
        break;
      case "thisMonth":
        setStartDate(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]);
        setEndDate(today.toISOString().split("T")[0]);
        setGroupBy("day");
        break;
      case "lastMonth":
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        setStartDate(lastMonthStart.toISOString().split("T")[0]);
        setEndDate(lastMonthEnd.toISOString().split("T")[0]);
        setGroupBy("day");
        break;
      case "last3Months":
        setStartDate(new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString().split("T")[0]);
        setEndDate(today.toISOString().split("T")[0]);
        setGroupBy("week");
        break;
      case "thisYear":
        setStartDate(new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0]);
        setEndDate(today.toISOString().split("T")[0]);
        setGroupBy("month");
        break;
      default:
        break;
    }
  }, []);

  // 데이터 조회
  const fetchStats = useCallback(async () => {
    if (!selectedGymId || !selectedCompanyId || !filterInitialized) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        gym_id: selectedGymId,
        company_id: selectedCompanyId,
        start_date: startDate,
        end_date: endDate,
        group_by: groupBy,
      });

      const response = await fetch(`/api/admin/sales/stats/renewals?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "통계 조회 실패");
      }

      setStats(result);
    } catch (err) {
      console.error("[useRenewalStats] 조회 오류:", err);
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setIsLoading(false);
    }
  }, [selectedGymId, selectedCompanyId, filterInitialized, startDate, endDate, groupBy]);

  // 초기 로드 및 필터 변경 시 재조회
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    quickSelect,
    handleQuickSelect,
    groupBy,
    setGroupBy,
    refetch: fetchStats,
  };
}
