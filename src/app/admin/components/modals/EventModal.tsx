"use client";

import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import type { CompanyEvent } from "../../hooks/useAdminDashboardData";

type EventType = "general" | "training" | "meeting" | "holiday" | "celebration";

interface ExtendedCompanyEvent extends CompanyEvent {
  event_date: string;
  event_type: EventType;
  start_time?: string;
  location?: string;
}

interface EventModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  companyEvents: ExtendedCompanyEvent[];
}

export function EventModal({ isOpen, onOpenChange, selectedDate, companyEvents }: EventModalProps) {
  const eventTypeColors: Record<string, string> = {
    general: "bg-[var(--primary-light-hex)] text-[var(--primary-hex)]",
    training: "bg-purple-100 text-purple-600",
    meeting: "bg-[var(--accent-light-hex)] text-[var(--accent-hex)]",
    holiday: "bg-[var(--error-light-hex)] text-[var(--error-hex)]",
    celebration: "bg-pink-100 text-pink-600"
  };

  const eventTypeLabels: Record<string, string> = {
    general: "일반",
    training: "교육",
    meeting: "회의",
    holiday: "휴무",
    celebration: "행사"
  };

  const dateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const dayEvents = companyEvents.filter(event => event.event_date === dateKey);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle>
            {selectedDate && format(selectedDate, "yyyy년 M월 d일 (EEE)", { locale: ko })} 행사
          </DialogTitle>
          <DialogDescription className="sr-only">선택한 날짜의 행사 목록입니다</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {dayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--foreground-muted)]">
              <Calendar className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">이 날짜에 등록된 행사가 없습니다.</p>
            </div>
          ) : (
            dayEvents.map((event) => (
              <div key={event.id} className="p-4 rounded-xl border border-[#E5E8EB] bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)] transition-colors duration-200">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${eventTypeColors[event.event_type]}`}>
                    {eventTypeLabels[event.event_type]}
                  </span>
                  {event.gym_id ? (
                    <span className="text-xs text-[var(--foreground-muted)]">특정 지점</span>
                  ) : (
                    <span className="text-xs text-[var(--secondary-hex)] font-semibold">전사</span>
                  )}
                </div>
                <div className="font-bold text-[var(--foreground)] mb-2">{event.title}</div>
                {event.description && (
                  <div className="text-sm text-[var(--foreground-secondary)] mb-3 whitespace-pre-wrap">{event.description}</div>
                )}
                <div className="flex items-center gap-3 text-sm text-[var(--foreground-muted)]">
                  {event.start_time && <span>🕐 {event.start_time.substring(0, 5)}</span>}
                  {event.location && <span>📍 {event.location}</span>}
                </div>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
