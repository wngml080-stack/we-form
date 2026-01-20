"use client";

import { useMemo } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { useRenewalStats } from "../hooks/useRenewalStats";
import { Button } from "@/components/ui/button";
import {
  Users, TrendingUp, TrendingDown, DollarSign,
  Target, RefreshCw, Calendar, Repeat
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RenewalDashboardProps {
  selectedGymId: string | null;
  selectedCompanyId: string | null;
  isInitialized: boolean;
}

const TYPE_COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];
const CATEGORY_COLORS = ["#6366F1", "#14B8A6", "#F97316", "#06B6D4", "#84CC16", "#F43F5E", "#A855F7"];

const formatAmount = (value: number) => {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억`;
  }
  if (value >= 10000) {
    return `${Math.round(value / 10000)}만`;
  }
  return value.toLocaleString();
};

export function RenewalDashboard({
  selectedGymId,
  selectedCompanyId,
  isInitialized
}: RenewalDashboardProps) {
  const {
    stats,
    isLoading,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    quickSelect,
    handleQuickSelect,
    refetch,
  } = useRenewalStats({
    selectedGymId,
    selectedCompanyId,
    filterInitialized: isInitialized,
  });

  // 파이차트 데이터 변환 (유형별)
  const pieData = useMemo(() => {
    if (!stats?.by_type) return [];
    return stats.by_type.map(item => ({
      name: item.type,
      value: item.count,
      amount: item.amount,
    }));
  }, [stats?.by_type]);

  // 바차트 데이터 변환 (회원권 카테고리별)
  const barData = useMemo(() => {
    if (!stats?.by_category) return [];
    return stats.by_category.map(item => ({
      name: item.route,
      건수: item.count,
      금액: item.amount,
    }));
  }, [stats?.by_category]);

  // 트렌드 차트 데이터
  const trendData = useMemo(() => {
    if (!stats?.trend) return [];
    return stats.trend.map(item => ({
      date: item.date.slice(5),
      건수: item.count,
      금액: Math.round(item.amount / 10000),
    }));
  }, [stats?.trend]);

  if (!isInitialized || !selectedGymId) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 필터 영역 */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* 빠른 선택 */}
          <div className="flex gap-2">
            {[
              { value: "today", label: "오늘" },
              { value: "thisWeek", label: "이번 주" },
              { value: "thisMonth", label: "이번 달" },
              { value: "lastMonth", label: "지난 달" },
              { value: "last3Months", label: "최근 3개월" },
              { value: "thisYear", label: "올해" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleQuickSelect(option.value)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black transition-all",
                  quickSelect === option.value
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* 날짜 필터 */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 text-sm font-bold"
            />
            <span className="text-slate-400">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 text-sm font-bold"
            />
          </div>

          {/* 새로고침 */}
          <Button
            variant="outline"
            className="h-10 w-10 p-0 rounded-xl border-slate-200"
            onClick={refetch}
          >
            <RefreshCw className={cn("h-4 w-4 text-slate-500", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 총 리뉴 수 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-8 -mt-8 bg-emerald-500 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <Repeat className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">총 리뉴</p>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats?.summary.total_count || 0}</p>
          {stats?.comparison && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-xs font-bold",
              stats.comparison.count_change_rate >= 0 ? "text-emerald-600" : "text-rose-600"
            )}>
              {stats.comparison.count_change_rate >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>전기간 대비 {Math.abs(stats.comparison.count_change_rate)}%</span>
            </div>
          )}
        </div>

        {/* 총 매출 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-8 -mt-8 bg-blue-500 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">총 매출</p>
          </div>
          <p className="text-3xl font-black text-slate-900">{formatAmount(stats?.summary.total_amount || 0)}</p>
          {stats?.comparison && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-xs font-bold",
              stats.comparison.amount_change_rate >= 0 ? "text-emerald-600" : "text-rose-600"
            )}>
              {stats.comparison.amount_change_rate >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>전기간 대비 {Math.abs(stats.comparison.amount_change_rate)}%</span>
            </div>
          )}
        </div>

        {/* 평균 결제금액 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-8 -mt-8 bg-amber-500 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">평균 결제</p>
          </div>
          <p className="text-3xl font-black text-slate-900">{formatAmount(stats?.summary.avg_amount || 0)}</p>
          <p className="text-xs text-slate-400 mt-2 font-bold">건당 평균 금액</p>
        </div>

        {/* 전기간 등록수 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-8 -mt-8 bg-purple-500 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">전기간</p>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats?.comparison.prev_period_count || 0}</p>
          <p className="text-xs text-slate-400 mt-2 font-bold">
            {formatAmount(stats?.comparison.prev_period_amount || 0)}
          </p>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 유형별 통계 (파이차트) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 mb-4">리뉴 유형별 현황</h3>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) => [
                        `${value ?? 0}건 (${formatAmount((props?.payload as { amount?: number })?.amount ?? 0)})`,
                        name ?? ""
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {pieData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: TYPE_COLORS[index % TYPE_COLORS.length] }}
                      />
                      <span className="text-xs font-bold text-slate-600">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900">{item.value}건</span>
                      <span className="text-[10px] text-slate-400 ml-2">{formatAmount(item.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              데이터가 없습니다
            </div>
          )}
        </div>

        {/* 회원권별 통계 (바차트) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 mb-4">회원권별 리뉴 현황</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" fontSize={10} />
                <YAxis type="category" dataKey="name" fontSize={10} width={60} />
                <Tooltip
                  formatter={(value, name) => [
                    name === "건수" ? `${value ?? 0}건` : formatAmount((value as number ?? 0) * 10000),
                    name ?? ""
                  ]}
                />
                <Bar dataKey="건수" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              데이터가 없습니다
            </div>
          )}
        </div>
      </div>

      {/* 트렌드 차트 */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-black text-slate-900 mb-4">기간별 리뉴 추이</h3>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" fontSize={10} />
              <YAxis yAxisId="left" fontSize={10} />
              <YAxis yAxisId="right" orientation="right" fontSize={10} />
              <Tooltip
                formatter={(value, name) => [
                  name === "건수" ? `${value ?? 0}건` : `${value ?? 0}만원`,
                  name ?? ""
                ]}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="건수"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="금액"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
            데이터가 없습니다
          </div>
        )}
      </div>

      {/* 상세 테이블 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 유형별 상세 */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900">리뉴 유형별 상세</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="py-3 px-4 text-left text-[10px] font-black text-slate-400 uppercase">유형</th>
                <th className="py-3 px-4 text-right text-[10px] font-black text-slate-400 uppercase">건수</th>
                <th className="py-3 px-4 text-right text-[10px] font-black text-slate-400 uppercase">금액</th>
                <th className="py-3 px-4 text-right text-[10px] font-black text-slate-400 uppercase">비율</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats?.by_type.map((item, index) => (
                <tr key={item.type} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: TYPE_COLORS[index % TYPE_COLORS.length] }}
                      />
                      <span className="text-xs font-bold text-slate-700">{item.type}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-xs font-black text-slate-900">{item.count}건</td>
                  <td className="py-3 px-4 text-right text-xs font-bold text-slate-600">{formatAmount(item.amount)}</td>
                  <td className="py-3 px-4 text-right text-xs font-bold text-slate-400">
                    {stats.summary.total_count > 0
                      ? `${Math.round((item.count / stats.summary.total_count) * 100)}%`
                      : "0%"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 회원권별 상세 */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900">회원권별 상세</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="py-3 px-4 text-left text-[10px] font-black text-slate-400 uppercase">회원권</th>
                <th className="py-3 px-4 text-right text-[10px] font-black text-slate-400 uppercase">건수</th>
                <th className="py-3 px-4 text-right text-[10px] font-black text-slate-400 uppercase">금액</th>
                <th className="py-3 px-4 text-right text-[10px] font-black text-slate-400 uppercase">비율</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats?.by_category.map((item, index) => (
                <tr key={item.route} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                      />
                      <span className="text-xs font-bold text-slate-700">{item.route}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-xs font-black text-slate-900">{item.count}건</td>
                  <td className="py-3 px-4 text-right text-xs font-bold text-slate-600">{formatAmount(item.amount)}</td>
                  <td className="py-3 px-4 text-right text-xs font-bold text-slate-400">
                    {stats.summary.total_count > 0
                      ? `${Math.round((item.count / stats.summary.total_count) * 100)}%`
                      : "0%"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
