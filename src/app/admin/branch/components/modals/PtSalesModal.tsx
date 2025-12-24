"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Award, Search } from "lucide-react";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { PtStats, SalesPeriod, SalesType } from "../../hooks/useBranchData";

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
      <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-orange-500" />
            PT 매출 현황
          </DialogTitle>
          <DialogDescription className="sr-only">PT 매출 현황을 확인합니다</DialogDescription>
        </DialogHeader>

        {/* 기간 선택 */}
        <div className="flex items-center gap-2 py-4 border-b">
          <Button
            variant={salesPeriod === "thisMonth" ? "default" : "outline"}
            size="sm"
            onClick={() => onPeriodChange("pt", "thisMonth")}
            className={salesPeriod === "thisMonth" ? "bg-orange-500 hover:bg-orange-600" : ""}
          >
            이번 달
          </Button>
          <Button
            variant={salesPeriod === "lastMonth" ? "default" : "outline"}
            size="sm"
            onClick={() => onPeriodChange("pt", "lastMonth")}
            className={salesPeriod === "lastMonth" ? "bg-orange-500 hover:bg-orange-600" : ""}
          >
            지난 달
          </Button>
          <Button
            variant={salesPeriod === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => onPeriodChange("pt", "custom")}
            className={salesPeriod === "custom" ? "bg-orange-500 hover:bg-orange-600" : ""}
          >
            날짜 지정
          </Button>
          {salesPeriod === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <Input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                className="w-36"
              />
              <span>~</span>
              <Input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                className="w-36"
              />
              <Button size="sm" onClick={onCustomSearch} className="bg-orange-500 hover:bg-orange-600">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* PT 상세 DATA */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : (
          <div className="space-y-4 py-4">
            {/* 첫 번째 행: BEP, 총 매출, BEP 달성률, 객단가 */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center border border-orange-200">
                <div className="text-xs text-orange-600 font-medium mb-1">PT BEP</div>
                <div className="text-xl font-bold text-orange-700">{Math.round(ptStats.bep / 10000).toLocaleString()}만원</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200">
                <div className="text-xs text-green-600 font-medium mb-1">PT 총 매출</div>
                <div className="text-xl font-bold text-green-700">{Math.round(ptStats.totalSales / 10000).toLocaleString()}만원</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border border-purple-200">
                <div className="text-xs text-purple-600 font-medium mb-1">BEP 달성률</div>
                <div className="text-xl font-bold text-purple-700">{Math.round(ptStats.bepRate)}%</div>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 text-center border border-indigo-200">
                <div className="text-xs text-indigo-600 font-medium mb-1 flex items-center justify-center">PT 객단가<HelpTooltip content="PT 1건당 평균 결제 금액입니다." iconClassName="w-3 h-3" /></div>
                <div className="text-xl font-bold text-indigo-700">{Math.round(ptStats.avgPrice / 10000).toLocaleString()}만원</div>
              </div>
            </div>

            {/* 두 번째 행: 총 등록, 신규, 재등록, 재등록률 */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                <div className="text-xs text-gray-500 font-medium mb-1">PT 총 등록</div>
                <div className="text-xl font-bold text-gray-700">{ptStats.totalCount}건</div>
              </div>
              <div className="bg-cyan-50 rounded-xl p-4 text-center border border-cyan-200">
                <div className="text-xs text-cyan-600 font-medium mb-1">PT 신규</div>
                <div className="text-xl font-bold text-cyan-700">{ptStats.newCount}건</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-200">
                <div className="text-xs text-amber-600 font-medium mb-1">PT 재등록</div>
                <div className="text-xl font-bold text-amber-700">{ptStats.renewCount}건</div>
              </div>
              <div className="bg-rose-50 rounded-xl p-4 text-center border border-rose-200">
                <div className="text-xs text-rose-600 font-medium mb-1 flex items-center justify-center">재등록률<HelpTooltip content="전체 PT 등록 중 기존 회원이 재등록한 비율입니다. 높을수록 회원 유지율이 좋습니다." iconClassName="w-3 h-3" /></div>
                <div className="text-xl font-bold text-rose-700">{Math.round(ptStats.renewRate)}%</div>
              </div>
            </div>

            {/* 세 번째 행: 신규 등록 매출, 재등록 매출 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-5 text-center">
                <div className="text-sm text-orange-100 font-medium mb-1">신규 등록 매출 ({salesPeriod === "thisMonth" ? "이번 달" : salesPeriod === "lastMonth" ? "지난 달" : "지정 기간"})</div>
                <div className="text-2xl font-bold text-white">{Math.round(ptStats.newSales / 10000).toLocaleString()}만원</div>
              </div>
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-5 text-center">
                <div className="text-sm text-amber-100 font-medium mb-1">재등록 매출 ({salesPeriod === "thisMonth" ? "이번 달" : salesPeriod === "lastMonth" ? "지난 달" : "지정 기간"})</div>
                <div className="text-2xl font-bold text-white">{Math.round(ptStats.renewSales / 10000).toLocaleString()}만원</div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
