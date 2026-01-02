"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Bell, Activity, Pencil, Trash2, X, Calendar as CalendarIcon, Info, AlertTriangle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { BranchAnnouncement } from "../../hooks/useBranchData";
import { cn } from "@/lib/utils";

interface DateAnnouncementsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  announcements: BranchAnnouncement[];
  onToggleActive: (announcement: BranchAnnouncement) => void;
  onEdit: (announcement: BranchAnnouncement) => void;
  onDelete: (id: string) => void;
}

export function DateAnnouncementsModal({
  isOpen,
  onOpenChange,
  selectedDate,
  announcements,
  onToggleActive,
  onEdit,
  onDelete
}: DateAnnouncementsModalProps) {
  const priorityColors: Record<string, string> = {
    urgent: "bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-50",
    normal: "bg-blue-50 text-blue-600 border-blue-100 shadow-sm shadow-blue-50",
    low: "bg-slate-50 text-slate-500 border-slate-100"
  };
  const priorityLabels: Record<string, string> = {
    urgent: "긴급",
    normal: "일반",
    low: "참고"
  };

  const getDateAnnouncements = () => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return announcements.filter(announcement => {
      const startDate = new Date(announcement.start_date);
      const endDate = announcement.end_date ? new Date(announcement.end_date) : new Date(announcement.start_date);
      const selected = new Date(dateKey);
      return selected >= startDate && selected <= endDate;
    });
  };

  const dateAnnouncements = getDateAnnouncements();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px]">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <CalendarIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {selectedDate && format(selectedDate, "M월 d일 (EEE)", { locale: ko })} 지점 공지
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <p className="text-sm text-slate-400 font-bold">선택하신 날짜의 공지사항 목록입니다</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">선택한 날짜의 지점 공지사항 목록입니다</DialogDescription>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-4">
          {dateAnnouncements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[32px] border border-slate-100 shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Bell className="w-10 h-10 text-slate-200" />
              </div>
              <p className="text-lg font-black text-slate-400">등록된 공지사항이 없습니다.</p>
              <p className="text-sm text-slate-300 font-bold mt-1">오늘의 새로운 소식을 등록해보세요!</p>
            </div>
          ) : (
            dateAnnouncements.map((announcement) => (
              <div 
                key={announcement.id} 
                className={cn(
                  "bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group",
                  !announcement.is_active && "opacity-60"
                )}
              >
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border", priorityColors[announcement.priority])}>
                        {priorityLabels[announcement.priority]}
                      </Badge>
                      
                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                        {announcement.gym_id ? (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{announcement.gyms?.name}</span>
                          </>
                        ) : (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">전사 공지</span>
                          </>
                        )}
                      </div>

                      {!announcement.is_active && (
                        <Badge className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black tracking-widest">INACTIVE</Badge>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xl font-black text-slate-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors">
                        {announcement.title}
                      </h4>
                      <p className="text-slate-500 font-bold leading-relaxed whitespace-pre-wrap">
                        {announcement.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                          {announcement.staffs?.name?.[0] || 'U'}
                        </div>
                        <span className="text-xs font-black text-slate-400">{announcement.staffs?.name || '알 수 없음'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {announcement.start_date} {announcement.end_date ? `~ ${announcement.end_date}` : '(무기한)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Activity className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest">조회 {announcement.view_count || 0}회</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-12 w-12 rounded-2xl border-slate-100 transition-all",
                        announcement.is_active ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                      )}
                      onClick={() => onToggleActive(announcement)}
                      title={announcement.is_active ? "비활성화" : "활성화"}
                    >
                      <Activity className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-2xl border-slate-100 bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100 transition-all"
                      onClick={() => {
                        onOpenChange(false);
                        onEdit(announcement);
                      }}
                    >
                      <Pencil className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-2xl border-slate-100 bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-100 transition-all"
                      onClick={() => onDelete(announcement.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
