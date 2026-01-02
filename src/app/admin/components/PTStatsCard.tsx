"use client";

import Link from "next/link";
import { Users, UserCheck, Ghost, DollarSign, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { DashboardStats } from "../hooks/useAdminDashboardData";

interface StatRowProps {
  icon: any;
  label: string;
  value: string;
  subValue: string;
  iconBg: string;
  iconColor: string;
  href?: string;
}

function StatRow({ icon: Icon, label, value, subValue, iconBg, iconColor, href }: StatRowProps) {
  const content = (
    <div className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 rounded-xl p-2 -m-2 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <div className="text-xs text-gray-400 font-medium mb-0.5">{label}</div>
          <div className="text-lg font-bold text-gray-900">{value}</div>
        </div>
      </div>
      <div className="text-right flex items-center gap-2">
        <div className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md">{subValue}</div>
        {href && <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />}
      </div>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

interface PTStatsCardProps {
  stats: DashboardStats;
  statsViewMode: 'monthly' | '3month' | '6month' | 'firstHalf' | 'secondHalf';
  setStatsViewMode: (mode: 'monthly' | '3month' | '6month' | 'firstHalf' | 'secondHalf') => void;
  centerStatsMonthOffset: number;
  setCenterStatsMonthOffset: (value: number | ((prev: number) => number)) => void;
  getSalesForMonth: (offset: number) => number;
  getMonthLabel: (offset: number) => string;
  calculateStatistics: () => { label: string; value: number } | null;
  formatCurrency: (amount: number) => string;
}

export function PTStatsCard({
  stats, statsViewMode, setStatsViewMode,
  centerStatsMonthOffset, setCenterStatsMonthOffset,
  getSalesForMonth, getMonthLabel, calculateStatistics, formatCurrency
}: PTStatsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          <div className="w-1.5 h-6 bg-[#2F80ED] rounded-full"></div>
          PT회원 현황
        </h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-gray-400 hover:text-[#2F80ED] transition-colors p-1.5 rounded-lg hover:bg-blue-50">
              <BarChart3 className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white">
            <DropdownMenuItem onClick={() => setStatsViewMode('monthly')} className={cn("cursor-pointer", statsViewMode === 'monthly' && "bg-blue-50 text-blue-600")}>
              월별 매출
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatsViewMode('3month')} className={cn("cursor-pointer", statsViewMode === '3month' && "bg-blue-50 text-blue-600")}>
              최근 3개월 평균
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatsViewMode('6month')} className={cn("cursor-pointer", statsViewMode === '6month' && "bg-blue-50 text-blue-600")}>
              최근 6개월 평균
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatsViewMode('firstHalf')} className={cn("cursor-pointer", statsViewMode === 'firstHalf' && "bg-blue-50 text-blue-600")}>
              상반기 평균 (1~6월)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatsViewMode('secondHalf')} className={cn("cursor-pointer", statsViewMode === 'secondHalf' && "bg-blue-50 text-blue-600")}>
              하반기 평균 (7~12월)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-4">
        <StatRow icon={Users} label="전체회원" value={`${stats.totalPTMembers ?? 0}명`} subValue={`총 ${stats.totalMembers ?? 0}명 중`} iconBg="bg-blue-50" iconColor="text-blue-600" href="/admin/members" />
        <StatRow icon={UserCheck} label="활성회원" value={`${stats.activePTMembers ?? 0}명`} subValue={`${(stats.totalPTMembers ?? 0) > 0 ? (((stats.activePTMembers ?? 0)/(stats.totalPTMembers ?? 1))*100).toFixed(0) : 0}% 활성`} iconBg="bg-emerald-50" iconColor="text-emerald-600" href="/admin/members?status=active" />
        <StatRow icon={Ghost} label="30일 이상 유령회원" value={`${stats.ghostMembers ?? 0}명`} subValue={(stats.ghostMembers ?? 0) > 0 ? "관리 필요" : "없음"} iconBg={(stats.ghostMembers ?? 0) > 0 ? "bg-red-50" : "bg-gray-50"} iconColor={(stats.ghostMembers ?? 0) > 0 ? "text-red-500" : "text-gray-400"} href="/admin/members?filter=ghost" />

        {statsViewMode === 'monthly' ? (
          <div className="relative">
            <div className="flex items-center justify-between group">
              <Link href="/admin/sales" className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-medium mb-0.5">{getMonthLabel(centerStatsMonthOffset)} 매출</div>
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(getSalesForMonth(centerStatsMonthOffset))}</div>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <button onClick={() => setCenterStatsMonthOffset(prev => prev - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" disabled={centerStatsMonthOffset <= -11}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setCenterStatsMonthOffset(prev => Math.min(prev + 1, 0))} className={cn("p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors", centerStatsMonthOffset >= 0 && "opacity-30 cursor-not-allowed")} disabled={centerStatsMonthOffset >= 0}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            {centerStatsMonthOffset !== 0 && (
              <button onClick={() => setCenterStatsMonthOffset(0)} className="mt-2 text-xs text-blue-500 hover:text-blue-600 font-medium">
                이번 달로 돌아가기
              </button>
            )}
          </div>
        ) : (
          <Link href="/admin/sales" className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 rounded-xl p-2 -m-2 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-xs text-gray-400 font-medium mb-0.5">{calculateStatistics()?.label}</div>
                <div className="text-lg font-bold text-gray-900">{formatCurrency(calculateStatistics()?.value || 0)}</div>
              </div>
            </div>
            <div className="text-right flex items-center gap-2">
              <div className="text-xs font-medium text-purple-500 bg-purple-50 px-2 py-1 rounded-md">평균 통계</div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
