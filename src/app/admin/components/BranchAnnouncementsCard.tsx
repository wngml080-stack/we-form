"use client";

import { Bell } from "lucide-react";
import { BranchAnnouncement } from "../branch/hooks/useBranchData";

interface BranchAnnouncementsCardProps {
  announcements: BranchAnnouncement[];
  onAnnouncementClick: (announcement: BranchAnnouncement) => void;
}

export function BranchAnnouncementsCard({ announcements, onAnnouncementClick }: BranchAnnouncementsCardProps) {
  const priorityColors: Record<string, string> = {
    urgent: "bg-red-100 text-red-600",
    normal: "bg-blue-100 text-blue-600",
    low: "bg-gray-100 text-gray-600"
  };
  const priorityLabels: Record<string, string> = {
    urgent: "긴급",
    normal: "일반",
    low: "참고"
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#2F80ED]" />
          지점 공지사항
        </h3>
        <span className="text-xs text-gray-400">{announcements.length}개</span>
      </div>
      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Bell className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm">등록된 지점 공지사항이 없습니다.</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border border-gray-100"
              onClick={() => onAnnouncementClick(announcement)}
            >
              <div className="flex items-start gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${priorityColors[announcement.priority]}`}>
                  {priorityLabels[announcement.priority]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-800 text-sm truncate">{announcement.title}</div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">{announcement.content}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(announcement.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
