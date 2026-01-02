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
    general: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]",
    training: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]",
    meeting: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]",
    holiday: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]",
    celebration: "bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]"
  };

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-all duration-500">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-slate-900 text-xl tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          전사 일정 및 행사
        </h3>
        <span className="bg-slate-50 text-slate-400 font-black text-[10px] px-3 py-1 rounded-lg border border-slate-100 tracking-widest uppercase">{companyEvents.length} Events</span>
      </div>

      <div className="flex items-center justify-between mb-8 bg-slate-50 p-2 rounded-2xl border border-slate-100">
        <button
          onClick={() => {
            const prev = new Date(currentMonth);
            prev.setMonth(prev.getMonth() - 1);
            setCurrentMonth(prev);
          }}
          className="w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-xl transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-slate-400 hover:text-slate-900" />
        </button>
        <span className="text-base font-black text-slate-900 tracking-tighter">
          {format(currentMonth, "yyyy. MM", { locale: ko })}
        </span>
        <button
          onClick={() => {
            const next = new Date(currentMonth);
            next.setMonth(next.getMonth() + 1);
            setCurrentMonth(next);
          }}
          className="w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-xl transition-all"
        >
          <ChevronRight className="w-5 h-5 text-slate-400 hover:text-slate-900" />
        </button>
      </div>

      <div className="flex-1">
        <div className="grid grid-cols-7 gap-1 mb-4">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
            <div
              key={idx}
              className={cn(
                "text-center text-[10px] font-black py-1 uppercase tracking-widest",
                idx === 0 ? "text-red-400" : idx === 6 ? "text-blue-400" : "text-slate-300"
              )}
            >
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
                  "aspect-square p-1 rounded-xl cursor-pointer transition-all relative flex flex-col items-center justify-center border-2",
                  isToday ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-200" : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-100",
                  !isCurrentMonth && "opacity-20 pointer-events-none"
                )}
                onClick={() => {
                  if (dayEvents.length > 0) {
                    onDateClick(date, dayEvents);
                  }
                }}
              >
                <div className={cn(
                  "text-xs font-black tracking-tighter",
                  isToday ? "text-white" : "text-slate-700"
                )}>
                  {format(date, "d")}
                </div>
                {dayEvents.length > 0 && (
                  <div className="flex gap-1 mt-1 justify-center">
                    {dayEvents.slice(0, 3).map((event, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isToday ? "bg-white/80" : (eventTypeColors[event.event_type] || "bg-slate-400")
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
