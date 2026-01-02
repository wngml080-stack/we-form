"use client";

import { Badge } from "@/components/ui/badge";
import { Building2, Users, UserCheck, TrendingUp } from "lucide-react";
import { Stats } from "../hooks/useHqData";

interface StatCardsProps {
  stats: Stats;
  selectedGymFilter: string;
}

export function StatCards({ stats, selectedGymFilter }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
        <div className="flex items-center justify-between mb-6">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-500">
            <Building2 className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors duration-500" />
          </div>
          <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[10px] tracking-widest px-3 py-1 rounded-lg">
            {selectedGymFilter === "all" ? "TOTAL BRANCHES" : "SELECTED BRANCH"}
          </Badge>
        </div>
        <div className="space-y-1">
          <div className="text-4xl font-black text-slate-900 tracking-tighter">{stats.totalGyms}</div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">개 지점 운영 중</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
        <div className="flex items-center justify-between mb-6">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors duration-500">
            <Users className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors duration-500" />
          </div>
          <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px] tracking-widest px-3 py-1 rounded-lg">
            ACTIVE STAFFS
          </Badge>
        </div>
        <div className="space-y-1">
          <div className="text-4xl font-black text-slate-900 tracking-tighter">{stats.totalStaffs}</div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">명 재직 중</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
        <div className="flex items-center justify-between mb-6">
          <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:bg-purple-600 transition-colors duration-500">
            <UserCheck className="w-7 h-7 text-purple-600 group-hover:text-white transition-colors duration-500" />
          </div>
          <Badge className="bg-purple-50 text-purple-600 border-none font-black text-[10px] tracking-widest px-3 py-1 rounded-lg">
            TOTAL MEMBERS
          </Badge>
        </div>
        <div className="space-y-1">
          <div className="text-4xl font-black text-slate-900 tracking-tighter">{stats.totalMembers}</div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">명 등록</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
        <div className="flex items-center justify-between mb-6">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center group-hover:bg-orange-600 transition-colors duration-500">
            <TrendingUp className="w-7 h-7 text-orange-600 group-hover:text-white transition-colors duration-500" />
          </div>
          <Badge className="bg-orange-50 text-orange-600 border-none font-black text-[10px] tracking-widest px-3 py-1 rounded-lg">
            NEW JOINED
          </Badge>
        </div>
        <div className="space-y-1">
          <div className="text-4xl font-black text-slate-900 tracking-tighter">{stats.newMembersThisMonth}</div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">명 이번 달 가입</p>
        </div>
      </div>
    </div>
  );
}
