"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { useNewMemberStats } from "../hooks/useNewMemberStats";
import { Button } from "@/components/ui/button";
import {
  Users, TrendingUp, TrendingDown, DollarSign,
  Target, RefreshCw, Calendar, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NewMemberDashboardProps {
  selectedGymId: string | null;
  selectedCompanyId: string | null;
  isInitialized: boolean;
  inquiryStats?: {
    today: number;
    week: number;
    month: number;
    pending: number;
    conversionRate: number;
  };
  reservationCount?: number;
}

const TYPE_COLORS: Record<string, string> = {
  "워크인": "#3B82F6",
  "문의후 등록": "#10B981",
  "문의후 비대면": "#8B5CF6",
  "비대면": "#F59E0B",
  "예약후 등록": "#EC4899",
  "타종목신규": "#94A3B8",
  "네이버": "#22C55E",
  "인스타그램": "#E1306C",
  "전화": "#2563EB",
  "지인소개": "#F59E0B",
  "기타": "#64748B",
  "카카오채널": "#FFD400",
  "간판": "#F43F5E",
  "웹검색": "#0EA5E9",
  "블로그": "#10B981",
  "유튜브": "#FF0000",
  "당근마켓": "#FF8224",
};


const formatAmount = (value: number) => {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억`;
  }
  if (value >= 10000) {
    return `${Math.round(value / 10000)}만`;
  }
  return value.toLocaleString();
};

export function NewMemberDashboard({
  selectedGymId,
  selectedCompanyId,
  isInitialized,
  inquiryStats,
  reservationCount = 0
}: NewMemberDashboardProps) {
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
  } = useNewMemberStats({
    selectedGymId,
    selectedCompanyId,
    filterInitialized: isInitialized,
  });

  // 파이차트 데이터 (유형별 등록 현황)
  const pieData = useMemo(() => {
    if (!stats?.registration_types) return [];
    
    // 데이터 가공
    const data = stats.registration_types.map(item => ({
      name: item.type,
      value: item.count,
      amount: item.amount,
      color: TYPE_COLORS[item.type] || "#94A3B8",
    }));

    // "타종목신규"를 맨 밑으로 보내기 위한 정렬
    return [...data].sort((a, b) => {
      if (a.name === "타종목신규") return 1;
      if (b.name === "타종목신규") return -1;
      return 0;
    });
  }, [stats?.registration_types]);

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
                    ? "bg-indigo-600 text-white shadow-sm"
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
        {/* 신규 등록 수 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-8 -mt-8 bg-indigo-500 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">신규 등록</p>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats?.summary.total_count || 0}명</p>
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
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-8 -mt-8 bg-emerald-500 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
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

        {/* 객단가 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-8 -mt-8 bg-amber-500 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">객단가</p>
          </div>
          <p className="text-3xl font-black text-slate-900">{formatAmount(stats?.summary.avg_amount || 0)}</p>
          <p className="text-xs text-slate-400 mt-2 font-bold">건당 평균 금액</p>
        </div>

        {/* 미등록 / 전환율 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-8 -mt-8 bg-purple-500 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">미등록 / 전환율</p>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {inquiryStats?.pending || 0}건 / {inquiryStats?.conversionRate || 0}%
          </p>
          <p className="text-xs text-slate-400 mt-2 font-bold">
            미처리 문의 및 최종 전환율
          </p>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 유형별 등록 현황 (부유형 상세) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-900">유형별 등록 현황</h3>
          </div>
          
          <div className="flex flex-row items-center gap-6">
            {pieData.length > 0 ? (
              <>
                <div className="shrink-0" style={{ width: 176, height: 176 }}>
                  <PieChart width={176} height={176}>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) => [
                        `${value ?? 0}명 (${formatAmount((props?.payload as { amount?: number })?.amount ?? 0)})`,
                        name ?? ""
                      ]}
                    />
                  </PieChart>
                </div>
                <div className="flex-1 space-y-0.5">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-1.5 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-[11px] font-bold text-slate-600 truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="text-xs font-black text-slate-900">{item.value}명</span>
                        <span className="text-[9px] font-bold text-slate-400">({formatAmount(item.amount)})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-36 w-full flex items-center justify-center text-slate-400 text-sm">
                데이터가 없습니다
              </div>
            )}
          </div>
        </div>

        {/* 타종목 신규 현황 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-900">타종목 신규</h3>
            {stats?.other_sports && stats.other_sports.total_count > 0 && (
              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-violet-100 text-sm font-black text-violet-700">
                총 {stats.other_sports.total_count}명
              </span>
            )}
          </div>
          {stats?.other_sports && stats.other_sports.types.length > 0 ? (
            <div className="space-y-2">
              {stats.other_sports.types.map((sport) => (
                <div key={sport.type} className="flex items-center justify-between p-3 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-violet-500 text-[10px] font-black text-white shadow-sm">
                      {sport.type.split(" ")[0].slice(0, 2)}
                    </span>
                    <span className="text-sm font-black text-slate-800">{sport.type}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center justify-center min-w-[40px] h-7 px-2 rounded-lg bg-white text-xs font-black text-violet-600 shadow-sm border border-violet-200">
                      {sport.count}명
                    </span>
                    <span className="text-xs font-bold text-emerald-600 min-w-[50px] text-right">
                      {formatAmount(sport.amount)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 min-w-[50px] text-right">
                      객단가 {formatAmount(sport.count > 0 ? Math.round(sport.amount / sport.count) : 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-400 text-sm">
              타종목 신규 등록이 없습니다
            </div>
          )}
        </div>
      </div>

      {/* 일자별 통계 테이블 */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900">일자별 신규 등록 현황</h3>
          <p className="text-[10px] text-slate-400 mt-1">
            {stats?.period.start_date} ~ {stats?.period.end_date}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100">
                <th className="py-4 px-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider">날짜</th>
                <th className="py-4 px-3 text-center text-[10px] font-black text-indigo-500 uppercase tracking-wider">총 등록</th>
                <th className="py-4 px-3 text-center text-[10px] font-black text-blue-500 uppercase tracking-wider">워크인</th>
                <th className="py-4 px-3 text-center text-[10px] font-black text-emerald-500 uppercase tracking-wider">문의</th>
                <th className="py-4 px-3 text-center text-[10px] font-black text-purple-500 uppercase tracking-wider">예약</th>
                <th className="py-4 px-3 text-center text-[10px] font-black text-teal-500 uppercase tracking-wider">금액</th>
                <th className="py-4 px-3 text-center text-[10px] font-black text-amber-500 uppercase tracking-wider">객단가</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats?.daily_stats.filter(day => day.count > 0).map((day) => (
                <tr
                  key={day.date}
                  className="hover:bg-indigo-50/40 transition-colors"
                >
                  <td className="py-3 px-3 text-center">
                    <span className="text-xs font-bold text-slate-700">
                      {day.date}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-lg bg-indigo-100 text-sm font-black text-indigo-700">
                      {day.count}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={cn(
                      "text-sm font-bold",
                      day.walkIn > 0 ? "text-blue-600" : "text-slate-300"
                    )}>
                      {day.walkIn > 0 ? day.walkIn : "-"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={cn(
                      "text-sm font-bold",
                      day.inquiry > 0 ? "text-emerald-600" : "text-slate-300"
                    )}>
                      {day.inquiry > 0 ? day.inquiry : "-"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={cn(
                      "text-sm font-bold",
                      day.reservation > 0 ? "text-purple-600" : "text-slate-300"
                    )}>
                      {day.reservation > 0 ? day.reservation : "-"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-sm font-bold text-teal-600">
                      {formatAmount(day.amount)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-sm font-bold text-amber-600">
                      {formatAmount(day.avgPrice)}
                    </span>
                  </td>
                </tr>
              ))}
              {stats?.daily_stats.filter(day => day.count > 0).length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    등록 데이터가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
            {/* 합계 행 */}
            {stats && stats.summary.total_count > 0 && (
              <tfoot>
                <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 border-t-2 border-indigo-100">
                  <td className="py-4 px-3 text-center">
                    <span className="text-xs font-black text-slate-600">합계</span>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <span className="inline-flex items-center justify-center min-w-[40px] h-8 px-3 rounded-lg bg-indigo-600 text-sm font-black text-white">
                      {stats.summary.total_count}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <span className="text-sm font-black text-blue-600">
                      {stats.daily_stats.reduce((sum, d) => sum + d.walkIn, 0)}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <span className="text-sm font-black text-emerald-600">
                      {stats.daily_stats.reduce((sum, d) => sum + d.inquiry, 0)}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <span className="text-sm font-black text-purple-600">
                      {stats.daily_stats.reduce((sum, d) => sum + d.reservation, 0)}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <span className="text-sm font-black text-teal-600">
                      {formatAmount(stats.summary.total_amount)}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <span className="text-sm font-black text-amber-600">
                      {formatAmount(stats.summary.avg_amount)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
