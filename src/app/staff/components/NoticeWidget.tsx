import { Bell } from "lucide-react";

export function NoticeWidget() {
  return (
    <div className="bg-gradient-to-r from-[#2F80ED] to-[#56CCF2] rounded-2xl p-6 text-white mb-8 shadow-lg relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium backdrop-blur-sm">Notice</span>
          <span className="text-sm font-medium opacity-90">새로운 기능 업데이트</span>
        </div>
        <h2 className="text-xl font-bold mb-1">Google Calendar 연동 기능이 추가되었습니다!</h2>
        <p className="text-sm opacity-80 mb-4">이제 외부 캘린더와 스케줄을 동기화하여 더 편리하게 관리하세요.</p>
        <button className="bg-white text-[#2F80ED] px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
          지금 연동하기
        </button>
      </div>
      <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
        <Bell size={200} />
      </div>
    </div>
  );
}

