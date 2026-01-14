"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { getWeekOfMonth } from "../utils/excelExport";

interface ScheduleControlsProps {
  viewType: 'day' | 'week' | 'month' | 'attendance';
  selectedDate: string;
  onViewTypeChange: (type: 'day' | 'week' | 'month' | 'attendance') => void;
  onPrevDate: () => void;
  onNextDate: () => void;
  onToday: () => void;
  onDateChange: (date: string) => void;
}

export function ScheduleControls({
  viewType, selectedDate,
  onViewTypeChange, onPrevDate, onNextDate, onToday, onDateChange
}: ScheduleControlsProps) {
  const currentDate = new Date(selectedDate);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const weekOfMonth = getWeekOfMonth(currentDate);

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-[40px] p-3 shadow-xl shadow-slate-200/50 border border-white/60 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150 mb-8 overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
      
      <div className="flex flex-col xl:flex-row gap-6 items-center justify-between p-2 relative z-10">
        {/* 날짜 네비게이션 */}
        <div className="flex items-center bg-white/80 p-2 rounded-[28px] border border-slate-100 shadow-sm min-w-fit">
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 hover:bg-slate-100 hover:text-blue-600 rounded-2xl transition-all active:scale-90"
            onClick={onPrevDate}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <div className="relative group/date flex items-center justify-center min-w-[240px]">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <div className="px-6 text-lg font-black text-slate-900 flex items-center gap-4 group-hover/date:text-blue-600 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <span className="tracking-tightest">
                {viewType === 'day' && `${year}년 ${month}월 ${currentDate.getDate()}일`}
                {viewType === 'week' && `${year}년 ${month}월 ${weekOfMonth}주차`}
                {viewType === 'month' && `${year}년 ${month}월`}
                {viewType === 'attendance' && `${year}년 ${month}월 ${currentDate.getDate()}일`}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 hover:bg-slate-100 hover:text-blue-600 rounded-2xl transition-all active:scale-90"
            onClick={onNextDate}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 w-full xl:w-auto">
          <Button
            variant="ghost"
            size="sm"
            className="h-12 px-8 text-[11px] font-black text-slate-500 hover:text-slate-900 hover:bg-white rounded-[20px] transition-all border border-slate-100 uppercase tracking-[0.2em] bg-white/50 shadow-sm active:scale-95"
            onClick={onToday}
          >
            TODAY
          </Button>

          <div className="w-px h-8 bg-slate-200 mx-2 hidden xl:block"></div>

          {/* 뷰 전환 버튼 */}
          <div className="flex items-center gap-1.5 bg-slate-900/5 backdrop-blur-sm p-1.5 rounded-[24px] w-full sm:w-auto overflow-x-auto no-scrollbar">
            {(['day', 'week', 'month', 'attendance'] as const).map((type) => (
              <button
                key={type}
                onClick={() => onViewTypeChange(type)}
                className={`flex-1 sm:flex-none px-8 py-3 rounded-[18px] font-black text-[11px] uppercase tracking-widest transition-all duration-500 whitespace-nowrap active:scale-95 ${
                  viewType === type
                    ? type === 'attendance'
                      ? 'bg-orange-500 text-white shadow-xl shadow-orange-200'
                      : 'bg-white text-blue-600 shadow-xl shadow-blue-100 scale-105'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {type === 'day' ? 'Daily' : type === 'week' ? 'Weekly' : type === 'month' ? '월간 리포트' : '스케줄 출석관리'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
