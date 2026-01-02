"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Calendar, Activity, Clock, MapPin } from "lucide-react";

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
    general: "bg-blue-50 text-blue-600 border-none",
    training: "bg-purple-50 text-purple-600 border-none",
    meeting: "bg-orange-50 text-orange-600 border-none",
    holiday: "bg-rose-50 text-rose-600 border-none",
    celebration: "bg-pink-50 text-pink-600 border-none"
  };

  const eventTypeLabels: Record<string, string> = {
    general: "일반",
    training: "교육",
    meeting: "회의",
    holiday: "휴무",
    celebration: "행사"
  };

  return (
    <div className="bg-white rounded-[32px] shadow-sm overflow-hidden border border-gray-100 flex flex-col h-full hover:shadow-md transition-all duration-500">
      <div className="bg-white px-8 py-6 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">회사 일정 & 행사 관리</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Corporate Events</p>
          </div>
          <Badge className="ml-2 bg-indigo-50 text-indigo-600 border-none font-black text-xs px-3 py-1 rounded-lg">
            {companyEvents.length}개 일정
          </Badge>
        </div>
        <Button
          onClick={onAddClick}
          className="bg-slate-900 text-white hover:bg-slate-800 font-black h-11 px-6 rounded-xl transition-all shadow-lg shadow-slate-200"
        >
          <Plus className="mr-2 h-5 w-5" /> 행사 등록
        </Button>
      </div>
      <div className="p-8 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
        {companyEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 py-20">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 opacity-20" />
            </div>
            <p className="font-bold text-sm text-center">등록된 회사 일정이 없습니다.</p>
          </div>
        ) : (
          companyEvents.map((event) => {
            const isToday = event.event_date === new Date().toISOString().split('T')[0];

            return (
              <div key={event.id} className="group border border-gray-100 rounded-[24px] p-6 hover:shadow-xl hover:border-indigo-100 transition-all duration-500 bg-slate-50/50 hover:bg-white relative overflow-hidden">
                <div className="flex justify-between items-start gap-6 relative z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                      <Badge className={cn("font-black text-[9px] tracking-widest px-2 py-0.5 rounded-md", eventTypeColors[event.event_type])}>
                        {eventTypeLabels[event.event_type].toUpperCase()}
                      </Badge>
                      {event.gym_id ? (
                        <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[9px] tracking-widest px-2 py-0.5 rounded-md">
                          {event.gyms?.name.toUpperCase()}
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] tracking-widest px-2 py-0.5 rounded-md">
                          ALL BRANCHES
                        </Badge>
                      )}
                      {isToday && (
                        <Badge className="bg-blue-600 text-white border-none font-black text-[9px] tracking-widest px-2 py-0.5 rounded-md shadow-sm shadow-blue-100 animate-pulse">
                          TODAY
                        </Badge>
                      )}
                      {!event.is_active && (
                        <Badge className="bg-slate-200 text-slate-400 border-none font-black text-[9px] tracking-widest px-2 py-0.5 rounded-md">
                          INACTIVE
                        </Badge>
                      )}
                    </div>
                    
                    <h4 className="font-black text-slate-900 text-xl tracking-tighter group-hover:text-indigo-600 transition-colors mb-2">{event.title}</h4>
                    
                    {event.description && (
                      <p className="text-sm font-medium text-slate-500 line-clamp-2 mb-4 leading-relaxed">{event.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-100/50">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[11px] font-bold tracking-tight">{event.event_date}</span>
                      </div>
                      {(event.start_time || event.end_time) && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-[11px] font-bold tracking-tight">
                            {event.start_time?.substring(0, 5) || '00:00'} ~ {event.end_time?.substring(0, 5) || '23:59'}
                          </span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-rose-400" />
                          <span className="text-[11px] font-bold tracking-tight">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-10 w-10 rounded-xl transition-all", event.is_active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-400 hover:text-white')}
                      onClick={() => onToggleActive(event)}
                    >
                      <Activity className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
                      onClick={() => onEditClick(event)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                      onClick={() => onDeleteClick(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
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
