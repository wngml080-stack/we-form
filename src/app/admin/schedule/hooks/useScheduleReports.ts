import { useEffect, useState, useCallback, useMemo } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

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
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!gymId) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. 먼저 보고서 조회 (staffs 조인 없이)
      let query = supabase
        .from("monthly_schedule_reports")
        .select("*")
        .eq("gym_id", gymId)
        .order("submitted_at", { ascending: false });

      if (companyId) {
        query = query.eq("company_id", companyId);
      }
      if (status !== "all") {
        query = query.eq("status", status);
      }
      if (yearMonth) {
        query = query.eq("year_month", yearMonth);
      }

      const { data: reportsData, error: reportsError } = await query;
      if (reportsError) {
        setError(reportsError.message);
        setIsLoading(false);
        return;
      }

      if (!reportsData || reportsData.length === 0) {
        setReports([]);
        setIsLoading(false);
        return;
      }

      // 2. 관련된 staff 정보 별도 조회
      const staffIds = [...new Set(reportsData.map(r => r.staff_id))];
      const { data: staffsData } = await supabase
        .from("staffs")
        .select("id, name, job_title")
        .in("id", staffIds);

      // 3. 보고서에 staff 정보 매핑
      const staffMap = new Map(staffsData?.map(s => [s.id, s]) || []);
      const reportsWithStaff = reportsData.map(report => ({
        ...report,
        staffs: staffMap.get(report.staff_id) || null,
      }));

      setReports(reportsWithStaff);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [gymId, companyId, status, yearMonth, supabase]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { reports, isLoading, error, refetch: fetchReports };
}

