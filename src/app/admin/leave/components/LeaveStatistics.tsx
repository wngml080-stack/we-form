"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { BarChart3, PieChart, TrendingUp, Users, Calendar, Activity, CheckCircle2, AlertCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LeaveStats {
  year: number;
  overview: {
    totalStaff: number;
    totalAllowance: number;
    usedDays: number;
    pendingDays: number;
    remainingDays: number;
    utilizationRate: number;
  };
  pendingCount: number;
  monthly: Array<{ month: number; days: number }>;
  byType: Array<{ code: string; name: string; days: number; count: number }>;
  byStatus: {
    approved: number;
    pending: number;
    rejected: number;
    cancelled: number;
  };
}

export default function LeaveStatistics() {
  const { branchFilter } = useAdminFilter();
  const [stats, setStats] = useState<LeaveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year: year.toString() });
      if (branchFilter.selectedGymId) {
        params.append("gym_id", branchFilter.selectedGymId);
      }

      const response = await fetch(`/api/admin/leave/stats?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "통계를 불러올 수 없습니다.");
      }

      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching leave stats:", error);
      toast.error("통계를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [branchFilter.selectedGymId, year]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  const maxMonthlyDays = stats?.monthly ? Math.max(...stats.monthly.map(m => m.days), 1) : 1;

  return (
    <div className="space-y-10">
      {/* Filters - Modern Toss Style */}
      <div className="flex justify-end bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm inline-flex ml-auto w-auto">
        <Select value={year.toString()} onValueChange={v => setYear(parseInt(v))}>
          <SelectTrigger className="h-10 w-[120px] rounded-xl bg-[var(--background-secondary)] border-none font-bold text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-2xl">
            {years.map(y => (
              <SelectItem key={y} value={y.toString()} className="rounded-xl font-bold">{y}년 리포트</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white rounded-[32px] animate-pulse shadow-sm"></div>
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Overview Cards - Dashboard Style */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden group hover:shadow-toss transition-all duration-500">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-[var(--foreground-subtle)] uppercase tracking-widest">Total Staff</p>
                    <p className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">{stats.overview.totalStaff}<span className="text-sm font-bold ml-1 text-[var(--foreground-subtle)]">명</span></p>
                  </div>
                  <div className="w-14 h-14 bg-blue-50 rounded-[20px] flex items-center justify-center text-[var(--primary-hex)] group-hover:bg-[var(--primary-hex)] group-hover:text-white transition-all duration-500">
                    <Users className="w-7 h-7" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden group hover:shadow-toss transition-all duration-500">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-[var(--foreground-subtle)] uppercase tracking-widest">Usage Rate</p>
                    <p className="text-3xl font-extrabold text-emerald-600 tracking-tight">{stats.overview.utilizationRate}<span className="text-sm font-bold ml-1 text-emerald-300">%</span></p>
                  </div>
                  <div className="w-14 h-14 bg-emerald-50 rounded-[20px] flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden group hover:shadow-toss transition-all duration-500">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-[var(--foreground-subtle)] uppercase tracking-widest">Total Used</p>
                    <p className="text-3xl font-extrabold text-orange-600 tracking-tight">{stats.overview.usedDays}<span className="text-sm font-bold ml-1 text-orange-300">일</span></p>
                  </div>
                  <div className="w-14 h-14 bg-orange-50 rounded-[20px] flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                    <Calendar className="w-7 h-7" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden group hover:shadow-toss transition-all duration-500">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-[var(--foreground-subtle)] uppercase tracking-widest">Pending</p>
                    <p className="text-3xl font-extrabold text-blue-600 tracking-tight">{stats.pendingCount}<span className="text-sm font-bold ml-1 text-blue-300">건</span></p>
                  </div>
                  <div className="w-14 h-14 bg-blue-50 rounded-[20px] flex items-center justify-center text-[var(--primary-hex)] group-hover:bg-[var(--primary-hex)] group-hover:text-white transition-all duration-500">
                    <Activity className="w-7 h-7" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Usage Chart */}
          <Card className="rounded-[40px] border-none shadow-sm bg-white overflow-hidden">
            <div className="p-10 border-b border-gray-50 flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-2xl font-extrabold text-[var(--foreground)] tracking-tight">월별 연차 사용 추이</h4>
                <p className="text-sm font-bold text-[var(--foreground-subtle)]">연간 연차 사용 데이터를 시각적으로 분석합니다.</p>
              </div>
              <div className="px-5 py-2.5 bg-[var(--background-secondary)] rounded-2xl text-[10px] font-black text-[var(--foreground-subtle)] uppercase tracking-widest">
                Analytics 2024
              </div>
            </div>
            <CardContent className="p-10">
              <div className="flex items-end gap-3 h-64">
                {stats.monthly.map(({ month, days }) => {
                  const height = (days / maxMonthlyDays) * 100;
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center group cursor-pointer">
                      <div className="relative w-full flex flex-col items-center">
                        <div
                          className={cn(
                            "w-full max-w-[40px] rounded-t-[12px] transition-all duration-700 ease-out group-hover:scale-x-110 group-hover:shadow-lg",
                            days > 0 ? "bg-gradient-to-t from-blue-600 to-blue-400" : "bg-gray-50"
                          )}
                          style={{
                            height: `${Math.max(height, 2)}%`,
                            minHeight: days > 0 ? "12px" : "4px",
                          }}
                        />
                        {days > 0 && (
                          <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-xl -translate-y-2 group-hover:translate-y-0">
                            {days}일
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-extrabold text-[var(--foreground-subtle)] mt-4 group-hover:text-[var(--primary-hex)] transition-colors">{monthNames[month - 1]}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Statistics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[40px] border-none shadow-sm bg-white overflow-hidden">
              <div className="p-8 border-b border-gray-50">
                <h4 className="text-xl font-extrabold text-[var(--foreground)] tracking-tight">휴가 유형별 사용 비중</h4>
              </div>
              <CardContent className="p-8">
                {stats.byType.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 opacity-30">
                    <PieChart className="w-12 h-12 mb-4" />
                    <p className="font-bold">데이터가 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {stats.byType.map((type, idx) => {
                      const maxDays = Math.max(...stats.byType.map(t => t.days), 1);
                      const percentage = (type.days / maxDays) * 100;

                      return (
                        <div key={type.code} className="space-y-2">
                          <div className="flex justify-between items-center px-1">
                            <span className="text-sm font-extrabold text-[var(--foreground-secondary)]">{type.name}</span>
                            <span className="text-xs font-black text-[var(--foreground-subtle)]">
                              {type.days}일 <span className="text-[var(--border-dark)] ml-1">·</span> {type.count}건
                            </span>
                          </div>
                          <div className="h-2.5 bg-[var(--background-secondary)] rounded-full overflow-hidden p-0.5">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-1000 ease-out",
                                idx === 0 ? "bg-blue-600" : idx === 1 ? "bg-blue-400" : "bg-blue-200"
                              )}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[40px] border-none shadow-sm bg-white overflow-hidden">
              <div className="p-8 border-b border-gray-50">
                <h4 className="text-xl font-extrabold text-[var(--foreground)] tracking-tight">신청 상태 요약</h4>
              </div>
              <CardContent className="p-8">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "승인 완료", value: stats.byStatus.approved, color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
                    { label: "승인 대기", value: stats.byStatus.pending, color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
                    { label: "반려됨", value: stats.byStatus.rejected, color: "text-rose-600", bg: "bg-rose-50", icon: AlertCircle },
                    { label: "취소됨", value: stats.byStatus.cancelled, color: "text-slate-500", bg: "bg-slate-50", icon: XCircle },
                  ].map((item, i) => (
                    <div key={i} className={cn("p-6 rounded-[28px] flex flex-col items-center gap-3", item.bg)}>
                      <item.icon className={cn("w-6 h-6", item.color)} />
                      <div className="text-center">
                        <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-60", item.color)}>{item.label}</p>
                        <p className={cn("text-2xl font-black mt-1", item.color)}>{item.value}<span className="text-xs ml-0.5 opacity-60">일</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px]">
          <BarChart3 className="w-16 h-16 text-gray-200 mb-4" />
          <p className="text-[var(--foreground-subtle)] font-bold">통계 데이터가 존재하지 않습니다.</p>
        </div>
      )}
    </div>
  );
}
