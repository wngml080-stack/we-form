import { useEffect, useState } from "react";
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
  const supabase = createSupabaseClient();
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    if (!gymId) return;
    setIsLoading(true);
    setError(null);

    let query = supabase
      .from("monthly_schedule_reports")
      .select("*, staffs(name, job_title)")
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

    const { data, error } = await query;
    if (error) {
      setError(error.message);
    } else {
      setReports(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [gymId, companyId, status, yearMonth]);

  return { reports, isLoading, error, refetch: fetchReports };
}

