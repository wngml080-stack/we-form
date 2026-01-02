"use client";

import { Bell } from "lucide-react";
import { BranchAnnouncement } from "../branch/hooks/useBranchData";

interface BranchAnnouncementsCardProps {
  announcements: BranchAnnouncement[];
  onAnnouncementClick: (announcement: BranchAnnouncement) => void;
}

export function BranchAnnouncementsCard({ announcements, onAnnouncementClick }: BranchAnnouncementsCardProps) {
  const priorityColors: Record<string, string> = {
    urgent: "bg-red-50 text-red-600 border-red-100",
    normal: "bg-blue-50 text-blue-600 border-blue-100",
    low: "bg-slate-50 text-slate-500 border-slate-100"
  };
  const priorityLabels: Record<string, string> = {
    urgent: "URGENT",
    normal: "NOTICE",
    low: "INFO"
  };

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-all duration-500">
      <div className="flex justify-between items-center mb-8">
        <h3 className="font-black text-slate-900 text-xl tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          지점 공지사항
        </h3>
        <span className="bg-slate-50 text-slate-400 font-black text-[10px] px-3 py-1 rounded-lg border border-slate-100 tracking-widest">{announcements.length}건</span>
      </div>
      
      <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 opacity-20" />
            </div>
            <p className="font-bold text-sm">등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="group p-5 bg-white hover:bg-slate-50 rounded-[24px] transition-all cursor-pointer border border-slate-50 hover:border-blue-100 hover:shadow-lg hover:shadow-blue-100/20"
              onClick={() => onAnnouncementClick(announcement)}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black border tracking-tighter ${priorityColors[announcement.priority]}`}>
                    {priorityLabels[announcement.priority]}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(announcement.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="font-black text-slate-800 text-base group-hover:text-blue-600 transition-colors truncate tracking-tight">{announcement.title}</div>
                  <div className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-2">{announcement.content}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
