"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TrendingUp, Target, Award, BarChart3, Search } from "lucide-react";
import { FcStats, PtStats, SalesSummary, ComparisonData, SalesPeriod, SalesType } from "../../hooks/useBranchData";

interface TotalSalesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  salesPeriod: SalesPeriod;
  onPeriodChange: (type: SalesType, period: SalesPeriod) => void;
  customDateRange: { start: string; end: string };
  setCustomDateRange: (range: { start: string; end: string }) => void;
  onCustomSearch: () => void;
  fcStats: FcStats;
  ptStats: PtStats;
  salesSummary: SalesSummary;
  comparisonData: ComparisonData;
  isLoading: boolean;
}

export function TotalSalesModal({
  isOpen,
  onOpenChange,
  salesPeriod,
  onPeriodChange,
  customDateRange,
  setCustomDateRange,
  onCustomSearch,
  fcStats,
  ptStats,
  salesSummary,
  comparisonData,
  isLoading
}: TotalSalesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl bg-[var(--background)] max-h-[95vh] overflow-y-auto p-0 border-none rounded-[40px] shadow-2xl">
        {/* 헤더 - 프리미엄 디자인 */}
        <div className="bg-[var(--foreground)] p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white" style={{ color: 'white' }}>전체 매출 현황</h2>
                  <p className="text-purple-200/60 text-xs font-black uppercase tracking-[0.2em] mt-0.5">Total Revenue Analytics</p>
                </div>
              </div>
            </div>

            {/* 기간 선택 - 필 스타일 */}
            <div className="flex items-center gap-1.5 bg-white/10 p-1.5 rounded-2xl backdrop-blur-sm border border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPeriodChange("all", "thisMonth")}
                className={cn("h-10 px-6 rounded-xl font-black transition-all", salesPeriod === "thisMonth" ? "bg-white text-slate-900 shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5")}
              >
                이번 달
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPeriodChange("all", "lastMonth")}
                className={cn("h-10 px-6 rounded-xl font-black transition-all", salesPeriod === "lastMonth" ? "bg-white text-slate-900 shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5")}
              >
                지난 달
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPeriodChange("all", "custom")}
                className={cn("h-10 px-6 rounded-xl font-black transition-all", salesPeriod === "custom" ? "bg-white text-slate-900 shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5")}
              >
                날짜 지정
              </Button>
            </div>
          </div>

          {salesPeriod === "custom" && (
            <div className="mt-8 flex items-center gap-3 bg-white/5 p-4 rounded-3xl border border-white/5 animate-in slide-in-from-top-4 duration-500">
              <Input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                className="h-11 bg-white border-none rounded-xl font-bold text-slate-900"
              />
              <span className="text-white/40 font-black">~</span>
              <Input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                className="h-11 bg-white border-none rounded-xl font-bold text-slate-900"
              />
              <Button onClick={onCustomSearch} className="h-11 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black">
                <Search className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>

        {/* 메인 콘텐츠 */}
        <div className="p-10 space-y-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
              <TrendingUp className="w-16 h-16 text-purple-200 mb-4" />
              <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Loading Analytics...</p>
            </div>
          ) : (
            <>
              {/* 총 매출 요약 - 히어로 카드 */}
              <div className="bg-white rounded-[40px] p-12 shadow-xl shadow-purple-100/50 border border-purple-50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-50 rounded-full -mr-40 -mt-40 transition-transform duration-1000 group-hover:scale-110"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="space-y-4 text-center md:text-left">
                    <h3 className="text-sm font-black text-purple-600 uppercase tracking-[0.3em]">Total Performance</h3>
                    <div className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">
                      총 매출 <span className="text-purple-600">{Math.round(salesSummary.totalRevenue / 10000).toLocaleString()}</span>만원
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-4">
                      <Badge className="bg-blue-50 text-blue-600 border-none font-black text-xs px-4 py-1.5 rounded-xl">
                        FC {salesSummary.fcCount}건
                      </Badge>
                      <Badge className="bg-orange-50 text-orange-600 border-none font-black text-xs px-4 py-1.5 rounded-xl">
                        PT {salesSummary.ptCount}건
                      </Badge>
                    </div>
                  </div>
                  <div className="w-40 h-40 bg-purple-600 rounded-[48px] flex items-center justify-center shadow-2xl shadow-purple-500/40 rotate-12 transition-transform duration-500 group-hover:rotate-0">
                    <BarChart3 className="w-20 h-20 text-white" />
                  </div>
                </div>
              </div>

              {/* FC vs PT 상세 그리드 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* FC 상세 */}
                <div className="bg-white rounded-[32px] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#E5E8EB] space-y-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow duration-200">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#E5E8EB]">
                    <div className="w-10 h-10 bg-[var(--primary-light-hex)] rounded-xl flex items-center justify-center">
                      <Target className="w-5 h-5 text-[var(--primary-hex)]" />
                    </div>
                    <h4 className="text-lg font-black text-[var(--foreground)]">FC 회원권 상세</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="FC BEP" value={`${Math.round(fcStats.bep / 10000).toLocaleString()}만원`} color="blue" />
                    <DetailItem label="FC TOTAL" value={`${Math.round(fcStats.totalSales / 10000).toLocaleString()}만원`} color="green" />
                    <DetailItem label="BEP RATE" value={`${Math.round(fcStats.bepRate)}%`} color="purple" />
                    <DetailItem label="UNIT PRICE" value={`${Math.round(fcStats.avgPrice / 10000).toLocaleString()}만원`} color="indigo" />
                  </div>
                  <div className="bg-[var(--primary-hex)] rounded-2xl p-5 text-center shadow-lg shadow-[var(--primary-light-hex)]">
                    <div className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">FC NEW SALES</div>
                    <div className="text-2xl font-black text-white">{Math.round(fcStats.newSales / 10000).toLocaleString()}만원</div>
                  </div>
                </div>

                {/* PT 상세 */}
                <div className="bg-white rounded-[32px] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#E5E8EB] space-y-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow duration-200">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#E5E8EB]">
                    <div className="w-10 h-10 bg-[var(--accent-light-hex)] rounded-xl flex items-center justify-center">
                      <Award className="w-5 h-5 text-[var(--accent-hex)]" />
                    </div>
                    <h4 className="text-lg font-black text-[var(--foreground)]">PT 트레이닝 상세</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="PT BEP" value={`${Math.round(ptStats.bep / 10000).toLocaleString()}만원`} color="orange" />
                    <DetailItem label="PT TOTAL" value={`${Math.round(ptStats.totalSales / 10000).toLocaleString()}만원`} color="green" />
                    <DetailItem label="BEP RATE" value={`${Math.round(ptStats.bepRate)}%`} color="purple" />
                    <DetailItem label="UNIT PRICE" value={`${Math.round(ptStats.avgPrice / 10000).toLocaleString()}만원`} color="indigo" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-orange-500 rounded-2xl p-4 text-center shadow-lg shadow-orange-100">
                      <div className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">NEW PT</div>
                      <div className="text-xl font-black text-white">{Math.round(ptStats.newSales / 10000).toLocaleString()}만원</div>
                    </div>
                    <div className="bg-amber-500 rounded-2xl p-4 text-center shadow-lg shadow-amber-100">
                      <div className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">RE-JOIN</div>
                      <div className="text-xl font-black text-white">{Math.round(ptStats.renewSales / 10000).toLocaleString()}만원</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 전월/전년 대비 비교 테이블 */}
              <div className="bg-white rounded-[32px] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#E5E8EB] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow duration-200">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-[var(--background-secondary)] rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-[var(--foreground-secondary)]" />
                  </div>
                  <h4 className="text-lg font-black text-[var(--foreground)]">전월/전년 대비 성장률</h4>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E5E8EB]">
                        <th className="px-4 py-4 text-left text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-widest">구분</th>
                        <th className="px-4 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">현재</th>
                        <th className="px-4 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">전월</th>
                        <th className="px-4 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">전월대비</th>
                        <th className="px-4 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">전년동월</th>
                        <th className="px-4 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">전년대비</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E8EB]">
                      <GrowthRow label="총 매출" current={salesSummary.totalRevenue} prevMonth={comparisonData.prevMonth.totalSales} prevYear={comparisonData.prevYear.totalSales} isTotal />
                      <GrowthRow label="FC 매출" current={fcStats.totalSales} prevMonth={comparisonData.prevMonth.fcSales} prevYear={comparisonData.prevYear.fcSales} color="blue" />
                      <GrowthRow label="PT 매출" current={ptStats.totalSales} prevMonth={comparisonData.prevMonth.ptSales} prevYear={comparisonData.prevYear.ptSales} color="orange" />
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-10 pt-0 flex justify-end">
          <Button onClick={() => onOpenChange(false)} variant="ghost" className="h-14 px-10 rounded-2xl font-black text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-all">
            CLOSE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({ label, value, color }: { label: string, value: string, color: string }) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-emerald-600 bg-emerald-50",
    purple: "text-purple-600 bg-purple-50",
    indigo: "text-indigo-600 bg-indigo-50",
    orange: "text-orange-600 bg-orange-50"
  };

  return (
    <div className={cn("p-4 rounded-2xl border border-[#E5E8EB] shadow-[0_2px_8px_rgba(0,0,0,0.04)]", colorMap[color])}>
      <div className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">{label}</div>
      <div className="text-lg font-black tracking-tight">{value}</div>
    </div>
  );
}

