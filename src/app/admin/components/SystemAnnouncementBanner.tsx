"use client";

import { Bell } from "lucide-react";

type AnnouncementPriority = 'urgent' | 'normal';

interface Announcement {
  id: string;
  title: string;
  priority: AnnouncementPriority;
}

interface SystemAnnouncementBannerProps {
  announcements: Announcement[];
  onBannerClick: () => void;
}

export function SystemAnnouncementBanner({ announcements, onBannerClick }: SystemAnnouncementBannerProps) {
  if (announcements.length === 0) return null;

  return (
    <div
      className="bg-slate-900 py-2 overflow-hidden cursor-pointer -mx-4 lg:-mx-6 -mt-4 lg:-mt-6 mb-6"
      onClick={onBannerClick}
    >
      <div className="flex whitespace-nowrap animate-marquee-scroll">
        {[0, 1].map((setIndex) => (
          <div key={setIndex} className="flex shrink-0 items-center px-4">
            {announcements.map((announcement, idx) => (
              <div key={`${setIndex}-${idx}`} className="flex items-center text-white text-sm">
                <span className="mx-8 opacity-30">•</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded mr-3 ${
                  announcement.priority === 'urgent' ? 'bg-rose-500' : 'bg-blue-500'
                }`}>
                  {announcement.priority.toUpperCase()}
                </span>
                <span className="font-medium mr-2">{announcement.title}</span>
                <Bell className="w-3.5 h-3.5 text-slate-400" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
