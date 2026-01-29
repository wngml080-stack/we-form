"use client";

import { X, Calendar as CalendarIcon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Announcement } from "../../hooks/useAdminDashboardData";

interface BranchAnnouncementModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: Announcement | null;
}

export function BranchAnnouncementModal({ isOpen, onOpenChange, announcement }: BranchAnnouncementModalProps) {
  if (!announcement) return null;

  const priorityConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    urgent: { label: "긴급", color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100" },
    low: { label: "참고", color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-100" },
    normal: { label: "일반", color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" }
  };

  const currentPriority = priorityConfig[announcement.priority] || priorityConfig.normal;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] sm:max-w-xl bg-white p-0 border-none shadow-2xl rounded-[32px] overflow-hidden animate-in zoom-in-95 duration-300">
        <DialogHeader className="px-8 pt-8 pb-4 space-y-4">
          <div className="flex justify-between items-start">
            <div className={cn("px-3 py-1 rounded-full text-[11px] font-bold tracking-tight border", currentPriority.bg, currentPriority.color, currentPriority.border)}>
              {currentPriority.label} 공지
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 flex items-center justify-center bg-[var(--background-secondary)] rounded-full hover:bg-[var(--background-tertiary)] transition-all active:scale-90"
            >
              <X className="w-4 h-4 text-[var(--foreground-muted)]" />
            </button>
          </div>
          <DialogTitle className="text-2xl font-extrabold text-[var(--foreground)] tracking-tight leading-snug">
            {announcement.title}
          </DialogTitle>
          <div className="flex items-center gap-3 text-sm text-[var(--foreground-subtle)] font-bold">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4" />
              {new Date(announcement.created_at).toLocaleDateString('ko-KR')}
            </span>
            <span className="w-1 h-1 rounded-full bg-[var(--border)]"></span>
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {announcement.gym_id ? "지점 관리자" : "본사 공지"}
            </span>
          </div>
        </DialogHeader>

        <div className="px-8 py-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <div className="text-base text-[var(--foreground-secondary)] font-medium leading-relaxed whitespace-pre-wrap tracking-tight">
            {announcement.content}
          </div>
        </div>

        <DialogFooter className="px-8 py-8 mt-4 bg-[var(--background-secondary)]/30 border-t border-[var(--border-light)]">
          <Button 
            onClick={() => onOpenChange(false)} 
            className="w-full h-14 rounded-2xl bg-[var(--primary-hex)] hover:bg-[var(--primary-hover-hex)] font-extrabold text-white text-base shadow-lg shadow-[var(--primary-hex)]/20 transition-all active:scale-[0.98]"
          >
            확인했어요
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
