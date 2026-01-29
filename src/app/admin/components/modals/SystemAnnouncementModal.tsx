"use client";

import { Bell, X, Calendar as CalendarIcon, Info, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type SystemAnnouncementPriority = "urgent" | "update" | "info" | "general";

interface SystemAnnouncementItem {
  id: string;
  title: string;
  content: string;
  priority: SystemAnnouncementPriority;
  start_date?: string;
  is_active: boolean;
}

interface SystemAnnouncementModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  announcements: SystemAnnouncementItem[];
}

export function SystemAnnouncementModal({ isOpen, onOpenChange, announcements }: SystemAnnouncementModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl bg-[var(--background)] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-2xl xs:rounded-3xl sm:rounded-[32px]">
        <DialogHeader className="px-10 py-8 bg-[var(--foreground)] flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary-hex)]/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--primary-hex)] to-[var(--primary-active-hex)] flex items-center justify-center shadow-[0_4px_16px_rgba(49,130,246,0.3)]">
              <Bell className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight" style={{ color: 'white' }}>시스템 공지 및 업데이트</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <p className="text-sm text-white/80 font-bold">We:form 플랫폼의 최신 소식과 기능 업데이트 안내</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">시스템 공지사항 내용입니다</DialogDescription>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-6 bg-[var(--background)]">
          {announcements.length > 0 ? (
            <div className="space-y-6">
              {announcements.map((announcement) => {
                const priorityStyles: Record<SystemAnnouncementPriority, { bg: string; text: string; label: string; icon: ReactNode }> = {
                  urgent: { bg: "bg-rose-500", text: "text-rose-600", label: "URGENT", icon: <Info className="w-3.5 h-3.5" /> },
                  update: { bg: "bg-purple-500", text: "text-purple-600", label: "UPDATE", icon: <Sparkles className="w-3.5 h-3.5" /> },
                  info: { bg: "bg-cyan-500", text: "text-cyan-600", label: "INFO", icon: <Info className="w-3.5 h-3.5" /> },
                  general: { bg: "bg-blue-500", text: "text-blue-600", label: "NOTICE", icon: <Bell className="w-3.5 h-3.5" /> }
                };
                const style = priorityStyles[announcement.priority] || priorityStyles.general;

                return (
                  <div key={announcement.id} className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                    <div className={cn("absolute top-0 left-0 w-1.5 h-full", style.bg)}></div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-sm", style.bg)}>
                          {style.label}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-tight">
                            {announcement.start_date && new Date(announcement.start_date).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <h4 className="text-xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-blue-600 transition-colors">
                      {announcement.title}
                    </h4>
                    
                    <p className="text-slate-600 font-bold leading-relaxed whitespace-pre-wrap text-sm">
                      {announcement.content}
                    </p>

                    <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-end">
                      <button className="flex items-center gap-1 text-[10px] font-black text-slate-300 group-hover:text-slate-900 transition-all uppercase tracking-widest">
                        Read Detailed Info <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 bg-white rounded-2xl xs:rounded-3xl sm:rounded-[40px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center p-10">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-slate-900 font-black tracking-tight">새로운 공지사항이 없습니다</p>
              <p className="text-sm text-slate-400 font-bold">시스템 업데이트 시 알림이 표시됩니다.</p>
            </div>
          )}
        </div>

        <DialogFooter className="px-10 py-8 bg-white border-t flex items-center justify-center flex-shrink-0">
          <Button 
            onClick={() => onOpenChange(false)} 
            className="h-14 px-16 rounded-2xl bg-slate-900 hover:bg-black font-black text-white shadow-xl shadow-slate-100 hover:-translate-y-1 transition-all"
          >
            모든 알림 확인 완료
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
