"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

type CompanyEventType = 'general' | 'training' | 'meeting' | 'holiday' | 'celebration';

interface CompanyEvent {
  id: string;
  event_date: string;
  event_type: CompanyEventType;
  title?: string;
}

interface CompanyEventsCalendarProps {
  companyEvents: CompanyEvent[];
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  onDateClick: (date: Date, events: CompanyEvent[]) => void;
}

export function CompanyEventsCalendar({
  companyEvents, currentMonth, setCurrentMonth, onDateClick
}: CompanyEventsCalendarProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();

  const eventsByDate: Record<string, CompanyEvent[]> = {};
  companyEvents.forEach((event) => {
    const dateKey = event.event_date;
    if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
    eventsByDate[dateKey].push(event);
  });

  const eventTypeColors: Record<string, string> = {
    general: "bg-blue-400",
    training: "bg-purple-400",
    meeting: "bg-orange-400",
    holiday: "bg-rose-400",
    celebration: "bg-pink-400"
  };

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[var(--border)] flex flex-col h-full hover:shadow-toss transition-all duration-300">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-3 tracking-tight">
          <Calendar className="w-6 h-6 text-[var(--secondary-hex)]" />
          회사 일정
        </h3>
      </div>

      <div className="flex items-center justify-between mb-6 px-2">
        <button
          onClick={() => {
            const prev = new Date(currentMonth);
            prev.setMonth(prev.getMonth() - 1);
            setCurrentMonth(prev);
          }}
          className="w-10 h-10 flex items-center justify-center hover:bg-[var(--background-secondary)] rounded-full transition-all active:scale-90"
        >
          <ChevronLeft className="w-5 h-5 text-[var(--foreground-muted)]" />
        </button>
        <span className="text-base font-extrabold text-[var(--foreground)] tracking-tight">
          {format(currentMonth, "yyyy년 MM월", { locale: ko })}
        </span>
        <button
          onClick={() => {
            const next = new Date(currentMonth);
            next.setMonth(next.getMonth() + 1);
            setCurrentMonth(next);
          }}
          className="w-10 h-10 flex items-center justify-center hover:bg-[var(--background-secondary)] rounded-full transition-all active:scale-90"
        >
          <ChevronRight className="w-5 h-5 text-[var(--foreground-muted)]" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-3">
        {["일", "월", "화", "수", "목", "금", "토"].map((day, idx) => (
          <div key={idx} className={cn("text-center text-[11px] font-extrabold py-1 tracking-widest uppercase", idx === 0 ? "text-rose-400" : idx === 6 ? "text-blue-400" : "text-[var(--foreground-subtle)]")}>
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
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
                "aspect-square rounded-2xl cursor-pointer transition-all duration-300 flex flex-col items-center justify-center relative group active:scale-90",
                isToday 
                  ? "bg-[var(--primary-hex)] text-white shadow-lg shadow-[var(--primary-hex)]/20" 
                  : "hover:bg-[var(--background-secondary)] text-[var(--foreground)]",
                !isCurrentMonth && "opacity-10 pointer-events-none"
              )}
              onClick={() => dayEvents.length > 0 && onDateClick(date, dayEvents)}
            >
              <div className={cn("text-xs font-bold tracking-tight", isToday ? "text-white" : "text-[var(--foreground)]")}>
                {format(date, "d")}
              </div>
              {dayEvents.length > 0 && (
                <div className="absolute bottom-1.5 flex gap-1">
                  {dayEvents.slice(0, 3).map((event, idx) => (
                    <div key={idx} className={cn("w-1 h-1 rounded-full", isToday ? "bg-white" : (eventTypeColors[event.event_type] || "bg-[var(--foreground-subtle)]"))} />
                  ))}
                </div>
              )}
              {dayEvents.length > 3 && (
                <div className={cn("absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border border-white", isToday ? "bg-white text-[var(--primary-hex)]" : "bg-[var(--primary-hex)] text-white")}>
                  {dayEvents.length}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
