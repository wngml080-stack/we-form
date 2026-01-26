"use client";

import { Bell } from "lucide-react";
import { BranchAnnouncement } from "../branch/hooks/useBranchData";

interface BranchAnnouncementsCardProps {
  announcements: BranchAnnouncement[];
  onAnnouncementClick: (announcement: BranchAnnouncement) => void;
}

export function BranchAnnouncementsCard({ announcements, onAnnouncementClick }: BranchAnnouncementsCardProps) {
  const priorityLabels: Record<string, string> = {
    urgent: "긴급",
    normal: "일반",
    low: "정보"
  };

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[var(--border)] flex flex-col h-full hover:shadow-toss transition-all duration-300">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-3 tracking-tight">
          <Bell className="w-6 h-6 text-[var(--accent-hex)]" />
          지점 공지사항
        </h3>
        <div className="px-3 py-1.5 bg-[var(--background-secondary)] rounded-full text-xs text-[var(--foreground-muted)] font-bold">
          {announcements.length}건
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--foreground-subtle)] space-y-3">
            <div className="w-16 h-16 bg-[var(--background-secondary)] rounded-full flex items-center justify-center">
              <Bell className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-sm font-bold tracking-tight">등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="p-5 bg-[var(--background)] hover:bg-[var(--background-secondary)] border border-transparent hover:border-[var(--border)] rounded-[24px] transition-all duration-300 cursor-pointer active:scale-[0.98] group"
              onClick={() => onAnnouncementClick(announcement)}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold tracking-widest ${
                  announcement.priority === 'urgent' 
                    ? 'bg-rose-50 text-rose-500 border border-rose-100' 
                    : 'bg-blue-50 text-blue-500 border border-blue-100'
                }`}>
                  {priorityLabels[announcement.priority]}
                </span>
                <span className="text-[11px] text-[var(--foreground-subtle)] font-bold">
                  {new Date(announcement.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <div className="font-bold text-[var(--foreground)] text-base tracking-tight truncate group-hover:text-[var(--primary-hex)] transition-colors">
                {announcement.title}
              </div>
              <div className="mt-1 text-sm text-[var(--foreground-muted)] line-clamp-1 opacity-70">
                {announcement.content || "공지사항 내용을 확인해주세요."}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
