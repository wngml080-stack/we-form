"use client";

import { toast } from "@/lib/toast";

export function BannerWidget() {
  return (
    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="bg-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">New</span>
          <span className="text-white/80 text-sm font-medium">업데이트 소식</span>
        </div>
        <h3 className="text-xl font-bold text-white" style={{ color: 'white' }}>
          Google Calendar 연동 출시 예정
        </h3>
        <p className="text-white/80 text-sm max-w-md">
          이제 수업 예약과 개인 일정을 구글 캘린더와 실시간으로 동기화하세요.
        </p>
      </div>
      
      <button
        onClick={() => toast.info("곧 출시될 기능입니다!")}
        className="px-6 py-3 bg-white text-slate-900 rounded-lg font-bold text-sm hover:bg-slate-50 transition-colors whitespace-nowrap"
      >
        자세히 보기
      </button>
    </div>
  );
}
