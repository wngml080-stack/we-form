"use client";

import Link from "next/link";
import { Calendar, CheckCircle2, ChevronRight } from "lucide-react";

interface TodaySchedulesCardProps {
  schedules: any[];
  getStatusColor: (status: string) => string;
}

export function TodaySchedulesCard({ schedules, getStatusColor }: TodaySchedulesCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          <span className="text-[#2F80ED] text-2xl">●</span>
          나의 오늘 수업 <span className="text-[#2F80ED]">{schedules.length}</span>
        </h3>
        <Link href="/admin/schedule">
          <span className="text-xs font-bold text-gray-400 hover:text-[#2F80ED] cursor-pointer border px-2 py-1 rounded-md">전체보기</span>
        </Link>
      </div>

      <div className="flex-1 overflow-auto space-y-3 custom-scrollbar pr-2">
        {schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Calendar className="w-10 h-10 mb-2 opacity-20" />
            <p>오늘 담당하신 수업이 없습니다.</p>
          </div>
        ) : (
          schedules.map((schedule) => (
            <Link
              key={schedule.id}
              href={`/admin/schedule?date=${new Date().toISOString().split('T')[0]}&highlight=${schedule.id}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-blue-50/50 border border-transparent hover:border-blue-100 transition-all group cursor-pointer"
            >
              <div className="flex flex-col items-center min-w-[50px]">
                <span className="text-xs font-bold text-[#2F80ED] bg-blue-100 px-2 py-1 rounded-md mb-1">
                  {schedule.type}
                </span>
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-800 flex items-center gap-2">
                  {schedule.member_name} 회원님
                  {schedule.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(schedule.status)}`}></div>
                  {new Date(schedule.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  <span className="text-gray-300">|</span>
                  {schedule.staffs?.name} 강사
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
