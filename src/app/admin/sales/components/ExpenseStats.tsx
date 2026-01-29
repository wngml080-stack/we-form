"use client";

import { TrendingDown, Users, Megaphone, Building, PieChart, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpenseStats {
  total: number;
  card: number;
  cash: number;
  transfer: number;
  count: number;
  byCategory: Record<string, number>;
  bySubCategory: Record<string, Record<string, number>>;
}

interface ExpenseStatsProps {
  stats: ExpenseStats;
  salesTotal?: number;
}

// 대분류별 색상 매핑
const categoryColors: Record<string, string> = {
  "운영비": "#6b7280",      // gray-500
  "마케팅비": "#ec4899",    // pink-500
  "인건비": "#3b82f6",      // blue-500
  "세금": "#ef4444",        // red-500
  "지원금": "#10b981",      // emerald-500
  "예비비": "#f59e0b",      // amber-500
  "수익분배금": "#8b5cf6",  // violet-500
};

const categoryBgColors: Record<string, string> = {
  "운영비": "bg-slate-100 text-slate-600",
  "마케팅비": "bg-pink-50 text-pink-600",
  "인건비": "bg-blue-50 text-blue-600",
  "세금": "bg-red-50 text-red-600",
  "지원금": "bg-emerald-50 text-emerald-600",
  "예비비": "bg-amber-50 text-amber-600",
  "수익분배금": "bg-violet-50 text-violet-600",
};

export function ExpenseStats({ stats, salesTotal = 0 }: ExpenseStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(amount);
  };

  const formatCompact = (amount: number) => {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}억`;
    } else if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}만`;
    }
    return amount.toLocaleString();
  };

  const getPercentage = (amount: number) => {
    if (stats.total === 0) return 0;
    return Math.round((amount / stats.total) * 100);
  };

  const _expenseRatio = salesTotal > 0 ? Math.round((stats.total / salesTotal) * 100) : 0;
  const totalAmount = salesTotal + stats.total; // 매출 + 지출 합계
  const salesPercentage = totalAmount > 0 ? Math.round((salesTotal / totalAmount) * 100) : 0;
  const expensePercentage = totalAmount > 0 ? Math.round((stats.total / totalAmount) * 100) : 0;

  // 카테고리별 데이터 정렬 (금액 기준 내림차순)
  const categoryData = Object.entries(stats.byCategory)
    .filter(([, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a);

  const mainStats = [
    {
      label: "총 지출",
      value: stats.total,
      icon: TrendingDown,
      color: "rose",
      percentage: null
    },
    {
      label: "카드",
      value: stats.card,
      icon: Building,
      color: "blue",
      percentage: getPercentage(stats.card)
    },
    {
      label: "현금",
      value: stats.cash,
      icon: Users,
      color: "emerald",
      percentage: getPercentage(stats.cash)
    },
    {
      label: "이체",
      value: stats.transfer,
      icon: Megaphone,
      color: "amber",
      percentage: getPercentage(stats.transfer)
    },
  ];

  return (
    <div className="animate-in fade-in duration-500 delay-300 space-y-3">
      {/* 메인 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {mainStats.map((item) => (
          <div key={item.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm group hover:shadow-md transition-all">
            <div className={cn(
              "w-9 h-9 rounded-xl mb-3 flex items-center justify-center transition-colors",
              item.color === 'rose' && 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white',
              item.color === 'blue' && 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
              item.color === 'emerald' && 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
              item.color === 'amber' && 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
            )}>
              <item.icon className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
              {item.percentage !== null && item.percentage > 0 && (
                <span className={cn(
                  "text-[10px] font-black px-1.5 py-0.5 rounded",
                  item.color === 'blue' && 'bg-blue-50 text-blue-600',
                  item.color === 'emerald' && 'bg-emerald-50 text-emerald-600',
                  item.color === 'amber' && 'bg-amber-50 text-amber-600',
                )}>
                  {item.percentage}%
                </span>
              )}
            </div>
            <p className="text-lg font-black text-slate-900 mt-1 tracking-tight">
              {formatCurrency(item.value)}
            </p>
          </div>
        ))}
      </div>

      {/* 대분류별 지출 분석 + 매출 대비 지출 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* 카테고리별 지출 내역 - 수평 바 차트 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm lg:col-span-2 h-full">
        <div className="flex items-center justify-between mb-4 h-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <PieChart className="w-4 h-4 text-violet-600" />
            </div>
            <p className="text-sm font-black text-slate-900">대분류별 지출 분석</p>
          </div>
          {stats.total > 0 && (
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400">총 지출</span>
              <p className="text-sm font-black text-slate-900">{formatCompact(stats.total)}원</p>
            </div>
          )}
        </div>

        {categoryData.length > 0 ? (
          <div className="space-y-4">
            {categoryData.map(([category, amount], index) => {
              const percentage = getPercentage(amount);
              const maxAmount = categoryData[0][1]; // 가장 큰 금액 기준
              const barWidth = (amount / maxAmount) * 100;

              // 해당 대분류의 계정과목별 데이터
              const subCategoryData = stats.bySubCategory?.[category] || {};
              const subCategoryEntries = Object.entries(subCategoryData)
                .filter(([, subAmount]) => subAmount > 0)
                .sort(([, a], [, b]) => b - a);

              return (
                <div key={category} className="group">
                  {/* 대분류 바 */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded",
                        categoryBgColors[category] || "bg-slate-100 text-slate-600"
                      )}>
                        {category}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {percentage}%
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-700">
                      {formatCompact(amount)}원
                    </span>
                  </div>
                  <div className="h-6 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-700 ease-out group-hover:opacity-80"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: categoryColors[category] || "#94a3b8",
                        animationDelay: `${index * 100}ms`
                      }}
                    />
                  </div>

                  {/* 계정과목별 세부 바 (100% 기준) */}
                  {subCategoryEntries.length > 0 && (
                    <div className="mt-1.5 ml-4">
                      <div className="h-3 bg-slate-50 rounded-full overflow-hidden flex">
                        {subCategoryEntries.map(([subCat, subAmount], subIndex) => {
                          const subPercentage = (subAmount / amount) * 100;
                          return (
                            <div
                              key={subCat}
                              className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full relative group/sub"
                              style={{
                                width: `${subPercentage}%`,
                                backgroundColor: categoryColors[category] || "#94a3b8",
                                opacity: 0.4 + (subIndex * 0.15),
                                animationDelay: `${(index * 100) + (subIndex * 50)}ms`
                              }}
                              title={`${subCat}: ${formatCompact(subAmount)}원 (${Math.round(subPercentage)}%)`}
                            />
                          );
                        })}
                      </div>
                      {/* 계정과목 라벨들 */}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {subCategoryEntries.map(([subCat, subAmount]) => {
                          const subPercentage = Math.round((subAmount / amount) * 100);
                          return (
                            <span key={subCat} className="text-[9px] text-slate-500">
                              {subCat} <span className="font-bold text-slate-600">{subPercentage}%</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <PieChart className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold">지출 데이터가 없습니다</p>
          </div>
        )}
        </div>

        {/* 매출 대비 지출 원형 그래프 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm h-full flex flex-col">
          <div className="flex items-center gap-2 mb-4 h-8">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-sm font-black text-slate-900">매출 대비 지출</p>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 flex-1">
            {/* 원형 그래프 - 매출 + 지출 합계 기준 */}
            <div className="relative w-32 h-32 lg:w-40 lg:h-40 flex-shrink-0">
              <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                {/* 배경 원 (100% = 매출 + 지출 합계) */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="40"
                />
                {/* 매출 비율 (파란색) */}
                {totalAmount > 0 && salesTotal > 0 && (
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="40"
                    strokeDasharray={`${(salesPercentage / 100) * 502.65} 502.65`}
                    className="transition-all duration-700"
                  />
                )}
                {/* 지출 비율 (빨간색) - 매출 다음에 이어서 그리기 */}
                {totalAmount > 0 && stats.total > 0 && (
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="40"
                    strokeDasharray={`${(expensePercentage / 100) * 502.65} 502.65`}
                    strokeDashoffset={`-${(salesPercentage / 100) * 502.65}`}
                    className="transition-all duration-700"
                  />
                )}
                {/* 중앙 배경 */}
                <circle cx="100" cy="100" r="55" fill="white" />
              </svg>
              {/* 중앙 텍스트 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {totalAmount > 0 ? (
                  stats.total > salesTotal ? (
                    <div className="text-center">
                      <span className="text-xs font-bold text-rose-500">초과</span>
                      <span className="block text-base lg:text-lg font-black text-rose-600">
                        {formatCompact(stats.total - salesTotal)}원
                      </span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-500">순이익</span>
                      <span className="block text-base lg:text-lg font-black text-emerald-600">
                        {formatCompact(salesTotal - stats.total)}원
                      </span>
                    </div>
                  )
                ) : (
                  <span className="text-2xl lg:text-3xl font-black text-slate-400">-</span>
                )}
              </div>
            </div>

            {/* 범례 */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-200" />
                  <span className="font-bold text-slate-600">매출</span>
                </div>
                <span className="font-black text-slate-700">{formatCompact(salesTotal)}원</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="font-bold text-slate-600">지출</span>
                </div>
                <span className="font-black text-slate-700">{formatCompact(stats.total)}원</span>
              </div>
              <div className="pt-3 mt-1 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-500">순이익</span>
                  <span className={cn(
                    "font-black",
                    salesTotal - stats.total >= 0 ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {formatCompact(salesTotal - stats.total)}원
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
