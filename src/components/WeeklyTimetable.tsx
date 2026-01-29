"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface Schedule {
  id: string;
  start_time: string;
  end_time: string;
  member_name: string;
  type: string;
  status: string;
  schedule_type?: string;
  sub_type?: string;
  total_sessions?: number;
  session_number?: number;
  is_not_completed?: boolean;
}

type Staff = {
  id: string;
  name: string;
};

interface WeeklyTimetableProps {
  schedules: Schedule[];
  onScheduleClick?: (schedule: Schedule) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
  viewType?: 'day' | 'week' | 'month';
  selectedDate: string; // "YYYY-MM-DD"
  workStartTime?: string | null;
  workEndTime?: string | null;
  selectedStaffId?: string;
  staffs?: Staff[];
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const START_HOUR = 6; // 06:00
const END_HOUR = 24; // 24:00
const _SLOT_MINUTES = 30;

export default function WeeklyTimetable({
  schedules,
  onScheduleClick,
  onTimeSlotClick,
  viewType = 'week',
  selectedDate,
  workStartTime,
  workEndTime,
  selectedStaffId,
  staffs
}: WeeklyTimetableProps) {
  // 현재 주의 시작일 (월요일 기준, 혹은 선택된 날짜가 속한 주의 월요일)
  const weekStart = useMemo(() => {
    // 로컬 시간 기준으로 날짜 파싱 (타임존 문제 방지)
    const [year, month, day] = selectedDate.split('-').map(Number);
    const current = new Date(year, month - 1, day);
    const dayOfWeek = current.getDay();
    
    // 일반적인 달력(일요일 시작)으로 변경하는 것이 더 직관적일 수 있으나
    // 기존 로직(월요일 시작)을 유지하면서 selectedDate 기준으로 변경
    const diff = current.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(current);
    monday.setDate(diff);
    return monday;
  }, [selectedDate]);

  // 시간 슬롯 생성 (06:00~24:00, 30분 단위)
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      slots.push(`${String(hour).padStart(2, '0')}:00`);
      slots.push(`${String(hour).padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  // 표시할 날짜들 (viewType에 따라 다름)
  const displayDates = useMemo(() => {
    const dates: Date[] = [];

    if (viewType === 'day') {
      // 선택된 날짜만 표시 (로컬 시간 기준)
      const [year, month, day] = selectedDate.split('-').map(Number);
      dates.push(new Date(year, month - 1, day));
    } else {
      // 일주일 (월~일)
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        dates.push(date);
      }
    }

    return dates;
  }, [weekStart, viewType, selectedDate]);

  const weekDates = displayDates;

  // 스케줄을 날짜별, 시간별로 그룹화 및 duration 계산
  const { scheduleGrid, occupiedSlots } = useMemo(() => {
    const grid: Map<string, Array<Schedule & { rowSpan: number }>> = new Map();
    const occupied: Set<string> = new Set();

    schedules.forEach((schedule) => {
      const startDate = new Date(schedule.start_time);
      const endDate = new Date(schedule.end_time);

      // 로컬 시간 기준으로 날짜 문자열 생성 (타임존 문제 방지)
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, '0');
      const day = String(startDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const hours = startDate.getHours();
      const minutes = startDate.getMinutes();
      const timeSlot = `${String(hours).padStart(2, '0')}:${minutes < 30 ? '00' : '30'}`;

      // duration 계산 (30분 단위로 몇 칸을 차지하는지)
      const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
      const rowSpan = Math.max(1, Math.ceil(durationMinutes / 30));

      const key = `${dateStr}-${timeSlot}`;

      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key)!.push({ ...schedule, rowSpan });

      // 이 스케줄이 차지하는 모든 슬롯을 occupied에 추가
      for (let i = 1; i < rowSpan; i++) {
        const occupiedTime = new Date(startDate);
        occupiedTime.setMinutes(occupiedTime.getMinutes() + (i * 30));
        const occupiedHours = occupiedTime.getHours();
        const occupiedMinutes = occupiedTime.getMinutes();
        const occupiedSlot = `${String(occupiedHours).padStart(2, '0')}:${occupiedMinutes < 30 ? '00' : '30'}`;

        // occupied 슬롯의 날짜도 로컬 시간 기준으로 계산
        const occYear = occupiedTime.getFullYear();
        const occMonth = String(occupiedTime.getMonth() + 1).padStart(2, '0');
        const occDay = String(occupiedTime.getDate()).padStart(2, '0');
        const occDateStr = `${occYear}-${occMonth}-${occDay}`;

        const occupiedKey = `${occDateStr}-${occupiedSlot}`;
        occupied.add(occupiedKey);
      }
    });

    return { scheduleGrid: grid, occupiedSlots: occupied };
  }, [schedules]);

  const getScheduleColor = (schedule: Schedule) => {
    // 0. 개인 일정은 항상 바이올렛 (상태와 관계없이 최우선)
    if (schedule.type === '개인' || schedule.type?.toLowerCase() === 'personal') return 'bg-purple-200 border-purple-300 text-purple-900'; // 개인일정: 파스텔 바이올렛

    // 1. 출석 상태별 색상
    if (schedule.status === 'completed') return 'bg-emerald-200 border-emerald-300 text-emerald-900'; // 출석완료: 파스텔 에메랄드
    if (schedule.status === 'no_show') return 'bg-rose-300 border-rose-400 text-rose-900'; // 노쇼: 파스텔 로즈
    if (schedule.status === 'no_show_deducted') return 'bg-rose-100 border-rose-200 text-rose-800'; // 노쇼(차감): 연한 로즈
    if (schedule.status === 'service') return 'bg-amber-200 border-amber-300 text-amber-900'; // 서비스수업: 파스텔 앰버
    if (schedule.status === 'cancelled') return 'bg-gray-200 border-gray-300 text-gray-800'; // 취소: 파스텔 그레이

    // 2. 타입별 색상
    // OT
    if (schedule.type === 'OT') return 'bg-teal-200 border-teal-300 text-teal-900'; // OT: 파스텔 틸

    // PT
    if (schedule.type === 'PT') {
      // 주말 및 공휴일
      if (schedule.schedule_type === 'weekend' || schedule.schedule_type === 'holiday') {
        return 'bg-orange-200 border-orange-300 text-orange-900'; // 주말/공휴일: 파스텔 오렌지
      }
      // 근무외
      if (schedule.schedule_type === 'outside') {
        return 'bg-pink-200 border-pink-300 text-pink-900'; // PT(근무외): 파스텔 핑크
      }
      // 근무내 (기본)
      return 'bg-sky-200 border-sky-300 text-sky-900'; // PT(근무내): 파스텔 블루
    }

    // 기타
    return 'bg-gray-200 border-gray-300 text-gray-800';
  };

  const handleTimeSlotClick = (date: Date, timeSlot: string) => {
    if (!onTimeSlotClick) return;

    const clickedDate = new Date(date);
    const [hours, minutes] = timeSlot.split(':').map(Number);
    clickedDate.setHours(hours, minutes, 0, 0);

    onTimeSlotClick(clickedDate, timeSlot);
  };

  return (
    <div className="w-full h-full overflow-hidden bg-white rounded-[40px] shadow-2xl shadow-slate-200/60 border border-slate-100 md:mx-0 relative flex flex-col animate-in fade-in duration-1000">
      {/* 근무시간 정보 표시 */}
      {selectedStaffId && selectedStaffId !== "all" && (
        <div className="bg-slate-900 px-8 py-4 shadow-xl z-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4 text-sm">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-black text-white text-base tracking-tight">
                  {staffs?.find(s => s.id === selectedStaffId)?.name || '선택된 강사'} 코치
                </span>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Working Hours Today</p>
              </div>
            </div>
            <div className="px-6 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner">
              <span className="font-black text-blue-400 text-sm tracking-widest uppercase">
                {workStartTime ? workStartTime.substring(0, 5) : '--:--'} <span className="text-white/30 mx-2">-</span> {workEndTime ? workEndTime.substring(0, 5) : '--:--'}
              </span>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto relative custom-scrollbar">
        <table className={cn("w-full border-collapse", viewType === 'day' ? 'min-w-full' : 'min-w-[800px] md:min-w-full')}>
          {/* 헤더 */}
          <thead className="sticky top-0 z-40">
            <tr className="bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm">
              <th className="p-4 w-20 md:w-28 sticky left-0 bg-slate-50/95 backdrop-blur-md z-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] h-16 border-r border-slate-100 text-center">
                Time
              </th>
              {weekDates.map((date, idx) => {
                const isToday = new Date().toDateString() === date.toDateString();
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                return (
                  <th key={idx} className={cn(
                    "p-4 min-w-[140px] h-16 align-middle border-r border-slate-50 last:border-r-0 transition-colors",
                    isToday ? "bg-blue-50/40" : "bg-white/95 backdrop-blur-xl"
                  )}>
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-[0.15em]",
                        isToday ? "text-blue-600" : isWeekend ? "text-rose-500" : "text-slate-400"
                      )}>
                        {DAYS[date.getDay()]}
                      </span>
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-black tracking-tightest transition-all",
                        isToday ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110" : "text-slate-900"
                      )}>
                        {date.getDate()}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* 바디 */}
          <tbody className="divide-y divide-slate-50">
            {timeSlots.map((timeSlot, _timeIdx) => (
              <tr key={timeSlot} className="group">
                {/* 시간 컬럼 */}
                <td className="p-4 text-center text-[11px] font-black text-slate-400 sticky left-0 bg-slate-50/90 backdrop-blur-sm z-30 border-r border-slate-100 group-hover:text-blue-600 group-hover:bg-blue-50/50 transition-all">
                  {timeSlot}
                </td>

                {/* 요일별 셀 */}
                {weekDates.map((date, dayIdx) => {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const dateStr = `${year}-${month}-${day}`;
                  const key = `${dateStr}-${timeSlot}`;

                  if (occupiedSlots.has(key)) return null;

                  const schedulesInSlot = scheduleGrid.get(key) || [];
                  const cellRowSpan = schedulesInSlot.length > 0
                    ? Math.max(...schedulesInSlot.map(s => s.rowSpan))
                    : 1;

                  return (
                    <td
                      key={dayIdx}
                      rowSpan={cellRowSpan}
                      className={cn(
                        "p-1 align-top cursor-pointer transition-all relative h-[64px] border-r border-slate-50 last:border-r-0",
                        schedulesInSlot.length === 0 && "hover:bg-blue-50/20"
                      )}
                      onClick={() => {
                        if (schedulesInSlot.length === 0) {
                          handleTimeSlotClick(date, timeSlot);
                        }
                      }}
                    >
                      <div className="flex flex-col w-full h-full gap-1">
                        {schedulesInSlot.map((schedule, _sIdx) => (
                          <div
                            key={schedule.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onScheduleClick?.(schedule);
                            }}
                            className={cn(
                              "group/item px-4 py-3 rounded-[20px] border-2 transition-all w-full overflow-hidden flex flex-col justify-center shadow-sm hover:shadow-xl hover:scale-[1.03] hover:z-20 relative",
                              getScheduleColor(schedule)
                            )}
                            style={{
                              height: `${schedule.rowSpan * 64 - 8}px`,
                              minHeight: `${schedule.rowSpan * 64 - 8}px`
                            }}
                          >
                            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                            
                            <div className="flex items-center justify-between mb-1.5 relative z-10">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                                  {schedule.type}
                                </span>
                                {schedule.type === 'PT' && schedule.session_number && (
                                  <Badge className="bg-white/30 text-current border-none h-4 px-1.5 text-[9px] font-black rounded-lg">
                                    {schedule.session_number}회차
                                  </Badge>
                                )}
                              </div>
                              <div className="w-2 h-2 rounded-full bg-current animate-pulse opacity-40"></div>
                            </div>
                            
                            <div className="font-black text-sm truncate leading-tight tracking-tightest mb-1 relative z-10">
                              {schedule.member_name || '개인일정'}
                            </div>
                            
                            <div className="text-[10px] font-bold opacity-70 flex items-center gap-1.5 relative z-10">
                              <div className="w-4 h-4 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <Clock className="w-2.5 h-2.5" />
                              </div>
                              {new Date(schedule.start_time).toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 범례 */}
      <div className="p-4 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[10px] font-black uppercase tracking-widest shrink-0 sticky bottom-0 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2 text-sky-600 bg-sky-100/50 px-3 py-1.5 rounded-xl border border-sky-100">
          <div className="w-2 h-2 rounded-full bg-sky-400"></div>
          <span>PT (근무내)</span>
        </div>
        <div className="flex items-center gap-2 text-pink-600 bg-pink-100/50 px-3 py-1.5 rounded-xl border border-pink-100">
          <div className="w-2 h-2 rounded-full bg-pink-400"></div>
          <span>PT (근무외)</span>
        </div>
        <div className="flex items-center gap-2 text-orange-600 bg-orange-100/50 px-3 py-1.5 rounded-xl border border-orange-100">
          <div className="w-2 h-2 rounded-full bg-orange-400"></div>
          <span>PT (주말/공휴일)</span>
        </div>
        <div className="flex items-center gap-2 text-teal-600 bg-teal-100/50 px-3 py-1.5 rounded-xl border border-teal-100">
          <div className="w-2 h-2 rounded-full bg-teal-400"></div>
          <span>OT</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span>출석완료</span>
        </div>
        <div className="flex items-center gap-2 text-rose-600 bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200">
          <div className="w-2 h-2 rounded-full bg-rose-500"></div>
          <span>노쇼</span>
        </div>
        <div className="flex items-center gap-2 text-purple-600 bg-purple-100/50 px-3 py-1.5 rounded-xl border border-purple-100">
          <div className="w-2 h-2 rounded-full bg-purple-400"></div>
          <span>개인일정</span>
        </div>
      </div>
    </div>
  );
}
