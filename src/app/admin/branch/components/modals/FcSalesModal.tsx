"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Target, Search } from "lucide-react";
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
      <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-[#2F80ED]" />
            FC (회원권) 매출 현황
          </DialogTitle>
          <DialogDescription className="sr-only">FC 회원권 매출 현황을 확인합니다</DialogDescription>
        </DialogHeader>

        {/* 기간 선택 */}
        <div className="flex items-center gap-2 py-4 border-b">
          <Button
            variant={salesPeriod === "thisMonth" ? "default" : "outline"}
            size="sm"
            onClick={() => onPeriodChange("fc", "thisMonth")}
            className={salesPeriod === "thisMonth" ? "bg-[#2F80ED]" : ""}
          >
            이번 달
          </Button>
          <Button
            variant={salesPeriod === "lastMonth" ? "default" : "outline"}
            size="sm"
            onClick={() => onPeriodChange("fc", "lastMonth")}
            className={salesPeriod === "lastMonth" ? "bg-[#2F80ED]" : ""}
          >
            지난 달
          </Button>
          <Button
            variant={salesPeriod === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => onPeriodChange("fc", "custom")}
            className={salesPeriod === "custom" ? "bg-[#2F80ED]" : ""}
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
              <Button size="sm" onClick={onCustomSearch}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* FC 상세 DATA */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : (
          <div className="space-y-4 py-4">
            {/* 첫 번째 행: BEP, 총 매출, BEP 달성률, 객단가 */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200">
                <div className="text-xs text-blue-600 font-medium mb-1">FC BEP</div>
                <div className="text-xl font-bold text-blue-700">{Math.round(fcStats.bep / 10000).toLocaleString()}만원</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200">
                <div className="text-xs text-green-600 font-medium mb-1">FC 총 매출</div>
                <div className="text-xl font-bold text-green-700">{Math.round(fcStats.totalSales / 10000).toLocaleString()}만원</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border border-purple-200">
                <div className="text-xs text-purple-600 font-medium mb-1">BEP 달성률</div>
                <div className="text-xl font-bold text-purple-700">{Math.round(fcStats.bepRate)}%</div>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 text-center border border-indigo-200">
                <div className="text-xs text-indigo-600 font-medium mb-1 flex items-center justify-center">FC 객단가<HelpTooltip content="1건당 평균 결제 금액입니다." iconClassName="w-3 h-3" /></div>
                <div className="text-xl font-bold text-indigo-700">{Math.round(fcStats.avgPrice / 10000).toLocaleString()}만원</div>
              </div>
            </div>

            {/* 두 번째 행: 총 등록, 워크인, 비대면, 리뉴얼, 신규율 */}
            <div className="grid grid-cols-5 gap-3">
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                <div className="text-xs text-gray-500 font-medium mb-1">총 등록</div>
                <div className="text-xl font-bold text-gray-700">{fcStats.totalCount}건</div>
              </div>
              <div className="bg-cyan-50 rounded-xl p-4 text-center border border-cyan-200">
                <div className="text-xs text-cyan-600 font-medium mb-1 flex items-center justify-center">
                  워크인<HelpTooltip content="직접 센터를 방문하여 등록한 회원입니다." iconClassName="w-3 h-3" />
                </div>
                <div className="text-xl font-bold text-cyan-700">{fcStats.walkinCount}건</div>
              </div>
              <div className="bg-teal-50 rounded-xl p-4 text-center border border-teal-200">
                <div className="text-xs text-teal-600 font-medium mb-1 flex items-center justify-center">
                  비대면<HelpTooltip content="온라인/인터넷/네이버 등을 통해 등록한 회원입니다." iconClassName="w-3 h-3" />
                </div>
                <div className="text-xl font-bold text-teal-700">{fcStats.onlineCount}건</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-200">
                <div className="text-xs text-amber-600 font-medium mb-1 flex items-center justify-center">
                  FC 리뉴얼<HelpTooltip content="기존 회원이 회원권을 재등록한 건수입니다." iconClassName="w-3 h-3" />
                </div>
                <div className="text-xl font-bold text-amber-700">{fcStats.renewCount}건</div>
              </div>
              <div className="bg-rose-50 rounded-xl p-4 text-center border border-rose-200">
                <div className="text-xs text-rose-600 font-medium mb-1 flex items-center justify-center">
                  신규율<HelpTooltip content="전체 등록 중 신규 회원의 비율입니다. 높을수록 신규 유입이 활발합니다." iconClassName="w-3 h-3" />
                </div>
                <div className="text-xl font-bold text-rose-700">{Math.round(fcStats.newRate)}%</div>
              </div>
            </div>

            {/* 세 번째 행: FC 신규매출 */}
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 text-center">
                <div className="text-sm text-blue-100 font-medium mb-1">FC 신규매출 ({salesPeriod === "thisMonth" ? "이번 달" : salesPeriod === "lastMonth" ? "지난 달" : "지정 기간"})</div>
                <div className="text-2xl font-bold text-white">{Math.round(fcStats.newSales / 10000).toLocaleString()}만원</div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
