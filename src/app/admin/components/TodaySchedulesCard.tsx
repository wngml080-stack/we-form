"use client";

import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";

interface TodaySchedulesCardProps {
  schedules: any[];
  getStatusColor: (status: string) => string;
}

export function TodaySchedulesCard({ schedules, getStatusColor }: TodaySchedulesCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          오늘 수업
        </h3>
        <Link href="/admin/schedule" className="text-xs text-blue-600 hover:underline">
          전체보기
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <p className="text-sm">예정된 수업이 없습니다.</p>
          </div>
        ) : (
          schedules.map((schedule) => (
            <Link
              key={schedule.id}
              href={`/admin/schedule?highlight=${schedule.id}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="text-center min-w-[50px]">
                <div className="text-[10px] text-slate-400 font-bold">{schedule.type}</div>
                <div className="text-sm font-bold text-slate-900">
                  {new Date(schedule.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 text-sm truncate">{schedule.member_name} 회원</div>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(schedule.status)}`}></div>
                  <span className="text-[10px] text-slate-500 font-medium uppercase">{schedule.status}</span>
                </div>
              </div>
              
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