function GrowthRow({ label, current, prevMonth, prevYear, isTotal, color }: { label: string, current: number, prevMonth: number, prevYear: number, isTotal?: boolean, color?: string }) {
  const calculateChange = (cur: number, prev: number) => {
    if (prev <= 0) return null;
    const diff = ((cur - prev) / prev) * 100;
    return Math.round(diff);
  };

  const monthChange = calculateChange(current, prevMonth);
  const yearChange = calculateChange(current, prevYear);

  return (
    <tr className="group hover:bg-[var(--background-secondary)]/50 transition-colors">
      <td className={cn("px-4 py-5 font-black text-sm", isTotal ? "text-[var(--foreground)]" : (color === 'blue' ? "text-[var(--primary-hex)]" : "text-[var(--accent-hex)]"))}>{label}</td>
      <td className="px-4 py-5 text-right font-black text-sm">{Math.round(current / 10000).toLocaleString()}만</td>
      <td className="px-4 py-5 text-right font-bold text-slate-400 text-xs">{Math.round(prevMonth / 10000).toLocaleString()}만</td>
      <td className="px-4 py-5 text-right font-black text-xs">
        {monthChange !== null ? (
          <span className={monthChange >= 0 ? "text-emerald-500" : "text-rose-500"}>
            {monthChange >= 0 ? '▲' : '▼'} {Math.abs(monthChange)}%
          </span>
        ) : '-'}
      </td>
      <td className="px-4 py-5 text-right font-bold text-slate-400 text-xs">{Math.round(prevYear / 10000).toLocaleString()}만</td>
      <td className="px-4 py-5 text-right font-black text-xs">
        {yearChange !== null ? (
          <span className={yearChange >= 0 ? "text-emerald-500" : "text-rose-500"}>
            {yearChange >= 0 ? '▲' : '▼'} {Math.abs(yearChange)}%
          </span>
        ) : '-'}
      </td>
    </tr>
  );
}

