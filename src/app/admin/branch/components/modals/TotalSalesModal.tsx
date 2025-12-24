"use client";

import { Button } from "@/components/ui/button";
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
      <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            매출 현황
          </DialogTitle>
          <DialogDescription className="sr-only">전체 매출 현황을 확인합니다</DialogDescription>
        </DialogHeader>

        {/* 기간 선택 */}
        <div className="flex items-center gap-2 py-4 border-b">
          <Button
            variant={salesPeriod === "thisMonth" ? "default" : "outline"}
            size="sm"
            onClick={() => onPeriodChange("all", "thisMonth")}
            className={salesPeriod === "thisMonth" ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            이번 달
          </Button>
          <Button
            variant={salesPeriod === "lastMonth" ? "default" : "outline"}
            size="sm"
            onClick={() => onPeriodChange("all", "lastMonth")}
            className={salesPeriod === "lastMonth" ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            지난 달
          </Button>
          <Button
            variant={salesPeriod === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => onPeriodChange("all", "custom")}
            className={salesPeriod === "custom" ? "bg-purple-600 hover:bg-purple-700" : ""}
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
              <Button size="sm" onClick={onCustomSearch} className="bg-purple-600 hover:bg-purple-700">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* 전체 통계 */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : (
          <div className="space-y-6 py-4">
            {/* 총 매출 요약 */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-5 text-center">
              <div className="text-sm text-purple-100 font-medium mb-1">총 매출 ({salesPeriod === "thisMonth" ? "이번 달" : salesPeriod === "lastMonth" ? "지난 달" : "지정 기간"})</div>
              <div className="text-3xl font-bold text-white">{Math.round(salesSummary.totalRevenue / 10000).toLocaleString()}만원</div>
              <div className="text-sm text-purple-200 mt-2">FC {salesSummary.fcCount}건 + PT {salesSummary.ptCount}건</div>
            </div>

            {/* FC 회원권 / 부가상품 상세 DATA */}
            <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/30">
              <h4 className="font-bold text-blue-700 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5" />
                FC 회원권 / 부가상품 상세 DATA
              </h4>
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
                  <div className="text-xs text-blue-600 font-medium">FC BEP</div>
                  <div className="text-lg font-bold text-blue-700">{Math.round(fcStats.bep / 10000).toLocaleString()}만원</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-green-100">
                  <div className="text-xs text-green-600 font-medium">FC 총 매출</div>
                  <div className="text-lg font-bold text-green-700">{Math.round(fcStats.totalSales / 10000).toLocaleString()}만원</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-purple-100">
                  <div className="text-xs text-purple-600 font-medium">BEP 달성률</div>
                  <div className="text-lg font-bold text-purple-700">{Math.round(fcStats.bepRate)}%</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-indigo-100">
                  <div className="text-xs text-indigo-600 font-medium">FC 객단가</div>
                  <div className="text-lg font-bold text-indigo-700">{Math.round(fcStats.avgPrice / 10000).toLocaleString()}만원</div>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                <div className="bg-white rounded-lg p-2 text-center border border-gray-100">
                  <div className="text-xs text-gray-500">총 등록</div>
                  <div className="text-sm font-bold text-gray-700">{fcStats.totalCount}건</div>
                </div>
                <div className="bg-white rounded-lg p-2 text-center border border-cyan-100">
                  <div className="text-xs text-cyan-600">워크인</div>
                  <div className="text-sm font-bold text-cyan-700">{fcStats.walkinCount}건</div>
                </div>
                <div className="bg-white rounded-lg p-2 text-center border border-teal-100">
                  <div className="text-xs text-teal-600">비대면</div>
                  <div className="text-sm font-bold text-teal-700">{fcStats.onlineCount}건</div>
                </div>
                <div className="bg-white rounded-lg p-2 text-center border border-amber-100">
                  <div className="text-xs text-amber-600">리뉴얼</div>
                  <div className="text-sm font-bold text-amber-700">{fcStats.renewCount}건</div>
                </div>
                <div className="bg-white rounded-lg p-2 text-center border border-rose-100">
                  <div className="text-xs text-rose-600">신규율</div>
                  <div className="text-sm font-bold text-rose-700">{Math.round(fcStats.newRate)}%</div>
                </div>
              </div>
              <div className="mt-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-3 text-center">
                <div className="text-xs text-blue-100">FC 신규매출</div>
                <div className="text-xl font-bold text-white">{Math.round(fcStats.newSales / 10000).toLocaleString()}만원</div>
              </div>
            </div>

            {/* PT / PPT 상세 DATA */}
            <div className="border border-orange-200 rounded-xl p-4 bg-orange-50/30">
              <h4 className="font-bold text-orange-700 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5" />
                PT / PPT 상세 DATA
              </h4>
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-white rounded-lg p-3 text-center border border-orange-100">
                  <div className="text-xs text-orange-600 font-medium">PT BEP</div>
                  <div className="text-lg font-bold text-orange-700">{Math.round(ptStats.bep / 10000).toLocaleString()}만원</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-green-100">
                  <div className="text-xs text-green-600 font-medium">PT 총 매출</div>
                  <div className="text-lg font-bold text-green-700">{Math.round(ptStats.totalSales / 10000).toLocaleString()}만원</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-purple-100">
                  <div className="text-xs text-purple-600 font-medium">BEP 달성률</div>
                  <div className="text-lg font-bold text-purple-700">{Math.round(ptStats.bepRate)}%</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-indigo-100">
                  <div className="text-xs text-indigo-600 font-medium">PT 객단가</div>
                  <div className="text-lg font-bold text-indigo-700">{Math.round(ptStats.avgPrice / 10000).toLocaleString()}만원</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-white rounded-lg p-2 text-center border border-gray-100">
                  <div className="text-xs text-gray-500">PT 총 등록</div>
                  <div className="text-sm font-bold text-gray-700">{ptStats.totalCount}건</div>
                </div>
                <div className="bg-white rounded-lg p-2 text-center border border-cyan-100">
                  <div className="text-xs text-cyan-600">PT 신규</div>
                  <div className="text-sm font-bold text-cyan-700">{ptStats.newCount}건</div>
                </div>
                <div className="bg-white rounded-lg p-2 text-center border border-amber-100">
                  <div className="text-xs text-amber-600">PT 재등록</div>
                  <div className="text-sm font-bold text-amber-700">{ptStats.renewCount}건</div>
                </div>
                <div className="bg-white rounded-lg p-2 text-center border border-rose-100">
                  <div className="text-xs text-rose-600">재등록률</div>
                  <div className="text-sm font-bold text-rose-700">{Math.round(ptStats.renewRate)}%</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-3 text-center">
                  <div className="text-xs text-orange-100">신규 등록 매출</div>
                  <div className="text-xl font-bold text-white">{Math.round(ptStats.newSales / 10000).toLocaleString()}만원</div>
                </div>
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg p-3 text-center">
                  <div className="text-xs text-amber-100">재등록 매출</div>
                  <div className="text-xl font-bold text-white">{Math.round(ptStats.renewSales / 10000).toLocaleString()}만원</div>
                </div>
              </div>
            </div>

            {/* 전월/전년 대비 비교 */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
              <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                전월/전년 대비 비교
              </h4>

              {/* 비교 테이블 */}
              <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">구분</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">현재</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">전월</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">전월대비</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">전년동월</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">전년대비</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">총 매출</td>
                      <td className="px-4 py-3 text-right font-bold text-purple-600">{Math.round(salesSummary.totalRevenue / 10000).toLocaleString()}만원</td>
                      <td className="px-4 py-3 text-right text-gray-600">{Math.round(comparisonData.prevMonth.totalSales / 10000).toLocaleString()}만원</td>
                      <td className={`px-4 py-3 text-right font-semibold ${comparisonData.prevMonth.totalSales > 0 ? (salesSummary.totalRevenue >= comparisonData.prevMonth.totalSales ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                        {comparisonData.prevMonth.totalSales > 0
                          ? `${salesSummary.totalRevenue >= comparisonData.prevMonth.totalSales ? '▲' : '▼'} ${Math.abs(Math.round((salesSummary.totalRevenue - comparisonData.prevMonth.totalSales) / comparisonData.prevMonth.totalSales * 100))}%`
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{Math.round(comparisonData.prevYear.totalSales / 10000).toLocaleString()}만원</td>
                      <td className={`px-4 py-3 text-right font-semibold ${comparisonData.prevYear.totalSales > 0 ? (salesSummary.totalRevenue >= comparisonData.prevYear.totalSales ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                        {comparisonData.prevYear.totalSales > 0
                          ? `${salesSummary.totalRevenue >= comparisonData.prevYear.totalSales ? '▲' : '▼'} ${Math.abs(Math.round((salesSummary.totalRevenue - comparisonData.prevYear.totalSales) / comparisonData.prevYear.totalSales * 100))}%`
                          : '-'
                        }
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-blue-700">FC 매출</td>
                      <td className="px-4 py-3 text-right font-bold text-blue-600">{Math.round(fcStats.totalSales / 10000).toLocaleString()}만원</td>
                      <td className="px-4 py-3 text-right text-gray-600">{Math.round(comparisonData.prevMonth.fcSales / 10000).toLocaleString()}만원</td>
                      <td className={`px-4 py-3 text-right font-semibold ${comparisonData.prevMonth.fcSales > 0 ? (fcStats.totalSales >= comparisonData.prevMonth.fcSales ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                        {comparisonData.prevMonth.fcSales > 0
                          ? `${fcStats.totalSales >= comparisonData.prevMonth.fcSales ? '▲' : '▼'} ${Math.abs(Math.round((fcStats.totalSales - comparisonData.prevMonth.fcSales) / comparisonData.prevMonth.fcSales * 100))}%`
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{Math.round(comparisonData.prevYear.fcSales / 10000).toLocaleString()}만원</td>
                      <td className={`px-4 py-3 text-right font-semibold ${comparisonData.prevYear.fcSales > 0 ? (fcStats.totalSales >= comparisonData.prevYear.fcSales ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                        {comparisonData.prevYear.fcSales > 0
                          ? `${fcStats.totalSales >= comparisonData.prevYear.fcSales ? '▲' : '▼'} ${Math.abs(Math.round((fcStats.totalSales - comparisonData.prevYear.fcSales) / comparisonData.prevYear.fcSales * 100))}%`
                          : '-'
                        }
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-orange-700">PT 매출</td>
                      <td className="px-4 py-3 text-right font-bold text-orange-600">{Math.round(ptStats.totalSales / 10000).toLocaleString()}만원</td>
                      <td className="px-4 py-3 text-right text-gray-600">{Math.round(comparisonData.prevMonth.ptSales / 10000).toLocaleString()}만원</td>
                      <td className={`px-4 py-3 text-right font-semibold ${comparisonData.prevMonth.ptSales > 0 ? (ptStats.totalSales >= comparisonData.prevMonth.ptSales ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                        {comparisonData.prevMonth.ptSales > 0
                          ? `${ptStats.totalSales >= comparisonData.prevMonth.ptSales ? '▲' : '▼'} ${Math.abs(Math.round((ptStats.totalSales - comparisonData.prevMonth.ptSales) / comparisonData.prevMonth.ptSales * 100))}%`
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{Math.round(comparisonData.prevYear.ptSales / 10000).toLocaleString()}만원</td>
                      <td className={`px-4 py-3 text-right font-semibold ${comparisonData.prevYear.ptSales > 0 ? (ptStats.totalSales >= comparisonData.prevYear.ptSales ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                        {comparisonData.prevYear.ptSales > 0
                          ? `${ptStats.totalSales >= comparisonData.prevYear.ptSales ? '▲' : '▼'} ${Math.abs(Math.round((ptStats.totalSales - comparisonData.prevYear.ptSales) / comparisonData.prevYear.ptSales * 100))}%`
                          : '-'
                        }
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 비교 바 차트 */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                {/* 총 매출 차트 */}
                <ComparisonChart
                  title="총 매출 비교"
                  current={salesSummary.totalRevenue}
                  prevMonth={comparisonData.prevMonth.totalSales}
                  prevYear={comparisonData.prevYear.totalSales}
                  color="purple"
                />
                {/* FC 매출 차트 */}
                <ComparisonChart
                  title="FC 매출 비교"
                  current={fcStats.totalSales}
                  prevMonth={comparisonData.prevMonth.fcSales}
                  prevYear={comparisonData.prevYear.fcSales}
                  color="blue"
                />
                {/* PT 매출 차트 */}
                <ComparisonChart
                  title="PT 매출 비교"
                  current={ptStats.totalSales}
                  prevMonth={comparisonData.prevMonth.ptSales}
                  prevYear={comparisonData.prevYear.ptSales}
                  color="orange"
                />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
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
