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
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* 날짜 네비게이션 */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-gray-100 rounded-lg"
            onClick={onPrevDate}
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <div className="relative group flex items-center justify-center min-w-[160px]">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <div className="px-4 py-2 text-sm font-bold text-gray-700 cursor-pointer hover:text-[#2F80ED] transition-colors">
              {viewType === 'day' && `${year}년 ${month}월 ${currentDate.getDate()}일`}
              {viewType === 'week' && `${year}년 ${month}월 ${weekOfMonth}주차`}
              {viewType === 'month' && `${year}년 ${month}월`}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-gray-100 rounded-lg"
            onClick={onNextDate}
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </Button>
          <div className="w-px h-6 bg-gray-200 mx-2"></div>
          <Button
            variant="ghost"
            size="sm"
            className="px-3 py-2 text-sm font-bold text-[#2F80ED] hover:bg-blue-50 rounded-lg transition-colors"
            onClick={onToday}
          >
            오늘
          </Button>
        </div>

        {/* 뷰 전환 버튼 */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          {(['day', 'week', 'month'] as const).map((type) => (
            <Button
              key={type}
              onClick={() => onViewTypeChange(type)}
              variant="ghost"
              className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                viewType === type
                  ? 'bg-white text-[#2F80ED] shadow-sm'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              {type === 'day' ? '일' : type === 'week' ? '주' : '월집계'}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
