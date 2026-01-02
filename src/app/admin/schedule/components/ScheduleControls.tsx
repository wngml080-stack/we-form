"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
    <div className="bg-white rounded-[28px] p-4 shadow-sm border border-gray-100 animate-in fade-in duration-500 delay-150">
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between px-2">
        {/* 날짜 네비게이션 - 세련된 디자인 */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
            onClick={onPrevDate}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="relative group flex items-center justify-center min-w-[180px]">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <div className="px-5 py-2.5 text-base font-black text-slate-800 cursor-pointer hover:bg-slate-50 rounded-xl transition-all flex items-center gap-2">
              <span className="tracking-tight">
                {viewType === 'day' && `${year}년 ${month}월 ${currentDate.getDate()}일`}
                {viewType === 'week' && `${year}년 ${month}월 ${weekOfMonth}주차`}
                {viewType === 'month' && `${year}년 ${month}월`}
              </span>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
            onClick={onNextDate}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <div className="w-px h-6 bg-gray-100 mx-3 hidden sm:block"></div>
          
          <Button
            variant="ghost"
            size="sm"
            className="px-4 py-2 text-xs font-black text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            onClick={onToday}
          >
            오늘로 이동
          </Button>
        </div>

        {/* 뷰 전환 버튼 - 탭 스타일 통합 */}
        <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-2xl w-full lg:w-auto overflow-hidden">
          {(['day', 'week', 'month'] as const).map((type) => (
            <button
              key={type}
              onClick={() => onViewTypeChange(type)}
              className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${
                viewType === type
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {type === 'day' ? '일간' : type === 'week' ? '주간' : '월별 통계'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
