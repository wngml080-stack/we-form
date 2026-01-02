"use client";

import { Button } from "@/components/ui/button";
import { Bell, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { BranchAnnouncement } from "../hooks/useBranchData";

interface AnnouncementCalendarProps {
  announcements: BranchAnnouncement[];
  currentCalendarMonth: Date;
  setCurrentCalendarMonth: (date: Date) => void;
  onDateClick: (date: Date, hasAnnouncements: boolean) => void;
  onAddClick: () => void;
}

export function AnnouncementCalendar({
  announcements,
  currentCalendarMonth,
  setCurrentCalendarMonth,
  onDateClick,
  onAddClick
}: AnnouncementCalendarProps) {
  const year = currentCalendarMonth.getFullYear();
  const month = currentCalendarMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  // 날짜별 공지사항 맵 생성
  const announcementsByDate: Record<string, any[]> = {};
  announcements.forEach((announcement) => {
    const startDate = new Date(announcement.start_date);
    const endDate = announcement.end_date ? new Date(announcement.end_date) : new Date(announcement.start_date);

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = format(currentDate, "yyyy-MM-dd");
      if (!announcementsByDate[dateKey]) {
        announcementsByDate[dateKey] = [];
      }
      announcementsByDate[dateKey].push(announcement);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });

  const handlePrevMonth = () => {
    const prevMonth = new Date(currentCalendarMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentCalendarMonth(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(currentCalendarMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentCalendarMonth(nextMonth);
  };

  // 달력 그리드 생성
  const calendarDays = [];

  // 빈 칸 추가 (월의 시작 전)
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(
      <div key={`empty-${i}`} className="h-32 bg-slate-50/30 rounded-2xl border border-slate-100/50"></div>
    );
  }

  // 날짜 추가
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = format(date, "yyyy-MM-dd");
    const dayAnnouncements = announcementsByDate[dateKey] || [];
    const isToday = format(new Date(), "yyyy-MM-dd") === dateKey;

    calendarDays.push(
      <div
        key={day}
        className={cn(
          "h-32 bg-white border border-slate-100 rounded-2xl p-3 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-indigo-100 hover:-translate-y-1 group relative overflow-hidden",
          isToday && "bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100"
        )}
        onClick={() => onDateClick(date, dayAnnouncements.length > 0)}
      >
        <div className={cn(
          "text-sm font-black mb-2 transition-all group-hover:scale-110 origin-left",
          isToday ? "text-indigo-600" : "text-slate-400"
        )}>
          {day}
        </div>
        
        <div className="space-y-1.5 overflow-y-auto max-h-[calc(100%-24px)] custom-scrollbar pr-1">
          {dayAnnouncements.map((ann, idx) => (
            <div
              key={idx}
              className={cn(
                "text-[10px] font-black px-2 py-1 rounded-lg truncate border shadow-sm",
                ann.priority === "urgent" ? "bg-red-50 text-red-600 border-red-100" :
                ann.priority === "normal" ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                "bg-slate-50 text-slate-500 border-slate-100"
              )}
            >
              {ann.title}
            </div>
          ))}
        </div>
        
        {isToday && (
          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[40px] shadow-xl shadow-slate-100/50 overflow-hidden border border-gray-100 transition-all duration-500 hover:shadow-2xl">
      <div className="bg-white px-10 py-8 border-b border-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center shadow-sm shadow-indigo-100/50">
            <Bell className="w-7 h-7 text-indigo-600" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">지점 공지사항</h3>
              <span className="bg-slate-50 text-slate-400 text-[10px] font-black px-3 py-1 rounded-lg border border-slate-100 tracking-widest uppercase">
                {announcements.length} Total
              </span>
            </div>
            <p className="text-sm text-slate-400 font-bold tracking-tight">전체 직원이 확인해야 할 주요 공지 일정을 관리합니다.</p>
          </div>
        </div>
        <Button
          onClick={onAddClick}
          className="h-12 px-8 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl font-black shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all hover:-translate-y-1 active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" /> 공지사항 등록
        </Button>
      </div>

      <div className="p-8 lg:p-10 space-y-10">
        {/* 달력 네비게이션 - 필 스타일 */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center bg-slate-50 p-2 rounded-3xl border border-slate-100 gap-6 shadow-inner">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePrevMonth}
              className="w-12 h-12 rounded-2xl hover:bg-white hover:shadow-sm text-slate-400 hover:text-slate-900 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <h4 className="text-xl font-black text-slate-900 tracking-tighter min-w-[140px] text-center">
              {format(currentCalendarMonth, "yyyy. MM", { locale: ko })}
            </h4>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNextMonth}
              className="w-12 h-12 rounded-2xl hover:bg-white hover:shadow-sm text-slate-400 hover:text-slate-900 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* 달력 UI */}
        <div className="space-y-4">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-4">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
              <div
                key={idx}
                className={cn(
                  "text-center text-[10px] font-black uppercase tracking-[0.2em]",
                  idx === 0 ? "text-red-400" : idx === 6 ? "text-blue-400" : "text-slate-300"
                )}
              >
                {day}
              </div>
            ))}
          </div>
          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-3">
            {calendarDays}
          </div>
        </div>
      </div>
    </div>
  );
}