function ComparisonChart({
  title,
  current,
  prevMonth,
  prevYear,
  color
}: {
  title: string;
  current: number;
  prevMonth: number;
  prevYear: number;
  color: 'purple' | 'blue' | 'orange';
}) {
  const maxValue = Math.max(current, prevMonth, prevYear);
  const colorClasses = {
    purple: { current: 'bg-purple-500', prev: 'bg-gray-400', year: 'bg-gray-300' },
    blue: { current: 'bg-blue-500', prev: 'bg-blue-300', year: 'bg-blue-200' },
    orange: { current: 'bg-orange-500', prev: 'bg-orange-300', year: 'bg-orange-200' }
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="text-xs text-gray-500 font-medium mb-3 text-center">{title}</div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs w-12 text-gray-600">현재</span>
          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className={`${colorClasses[color].current} h-full rounded-full transition-all duration-500`}
              style={{ width: `${maxValue > 0 ? (current / maxValue * 100) : 0}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs w-12 text-gray-600">전월</span>
          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className={`${colorClasses[color].prev} h-full rounded-full transition-all duration-500`}
              style={{ width: `${maxValue > 0 ? (prevMonth / maxValue * 100) : 0}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs w-12 text-gray-600">전년</span>
          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className={`${colorClasses[color].year} h-full rounded-full transition-all duration-500`}
              style={{ width: `${maxValue > 0 ? (prevYear / maxValue * 100) : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
