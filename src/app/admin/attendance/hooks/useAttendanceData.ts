"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { showError } from "@/lib/utils/error-handler";

export type ViewMode = "daily" | "monthly" | "range";

export interface Schedule {
  id: string;
  gym_id: string;
  staff_id: string;
  member_id: string | null;
  member_name: string | null;
  title: string | null;
  type: string;
  schedule_type: string | null;
  status: string;
  start_time: string;
  end_time: string;
  staff?: {
    id: string;
    name: string;
  };
}

export interface StaffSchedules {
  staffId: string;
  staffName: string;
  schedules: Schedule[];
}

export interface DateGroupedSchedules {
  date: string;
  dateLabel: string;
  staffSchedules: StaffSchedules[];
}

export interface AttendanceStats {
  total: number;
  completed: number;
  noShow: number;
  pending: number;
  service: number;
  cancelled: number;
}

interface UseAttendanceDataProps {
  gymId: string | null;
  staffId: string | null;
  viewMode: ViewMode;
  selectedDate: string;
  selectedMonth: string;
  startDate: string;
  endDate: string;
  isInitialized: boolean;
}

export function useAttendanceData({
  gymId,
  staffId,
  viewMode,
  selectedDate,
  selectedMonth,
  startDate,
  endDate,
  isInitialized,
}: UseAttendanceDataProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useMemo(() => createSupabaseClient(), []);

  // 날짜 포맷 (전체)
  const formatDateFull = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekDays[date.getDay()]})`;
  };

  // 스케줄 조회
  const fetchSchedules = useCallback(async () => {
    if (!gymId || !isInitialized) return;

    setIsLoading(true);
    try {
      let queryStartTime: string;
      let queryEndTime: string;

      if (viewMode === "daily") {
        queryStartTime = `${selectedDate}T00:00:00`;
        queryEndTime = `${selectedDate}T23:59:59`;
      } else if (viewMode === "monthly") {
        const [year, month] = selectedMonth.split("-").map(Number);
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        queryStartTime = `${firstDay.toISOString().split("T")[0]}T00:00:00`;
        queryEndTime = `${lastDay.toISOString().split("T")[0]}T23:59:59`;
      } else {
        queryStartTime = `${startDate}T00:00:00`;
        queryEndTime = `${endDate}T23:59:59`;
      }

      let query = supabase
        .from("schedules")
        .select(`
          id,
          gym_id,
          staff_id,
          member_id,
          member_name,
          title,
          type,
          schedule_type,
          status,
          start_time,
          end_time,
          staff:staffs!schedules_staff_id_fkey(id, name)
        `)
        .eq("gym_id", gymId)
        .gte("start_time", queryStartTime)
        .lte("start_time", queryEndTime)
        .not("member_id", "is", null)
        .order("start_time", { ascending: true });

      if (staffId) {
        query = query.eq("staff_id", staffId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // staff 배열을 객체로 변환
      const transformedData = (data || []).map((schedule: Record<string, unknown>) => ({
        ...schedule,
        staff: Array.isArray(schedule.staff) && (schedule.staff as unknown[]).length > 0
          ? (schedule.staff as unknown[])[0]
          : schedule.staff
      })) as Schedule[];

      setSchedules(transformedData);
    } catch (error) {
      console.error("스케줄 조회 실패:", error);
      showError("스케줄을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [gymId, staffId, selectedDate, selectedMonth, startDate, endDate, viewMode, isInitialized, supabase]);

  // 초기 로드
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // 직원별 스케줄 그룹핑 (일별)
  const staffSchedules = useMemo((): StaffSchedules[] => {
    const groupedMap = new Map<string, StaffSchedules>();

    schedules.forEach((schedule) => {
      const staffIdKey = schedule.staff_id;
      const staffName = schedule.staff?.name || "알 수 없음";

      if (!groupedMap.has(staffIdKey)) {
        groupedMap.set(staffIdKey, {
          staffId: staffIdKey,
          staffName,
          schedules: [],
        });
      }
      groupedMap.get(staffIdKey)!.schedules.push(schedule);
    });

    return Array.from(groupedMap.values()).sort((a, b) =>
      a.staffName.localeCompare(b.staffName)
    );
  }, [schedules]);

  // 날짜별 > 직원별 그룹핑 (월별/기간)
  const dateGroupedSchedules = useMemo((): DateGroupedSchedules[] => {
    const dateMap = new Map<string, Schedule[]>();

    schedules.forEach((schedule) => {
      const date = schedule.start_time.split("T")[0];
      if (!dateMap.has(date)) {
        dateMap.set(date, []);
      }
      dateMap.get(date)!.push(schedule);
    });

    const result: DateGroupedSchedules[] = [];

    Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, dateSchedules]) => {
        const staffMap = new Map<string, StaffSchedules>();

        dateSchedules.forEach((schedule) => {
          const staffIdKey = schedule.staff_id;
          const staffName = schedule.staff?.name || "알 수 없음";

          if (!staffMap.has(staffIdKey)) {
            staffMap.set(staffIdKey, { staffId: staffIdKey, staffName, schedules: [] });
          }
          staffMap.get(staffIdKey)!.schedules.push(schedule);
        });

        result.push({
          date,
          dateLabel: formatDateFull(date),
          staffSchedules: Array.from(staffMap.values()).sort((a, b) =>
            a.staffName.localeCompare(b.staffName)
          ),
        });
      });

    return result;
  }, [schedules]);

  // 통계 계산
  const stats = useMemo((): AttendanceStats => {
    const total = schedules.length;
    const completed = schedules.filter(s => s.status === "completed").length;
    const noShow = schedules.filter(s => ["no_show", "no_show_deducted"].includes(s.status)).length;
    const pending = schedules.filter(s => s.status === "reserved").length;
    const service = schedules.filter(s => s.status === "service").length;
    const cancelled = schedules.filter(s => s.status === "cancelled").length;
    return { total, completed, noShow, pending, service, cancelled };
  }, [schedules]);

  return {
    schedules,
    staffSchedules,
    dateGroupedSchedules,
    stats,
    isLoading,
    refetch: fetchSchedules,
  };
}
