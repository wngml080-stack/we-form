import { useEffect, useState, useCallback } from "react";

export type ReportStatus = "submitted" | "approved" | "rejected";

export interface MonthlyReport {
  id: string;
  staff_id: string;
  gym_id: string;
  company_id: string;
  year_month: string; // YYYY-MM
  status: ReportStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  staff_memo?: string | null;
  admin_memo?: string | null;
  stats?: Record<string, number>;
  staffs?: { name?: string | null; job_title?: string | null } | null;
}

interface UseScheduleReportsParams {
  gymId: string | null;
  companyId: string | null;
  status?: ReportStatus | "all";
  yearMonth?: string;
}

export function useScheduleReports({ gymId, companyId, status = "all", yearMonth }: UseScheduleReportsParams) {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!gymId) return;
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ gym_id: gymId });
      if (companyId) params.append("company_id", companyId);
      if (status !== "all") params.append("status", status);
      if (yearMonth) params.append("year_month", yearMonth);

      const response = await fetch(`/api/admin/schedule/reports?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "보고서 조회 실패");
        return;
      }

      setReports(result.reports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [gymId, companyId, status, yearMonth]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { reports, isLoading, error, refetch: fetchReports };
}
