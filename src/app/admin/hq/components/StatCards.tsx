"use client";

import { Building2, Users, UserCheck, TrendingUp } from "lucide-react";
import { Stats } from "../hooks/useHqData";

interface StatCardsProps {
  stats: Stats;
  selectedGymFilter: string;
}

export function StatCards({ stats, selectedGymFilter }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {selectedGymFilter === "all" ? "전체 지점" : "선택 지점"}
          </span>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalGyms}</div>
        <p className="text-sm text-gray-500">개 지점 운영 중</p>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">직원</span>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalStaffs}</div>
        <p className="text-sm text-gray-500">명 재직 중</p>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <UserCheck className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">회원</span>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalMembers}</div>
        <p className="text-sm text-gray-500">명 등록</p>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">이번 달 신규</span>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{stats.newMembersThisMonth}</div>
        <p className="text-sm text-gray-500">명 가입</p>
      </div>
    </div>
  );
}
