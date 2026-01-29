"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Award, Search } from "lucide-react";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { PtStats, SalesPeriod, SalesType } from "./TotalSalesModal";

interface PtSalesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  salesPeriod: SalesPeriod;
  onPeriodChange: (type: SalesType, period: SalesPeriod) => void;
  customDateRange: { start: string; end: string };
  setCustomDateRange: (range: { start: string; end: string }) => void;
  onCustomSearch: () => void;
  ptStats: PtStats;
  isLoading: boolean;
}

export function PtSalesModal({
  isOpen,
  onOpenChange,
  salesPeriod,
  onPeriodChange,
  customDateRange,
  setCustomDateRange,
  onCustomSearch,
  ptStats,
  isLoading
}: PtSalesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl bg-[#f8fafc] max-h-[90vh] overflow-y-auto p-0 border-none rounded-2xl xs:rounded-3xl sm:rounded-[40px] shadow-2xl">
        <VisuallyHidden>
          <DialogTitle>PT 매출 현황</DialogTitle>
        </VisuallyHidden>
        {/* 헤더 - 프리미엄 디자인 */}
        <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white" style={{ color: 'white' }}>PT 매출 현황</h2>
                  <p className="text-orange-200/60 text-xs font-black uppercase tracking-[0.2em] mt-0.5">Personal Training Analytics</p>
                </div>
              </div>
            </div>

            {/* 기간 선택 - 필 스타일 */}
            <div className="flex items-center gap-1.5 bg-white/10 p-1.5 rounded-2xl backdrop-blur-sm border border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPeriodChange("pt", "thisMonth")}
                className={cn("h-10 px-6 rounded-xl font-black transition-all", salesPeriod === "thisMonth" ? "bg-white text-slate-900 shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5")}
              >
                이번 달
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPeriodChange("pt", "lastMonth")}
                className={cn("h-10 px-6 rounded-xl font-black transition-all", salesPeriod === "lastMonth" ? "bg-white text-slate-900 shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5")}
              >
                지난 달
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPeriodChange("pt", "custom")}
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
              <Button onClick={onCustomSearch} className="h-11 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black">
                <Search className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>

        {/* 메인 콘텐츠 */}
        <div className="p-10 space-y-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
              <Award className="w-16 h-16 text-orange-200 mb-4" />
              <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Loading Analytics...</p>
            </div>
          ) : (
            <>
              {/* 첫 번째 행: 핵심 지표 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 group">
                  <div className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-4">PT BEP</div>
                  <div className="text-3xl font-black text-slate-900 tracking-tighter group-hover:text-orange-600 transition-colors">
                    {Math.round(ptStats.bep / 10000).toLocaleString()}<span className="text-base font-bold ml-1 opacity-40">만원</span>
                  </div>
                </div>
                <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 group">
                  <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4">PT TOTAL SALES</div>
                  <div className="text-3xl font-black text-slate-900 tracking-tighter group-hover:text-emerald-600 transition-colors">
                    {Math.round(ptStats.totalSales / 10000).toLocaleString()}<span className="text-base font-bold ml-1 opacity-40">만원</span>
                  </div>
                </div>
                <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 group">
                  <div className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] mb-4">BEP RATE</div>
                  <div className="text-3xl font-black text-slate-900 tracking-tighter group-hover:text-purple-600 transition-colors">
                    {Math.round(ptStats.bepRate)}<span className="text-base font-bold ml-1 opacity-40">%</span>
                  </div>
                </div>
                <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 group">
                  <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 flex items-center">
                    UNIT PRICE <HelpTooltip content="PT 1건당 평균 결제 금액입니다." iconClassName="w-3 h-3 ml-2" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 tracking-tighter group-hover:text-indigo-600 transition-colors">
                    {Math.round(ptStats.avgPrice / 10000).toLocaleString()}<span className="text-base font-bold ml-1 opacity-40">만원</span>
                  </div>
                </div>
              </div>

              {/* 두 번째 행: 상세 등록 지표 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <DetailStatCard label="TOTAL COUNT" value={`${ptStats.totalCount}건`} color="slate" />
                <DetailStatCard label="NEW PT" value={`${ptStats.newCount}건`} color="cyan" />
                <DetailStatCard label="RE-JOIN" value={`${ptStats.renewCount}건`} color="amber" />
                <DetailStatCard label="RE-RATE" value={`${Math.round(ptStats.renewRate)}%`} color="rose" tooltip="전체 PT 등록 중 기존 회원이 재등록한 비율입니다. 높을수록 회원 유지율이 좋습니다." />
              </div>

              {/* 세 번째 행: 주요 매출 성과 - 2컬럼 레이아웃 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[40px] p-10 shadow-xl shadow-orange-100/50 border border-orange-50 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110"></div>
                  <div className="relative z-10 space-y-4">
                    <h3 className="text-sm font-black text-orange-600 uppercase tracking-[0.3em]">New Registration</h3>
                    <div className="text-4xl font-black text-slate-900 tracking-tighter">
                      신규 등록 매출 <br/>
                      <span className="text-orange-600">{Math.round(ptStats.newSales / 10000).toLocaleString()}</span>만원
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[40px] p-10 shadow-xl shadow-amber-100/50 border border-amber-50 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110"></div>
                  <div className="relative z-10 space-y-4">
                    <h3 className="text-sm font-black text-amber-600 uppercase tracking-[0.3em]">Re-registration</h3>
                    <div className="text-4xl font-black text-slate-900 tracking-tighter">
                      재등록 매출 <br/>
                      <span className="text-amber-600">{Math.round(ptStats.renewSales / 10000).toLocaleString()}</span>만원
                    </div>
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
