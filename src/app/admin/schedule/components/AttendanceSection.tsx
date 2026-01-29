"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
  Users,
  CalendarDays,
  CalendarRange,
  Filter,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AttendanceViewMode = "daily" | "monthly" | "range";

interface ScheduleItem {
  id: string;
  member_id?: string;
  member_name?: string;
  start_time: string;
  end_time: string;
  status?: string;
  type?: string;
  sub_type?: string;
  staff_id?: string;
  trainer_name?: string;
  session_number?: number;
  total_sessions?: number;
  title?: string;
  schedule_type?: string;
}

interface Staff {
  id: string;
  name: string;
  role?: string;
}

interface AttendanceSectionProps {
  schedules: ScheduleItem[];
  staffs: Staff[];
  selectedStaffId: string;
  onScheduleClick: (schedule: ScheduleItem) => void;
  isLoading?: boolean;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  reserved: { label: "예약됨", color: "text-indigo-600", bgColor: "bg-indigo-50", borderColor: "border-indigo-100" },
  completed: { label: "출석완료", color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" },
  no_show_deducted: { label: "노쇼(차감)", color: "text-rose-600", bgColor: "bg-rose-50", borderColor: "border-rose-200" },
  no_show: { label: "노쇼", color: "text-slate-500", bgColor: "bg-slate-100", borderColor: "border-slate-200" },
  service: { label: "서비스", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  cancelled: { label: "취소됨", color: "text-slate-400", bgColor: "bg-slate-50", borderColor: "border-slate-200" },
};

export function AttendanceSection({
  schedules,
  staffs,
  selectedStaffId,
  onScheduleClick,
  isLoading,
  selectedDate: parentSelectedDate,
  onDateChange
}: AttendanceSectionProps) {
  const [viewMode, setViewMode] = useState<AttendanceViewMode>("daily");
  const [selectedType, setSelectedType] = useState<string>("all");
  
  // 일별 모드 (부모와 동기화)
  const selectedDate = parentSelectedDate;

  // 월별 모드
  const [selectedMonth, setSelectedMonth] = useState<string>(
    parentSelectedDate.slice(0, 7) // YYYY-MM
  );

  // 기간 모드
  const [startDate, setStartDate] = useState<string>(
    parentSelectedDate
  );
  const [endDate, setEndDate] = useState<string>(
    parentSelectedDate
  );

  // 필터링된 스케줄
  const filteredSchedules = useMemo(() => {
    let base = [...schedules]; // 모든 스케줄 (개인일정 포함)

    if (viewMode === "daily") {
      base = base.filter(s => {
        const d = new Date(s.start_time);
        const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return localDate === selectedDate;
      });
    } else if (viewMode === "monthly") {
      base = base.filter(s => {
        const d = new Date(s.start_time);
        const localMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return localMonth === selectedMonth;
      });
    } else {
      const start = new Date(`${startDate}T00:00:00`).getTime();
      const end = new Date(`${endDate}T23:59:59`).getTime();
      base = base.filter(s => {
        const time = new Date(s.start_time).getTime();
        return time >= start && time <= end;
      });
    }

    if (selectedStaffId !== "all") {
      base = base.filter(s => s.staff_id === selectedStaffId);
    }

    if (selectedType !== "all") {
      if (selectedType === "Member") {
        base = base.filter(s => s.member_id !== null && s.type?.toLowerCase() !== 'personal' && s.type !== '개인');
      } else if (selectedType === "Personal") {
        base = base.filter(s => s.member_id === null || s.type?.toLowerCase() === 'personal' || s.type === '개인');
      } else {
        base = base.filter(s => s.type === selectedType || (s.type === '개인' && selectedType === 'Personal') || (s.type === 'Personal' && selectedType === 'Personal'));
      }
    }

    return base.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [schedules, viewMode, selectedDate, selectedMonth, startDate, endDate, selectedStaffId, selectedType]);

  // 날짜별 > 직원별 그룹핑 (월별/기간 뷰용)
  const groupedByDate = useMemo(() => {
    if (viewMode === "daily") return [];

    const dateMap = new Map<string, Map<string, ScheduleItem[]>>();

    filteredSchedules.forEach(s => {
      const date = s.start_time.split("T")[0];
      const staffId = s.staff_id || "unknown";

      if (!dateMap.has(date)) dateMap.set(date, new Map());
      const staffMap = dateMap.get(date)!;

      if (!staffMap.has(staffId)) staffMap.set(staffId, []);
      staffMap.get(staffId)!.push(s);
    });

    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, staffMap]) => ({
        date,
        dateLabel: new Date(date).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" }),
        staffGroups: Array.from(staffMap.entries()).map(([staffId, staffSchedules]) => ({
          staffId,
          staffName: staffSchedules[0]?.trainer_name || staffs.find(st => st.id === staffId)?.name || "알 수 없음",
          schedules: staffSchedules
        })).sort((a, b) => a.staffName.localeCompare(b.staffName))
      }));
  }, [filteredSchedules, viewMode, staffs]);

