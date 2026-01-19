"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Zap,
  Users,
  X,
  CalendarDays,
  CalendarRange,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/utils/error-handler";

type ViewMode = "daily" | "monthly" | "range";

interface Schedule {
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

interface StaffSchedules {
  staffId: string;
  staffName: string;
  schedules: Schedule[];
}

interface DateGroupedSchedules {
  date: string;
  dateLabel: string;
  staffSchedules: StaffSchedules[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  reserved: { label: "예약됨", color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200" },
  completed: { label: "출석완료", color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" },
  no_show_deducted: { label: "노쇼(차감)", color: "text-rose-600", bgColor: "bg-rose-50", borderColor: "border-rose-200" },
  no_show: { label: "노쇼", color: "text-slate-500", bgColor: "bg-slate-100", borderColor: "border-slate-200" },
  service: { label: "서비스", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  cancelled: { label: "취소됨", color: "text-slate-400", bgColor: "bg-slate-50", borderColor: "border-slate-200" },
};

export default function AdminAttendancePage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading, isApproved } = useAuth();
  const { selectedGymId, selectedStaffId, gymName, isInitialized } = useAdminFilter();

  // 뷰 모드
  const [viewMode, setViewMode] = useState<ViewMode>("daily");

  // 일별 모드
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // 월별 모드
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );

  // 기간 모드
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const supabase = useMemo(() => createSupabaseClient(), []);

  // 날짜 이동 (일별)
  const moveDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  // 월 이동
  const moveMonth = (months: number) => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month - 1 + months, 1);
    setSelectedMonth(date.toISOString().slice(0, 7));
  };

