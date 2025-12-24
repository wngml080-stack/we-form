"use client";

import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AnnouncementCalendarProps {
  announcements: any[];
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
      <div key={`empty-${i}`} className="h-24 border border-gray-100"></div>
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
          "h-24 border border-gray-100 p-2 cursor-pointer hover:bg-purple-50 transition-colors",
          isToday && "bg-blue-50 border-blue-300"
        )}
        onClick={() => onDateClick(date, dayAnnouncements.length > 0)}
      >
        <div className={cn(
          "text-sm font-medium mb-1",
          isToday ? "text-blue-600" : "text-gray-700"
        )}>
          {day}
        </div>
        {dayAnnouncements.length > 0 && (
          <div className="space-y-1">
            {dayAnnouncements.slice(0, 2).map((ann, idx) => (
              <div
                key={idx}
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded truncate",
                  ann.priority === "urgent" ? "bg-red-100 text-red-700" :
                  ann.priority === "normal" ? "bg-purple-100 text-purple-700" :
                  "bg-gray-100 text-gray-700"
                )}
              >
                {ann.title}
              </div>
            ))}
            {dayAnnouncements.length > 2 && (
              <div className="text-xs text-gray-500 pl-1">
                +{dayAnnouncements.length - 2}개 더
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Bell className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-gray-900">지점 공지사항 관리</h3>
            <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
              {announcements.length}개
            </span>
          </div>
        </div>
        <Button
          onClick={onAddClick}
          size="sm"
          className="bg-purple-600 text-white hover:bg-purple-700"
        >
          <Plus className="mr-1 h-4 w-4" /> 공지 등록
        </Button>
      </div>

      {/* 달력 네비게이션 */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={handlePrevMonth}>
          이전 달
        </Button>
        <h4 className="text-lg font-semibold text-gray-900">
          {format(currentCalendarMonth, "yyyy년 M월", { locale: ko })}
        </h4>
        <Button variant="outline" size="sm" onClick={handleNextMonth}>
          다음 달
        </Button>
      </div>

      {/* 달력 UI */}
      <div className="p-6">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-0 mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((day, idx) => (
            <div
              key={day}
              className={cn(
                "text-center py-2 font-semibold text-sm",
                idx === 0 ? "text-red-600" : idx === 6 ? "text-blue-600" : "text-gray-700"
              )}
            >
              {day}
            </div>
          ))}
        </div>
        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-0 border-t border-l border-gray-200">
          {calendarDays}
        </div>
      </div>
    </div>
  );
}
