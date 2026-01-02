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
      className="py-3 overflow-hidden cursor-pointer -mx-4 lg:-mx-6 -mt-4 lg:-mt-6 mb-0 relative group"
      style={{ background: 'linear-gradient(to right, #0f172a, #1e293b)' }}
      onClick={onBannerClick}
    >
      <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-blue-600/20 transition-colors"></div>
      <div className="flex whitespace-nowrap animate-marquee-scroll relative z-10">
        {[0, 1].map((setIndex) => (
          <div key={setIndex} className="flex shrink-0 items-center px-4">
            {announcements.map((announcement, idx) => (
              <div key={`${setIndex}-${idx}`} className="flex items-center">
                <span className="text-blue-500/40 mx-8 font-black">✦</span>
                <span className={`text-[10px] font-black tracking-tighter px-2.5 py-0.5 rounded-full mr-4 border ${
                  announcement.priority === 'urgent' 
                    ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>
                  {announcement.priority === 'urgent' ? 'URGENT' :
                   announcement.priority === 'update' ? 'UPDATE' : 'NOTICE'}
                </span>
                <span className="text-white font-bold text-sm tracking-tight group-hover:text-blue-200 transition-colors">
                  {announcement.title}
                </span>
                <Bell className="w-3.5 h-3.5 text-blue-400/80 ml-4 animate-pulse" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
