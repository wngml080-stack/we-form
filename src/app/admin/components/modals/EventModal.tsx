"use client";

import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface EventModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  companyEvents: any[];
}

export function EventModal({ isOpen, onOpenChange, selectedDate, companyEvents }: EventModalProps) {
  const eventTypeColors: Record<string, string> = {
    general: "bg-blue-100 text-blue-600",
    training: "bg-purple-100 text-purple-600",
    meeting: "bg-orange-100 text-orange-600",
    holiday: "bg-red-100 text-red-600",
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
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle>
            {selectedDate && format(selectedDate, "yyyy년 M월 d일 (EEE)", { locale: ko })} 행사
          </DialogTitle>
          <DialogDescription className="sr-only">선택한 날짜의 행사 목록입니다</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {dayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">이 날짜에 등록된 행사가 없습니다.</p>
            </div>
          ) : (
            dayEvents.map((event) => (
              <div key={event.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${eventTypeColors[event.event_type]}`}>
                    {eventTypeLabels[event.event_type]}
                  </span>
                  {event.gym_id ? (
                    <span className="text-xs text-gray-500">특정 지점</span>
                  ) : (
                    <span className="text-xs text-green-600 font-semibold">전사</span>
                  )}
                </div>
                <div className="font-bold text-gray-800 mb-2">{event.title}</div>
                {event.description && (
                  <div className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{event.description}</div>
                )}
                <div className="flex items-center gap-3 text-sm text-gray-500">
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
