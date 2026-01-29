"use client";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, UserPlus, Plus } from "lucide-react";

interface WelcomeSectionProps {
  myStaffName: string | null;
  totalMonthlySchedules: number;
  todayStr: string;
  onOpenAddMember: () => void;
  onOpenAddClass: () => void;
}

export function WelcomeSection({
  myStaffName, totalMonthlySchedules, todayStr: _todayStr,
  onOpenAddMember, onOpenAddClass
}: WelcomeSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {/* Welcome Message */}
      <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <CalendarIcon className="w-4 h-4 text-[#2F80ED]" />
          <span>{new Date().toLocaleDateString('ko-KR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          {myStaffName}님, <span className="text-[#2F80ED]">오늘도 화이팅하세요!</span> 👋
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          이번 달은 총 <span className="font-bold text-gray-900">{totalMonthlySchedules}</span>개의 수업이 예정되어 있습니다.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center gap-3">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3 h-full">
          <Button
            onClick={onOpenAddMember}
            className="h-auto flex flex-col items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-[#2F80ED] border-0 rounded-xl py-4"
            variant="outline"
          >
            <UserPlus className="w-6 h-6" />
            <span className="text-xs font-bold">회원 등록</span>
          </Button>
          <Button
            onClick={onOpenAddClass}
            className="h-auto flex flex-col items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 text-[#F2994A] border-0 rounded-xl py-4"
            variant="outline"
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs font-bold">수업 추가</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
