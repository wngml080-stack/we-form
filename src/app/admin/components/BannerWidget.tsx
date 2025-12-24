"use client";

import { toast } from "@/lib/toast";

export function BannerWidget() {
  return (
    <div className="bg-gradient-to-r from-[#0a192f] via-[#172a45] to-[#2F80ED] rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-blue-200 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold">Notice</span>
          <span className="font-medium opacity-90">새로운 기능 업데이트</span>
        </div>
        <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: '#ffffff' }}>
          Google Calendar 연동 기능이 추가되었습니다!
        </h3>
        <p className="opacity-90 text-sm md:text-base">이제 외부 캘린더와 스케줄을 동기화하여 더 편리하게 관리하세요.</p>
      </div>
      <button
        onClick={() => toast.info("Google Calendar 연동 기능은 곧 출시됩니다!")}
        className="relative z-10 px-6 py-3 bg-white text-[#0a192f] rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-md whitespace-nowrap"
      >
        지금 연동하기
      </button>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl"></div>
    </div>
  );
}
