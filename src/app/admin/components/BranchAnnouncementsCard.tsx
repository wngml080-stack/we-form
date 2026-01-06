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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          지점 공지사항
        </h3>
        <span className="text-xs text-slate-400">{announcements.length}건</span>
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <p className="text-sm">등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              onClick={() => onAnnouncementClick(announcement)}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  announcement.priority === 'urgent' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {priorityLabels[announcement.priority]}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(announcement.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <div className="font-semibold text-slate-800 text-sm truncate">{announcement.title}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