  // 직원별 그룹핑 (일별 뷰용)
  const groupedByStaff = useMemo(() => {
    if (viewMode !== "daily") return [];

    const map = new Map<string, ScheduleItem[]>();
    filteredSchedules.forEach(s => {
      const staffId = s.staff_id || "unknown";
      if (!map.has(staffId)) map.set(staffId, []);
      map.get(staffId)!.push(s);
    });

    return Array.from(map.entries()).map(([staffId, staffSchedules]) => ({
      staffId,
      staffName: staffSchedules[0]?.trainer_name || staffs.find(st => st.id === staffId)?.name || "알 수 없음",
      schedules: staffSchedules
    })).sort((a, b) => a.staffName.localeCompare(b.staffName));
  }, [filteredSchedules, viewMode, staffs]);

  // 통계
  const stats = useMemo(() => {
    const total = filteredSchedules.length;
    const completed = filteredSchedules.filter(s => s.status === "completed").length;
    const noShow = filteredSchedules.filter(s => s.status && ["no_show", "no_show_deducted"].includes(s.status)).length;
    const pending = filteredSchedules.filter(s => s.status === "reserved").length;
    return { total, completed, noShow, pending };
  }, [filteredSchedules]);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const renderScheduleItem = (schedule: ScheduleItem) => {
    const statusConfig = STATUS_CONFIG[schedule.status || "reserved"] || STATUS_CONFIG.reserved;
    const isPersonal = schedule.member_id === null || schedule.type?.toLowerCase() === 'personal' || schedule.type === '개인';

    return (
      <div
        key={schedule.id}
        onClick={() => onScheduleClick(schedule)}
        className="px-6 py-4 flex items-center justify-between hover:bg-blue-50/30 cursor-pointer transition-all group border-b border-slate-50 last:border-0"
      >
        <div className="flex items-center gap-4">
          <div className="w-20 text-center">
            <div className="text-lg font-black text-slate-900">
              {formatTime(schedule.start_time)}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">
              ~ {formatTime(schedule.end_time)}
            </div>
          </div>

          <div className="w-px h-12 bg-slate-100"></div>

          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center font-bold",
              isPersonal ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
            )}>
              {isPersonal ? <Zap className="w-5 h-5" /> : (schedule.member_name?.charAt(0) || "?")}
            </div>
            <div>
              <div className="font-bold text-slate-900">
                {isPersonal ? (schedule.title || "개인 일정") : (schedule.member_name || "회원")}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                  isPersonal ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"
                )}>
                  {schedule.type}
                </span>
                {schedule.schedule_type && !isPersonal && (
                  <span className="text-slate-300">
                    {schedule.schedule_type === "inside" ? "근무내" :
                     schedule.schedule_type === "outside" ? "근무외" :
                     schedule.schedule_type === "weekend" ? "주말" :
                     schedule.schedule_type === "holiday" ? "공휴일" : ""}
                  </span>
                )}
                {isPersonal && schedule.sub_type && (
                  <span className="text-slate-300">
                    {schedule.sub_type}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn(
            "px-4 py-2 rounded-xl border font-bold text-sm",
            isPersonal ? "bg-slate-100 text-slate-500 border-slate-200" : (statusConfig.bgColor + " " + statusConfig.color + " " + statusConfig.borderColor)
          )}>
            {isPersonal ? "개인 일정" : statusConfig.label}
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
            <Pencil className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 필터 및 통계 카드 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* 뷰 모드 탭 */}
          <div className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-[20px]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("daily")}
              className={cn(
                "rounded-xl font-bold gap-2 h-9 px-4 transition-all",
                viewMode === "daily" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Calendar className="w-4 h-4" />
              일별
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("monthly")}
              className={cn(
                "rounded-xl font-bold gap-2 h-9 px-4 transition-all",
                viewMode === "monthly" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <CalendarDays className="w-4 h-4" />
              월별
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("range")}
              className={cn(
                "rounded-xl font-bold gap-2 h-9 px-4 transition-all",
                viewMode === "range" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <CalendarRange className="w-4 h-4" />
              기간 지정
            </Button>
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

        {/* 날짜/기간 상세 선택 */}
        <div className="pt-4 border-t border-slate-50 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            {viewMode === "daily" && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Select Date</span>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="w-44 h-10 rounded-xl border-slate-200 font-medium"
                />
              </div>
            )}

            {viewMode === "monthly" && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Select Month</span>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    onDateChange(`${e.target.value}-01`);
                  }}
                  className="w-44 h-10 rounded-xl border-slate-200 font-medium"
                />
              </div>
            )}

            {viewMode === "range" && (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">From</span>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      onDateChange(e.target.value);
                    }}
                    className="w-40 h-10 rounded-xl border-slate-200 font-medium"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">To</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      onDateChange(e.target.value);
                    }}
                    className="w-40 h-10 rounded-xl border-slate-200 font-medium"
                  />
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const weekAgo = new Date(today);
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      const start = weekAgo.toISOString().split("T")[0];
                      const end = today.toISOString().split("T")[0];
                      setStartDate(start);
                      setEndDate(end);
                      onDateChange(start);
                    }}
                    className="h-9 px-3 rounded-lg border-slate-200 text-xs font-bold"
                  >
                    최근 1주일
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const monthAgo = new Date(today);
                      monthAgo.setMonth(monthAgo.getMonth() - 1);
                      const start = monthAgo.toISOString().split("T")[0];
                      const end = today.toISOString().split("T")[0];
                      setStartDate(start);
                      setEndDate(end);
                      onDateChange(start);
                    }}
                    className="h-9 px-3 rounded-lg border-slate-200 text-xs font-bold"
                  >
                    최근 1개월
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 수업 유형 필터 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Type</span>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-32 h-10 rounded-xl border-slate-200 font-bold text-sm bg-white">
                <SelectValue placeholder="수업 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 일정</SelectItem>
                <SelectItem value="Member">회원 수업 전체</SelectItem>
                <SelectItem value="PT">PT 수업</SelectItem>
                <SelectItem value="OT">OT 수업</SelectItem>
                <SelectItem value="Consulting">상담</SelectItem>
                <SelectItem value="GX">GX 그룹</SelectItem>
                <SelectItem value="Personal">개인 일정</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 리스트 영역 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 shadow-sm border border-slate-100 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-slate-200" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">조회된 스케줄이 없습니다</h3>
          <p className="text-slate-400 font-medium">선택한 조건에 해당하는 회원 스케줄이 없습니다.</p>
        </div>
      ) : viewMode === "daily" ? (
        <div className="space-y-6">
          {groupedByStaff.map((group) => (
            <div key={group.staffId} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
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
              <div className="divide-y divide-slate-50">
                {group.schedules.map((schedule) => renderScheduleItem(schedule))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByDate.map((dateGroup) => (
            <div key={dateGroup.date} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-200">
                  {new Date(dateGroup.date).getDate()}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">{dateGroup.dateLabel}</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                    Total {dateGroup.staffGroups.reduce((acc, g) => acc + g.schedules.length, 0)} Sessions
                  </p>
                </div>
              </div>
              <div className="space-y-4 ml-4 border-l-2 border-slate-100 pl-6">
                {dateGroup.staffGroups.map((group) => (
                  <div key={group.staffId} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white text-sm font-bold">
                          {group.staffName.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900 text-sm">{group.staffName}</span>
                        <span className="text-xs text-slate-400 font-medium">({group.schedules.length}건)</span>
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
    </div>
  );
}

