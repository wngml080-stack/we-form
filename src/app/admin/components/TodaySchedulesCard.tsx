"use client";

import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";

interface Schedule {
  id: string;
  type: string;
  start_time: string;
  member_name: string;
  status: string;
}

interface TodaySchedulesCardProps {
  schedules: Schedule[];
  getStatusColor: (status: string) => string;
}

export function TodaySchedulesCard({ schedules, getStatusColor }: TodaySchedulesCardProps) {
  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[var(--border)] flex flex-col h-full hover:shadow-toss transition-all duration-300">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-3 tracking-tight">
          <Calendar className="w-6 h-6 text-[var(--primary-hex)]" />
          오늘 수업
        </h3>
        <Link href="/admin/schedule" className="px-4 py-2 bg-[var(--background-secondary)] rounded-full text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] font-bold transition-all active:scale-95">
          전체보기
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
        {schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--foreground-subtle)] space-y-3">
            <div className="w-16 h-16 bg-[var(--background-secondary)] rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-sm font-bold tracking-tight">예정된 수업이 없습니다.</p>
          </div>
        ) : (
          schedules.map((schedule) => (
            <Link
              key={schedule.id}
              href={`/admin/schedule?highlight=${schedule.id}`}
              className="flex items-center gap-5 p-5 rounded-[24px] bg-[var(--background)] hover:bg-[var(--background-secondary)] border border-transparent hover:border-[var(--border)] transition-all duration-300 group active:scale-[0.98]"
            >
              <div className="text-center min-w-[60px] py-1 bg-white rounded-2xl shadow-sm border border-[var(--border-light)] group-hover:border-transparent transition-all">
                <div className="text-[10px] text-[var(--foreground-subtle)] font-extrabold uppercase tracking-widest mb-0.5">{schedule.type}</div>
                <div className="text-sm font-bold text-[var(--foreground)] tracking-tight">
                  {new Date(schedule.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-bold text-[var(--foreground)] text-base tracking-tight mb-1 group-hover:text-[var(--primary-hex)] transition-colors">{schedule.member_name} 회원님</div>
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(schedule.status)} shadow-sm`}></div>
                  <span className="text-xs text-[var(--foreground-muted)] font-bold tracking-tight">{schedule.status}</span>
                </div>
              </div>

              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-[var(--border-light)]">
                <ChevronRight className="w-5 h-5 text-[var(--primary-hex)]" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
