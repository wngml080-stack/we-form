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
  const announcementsByDate: Record<string, BranchAnnouncement[]> = {};
  announcements.forEach((announcement) => {
    const startDate = new Date(announcement.start_date);
    const endDate = announcement.end_date ? new Date(announcement.end_date) : new Date(announcement.start_date);

    const currentDate = new Date(startDate);
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
          "h-36 bg-white border border-[var(--border-light)] rounded-[24px] p-4 cursor-pointer transition-all duration-300 hover:shadow-toss hover:-translate-y-1 group relative overflow-hidden active:scale-[0.98]",
          isToday && "bg-[var(--primary-light-hex)] border-[var(--primary-hex)]/30 ring-4 ring-[var(--primary-hex)]/5"
        )}
        onClick={() => onDateClick(date, dayAnnouncements.length > 0)}
      >
        <div className={cn(
          "text-sm font-extrabold mb-3 transition-all group-hover:scale-110 origin-left tracking-tight",
          isToday ? "text-[var(--primary-hex)]" : "text-[var(--foreground-subtle)]"
        )}>
          {day}
        </div>
        
        <div className="space-y-1.5 overflow-y-auto max-h-[calc(100%-28px)] custom-scrollbar pr-0.5">
          {dayAnnouncements.map((ann, idx) => (
            <div
              key={idx}
              className={cn(
                "text-[10px] font-bold px-2 py-1.5 rounded-lg truncate border shadow-sm transition-colors",
                ann.priority === "urgent" ? "bg-rose-50 text-rose-500 border-rose-100" :
                ann.priority === "normal" ? "bg-blue-50 text-blue-500 border-blue-100" :
                "bg-[var(--background-secondary)] text-[var(--foreground-muted)] border-[var(--border-light)]"
              )}
            >
              {ann.title}
            </div>
          ))}
        </div>
        
        {isToday && (
          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[var(--primary-hex)] shadow-[0_0_8px_var(--primary-hex)]"></div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[40px] shadow-sm overflow-hidden border border-[var(--border)] transition-all duration-500 hover:shadow-toss">
      <div className="bg-white px-10 py-10 border-b border-[var(--border-light)] flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-[var(--primary-light-hex)] rounded-[24px] flex items-center justify-center shadow-sm">
            <Bell className="w-8 h-8 text-[var(--primary-hex)]" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-4">
              <h3 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">지점 공지사항</h3>
              <div className="bg-[var(--background-secondary)] text-[var(--foreground-subtle)] text-[11px] font-extrabold px-3 py-1 rounded-full border border-[var(--border-light)] tracking-widest uppercase">
                {announcements.length}건
              </div>
            </div>
            <p className="text-base text-[var(--foreground-muted)] font-bold tracking-tight opacity-70">전체 직원이 확인해야 할 주요 공지 일정을 관리합니다.</p>
          </div>
        </div>
        <Button
          onClick={onAddClick}
          className="h-14 px-10 bg-[var(--primary-hex)] text-white hover:bg-[var(--primary-hover-hex)] rounded-2xl font-extrabold shadow-lg shadow-[var(--primary-hex)]/20 flex items-center gap-3 transition-all active:scale-[0.98] whitespace-nowrap text-base"
        >
          <Plus className="w-6 h-6" /> 공지사항 등록
        </Button>
      </div>

      <div className="p-10 lg:p-12 space-y-12">
        {/* 달력 네비게이션 */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center bg-[var(--background-secondary)]/50 p-2.5 rounded-[32px] border border-[var(--border-light)] gap-8 shadow-sm">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePrevMonth}
              className="w-12 h-12 rounded-full hover:bg-white hover:shadow-sm text-[var(--foreground-subtle)] hover:text-[var(--foreground)] transition-all active:scale-90"
            >
              <ChevronLeft className="w-7 h-7" />
            </Button>
            <h4 className="text-2xl font-extrabold text-[var(--foreground)] tracking-tighter min-w-[160px] text-center">
              {format(currentCalendarMonth, "yyyy. MM", { locale: ko })}
            </h4>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNextMonth}
              className="w-12 h-12 rounded-full hover:bg-white hover:shadow-sm text-[var(--foreground-subtle)] hover:text-[var(--foreground)] transition-all active:scale-90"
            >
              <ChevronRight className="w-7 h-7" />
            </Button>
          </div>
        </div>

        {/* 달력 UI */}
        <div className="space-y-6">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-4 px-4">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day, idx) => (
              <div
                key={idx}
                className={cn(
                  "text-center text-[11px] font-extrabold tracking-widest uppercase",
                  idx === 0 ? "text-rose-400" : idx === 6 ? "text-blue-400" : "text-[var(--foreground-subtle)]"
                )}
              >
                {day}
              </div>
            ))}
          </div>
          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-4">
            {calendarDays}
          </div>
        </div>
      </div>
    </div>
  );
}
