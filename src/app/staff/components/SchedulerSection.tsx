"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import WeeklyTimetable from "@/components/WeeklyTimetable";
import { MonthlyReportView } from "./MonthlyReportView";

type ScheduleItem = {
  id: string;
  start_time: string;
  end_time: string;
  type?: string;
  member_name?: string;
  member_id?: string;
  status: string;
  is_locked?: boolean;
  title?: string;
  sub_type?: string;
};

type MonthlyStatsData = {
  PT?: number;
  OT?: number;
  Consulting?: number;
  completed?: number;
  no_show_deducted?: number;
  no_show?: number;
  service?: number;
  total?: number;
};

interface SchedulerSectionProps {
  viewType: 'day' | 'week' | 'month';
  setViewType: (type: 'day' | 'week' | 'month') => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  year: number;
  month: number;
  todayStr: string;
  schedules: ScheduleItem[];
  monthlyStats: MonthlyStatsData | null;
  isMonthApproved: boolean;
  isMonthLocked: boolean;
  submissionStatus: string;
  onPrevDate: () => void;
  onNextDate: () => void;
  onScheduleClick: (schedule: ScheduleItem) => void;
  onTimeSlotClick: (date: Date, time: string) => void;
  onSubmitMonth: () => void;
}

export function SchedulerSection({
  viewType, setViewType, selectedDate, setSelectedDate,
  year, month, todayStr, schedules, monthlyStats,
  isMonthApproved, isMonthLocked, submissionStatus,
  onPrevDate, onNextDate, onScheduleClick, onTimeSlotClick, onSubmitMonth
}: SchedulerSectionProps) {
  const currentDate = new Date(selectedDate);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px]">
      {/* Scheduler Header Control */}
      <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-white sticky top-0 z-10">
        {/* 날짜 네비게이션 */}
        <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-200 w-full md:w-auto justify-between md:justify-start">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-white hover:shadow-sm" onClick={onPrevDate}>
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </Button>
          <div className="relative flex items-center justify-center px-4 min-w-[140px]">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <div className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              {year}년 {month}월 <span className="text-gray-400 font-light">|</span> {currentDate.getDate()}일
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-white hover:shadow-sm" onClick={onNextDate}>
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            className="h-9 px-3 text-xs font-bold text-[#2F80ED] hover:bg-white hover:shadow-sm rounded-lg ml-1"
            onClick={() => setSelectedDate(todayStr)}
          >
            오늘
          </Button>
        </div>

        {/* 뷰 전환 탭 */}
        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200 w-full md:w-auto">
          {['day', 'week', 'month'].map((type) => (
            <button
              key={type}
              onClick={() => setViewType(type as 'day' | 'week' | 'month')}
              className={cn(
                "flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all duration-200",
                viewType === type
                  ? "bg-white text-[#2F80ED] shadow-sm ring-1 ring-black/5"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {type === 'day' ? '일간' : type === 'week' ? '주간' : '월간(통계)'}
            </button>
          ))}
        </div>
      </div>

      {/* Scheduler Body */}
      <div className="flex-1 p-0 md:p-6 overflow-hidden flex flex-col">
        {viewType === 'month' ? (
          <MonthlyReportView
            month={month}
            monthlyStats={monthlyStats}
            isMonthApproved={isMonthApproved}
            isMonthLocked={isMonthLocked}
            submissionStatus={submissionStatus}
            onSubmitMonth={onSubmitMonth}
          />
        ) : (
          <WeeklyTimetable
            schedules={schedules}
            onScheduleClick={onScheduleClick}
            onTimeSlotClick={onTimeSlotClick}
            viewType={viewType}
            selectedDate={selectedDate}
          />
        )}
      </div>
    </div>
  );
}
