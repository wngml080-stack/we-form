"use client";

import { Bell } from "lucide-react";

interface SystemAnnouncementBannerProps {
  announcements: any[];
  onBannerClick: () => void;
}

export function SystemAnnouncementBanner({ announcements, onBannerClick }: SystemAnnouncementBannerProps) {
  if (announcements.length === 0) return null;

  return (
    <div
      className="py-2.5 overflow-hidden cursor-pointer -mx-4 lg:-mx-6 -mt-4 lg:-mt-6 mb-4 lg:mb-6"
      style={{ background: 'linear-gradient(to right, #2F80ED, #1e5bb8)' }}
      onClick={onBannerClick}
    >
      <div className="flex whitespace-nowrap animate-marquee-scroll">
        {[0, 1].map((setIndex) => (
          <div key={setIndex} className="flex shrink-0 items-center px-4">
            {announcements.map((announcement, idx) => (
              <div key={`${setIndex}-${idx}`} className="flex items-center">
                <span className="text-white/40 mx-6">◆</span>
                <span className={`text-white text-xs font-bold px-2 py-0.5 rounded mr-3 ${
                  announcement.priority === 'urgent' ? 'bg-red-500/80' : 'bg-white/20'
                }`}>
                  {announcement.priority === 'urgent' ? '긴급' :
                   announcement.priority === 'update' ? '업데이트' : '공지'}
                </span>
                <span className="text-white font-medium text-sm">
                  {announcement.title}
                </span>
                <Bell className="w-4 h-4 text-white/80 ml-3" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
