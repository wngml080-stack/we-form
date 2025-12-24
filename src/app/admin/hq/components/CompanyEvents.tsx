"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Calendar, Activity } from "lucide-react";

interface CompanyEventsProps {
  companyEvents: any[];
  onAddClick: () => void;
  onEditClick: (event: any) => void;
  onDeleteClick: (id: string) => void;
  onToggleActive: (event: any) => void;
}

export function CompanyEvents({
  companyEvents,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onToggleActive
}: CompanyEventsProps) {
  const eventTypeColors: Record<string, string> = {
    general: "bg-blue-100 text-blue-700 border-blue-200",
    training: "bg-purple-100 text-purple-700 border-purple-200",
    meeting: "bg-orange-100 text-orange-700 border-orange-200",
    holiday: "bg-red-100 text-red-700 border-red-200",
    celebration: "bg-pink-100 text-pink-700 border-pink-200"
  };

  const eventTypeLabels: Record<string, string> = {
    general: "일반",
    training: "교육",
    meeting: "회의",
    holiday: "휴무",
    celebration: "행사"
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-gray-900">회사 일정 & 행사 관리</h3>
            <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
              {companyEvents.length}개
            </span>
          </div>
        </div>
        <Button
          onClick={onAddClick}
          size="sm"
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="mr-1 h-4 w-4" /> 행사 등록
        </Button>
      </div>
      <div className="p-6 space-y-3 max-h-[500px] overflow-y-auto">
        {companyEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <Calendar className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm">등록된 회사 일정 & 행사가 없습니다.</p>
          </div>
        ) : (
          companyEvents.map((event) => {
            const isToday = event.event_date === new Date().toISOString().split('T')[0];

            return (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all bg-white">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant="outline" className={eventTypeColors[event.event_type]}>
                        {eventTypeLabels[event.event_type]}
                      </Badge>
                      {event.gym_id ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {event.gyms?.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          전사 행사
                        </Badge>
                      )}
                      {isToday && (
                        <Badge className="bg-blue-500 text-white">오늘</Badge>
                      )}
                      {!event.is_active && (
                        <Badge className="bg-gray-400">비활성</Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{event.title}</h4>
                    {event.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{event.description}</p>
                    )}
                    <div className="text-xs text-gray-500 flex gap-3 items-center flex-wrap">
                      <span>날짜: {event.event_date}</span>
                      {event.start_time && <span>시간: {event.start_time.substring(0, 5)}</span>}
                      {event.end_time && <span>~ {event.end_time.substring(0, 5)}</span>}
                      {event.location && <span>장소: {event.location}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-blue-50"
                      onClick={() => onToggleActive(event)}
                      title={event.is_active ? "비활성화" : "활성화"}
                    >
                      <Activity className={`h-4 w-4 ${event.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-blue-50"
                      onClick={() => onEditClick(event)}
                    >
                      <Pencil className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-red-50"
                      onClick={() => onDeleteClick(event.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
