"use client";

import Link from "next/link";
import { Calendar, CheckCircle2, ChevronRight, User } from "lucide-react";

interface TodaySchedulesCardProps {
  schedules: any[];
  getStatusColor: (status: string) => string;
}

export function TodaySchedulesCard({ schedules, getStatusColor }: TodaySchedulesCardProps) {
  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-all duration-500">
      <div className="flex justify-between items-center mb-8">
        <h3 className="font-black text-slate-900 text-xl tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          나의 오늘 수업
        </h3>
        <Link href="/admin/schedule">
          <span className="text-[10px] font-black text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg transition-all tracking-widest uppercase cursor-pointer">View All</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 opacity-20" />
            </div>
            <p className="font-bold text-sm">오늘 예정된 수업이 없습니다.</p>
          </div>
        ) : (
          schedules.map((schedule) => (
            <Link
              key={schedule.id}
              href={`/admin/schedule?date=${new Date().toISOString().split('T')[0]}&highlight=${schedule.id}`}
              className="group flex items-center gap-5 p-5 rounded-[24px] bg-white hover:bg-slate-50 border border-slate-50 hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-100/20 transition-all cursor-pointer"
            >
              <div className="flex flex-col items-center justify-center min-w-[64px] h-16 bg-slate-50 rounded-2xl group-hover:bg-emerald-500 transition-colors">
                <span className="text-[10px] font-black text-slate-400 group-hover:text-emerald-100 uppercase tracking-tighter mb-0.5">
                  {schedule.type}
                </span>
                <span className="text-sm font-black text-slate-900 group-hover:text-white tracking-tighter">
                  {new Date(schedule.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-black text-slate-800 text-base group-hover:text-emerald-600 transition-colors truncate">{schedule.member_name} 회원님</span>
                  {schedule.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-pulse" />}
                </div>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black border ${
                    schedule.status === 'reserved' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    schedule.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    'bg-slate-50 text-slate-400 border-slate-100'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(schedule.status)}`}></div>
                    {schedule.status.toUpperCase()}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {schedule.staffs?.name} 강사
                  </span>
                </div>
              </div>
              
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

