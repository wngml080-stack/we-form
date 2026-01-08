"use client";

import { useMemo } from "react";
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

interface WeeklyTimetableProps {
  schedules: Schedule[];
  onScheduleClick?: (schedule: Schedule) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
  viewType?: 'day' | 'week' | 'month';
  selectedDate: string; // "YYYY-MM-DD"
  workStartTime?: string | null;
  workEndTime?: string | null;
  selectedStaffId?: string;
  staffs?: any[];
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const START_HOUR = 6; // 06:00
const END_HOUR = 24; // 24:00
const SLOT_MINUTES = 30;

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
    <div className="w-full h-full overflow-hidden bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 md:mx-0 relative flex flex-col animate-in fade-in duration-1000">
      {/* 근무시간 정보 표시 */}
      {selectedStaffId && selectedStaffId !== "all" && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 shadow-lg z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-white tracking-tight">
                {staffs?.find(s => s.id === selectedStaffId)?.name || '선택된 강사'} 코치 근무시간
              </span>
            </div>
            <div className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <span className="font-black text-white text-xs tracking-widest uppercase">
                {workStartTime ? workStartTime.substring(0, 5) : '--:--'} - {workEndTime ? workEndTime.substring(0, 5) : '--:--'}
              </span>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto relative custom-scrollbar">
        <table className={cn("w-full border-collapse", viewType === 'day' ? 'min-w-full' : 'min-w-[800px] md:min-w-full')}>
          {/* 헤더 */}
          <thead className="sticky top-0 z-40">
            <tr className="bg-white border-b border-slate-100">
              <th className="p-3 w-16 md:w-24 sticky left-0 bg-slate-50/90 backdrop-blur-md z-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] h-14 border-r border-slate-100">
                Time
              </th>
              {weekDates.map((date, idx) => {
                const isToday = new Date().toDateString() === date.toDateString();
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                return (
                  <th key={idx} className={cn(
                    "p-3 min-w-[120px] h-14 align-middle border-r border-slate-50 last:border-r-0",
                    isToday ? "bg-blue-50/50" : "bg-white/90 backdrop-blur-md"
                  )}>
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className={cn(
                        "text-[11px] font-black uppercase tracking-widest",
                        isToday ? "text-blue-600" : isWeekend ? "text-rose-500" : "text-slate-500"
                      )}>
                        {DAYS[date.getDay()]}
                      </span>
                      <span className={cn(
                        "text-lg font-black tracking-tighter",
                        isToday ? "text-blue-600" : "text-slate-900"
                      )}>
                        {date.getDate()}
                      </span>
                      {isToday && <div className="w-1 h-1 bg-blue-600 rounded-full mt-1"></div>}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* 바디 */}
          <tbody className="divide-y divide-slate-50">
            {timeSlots.map((timeSlot, timeIdx) => (
              <tr key={timeSlot} className="group">
                {/* 시간 컬럼 */}
                <td className="p-3 text-center text-[11px] font-black text-slate-400 sticky left-0 bg-slate-50/80 backdrop-blur-sm z-30 border-r border-slate-100 group-hover:text-blue-500 transition-colors">
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
                        "p-0.5 align-top cursor-pointer transition-all relative h-[54px] border-r border-slate-50 last:border-r-0",
                        schedulesInSlot.length === 0 && "hover:bg-blue-50/30"
                      )}
                      onClick={() => {
                        if (schedulesInSlot.length === 0) {
                          handleTimeSlotClick(date, timeSlot);
                        }
                      }}
                    >
                      <div className="flex flex-col w-full h-full gap-0.5">
                        {schedulesInSlot.map((schedule, sIdx) => (
                          <div
                            key={schedule.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onScheduleClick?.(schedule);
                            }}
                            className={cn(
                              "group/item px-3 py-2 rounded-2xl border-2 transition-all w-full overflow-hidden flex flex-col justify-center shadow-sm hover:shadow-md hover:scale-[1.02] hover:z-10",
                              getScheduleColor(schedule)
                            )}
                            style={{
                              height: `${schedule.rowSpan * 54 - 4}px`,
                              minHeight: `${schedule.rowSpan * 54 - 4}px`
                            }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-black uppercase tracking-tighter opacity-70">
                                {schedule.type}
                                {/* PT인 경우 회차 표시 */}
                                {schedule.type === 'PT' && schedule.session_number && schedule.total_sessions && (
                                  <span className="ml-1">({schedule.session_number}/{schedule.total_sessions}회)</span>
                                )}
                              </span>
                              <div className="w-1.5 h-1.5 rounded-full bg-current opacity-30"></div>
                            </div>
                            <div className="font-black text-[13px] truncate leading-none tracking-tight mb-1">
                              {schedule.member_name || '개인일정'}
                            </div>
                            <div className="text-[10px] font-bold opacity-80 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
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
      <div className="p-3 border-t bg-gray-50 flex flex-wrap gap-x-4 gap-y-2 text-xs shrink-0 sticky bottom-0 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-sky-200 border-l-4 border-sky-300 rounded"></div>
          <span>PT (근무내)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-pink-200 border-l-4 border-pink-300 rounded"></div>
          <span>PT (근무외)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-200 border-l-4 border-orange-300 rounded"></div>
          <span>PT (주말)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-200 border-l-4 border-orange-300 rounded"></div>
          <span>PT (공휴일)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-teal-200 border-l-4 border-teal-300 rounded"></div>
          <span>OT</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-200 border-l-4 border-emerald-300 rounded"></div>
          <span>출석완료</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-rose-300 border-l-4 border-rose-400 rounded"></div>
          <span>노쇼</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-rose-100 border-l-4 border-rose-200 rounded"></div>
          <span>노쇼 (차감)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-200 border-l-4 border-amber-300 rounded"></div>
          <span>서비스</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 border-l-4 border-gray-300 rounded"></div>
          <span>취소</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-200 border-l-4 border-purple-300 rounded"></div>
          <span>개인일정</span>
        </div>
      </div>
    </div>
  );
}
