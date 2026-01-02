"use client";

import { toast } from "@/lib/toast";

export function BannerWidget() {
  return (
    <div className="bg-slate-900 rounded-[32px] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden group">
      {/* 장식용 그래디언트 배경 */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full -mr-40 -mt-40 blur-[100px] transition-all duration-1000 group-hover:bg-blue-600/30"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -ml-20 -mb-20 blur-[80px]"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="space-y-4 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <span className="bg-blue-600/20 text-blue-400 border border-blue-500/20 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">Feature</span>
            <span className="text-slate-400 font-bold text-sm tracking-tight">강력해진 연동 기능</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl md:text-3xl font-black leading-tight tracking-tighter" style={{ color: '#ffffff' }}>
              Google Calendar <br className="md:hidden" /> 
              양방향 실시간 연동 출시
            </h3>
            <p className="text-slate-400 font-medium text-sm md:text-base leading-relaxed max-w-lg">
              이제 수업 예약과 개인 일정을 구글 캘린더와 실시간으로 동기화하세요. <br className="hidden md:block" />
              센터 밖에서도 완벽한 스케줄 관리가 가능해집니다.
            </p>
          </div>
        </div>
        
        <button
          onClick={() => toast.info("Google Calendar 연동 기능은 곧 출시됩니다!")}
          className="px-10 py-4 bg-white text-slate-900 rounded-[20px] font-black text-sm hover:bg-blue-50 transition-all shadow-[0_10px_20px_rgba(255,255,255,0.1)] hover:shadow-white/20 hover:-translate-y-1 active:scale-95 whitespace-nowrap"
        >
          지금 설정하기
        </button>
      </div>
    </div>
  );
}
