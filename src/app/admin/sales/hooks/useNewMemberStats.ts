"use client";

import { useState, useEffect, useCallback } from "react";

interface RegistrationTypeStats {
  type: string;
  count: number;
  amount: number;
}

interface DailyStats {
  date: string;
  day: number;
  count: number;
  walkIn: number;
  inquiry: number;
  reservation: number;
  amount: number;
  avgPrice: number;
}

interface UnconvertedStats {
  type: string;
  count: number;
  percent: number;
}

interface SportTypeStats {
  type: string;
  count: number;
  amount: number;
}

interface OtherSportsStats {
  total_count: number;
  health_count: number;
  types: SportTypeStats[];
}

interface NewMemberStats {
  summary: {
    total_count: number;
    total_amount: number;
    avg_amount: number;
  };
  registration_types: RegistrationTypeStats[];
  other_sports: OtherSportsStats;
  daily_stats: DailyStats[];
  unconverted_stats: UnconvertedStats[];
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

interface UseNewMemberStatsProps {
  selectedGymId: string | null;
  selectedCompanyId: string | null;
  filterInitialized: boolean;
}

export function useNewMemberStats({
  selectedGymId,
  selectedCompanyId,
  filterInitialized
}: UseNewMemberStatsProps) {
  const [stats, setStats] = useState<NewMemberStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 날짜 필터 상태 (이번 달 1일 ~ 말일)
  const now = new Date();
  const [startDate, setStartDate] = useState<string>(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
  );
  const [quickSelect, setQuickSelect] = useState<string>("thisMonth");

  // 빠른 선택 핸들러
  const handleQuickSelect = useCallback((value: string) => {
    setQuickSelect(value);
    const today = new Date();

    switch (value) {
      case "today":
        const todayStr = today.toISOString().split("T")[0];
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      case "thisWeek":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        setStartDate(weekStart.toISOString().split("T")[0]);
        setEndDate(weekEnd.toISOString().split("T")[0]);
        break;
      case "thisMonth":
        setStartDate(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]);
        setEndDate(new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0]);
        break;
      case "lastMonth":
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        setStartDate(lastMonthStart.toISOString().split("T")[0]);
        setEndDate(lastMonthEnd.toISOString().split("T")[0]);
        break;
      case "last3Months":
        setStartDate(new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString().split("T")[0]);
        setEndDate(new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0]);
        break;
      case "thisYear":
        setStartDate(new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0]);
        setEndDate(new Date(today.getFullYear(), 11, 31).toISOString().split("T")[0]);
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
      });

      const response = await fetch(`/api/admin/sales/stats/new-members?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "통계 조회 실패");
      }

      setStats(result);
    } catch (err) {
      console.error("[useNewMemberStats] 조회 오류:", err);
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setIsLoading(false);
    }
  }, [selectedGymId, selectedCompanyId, filterInitialized, startDate, endDate]);

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
    refetch: fetchStats,
  };
}
