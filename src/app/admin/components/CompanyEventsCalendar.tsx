"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CompanyEventsCalendarProps {
  companyEvents: any[];
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  onDateClick: (date: Date, events: any[]) => void;
}

export function CompanyEventsCalendar({
  companyEvents, currentMonth, setCurrentMonth, onDateClick
}: CompanyEventsCalendarProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();

  const eventsByDate: Record<string, any[]> = {};
  companyEvents.forEach((event) => {
    const dateKey = event.event_date;
    if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
    eventsByDate[dateKey].push(event);
  });

  const eventTypeColors: Record<string, string> = {
    general: "bg-blue-500",
    training: "bg-purple-500",
    meeting: "bg-orange-500",
    holiday: "bg-red-500",
    celebration: "bg-pink-500"
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#2F80ED]" />
          회사 일정 & 행사
        </h3>
        <span className="text-xs text-gray-400">{companyEvents.length}개</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            const prev = new Date(currentMonth);
            prev.setMonth(prev.getMonth() - 1);
            setCurrentMonth(prev);
          }}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <span className="text-sm font-semibold text-gray-700">
          {format(currentMonth, "yyyy년 M월", { locale: ko })}
        </span>
        <button
          onClick={() => {
            const next = new Date(currentMonth);
            next.setMonth(next.getMonth() + 1);
            setCurrentMonth(next);
          }}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((day, idx) => (
            <div
              key={day}
              className={cn(
                "text-center text-xs font-semibold py-1",
                idx === 0 ? "text-red-600" : idx === 6 ? "text-blue-600" : "text-gray-600"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square"></div>
          ))}

          {daysInMonth.map((date) => {
            const dateKey = format(date, "yyyy-MM-dd");
            const dayEvents = eventsByDate[dateKey] || [];
            const isToday = isSameDay(date, new Date());
            const isCurrentMonth = isSameMonth(date, currentMonth);

            return (
              <div
                key={dateKey}
                className={cn(
                  "aspect-square p-1 rounded-lg cursor-pointer transition-all relative",
                  isToday && "bg-blue-100 ring-2 ring-blue-500",
                  !isToday && dayEvents.length > 0 && "hover:bg-gray-100",
                  !isToday && dayEvents.length === 0 && "hover:bg-gray-50"
                )}
                onClick={() => {
                  if (dayEvents.length > 0) {
                    onDateClick(date, dayEvents);
                  }
                }}
              >
                <div className={cn(
                  "text-xs font-medium text-center",
                  isToday ? "text-blue-700 font-bold" : "text-gray-700",
                  !isCurrentMonth && "text-gray-300"
                )}>
                  {format(date, "d")}
                </div>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                    {dayEvents.slice(0, 3).map((event, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "w-1 h-1 rounded-full",
                          eventTypeColors[event.event_type] || "bg-gray-400"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
