"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Target, Search, TrendingUp } from "lucide-react";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { FcStats, SalesPeriod, SalesType } from "../../hooks/useBranchData";

interface FcSalesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  salesPeriod: SalesPeriod;
  onPeriodChange: (type: SalesType, period: SalesPeriod) => void;
  customDateRange: { start: string; end: string };
  setCustomDateRange: (range: { start: string; end: string }) => void;
  onCustomSearch: () => void;
  fcStats: FcStats;
  isLoading: boolean;
}

export function FcSalesModal({
  isOpen,
  onOpenChange,
  salesPeriod,
  onPeriodChange,
  customDateRange,
  setCustomDateRange,
  onCustomSearch,
  fcStats,
  isLoading
}: FcSalesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-[#f8fafc] max-h-[90vh] overflow-y-auto p-0 border-none rounded-[40px] shadow-2xl">
        {/* 헤더 - 프리미엄 디자인 */}
        <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white" style={{ color: 'white' }}>FC (회원권) 매출 현황</h2>
                  <p className="text-blue-200/60 text-xs font-black uppercase tracking-[0.2em] mt-0.5">Membership Sales Dashboard</p>
                </div>
              </div>
            </div>

            {/* 기간 선택 - 필 스타일 */}
            <div className="flex items-center gap-1.5 bg-white/10 p-1.5 rounded-2xl backdrop-blur-sm border border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPeriodChange("fc", "thisMonth")}
                className={cn("h-10 px-6 rounded-xl font-black transition-all", salesPeriod === "thisMonth" ? "bg-white text-slate-900 shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5")}
              >
                이번 달
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPeriodChange("fc", "lastMonth")}
                className={cn("h-10 px-6 rounded-xl font-black transition-all", salesPeriod === "lastMonth" ? "bg-white text-slate-900 shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5")}
              >
                지난 달
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPeriodChange("fc", "custom")}
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
              <Button onClick={onCustomSearch} className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black">
                <Search className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>

        {/* 메인 콘텐츠 */}
        <div className="p-10 space-y-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
              <Target className="w-16 h-16 text-blue-200 mb-4" />
              <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Loading Analytics...</p>
            </div>
          ) : (
            <>
              {/* 첫 번째 행: 핵심 지표 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 group">
                  <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">FC BEP</div>
                  <div className="text-3xl font-black text-slate-900 tracking-tighter group-hover:text-blue-600 transition-colors">
                    {Math.round(fcStats.bep / 10000).toLocaleString()}<span className="text-base font-bold ml-1 opacity-40">만원</span>
                  </div>
                </div>
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 group">
                  <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4">FC TOTAL SALES</div>
                  <div className="text-3xl font-black text-slate-900 tracking-tighter group-hover:text-emerald-600 transition-colors">
                    {Math.round(fcStats.totalSales / 10000).toLocaleString()}<span className="text-base font-bold ml-1 opacity-40">만원</span>
                  </div>
                </div>
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 group">
                  <div className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] mb-4">BEP RATE</div>
                  <div className="text-3xl font-black text-slate-900 tracking-tighter group-hover:text-purple-600 transition-colors">
                    {Math.round(fcStats.bepRate)}<span className="text-base font-bold ml-1 opacity-40">%</span>
                  </div>
                </div>
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 group">
                  <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 flex items-center">
                    UNIT PRICE <HelpTooltip content="1건당 평균 결제 금액입니다." iconClassName="w-3 h-3 ml-2" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 tracking-tighter group-hover:text-indigo-600 transition-colors">
                    {Math.round(fcStats.avgPrice / 10000).toLocaleString()}<span className="text-base font-bold ml-1 opacity-40">만원</span>
                  </div>
                </div>
              </div>

              {/* 두 번째 행: 상세 등록 지표 */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <DetailStatCard label="TOTAL COUNT" value={`${fcStats.totalCount}건`} color="slate" />
                <DetailStatCard label="WALK-IN" value={`${fcStats.walkinCount}건`} color="cyan" tooltip="직접 센터를 방문하여 등록한 회원입니다." />
                <DetailStatCard label="ONLINE" value={`${fcStats.onlineCount}건`} color="teal" tooltip="온라인/인터넷/네이버 등을 통해 등록한 회원입니다." />
                <DetailStatCard label="RENEWAL" value={`${fcStats.renewCount}건`} color="amber" tooltip="기존 회원이 회원권을 재등록한 건수입니다." />
                <DetailStatCard label="NEW RATE" value={`${Math.round(fcStats.newRate)}%`} color="rose" tooltip="전체 등록 중 신규 회원의 비율입니다. 높을수록 신규 유입이 활발합니다." />
              </div>

              {/* 세 번째 행: 주요 매출 성과 - 그라데이션 박스 */}
              <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-blue-100/50 border border-blue-50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50 rounded-full -mr-40 -mt-40 transition-transform duration-1000 group-hover:scale-110"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-sm font-black text-blue-600 uppercase tracking-[0.3em]">Monthly Performance</h3>
                    <div className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                      FC 신규 매출 <span className="text-blue-600">{Math.round(fcStats.newSales / 10000).toLocaleString()}</span>만원
                    </div>
                    <p className="text-slate-400 font-bold text-base">
                      {salesPeriod === "thisMonth" ? "이번 달" : salesPeriod === "lastMonth" ? "지난 달" : "지정 기간"} 동안의 신규 유입 매출 성과입니다.
                    </p>
                  </div>
                  <div className="w-32 h-32 bg-blue-600 rounded-[40px] flex items-center justify-center shadow-2xl shadow-blue-500/40 rotate-12 transition-transform duration-500 group-hover:rotate-0">
                    <TrendingUp className="w-16 h-16 text-white" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-10 pt-0 flex justify-end">
          <Button onClick={() => onOpenChange(false)} variant="ghost" className="h-14 px-10 rounded-2xl font-black text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">
            CLOSE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailStatCard({ label, value, color, tooltip }: { label: string, value: string, color: string, tooltip?: string }) {
  const colorMap: Record<string, string> = {
    slate: "text-slate-600 bg-slate-50",
    cyan: "text-cyan-600 bg-cyan-50",
    teal: "text-teal-600 bg-teal-50",
    amber: "text-amber-600 bg-amber-50",
    rose: "text-rose-600 bg-rose-50"
  };

  return (
    <div className={cn("rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all", colorMap[color] || "bg-gray-50")}>
      <div className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 flex items-center opacity-60">
        {label} {tooltip && <HelpTooltip content={tooltip} iconClassName="w-2.5 h-2.5 ml-1.5" />}
      </div>
      <div className="text-xl font-black tracking-tight text-slate-900">{value}</div>
    </div>
  );
}
