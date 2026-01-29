"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Megaphone, Bell, Pencil, Trash2, Calendar, AlertTriangle, Info, Sparkles, Activity, type LucideIcon } from "lucide-react";
import { SystemAnnouncement } from "../hooks/useSystemData";

interface SystemAnnouncementSectionProps {
  announcements: SystemAnnouncement[];
  onAddClick: () => void;
  onEditClick: (announcement: SystemAnnouncement) => void;
  onDeleteClick: (id: string, title: string) => void;
  onToggleActive: (id: string, currentActive: boolean) => void;
}

export function SystemAnnouncementSection({
  announcements, onAddClick, onEditClick, onDeleteClick, onToggleActive
}: SystemAnnouncementSectionProps) {
  const priorityConfig: Record<string, { icon: LucideIcon; color: string; bg: string; label: string }> = {
    urgent: { icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50", label: "긴급" },
    normal: { icon: Bell, color: "text-blue-600", bg: "bg-blue-50", label: "일반" },
    info: { icon: Info, color: "text-emerald-600", bg: "bg-emerald-50", label: "안내" },
    update: { icon: Sparkles, color: "text-purple-600", bg: "bg-purple-50", label: "업데이트" }
  };

  const typeConfig: Record<string, string> = {
    general: "일반", update: "업데이트", maintenance: "점검", feature: "신기능", notice: "공지"
  };

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-all duration-500">
      <div className="p-8 border-b border-gray-50 bg-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">시스템 공지사항</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">System Notifications</p>
            </div>
          </div>
          <Button
            onClick={onAddClick}
            className="bg-slate-900 text-white hover:bg-slate-800 font-black h-11 px-6 rounded-xl transition-all shadow-lg shadow-slate-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            공지 추가
          </Button>
        </div>
      </div>

      <div className="p-8 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 opacity-20" />
            </div>
            <p className="font-bold text-sm text-center">등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          announcements.map((announcement) => {
            const priority = priorityConfig[announcement.priority] || priorityConfig.normal;
            const PriorityIcon = priority.icon;

            return (
              <div
                key={announcement.id}
                className={cn(
                  "group border border-gray-100 rounded-[24px] p-6 hover:shadow-xl hover:border-blue-100 transition-all duration-500 bg-slate-50/50 hover:bg-white relative overflow-hidden",
                  !announcement.is_active && "opacity-60 bg-gray-100 border-dashed"
                )}
              >
                <div className="flex items-start gap-6 relative z-10">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", priority.bg)}>
                    <PriorityIcon className={cn("w-6 h-6", priority.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="font-black text-slate-900 text-lg tracking-tight group-hover:text-blue-600 transition-colors">
                            {announcement.title}
                          </h3>
                          <Badge className={cn("font-black text-[9px] tracking-widest px-2 py-0.5 rounded-md border-none", priority.bg, priority.color)}>
                            {priority.label.toUpperCase()}
                          </Badge>
                          <Badge className="bg-slate-200 text-slate-500 border-none font-black text-[9px] tracking-widest px-2 py-0.5 rounded-md">
                            {(typeConfig[announcement.announcement_type] || announcement.announcement_type).toUpperCase()}
                          </Badge>
                          {!announcement.is_active && (
                            <Badge className="bg-slate-400 text-white border-none font-black text-[9px] tracking-widest px-2 py-0.5 rounded-md">
                              INACTIVE
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed mb-4">{announcement.content}</p>
                        
                        <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100/50">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Calendar className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-[11px] font-bold tracking-tight">
                              {announcement.start_date} {announcement.end_date && `~ ${announcement.end_date}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-[11px] font-bold tracking-tight">VIEWS {announcement.view_count || 0}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-10 w-10 rounded-xl transition-all", announcement.is_active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-400 hover:text-white')}
                          onClick={() => onToggleActive(announcement.id, announcement.is_active)}
                        >
                          <Activity className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                          onClick={() => onEditClick(announcement)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                          onClick={() => onDeleteClick(announcement.id, announcement.title)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
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
