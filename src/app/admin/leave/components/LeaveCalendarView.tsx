"use client";

import { Calendar, Clock, Sparkles } from "lucide-react";

export default function LeaveCalendarView() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border border-gray-100 shadow-sm space-y-8 animate-in fade-in duration-1000">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full"></div>
          <div className="relative w-24 h-24 rounded-[32px] bg-[var(--background-secondary)] flex items-center justify-center border border-white shadow-xl">
            <Calendar className="w-12 h-12 text-[var(--primary-hex)]" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shadow-lg border-4 border-white animate-bounce">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>
        
        <div className="text-center space-y-3">
          <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tight">캘린더 뷰 준비 중</h3>
          <p className="text-[var(--foreground-subtle)] font-bold max-w-sm mx-auto leading-relaxed">
            직원들의 휴가 일정을 한눈에 파악할 수 있는<br />
            스마트 캘린더 기능이 곧 추가됩니다.
          </p>
        </div>

        <div className="flex items-center gap-2 px-6 py-3 bg-[var(--background-secondary)] rounded-2xl text-[10px] font-black text-[var(--foreground-subtle)] uppercase tracking-widest">
          <Clock className="w-3.5 h-3.5" />
          Coming Soon in Q1 2024
        </div>
      </div>
    </div>
  );
}