  // 오늘로 이동
  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today.toISOString().split("T")[0]);
    setSelectedMonth(today.toISOString().slice(0, 7));
  };

  // 스케줄 조회
  const fetchSchedules = useCallback(async () => {
    if (!selectedGymId || !isInitialized) return;

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
        .eq("gym_id", selectedGymId)
        .gte("start_time", queryStartTime)
        .lte("start_time", queryEndTime)
        .not("member_id", "is", null)
        .order("start_time", { ascending: true });

      if (selectedStaffId) {
        query = query.eq("staff_id", selectedStaffId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error("스케줄 조회 실패:", error);
      showError("스케줄을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedGymId, selectedStaffId, selectedDate, selectedMonth, startDate, endDate, viewMode, isInitialized, supabase]);

  // 초기화 및 데이터 로드
  useEffect(() => {
    if (authLoading) return;
    if (!authUser || !isApproved) {
      router.push("/sign-in");
      return;
    }
  }, [authLoading, authUser, isApproved, router]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // 직원별 스케줄 그룹핑 (일별)
  const staffSchedules = useMemo((): StaffSchedules[] => {
    const groupedMap = new Map<string, StaffSchedules>();

    schedules.forEach((schedule) => {
      const staffId = schedule.staff_id;
      const staffName = schedule.staff?.name || "알 수 없음";

      if (!groupedMap.has(staffId)) {
        groupedMap.set(staffId, {
          staffId,
          staffName,
          schedules: [],
        });
      }
      groupedMap.get(staffId)!.schedules.push(schedule);
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
          const staffId = schedule.staff_id;
          const staffName = schedule.staff?.name || "알 수 없음";

          if (!staffMap.has(staffId)) {
            staffMap.set(staffId, { staffId, staffName, schedules: [] });
          }
          staffMap.get(staffId)!.schedules.push(schedule);
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

  // 상태 변경
  const handleStatusChange = async (scheduleId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/schedule/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId, newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "상태 변경 실패");
      }

      showSuccess("출석 상태가 변경되었습니다.");
      setIsStatusModalOpen(false);
      setSelectedSchedule(null);
      fetchSchedules();
    } catch (error: any) {
      showError(error.message || "상태 변경에 실패했습니다.");
    }
  };

  // 스케줄 카드 클릭
  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsStatusModalOpen(true);
  };

  // 날짜 포맷 (간단)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${weekDays[date.getDay()]})`;
  };

  // 날짜 포맷 (전체)
  function formatDateFull(dateStr: string) {
    const date = new Date(dateStr);
    const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekDays[date.getDay()]})`;
  }

  // 월 포맷
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    return `${year}년 ${parseInt(month)}월`;
  };

  // 시간 포맷
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // 통계 계산
  const stats = useMemo(() => {
    const total = schedules.length;
    const completed = schedules.filter(s => s.status === "completed").length;
    const noShow = schedules.filter(s => ["no_show", "no_show_deducted"].includes(s.status)).length;
    const pending = schedules.filter(s => s.status === "reserved").length;
    return { total, completed, noShow, pending };
  }, [schedules]);

  // 스케줄 아이템 렌더링 (공통)
  const renderScheduleItem = (schedule: Schedule, showDate = false) => {
    const statusConfig = STATUS_CONFIG[schedule.status] || STATUS_CONFIG.reserved;

    return (
      <div
        key={schedule.id}
        onClick={() => handleScheduleClick(schedule)}
        className="px-6 py-4 flex items-center justify-between hover:bg-blue-50/30 cursor-pointer transition-all group"
      >
        <div className="flex items-center gap-4">
          {/* 시간 */}
          <div className="w-20 text-center">
            {showDate && (
              <div className="text-[10px] font-bold text-blue-500 mb-0.5">
                {new Date(schedule.start_time).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
              </div>
            )}
            <div className="text-lg font-black text-slate-900">
              {formatTime(schedule.start_time)}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">
              ~ {formatTime(schedule.end_time)}
            </div>
          </div>

          {/* 구분선 */}
          <div className="w-px h-12 bg-slate-100"></div>

          {/* 회원 정보 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
              {schedule.member_name?.charAt(0) || "?"}
            </div>
            <div>
              <div className="font-bold text-slate-900">
                {schedule.member_name || "회원"}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase">
                  {schedule.type}
                </span>
                {schedule.schedule_type && (
                  <span className="text-slate-300">
                    {schedule.schedule_type === "inside" ? "근무내" :
                     schedule.schedule_type === "outside" ? "근무외" :
                     schedule.schedule_type === "weekend" ? "주말" :
                     schedule.schedule_type === "holiday" ? "공휴일" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 상태 */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "px-4 py-2 rounded-xl border font-bold text-sm",
            statusConfig.bgColor,
            statusConfig.color,
            statusConfig.borderColor
          )}>
            {statusConfig.label}
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
            <Zap className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
    );
  };

  if (isLoading && !schedules.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">출석 관리</h1>
          <p className="text-slate-500 text-sm font-medium mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            {gymName} 회원 스케줄 출석 체크
          </p>
        </div>
      </div>

      {/* 뷰 모드 & 날짜/기간 선택 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
        {/* 뷰 모드 탭 */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "daily" ? "default" : "outline"}
            onClick={() => setViewMode("daily")}
            className={cn(
              "rounded-xl font-bold gap-2",
              viewMode === "daily" && "bg-slate-900 text-white"
            )}
          >
            <Calendar className="w-4 h-4" />
            일별
          </Button>
          <Button
            variant={viewMode === "monthly" ? "default" : "outline"}
            onClick={() => setViewMode("monthly")}
            className={cn(
              "rounded-xl font-bold gap-2",
              viewMode === "monthly" && "bg-slate-900 text-white"
            )}
          >
            <CalendarDays className="w-4 h-4" />
            월별
          </Button>
          <Button
            variant={viewMode === "range" ? "default" : "outline"}
            onClick={() => setViewMode("range")}
            className={cn(
              "rounded-xl font-bold gap-2",
              viewMode === "range" && "bg-slate-900 text-white"
            )}
          >
            <CalendarRange className="w-4 h-4" />
            기간 지정
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* 날짜/기간 선택 */}
          <div className="flex items-center gap-3 flex-wrap">
            {viewMode === "daily" && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => moveDate(-1)}
                  className="h-10 w-10 rounded-xl border-slate-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>

                <div className="flex items-center gap-3">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-44 h-10 rounded-xl border-slate-200 font-medium"
                  />
                  <span className="text-lg font-bold text-slate-900 hidden sm:block">
                    {formatDate(selectedDate)}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => moveDate(1)}
                  className="h-10 w-10 rounded-xl border-slate-200"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>

                <Button
                  variant="outline"
                  onClick={goToToday}
                  className="h-10 px-4 rounded-xl border-slate-200 font-bold text-sm"
                >
                  오늘
                </Button>
              </>
            )}

            {viewMode === "monthly" && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => moveMonth(-1)}
                  className="h-10 w-10 rounded-xl border-slate-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>

                <div className="flex items-center gap-3">
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-44 h-10 rounded-xl border-slate-200 font-medium"
                  />
                  <span className="text-lg font-bold text-slate-900 hidden sm:block">
                    {formatMonth(selectedMonth)}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => moveMonth(1)}
                  className="h-10 w-10 rounded-xl border-slate-200"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>

                <Button
                  variant="outline"
                  onClick={goToToday}
                  className="h-10 px-4 rounded-xl border-slate-200 font-bold text-sm"
                >
                  이번 달
                </Button>
              </>
            )}

            {viewMode === "range" && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-500">시작일</span>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-44 h-10 rounded-xl border-slate-200 font-medium"
                  />
                </div>
                <span className="text-slate-300 font-bold">~</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-500">종료일</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-44 h-10 rounded-xl border-slate-200 font-medium"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    const today = new Date();
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    setStartDate(weekAgo.toISOString().split("T")[0]);
                    setEndDate(today.toISOString().split("T")[0]);
                  }}
                  className="h-10 px-4 rounded-xl border-slate-200 font-bold text-sm"
                >
                  최근 1주일
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const today = new Date();
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    setStartDate(monthAgo.toISOString().split("T")[0]);
                    setEndDate(today.toISOString().split("T")[0]);
                  }}
                  className="h-10 px-4 rounded-xl border-slate-200 font-bold text-sm"
                >
                  최근 1개월
                </Button>
              </>
            )}
          </div>

          {/* 통계 */}
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-50 rounded-xl">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-bold text-slate-600">전체 {stats.total}건</span>
            </div>
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-50 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-600">출석 {stats.completed}건</span>
            </div>
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-rose-50 rounded-xl">
              <XCircle className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-bold text-rose-600">노쇼 {stats.noShow}건</span>
            </div>
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-amber-50 rounded-xl">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-amber-600">대기 {stats.pending}건</span>
            </div>
          </div>
        </div>
      </div>

      {/* 스케줄 목록 */}
      {schedules.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 shadow-sm border border-slate-100 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-slate-200" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">스케줄이 없습니다</h3>
          <p className="text-slate-400 font-medium">
            {viewMode === "daily" && `${formatDate(selectedDate)}에 예정된 회원 스케줄이 없습니다.`}
            {viewMode === "monthly" && `${formatMonth(selectedMonth)}에 예정된 회원 스케줄이 없습니다.`}
            {viewMode === "range" && `선택한 기간에 예정된 회원 스케줄이 없습니다.`}
          </p>
        </div>
      ) : viewMode === "daily" ? (
        /* 일별 뷰 - 직원별 그룹핑 */
        <div className="space-y-6">
          {staffSchedules.map((group) => (
            <div key={group.staffId} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              {/* 직원 헤더 */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold">
                    {group.staffName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{group.staffName}</h3>
                    <p className="text-xs text-slate-400">총 {group.schedules.length}건의 스케줄</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg">
                    출석 {group.schedules.filter(s => s.status === "completed").length}
                  </span>
                  <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-lg">
                    대기 {group.schedules.filter(s => s.status === "reserved").length}
                  </span>
                </div>
              </div>

              {/* 스케줄 목록 */}
              <div className="divide-y divide-slate-50">
                {group.schedules.map((schedule) => renderScheduleItem(schedule))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 월별/기간 뷰 - 날짜별 > 직원별 그룹핑 */
        <div className="space-y-8">
          {dateGroupedSchedules.map((dateGroup) => (
            <div key={dateGroup.date} className="space-y-4">
              {/* 날짜 헤더 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                  {new Date(dateGroup.date).getDate()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{dateGroup.dateLabel}</h2>
                  <p className="text-xs text-slate-400">
                    총 {dateGroup.staffSchedules.reduce((acc, s) => acc + s.schedules.length, 0)}건
                  </p>
                </div>
              </div>

              {/* 직원별 스케줄 */}
              <div className="space-y-4 ml-4 border-l-2 border-slate-100 pl-6">
                {dateGroup.staffSchedules.map((group) => (
                  <div key={group.staffId} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* 직원 헤더 */}
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white text-sm font-bold">
                          {group.staffName.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900 text-sm">{group.staffName}</span>
                        <span className="text-xs text-slate-400">({group.schedules.length}건)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded">
                          출석 {group.schedules.filter(s => s.status === "completed").length}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded">
                          대기 {group.schedules.filter(s => s.status === "reserved").length}
                        </span>
                      </div>
                    </div>

                    {/* 스케줄 목록 */}
                    <div className="divide-y divide-slate-50">
                      {group.schedules.map((schedule) => renderScheduleItem(schedule))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 출석 상태 변경 모달 */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="max-w-md bg-[#f8fafc] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px]">
          <DialogHeader className="px-8 py-6 bg-slate-900 flex-shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
            <DialogTitle className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">출석 상태 변경</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Attendance Status</p>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">출석 상태를 변경합니다</DialogDescription>
            <button
              onClick={() => setIsStatusModalOpen(false)}
              className="absolute top-6 right-8 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all group z-10"
            >
              <X className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </DialogHeader>

          {selectedSchedule && (
            <div className="p-8 space-y-8 bg-[#f8fafc]">
              {/* 스케줄 정보 */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-black text-slate-900 leading-tight">
                      {selectedSchedule.member_name || "회원"}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(selectedSchedule.start_time).toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" })}
                      </span>
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(selectedSchedule.start_time)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Current Status:</span>
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                    STATUS_CONFIG[selectedSchedule.status]?.bgColor || "bg-slate-100",
                    STATUS_CONFIG[selectedSchedule.status]?.color || "text-slate-500"
                  )}>
                    {STATUS_CONFIG[selectedSchedule.status]?.label || selectedSchedule.status}
                  </span>
                </div>
              </div>

              {/* 상태 변경 버튼 */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Change Status
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "reserved", label: "예약완료", color: "bg-indigo-600" },
                    { id: "completed", label: "출석완료", color: "bg-emerald-500" },
                    { id: "no_show_deducted", label: "노쇼(차감)", color: "bg-rose-500" },
                    { id: "no_show", label: "노쇼", color: "bg-slate-500" },
                    { id: "service", label: "서비스", color: "bg-blue-500" },
                    { id: "cancelled", label: "취소", color: "bg-slate-300" },
                  ].map((btn) => (
                    <Button
                      key={btn.id}
                      onClick={() => handleStatusChange(selectedSchedule.id, btn.id)}
                      disabled={selectedSchedule.status === btn.id}
                      className={cn(
                        "h-14 rounded-2xl font-black transition-all",
                        selectedSchedule.status === btn.id
                          ? `${btn.color} text-white shadow-lg`
                          : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                      )}
                    >
                      {btn.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
