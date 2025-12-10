"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface Schedule {
  id: string;
  start_time: string;
  end_time: string;
  member_name: string;
  type: string;
  status: string;
  schedule_type?: string;
}

interface WeeklyTimetableProps {
  schedules: Schedule[];
  onScheduleClick?: (schedule: Schedule) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
  viewType?: 'day' | 'week' | 'month';
  selectedDate: string; // "YYYY-MM-DD"
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const START_HOUR = 6; // 06:00
const END_HOUR = 24; // 24:00
const SLOT_MINUTES = 30;

export default function WeeklyTimetable({ schedules, onScheduleClick, onTimeSlotClick, viewType = 'week', selectedDate }: WeeklyTimetableProps) {
  // 현재 주의 시작일 (월요일 기준, 혹은 선택된 날짜가 속한 주의 월요일)
  const weekStart = useMemo(() => {
    const current = new Date(selectedDate);
    const day = current.getDay();
    // 일요일(0)이면 -6일 전으로 이동 (월요일부터 시작하도록)
    // 월요일(1)이면 그날이 시작일
    // 화요일(2)이면 -1일 전...
    
    // 만약 일요일을 시작으로 하려면:
    // const diff = current.getDate() - day;
    
    // 사용자가 원하는 것이 월요일 시작인지 일요일 시작인지 명시적이진 않지만
    // 이전 코드에서 (day === 0 ? -6 : 1) 로직이 있었음.
    // 이전 로직: today.getDate() - day + (day === 0 ? -6 : 1)
    // day=0(일) -> date - 0 - 6 = date - 6 (지난주 월요일?)
    // day=1(월) -> date - 1 + 1 = date (이번주 월요일)
    
    // 일반적인 달력(일요일 시작)으로 변경하는 것이 더 직관적일 수 있으나
    // 기존 로직(월요일 시작)을 유지하면서 selectedDate 기준으로 변경
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
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
      // 선택된 날짜만 표시
      dates.push(new Date(selectedDate));
    } else if (viewType === 'week') {
      // 일주일 (일~토) -> 월요일 시작 로직이면 월~일
      // 위 weekStart 로직이 월요일 시작이므로 월~일로 렌더링됨
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        dates.push(date);
      }
    } else {
      // month는 현재 week와 동일하게 처리 (간단하게)
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        dates.push(date);
      }
    }

