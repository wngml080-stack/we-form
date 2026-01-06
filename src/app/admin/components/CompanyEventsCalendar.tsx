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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          회사 일정
        </h3>
      </div>

      <div className="flex items-center justify-between mb-4 px-2">
        <button
          onClick={() => {
            const prev = new Date(currentMonth);
            prev.setMonth(prev.getMonth() - 1);
            setCurrentMonth(prev);
          }}
          className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>
        <span className="text-sm font-bold text-slate-900">
          {format(currentMonth, "yyyy년 MM월", { locale: ko })}
        </span>
        <button
          onClick={() => {
            const next = new Date(currentMonth);
            next.setMonth(next.getMonth() + 1);
            setCurrentMonth(next);
          }}
          className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["일", "월", "화", "수", "목", "금", "토"].map((day, idx) => (
          <div key={idx} className={cn("text-center text-[10px] font-bold py-1", idx === 0 ? "text-red-400" : idx === 6 ? "text-blue-400" : "text-slate-300")}>
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
                "aspect-square p-1 rounded-lg cursor-pointer transition-colors flex flex-col items-center justify-center relative",
                isToday ? "bg-primary text-white shadow-sm" : "hover:bg-slate-50",
                !isCurrentMonth && "opacity-20 pointer-events-none"
              )}
              onClick={() => dayEvents.length > 0 && onDateClick(date, dayEvents)}
            >
              <div className="text-[11px] font-bold">{format(date, "d")}</div>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 2).map((event, idx) => (
                    <div key={idx} className={cn("w-1 h-1 rounded-full", isToday ? "bg-white" : (eventTypeColors[event.event_type] || "bg-slate-400"))} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
