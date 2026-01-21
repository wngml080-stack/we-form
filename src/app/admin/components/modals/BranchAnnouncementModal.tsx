"use client";

import { Bell, X, Calendar as CalendarIcon, Clock, MapPin, Info, Tag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface BranchAnnouncementModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: any | null;
}

export function BranchAnnouncementModal({ isOpen, onOpenChange, announcement }: BranchAnnouncementModalProps) {
  if (!announcement) return null;

  const priorityConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    urgent: { label: "긴급", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
    low: { label: "참고", color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-100" },
    normal: { label: "일반", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" }
  };

  const currentPriority = priorityConfig[announcement.priority] || priorityConfig.normal;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-2xl xs:rounded-3xl sm:rounded-[40px]">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bell className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">지점 공지사항 상세</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <p className="text-sm text-slate-400 font-bold">센터 운영 및 서비스 주요 안내 사항</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">지점 공지사항 상세 내용입니다</DialogDescription>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-[#f8fafc]">
          {/* 배지 및 메타 정보 */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={cn(
              "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
              announcement.priority === 'urgent' ? "bg-rose-500 text-white border-rose-400" :
              announcement.priority === 'low' ? "bg-slate-500 text-white border-slate-400" :
              "bg-blue-500 text-white border-blue-400"
            )}>
              {currentPriority.label} NOTICE
            </span>
            <span className={cn(
              "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
              announcement.gym_id ? "bg-white text-slate-500 border-slate-200" : "bg-emerald-50 text-emerald-600 border-emerald-100"
            )}>
              {announcement.gym_id ? "Branch Only" : "All Centers"}
            </span>
          </div>

          {/* 본문 카드 */}
          <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[40px] p-10 border border-slate-100 shadow-sm space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-5 -mr-10 -mt-10">
              <Bell className="w-48 h-48" />
            </div>
            
            <div className="space-y-4 relative z-10">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {announcement.title}
              </h3>
              <div className="w-12 h-1.5 bg-blue-500 rounded-full"></div>
            </div>

            <div className="relative z-10">
              <p className="text-lg font-bold text-slate-600 leading-relaxed whitespace-pre-wrap">
                {announcement.content}
              </p>
            </div>

            <div className="pt-10 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <CalendarIcon className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Posted Date</p>
                  <p className="font-black text-slate-900">
                    {new Date(announcement.start_date || announcement.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              
              {announcement.end_date && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</p>
                    <p className="font-black text-rose-600">
                      {new Date(announcement.end_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 하단 안내 문구 */}
          <div className="p-6 bg-slate-100 rounded-2xl xs:rounded-3xl sm:rounded-[32px] border border-slate-200 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm shrink-0">
              <Info className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-xs font-bold text-slate-500 leading-relaxed">
              본 공지는 지점 소속 전 직원에게 공개되는 사항입니다. 궁금한 점이 있으시면 지점 관리자 또는 본사 지원팀으로 문의해 주시기 바랍니다.
            </p>
          </div>
        </div>

        <DialogFooter className="px-10 py-8 bg-white border-t flex items-center justify-center flex-shrink-0">
          <Button 
            onClick={() => onOpenChange(false)} 
            className="h-14 px-16 rounded-2xl bg-slate-900 hover:bg-black font-black text-white shadow-xl shadow-slate-100 hover:-translate-y-1 transition-all"
          >
            내용 확인 완료
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