    return dates;
  }, [weekStart, viewType, selectedDate]);

  // 이전 weekDates를 displayDates로 변경
  const weekDates = displayDates;

  // 스케줄을 날짜별, 시간별로 그룹화 (날짜까지 정확히 매칭)
  const scheduleGrid = useMemo(() => {
    const grid: Map<string, Schedule[]> = new Map();

    schedules.forEach((schedule) => {
      const startDate = new Date(schedule.start_time);
      const dateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const hours = startDate.getHours();
      const minutes = startDate.getMinutes();
      const timeSlot = `${String(hours).padStart(2, '0')}:${minutes < 30 ? '00' : '30'}`;

      const key = `${dateStr}-${timeSlot}`;
      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key)!.push(schedule);
    });

    return grid;
  }, [schedules]);

  const getScheduleColor = (schedule: Schedule) => {
    // 상태별 색상
    if (schedule.status === 'completed') return 'bg-orange-100 border-orange-400 text-orange-900';
    if (schedule.status === 'cancelled') return 'bg-gray-100 border-gray-400 text-gray-600';

    // 타입별 색상
    if (schedule.type === 'OT') return 'bg-blue-100 border-blue-400 text-blue-900';
    if (schedule.type === 'PT') {
      // schedule_type별 색상
      if (schedule.schedule_type === 'weekend') return 'bg-purple-100 border-purple-400 text-purple-900';
      if (schedule.schedule_type === 'holiday') return 'bg-red-100 border-red-400 text-red-900';
      if (schedule.schedule_type === 'outside') return 'bg-yellow-100 border-yellow-400 text-yellow-900';
      return 'bg-green-100 border-green-400 text-green-900'; // inside
    }

    return 'bg-gray-100 border-gray-400 text-gray-900';
  };

  const handleTimeSlotClick = (date: Date, timeSlot: string) => {
    if (!onTimeSlotClick) return;

    const clickedDate = new Date(date);
    const [hours, minutes] = timeSlot.split(':').map(Number);
    clickedDate.setHours(hours, minutes, 0, 0);

    onTimeSlotClick(clickedDate, timeSlot);
  };

  return (
    <div className="w-full h-full overflow-hidden bg-white rounded-lg shadow border md:mx-0 relative flex flex-col">
      <div className="flex-1 overflow-auto relative">
        <table className={cn("w-full border-collapse", viewType === 'day' ? 'min-w-full' : 'min-w-[700px] md:min-w-full')}>
          {/* 헤더 */}
          <thead className="sticky top-0 z-40">
            <tr className="bg-[#2F80ED] text-white shadow-sm">
              <th className="border border-[#1c6cd7] p-2 w-16 md:w-20 sticky left-0 bg-[#2F80ED] z-50 text-xs font-bold h-10 md:h-12 align-middle">
                시간
              </th>
              {weekDates.map((date, idx) => {
                const isToday = new Date().toDateString() === date.toDateString();
                return (
                  <th key={idx} className={cn(
                    "border border-[#1c6cd7] p-2 min-w-[100px] h-10 md:h-12 align-middle",
                    isToday && "bg-[#1c6cd7]"
                  )}>
                    <div className="flex flex-col items-center justify-center h-full gap-0.5">
                      <span className="text-sm font-bold">{DAYS[date.getDay()]}</span>
                      <span className="text-[10px] md:text-xs bg-white/20 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                        {date.getMonth() + 1}.{date.getDate()}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* 바디 */}
          <tbody>
            {timeSlots.map((timeSlot, timeIdx) => (
              <tr key={timeSlot} className={cn(timeIdx % 2 === 0 ? 'bg-gray-50' : 'bg-white')}>
                {/* 시간 컬럼 */}
                <td className="border border-gray-200 p-2 text-center text-xs md:text-sm font-medium sticky left-0 bg-gray-50 z-30 border-r-2 border-r-gray-300">
                  {timeSlot}
                </td>

                {/* 요일별 셀 */}
                {weekDates.map((date, dayIdx) => {
                  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
                  const key = `${dateStr}-${timeSlot}`;
                  const schedulesInSlot = scheduleGrid.get(key) || [];

                  return (
                    <td
                      key={dayIdx}
                      className="border border-gray-200 p-0 align-top hover:bg-blue-50 cursor-pointer transition-colors relative"
                      onClick={() => {
                        if (schedulesInSlot.length === 0) {
                          handleTimeSlotClick(date, timeSlot);
                        }
                      }}
                    >
                      <div className="min-h-[40px] md:min-h-[50px] flex flex-col w-full h-full">
                        {schedulesInSlot.map((schedule, sIdx) => (
                          <div
                            key={schedule.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onScheduleClick?.(schedule);
                            }}
                            className={cn(
                              "px-1.5 py-1 border-l-[3px] text-[10px] md:text-xs font-medium cursor-pointer hover:brightness-95 transition-all w-full overflow-hidden flex-1",
                              sIdx < schedulesInSlot.length - 1 && "border-b border-black/5",
                              getScheduleColor(schedule)
                            )}
                          >
                            <div className="font-bold truncate leading-tight">{schedule.type}</div>
                            <div className="truncate leading-tight">{schedule.member_name}</div>
                            {/* 모바일에서는 시간 숨기거나 간소화 */}
                            <div className="hidden md:block text-[9px] opacity-80 mt-0.5">
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
          <div className="w-4 h-4 bg-green-100 border-l-4 border-green-400 rounded"></div>
          <span>PT (근무내)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border-l-4 border-yellow-400 rounded"></div>
          <span>PT (근무외)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-100 border-l-4 border-purple-400 rounded"></div>
          <span>PT (주말)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border-l-4 border-red-400 rounded"></div>
          <span>PT (공휴일)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border-l-4 border-blue-400 rounded"></div>
          <span>OT</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-100 border-l-4 border-orange-400 rounded"></div>
          <span>출석완료</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border-l-4 border-gray-400 rounded"></div>
          <span>취소</span>
        </div>
      </div>
    </div>
  );
}
