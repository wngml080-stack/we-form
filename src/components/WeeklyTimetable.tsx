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

      // 디버깅 로그 제거 (성능 개선)

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
    if (schedule.type === '개인') return 'bg-purple-200 border-purple-300 text-purple-900'; // 개인일정: 파스텔 바이올렛

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
    <div className="w-full h-full overflow-hidden bg-white rounded-lg shadow border md:mx-0 relative flex flex-col">
      {/* 근무시간 정보 표시 */}
      {selectedStaffId && selectedStaffId !== "all" && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 px-4 py-2.5">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="font-semibold text-gray-700">
              {staffs?.find(s => s.id === selectedStaffId)?.name || '선택된 강사'}의 근무시간:
            </span>
            <span className="font-bold text-[#2F80ED]">
              {workStartTime ? workStartTime.substring(0, 5) : '--:--'} ~ {workEndTime ? workEndTime.substring(0, 5) : '--:--'}
            </span>
          </div>
        </div>
      )}
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
                  // 로컬 시간 기준으로 날짜 문자열 생성
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const dateStr = `${year}-${month}-${day}`;
                  const key = `${dateStr}-${timeSlot}`;

                  // 이 슬롯이 다른 스케줄에 의해 차지되어 있으면 td를 렌더링하지 않음
                  if (occupiedSlots.has(key)) {
                    return null;
                  }

                  const schedulesInSlot = scheduleGrid.get(key) || [];
                  // 같은 셀에 여러 스케줄이 있을 때, 최대 rowSpan을 사용
                  const cellRowSpan = schedulesInSlot.length > 0
                    ? Math.max(...schedulesInSlot.map(s => s.rowSpan))
                    : 1;

                  return (
                    <td
                      key={dayIdx}
                      rowSpan={cellRowSpan}
                      className={cn(
                        "p-0 align-top cursor-pointer transition-colors relative h-[50px]",
                        schedulesInSlot.length === 0 && "border border-gray-200 hover:bg-blue-50"
                      )}
                      onClick={() => {
                        if (schedulesInSlot.length === 0) {
                          handleTimeSlotClick(date, timeSlot);
                        }
                      }}
                    >
                      <div className="flex flex-col w-full h-full">
                        {schedulesInSlot.map((schedule, sIdx) => (
                          <div
                            key={schedule.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onScheduleClick?.(schedule);
                            }}
                            className={cn(
                              "px-1.5 py-1 border-l-[3px] text-[10px] md:text-xs font-medium cursor-pointer hover:brightness-95 transition-all w-full overflow-hidden flex flex-col justify-center",
                              getScheduleColor(schedule)
                            )}
                            style={{
                              height: `${schedule.rowSpan * 50}px`,
                              minHeight: `${schedule.rowSpan * 50}px`
                            }}
                          >
                            <div className="font-bold truncate leading-tight">
                              {(() => {
                                const scheduleType = schedule.type?.toLowerCase();
                                // Consulting → "상담 | 분류"
                                if (scheduleType === 'consulting' || scheduleType === '상담') {
                                  const subTypeLabel = schedule.sub_type === 'sales' ? '세일즈' :
                                    schedule.sub_type === 'info' ? '안내상담' :
                                    schedule.sub_type === 'status' ? '현황상담' :
                                    schedule.sub_type === 'other' ? '기타' : null;
                                  return subTypeLabel ? `상담 | ${subTypeLabel}` : '상담';
                                }
                                // PT → "PT 30회/5회차" 또는 "PT 30회/노쇼"
                                if (scheduleType === 'pt') {
                                  // 미진행 상태 (회차 카운트 안됨: no_show, cancelled, reserved)
                                  const statusLabel = schedule.status === 'no_show' ? '노쇼' :
                                    schedule.status === 'cancelled' ? '취소' :
                                    schedule.status === 'reserved' ? '예약' : null;

                                  if (schedule.total_sessions) {
                                    // 미진행 수업은 상태 표시
                                    if (statusLabel && schedule.is_not_completed) {
                                      return `PT ${schedule.total_sessions}회/${statusLabel}`;
                                    }
                                    // 진행/차감된 수업은 회차 표시
                                    if (schedule.session_number) {
                                      return `PT ${schedule.total_sessions}회/${schedule.session_number}회차`;
                                    }
                                    return `PT ${schedule.total_sessions}회`;
                                  }
                                  return 'PT';
                                }
                                // OT → "OT 2회차" 또는 "OT 노쇼"
                                if (scheduleType === 'ot') {
                                  const statusLabel = schedule.status === 'no_show' ? '노쇼' :
                                    schedule.status === 'cancelled' ? '취소' :
                                    schedule.status === 'converted' ? 'PT전환' : null;

                                  // 미진행 수업은 상태 표시
                                  if (statusLabel && schedule.is_not_completed) {
                                    return `OT ${statusLabel}`;
                                  }
                                  // 진행된 수업은 회차 표시
                                  if (schedule.session_number) {
                                    return `OT ${schedule.session_number}회차`;
                                  }
                                  return 'OT';
                                }
                                return schedule.type;
                              })()}
                            </div>
                            <div className="truncate leading-tight">
                              {(schedule.type === '개인' || schedule.type?.toLowerCase() === 'personal')
                                ? (schedule.sub_type === 'meal' ? '식사시간' :
                                   schedule.sub_type === 'conference' ? '회의시간' :
                                   schedule.sub_type === 'meeting' ? '미팅시간' :
                                   schedule.sub_type === 'rest' ? '휴식시간' :
                                   schedule.sub_type === 'workout' ? '운동시간' :
                                   schedule.sub_type === 'other' ? '기타' :
                                   schedule.member_name || '개인일정')
                                : schedule.member_name}
                            </div>
                            {/* 모바일에서는 시간 숨기거나 간소화 */}
                            <div className="hidden md:block text-[9px] opacity-80 mt-0.5">
                              {new Date(schedule.start_time).toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                              {schedule.rowSpan > 1 && ` - ${new Date(schedule.end_time).toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}`}
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
