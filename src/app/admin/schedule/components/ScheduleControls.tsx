"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { getWeekOfMonth } from "../utils/excelExport";

interface ScheduleControlsProps {
  viewType: 'day' | 'week' | 'month';
  selectedDate: string;
  onViewTypeChange: (type: 'day' | 'week' | 'month') => void;
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
    <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-2 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between p-2">
        {/* 날짜 네비게이션 */}
        <div className="flex items-center bg-slate-100/50 p-1.5 rounded-[24px] border border-slate-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-white hover:text-blue-600 rounded-2xl transition-all shadow-none hover:shadow-sm"
            onClick={onPrevDate}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="relative group flex items-center justify-center min-w-[200px] px-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <div className="text-base font-black text-slate-900 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="tracking-tight">
                {viewType === 'day' && `${year}년 ${month}월 ${currentDate.getDate()}일`}
                {viewType === 'week' && `${year}년 ${month}월 ${weekOfMonth}주차`}
                {viewType === 'month' && `${year}년 ${month}월`}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-white hover:text-blue-600 rounded-2xl transition-all shadow-none hover:shadow-sm"
            onClick={onNextDate}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <Button
            variant="ghost"
            size="sm"
            className="h-11 px-6 text-[11px] font-black text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-2xl transition-all border border-slate-100 uppercase tracking-widest"
            onClick={onToday}
          >
            오늘로 이동
          </Button>

          <div className="w-px h-6 bg-slate-200 mx-1 hidden lg:block"></div>

          {/* 뷰 전환 버튼 */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-[22px] w-full lg:w-auto">
            {(['day', 'week', 'month'] as const).map((type) => (
              <button
                key={type}
                onClick={() => onViewTypeChange(type)}
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all duration-300 ${
                  viewType === type
                    ? 'bg-white text-blue-600 shadow-lg shadow-blue-100'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {type === 'day' ? 'Daily' : type === 'week' ? 'Weekly' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
