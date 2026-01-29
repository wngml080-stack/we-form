"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  RefreshCw,
  GitCompare,
  Users,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  membership_category: string;
  sale_type: string;
  payment_date: string;
  membership_name?: string;
  registrar?: string;
}

interface StaffStats {
  name: string;
  fc: {
    newReg: number;
    newRegCount: number;
    renewal: number;
    renewalCount: number;
    periodChange: number;
    periodChangeCount: number;
    addon: number;
    addonCount: number;
    total: number;
    totalCount: number;
  };
  pt: {
    newReg: number;
    newRegCount: number;
    renewal: number;
    renewalCount: number;
    sessionChange: number;
    sessionChangeCount: number;
    transfer: number;
    transferCount: number;
    total: number;
    totalCount: number;
  };
  total: number;
}

interface ComparisonAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPayments: Payment[];
  previousPayments: Payment[];
  lastYearPayments: Payment[];
  selectedGymId?: string | null;
  selectedCompanyId?: string | null;
}

export function ComparisonAnalysisModal({
  isOpen,
  onClose,
  currentPayments,
  previousPayments,
  lastYearPayments,
  selectedGymId,
  selectedCompanyId,
}: ComparisonAnalysisModalProps) {
  const [comparisonPeriod, setComparisonPeriod] = useState<"prev_month" | "last_year" | "custom">("prev_month");
  const [activeTab, setActiveTab] = useState<"summary" | "fc" | "pt" | "staff">("summary");

  // 사용자 지정 기간 상태
  const [customStartDate, setCustomStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 2);
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    date.setDate(0);
    return date.toISOString().split("T")[0];
  });
  const [customPayments, setCustomPayments] = useState<Payment[]>([]);
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);

  // 사용자 지정 기간 데이터 가져오기
  const fetchCustomPeriodData = useCallback(async () => {
    if (!selectedGymId || !selectedCompanyId) return;

    setIsLoadingCustom(true);
    try {
      const response = await fetch(
        `/api/admin/sales?gym_id=${selectedGymId}&company_id=${selectedCompanyId}&start_date=${customStartDate}&end_date=${customEndDate}`
      );
      const result = await response.json();
      if (result.success && result.payments) {
        setCustomPayments(result.payments.map((p: { id: string; amount?: number; membership_category?: string; sale_type?: string; paid_at?: string; created_at?: string; membership_name?: string; registrar?: string }) => ({
          id: p.id,
          amount: p.amount || 0,
          membership_category: p.membership_category || "",
          sale_type: p.sale_type || "",
          payment_date: p.paid_at || p.created_at,
          membership_name: p.membership_name || "",
          registrar: p.registrar || "",
        })));
      }
    } catch (error) {
      console.error("사용자 지정 기간 데이터 조회 오류:", error);
    } finally {
      setIsLoadingCustom(false);
    }
  }, [selectedGymId, selectedCompanyId, customStartDate, customEndDate]);

  useEffect(() => {
    if (comparisonPeriod === "custom" && isOpen) {
      fetchCustomPeriodData();
    }
  }, [comparisonPeriod, isOpen, fetchCustomPeriodData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(Math.round(amount)) + "원";
  };

  const getStats = (payments: Payment[]) => {
    const fc = payments.filter(p => p.membership_category === "회원권" || p.membership_category === "헬스");
    const pt = payments.filter(p => p.membership_category?.toUpperCase().includes("PT"));

    const calculateDetailed = (list: Payment[], isPt: boolean) => {
      const newReg = list.filter(p => p.sale_type === "신규");
      const renewal = list.filter(p => p.sale_type === "재등록" || p.sale_type === "리뉴");
      const thirdCategory = isPt
        ? list.filter(p => p.sale_type === "세션변경")
        : list.filter(p => p.sale_type === "기간변경");
      const fourthCategory = isPt
        ? list.filter(p => p.sale_type === "양도")
        : list.filter(p => p.sale_type === "부가상품");
      const refund = list.filter(p => p.sale_type === "환불");

      const total = list.reduce((sum, p) => sum + p.amount, 0);
      const count = list.length;

      return {
        total,
        count,
        newReg: { amount: newReg.reduce((s, p) => s + p.amount, 0), count: newReg.length },
        renewal: { amount: renewal.reduce((s, p) => s + p.amount, 0), count: renewal.length },
        third: { amount: thirdCategory.reduce((s, p) => s + p.amount, 0), count: thirdCategory.length },
        fourth: { amount: fourthCategory.reduce((s, p) => s + p.amount, 0), count: fourthCategory.length },
        refund: { amount: refund.reduce((s, p) => s + p.amount, 0), count: refund.length },
      };
    };

    // 직원별 통계
    const staffGroups: Record<string, StaffStats> = {};
    payments.forEach(p => {
      const name = p.registrar || "미지정";
      if (!staffGroups[name]) {
        staffGroups[name] = {
          name,
          fc: { newReg: 0, newRegCount: 0, renewal: 0, renewalCount: 0, periodChange: 0, periodChangeCount: 0, addon: 0, addonCount: 0, total: 0, totalCount: 0 },
          pt: { newReg: 0, newRegCount: 0, renewal: 0, renewalCount: 0, sessionChange: 0, sessionChangeCount: 0, transfer: 0, transferCount: 0, total: 0, totalCount: 0 },
          total: 0
        };
      }
      const isFc = p.membership_category === "회원권" || p.membership_category === "헬스";
      const isPt = p.membership_category?.toUpperCase().includes("PT");

      if (isFc) {
        staffGroups[name].fc.total += p.amount;
        staffGroups[name].fc.totalCount++;
        if (p.sale_type === "신규") { staffGroups[name].fc.newReg += p.amount; staffGroups[name].fc.newRegCount++; }
        else if (p.sale_type === "재등록" || p.sale_type === "리뉴") { staffGroups[name].fc.renewal += p.amount; staffGroups[name].fc.renewalCount++; }
        else if (p.sale_type === "기간변경") { staffGroups[name].fc.periodChange += p.amount; staffGroups[name].fc.periodChangeCount++; }
        else if (p.sale_type === "부가상품") { staffGroups[name].fc.addon += p.amount; staffGroups[name].fc.addonCount++; }
      }
      if (isPt) {
        staffGroups[name].pt.total += p.amount;
        staffGroups[name].pt.totalCount++;
        if (p.sale_type === "신규") { staffGroups[name].pt.newReg += p.amount; staffGroups[name].pt.newRegCount++; }
        else if (p.sale_type === "재등록" || p.sale_type === "리뉴") { staffGroups[name].pt.renewal += p.amount; staffGroups[name].pt.renewalCount++; }
        else if (p.sale_type === "세션변경") { staffGroups[name].pt.sessionChange += p.amount; staffGroups[name].pt.sessionChangeCount++; }
        else if (p.sale_type === "양도") { staffGroups[name].pt.transfer += p.amount; staffGroups[name].pt.transferCount++; }
      }
      staffGroups[name].total += p.amount;
    });

    const staffStats = Object.values(staffGroups).sort((a, b) => b.total - a.total);

    return {
      totalSales: payments.reduce((sum, p) => sum + p.amount, 0),
      totalCount: payments.length,
      fc: calculateDetailed(fc, false),
      pt: calculateDetailed(pt, true),
      staffStats,
    };
  };

  const current = useMemo(() => getStats(currentPayments), [currentPayments]);
  const prev = useMemo(() => getStats(previousPayments), [previousPayments]);
  const lastYear = useMemo(() => getStats(lastYearPayments), [lastYearPayments]);
  const custom = useMemo(() => getStats(customPayments), [customPayments]);

  const compare = useMemo(() => {
    if (comparisonPeriod === "prev_month") return prev;
    if (comparisonPeriod === "last_year") return lastYear;
    return custom;
  }, [comparisonPeriod, prev, lastYear, custom]);

  const comparisonLabel = useMemo(() => {
    if (comparisonPeriod === "prev_month") return "전월";
    if (comparisonPeriod === "last_year") return "전년 동월";
    return `${customStartDate} ~ ${customEndDate}`;
  }, [comparisonPeriod, customStartDate, customEndDate]);

  const getChangeIndicator = (current: number, compare: number) => {
    if (compare === 0) return { icon: Minus, color: "text-slate-400", bgColor: "bg-slate-100" };
    const change = ((current - compare) / compare) * 100;
    if (change > 0) return { icon: ArrowUpRight, color: "text-emerald-600", bgColor: "bg-emerald-100" };
    if (change < 0) return { icon: ArrowDownRight, color: "text-rose-600", bgColor: "bg-rose-100" };
    return { icon: Minus, color: "text-slate-400", bgColor: "bg-slate-100" };
  };

  const getChangePercent = (current: number, compare: number) => {
    if (compare === 0) return "-";
    const change = ((current - compare) / compare) * 100;
    return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl xs:rounded-3xl sm:rounded-[32px] border-none shadow-2xl bg-gradient-to-b from-white to-slate-50 p-0">
        <DialogHeader className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-200">
              <GitCompare className="w-7 h-7 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-heading font-black text-slate-900">
                기간별 실적 비교 분석
              </DialogTitle>
              <p className="text-sm font-bold text-slate-400 mt-1">
                당월 실적과 선택한 기간의 실적을 비교합니다
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-8 pb-4">
          {/* 비교 기간 선택 */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setComparisonPeriod("prev_month")}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-black transition-all",
                  comparisonPeriod === "prev_month"
                    ? "bg-white text-violet-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                전월 비교
              </button>
              <button
                onClick={() => setComparisonPeriod("last_year")}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-black transition-all",
                  comparisonPeriod === "last_year"
                    ? "bg-white text-violet-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                전년 동월
              </button>
              <button
                onClick={() => setComparisonPeriod("custom")}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-black transition-all",
                  comparisonPeriod === "custom"
                    ? "bg-white text-violet-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                기간 지정
              </button>
            </div>

            {comparisonPeriod === "custom" && (
              <div className="flex items-center gap-2 bg-violet-50 rounded-xl px-3 py-2 border border-violet-200">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="h-8 px-2 rounded-lg border border-violet-200 text-xs font-bold bg-white focus:ring-violet-500 focus:border-violet-500"
                />
                <span className="text-violet-400 text-xs">~</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="h-8 px-2 rounded-lg border border-violet-200 text-xs font-bold bg-white focus:ring-violet-500 focus:border-violet-500"
                />
                {isLoadingCustom && (
                  <RefreshCw className="w-4 h-4 text-violet-500 animate-spin" />
                )}
              </div>
            )}
          </div>

          {/* 탭 네비게이션 */}
          <div className="flex items-center gap-2 mt-4 border-b border-slate-200">
            {[
              { key: "summary", label: "요약", icon: BarChart3 },
              { key: "fc", label: "FC 매출", icon: Users },
              { key: "pt", label: "PT 매출", icon: TrendingUp },
              { key: "staff", label: "직원별", icon: Users },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-black border-b-2 transition-all -mb-[2px]",
                  activeTab === tab.key
                    ? "border-violet-500 text-violet-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {/* 요약 탭 */}
          {activeTab === "summary" && (
            <div className="space-y-6">
              {/* 총 매출 비교 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-3xl bg-slate-900 text-white">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">당월 총매출</p>
                  <p className="text-3xl font-heading font-black">{formatCurrency(current.totalSales)}</p>
                  <p className="text-xs font-bold text-slate-400 mt-1">{current.totalCount}건</p>
                </div>
                <div className="p-6 rounded-3xl bg-violet-100 border border-violet-200">
                  <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest mb-2">{comparisonLabel} 총매출</p>
                  <p className="text-3xl font-heading font-black text-violet-700">{formatCurrency(compare.totalSales)}</p>
                  <p className="text-xs font-bold text-violet-500 mt-1">{compare.totalCount}건</p>
                </div>
                <div className="p-6 rounded-3xl bg-white border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">증감</p>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const indicator = getChangeIndicator(current.totalSales, compare.totalSales);
                      return (
                        <>
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", indicator.bgColor)}>
                            <indicator.icon className={cn("w-5 h-5", indicator.color)} />
                          </div>
                          <div>
                            <p className={cn("text-2xl font-heading font-black", indicator.color)}>
                              {getChangePercent(current.totalSales, compare.totalSales)}
                            </p>
                            <p className={cn("text-xs font-bold", current.totalSales - compare.totalSales >= 0 ? "text-emerald-600" : "text-rose-600")}>
                              {current.totalSales - compare.totalSales >= 0 ? "+" : ""}{formatCurrency(current.totalSales - compare.totalSales)}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* FC / PT 비교 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FC 매출 */}
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span className="text-sm font-black text-amber-700">FC 매출</span>
                    </div>
                    <span className={cn(
                      "text-xs font-black px-2 py-1 rounded-lg",
                      getChangeIndicator(current.fc.total, compare.fc.total).bgColor,
                      getChangeIndicator(current.fc.total, compare.fc.total).color
                    )}>
                      {getChangePercent(current.fc.total, compare.fc.total)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white border border-amber-100">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">당월</p>
                      <p className="text-lg font-black text-amber-700">{formatCurrency(current.fc.total)}</p>
                      <p className="text-[10px] font-bold text-slate-400">{current.fc.count}건</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-amber-100">
                      <p className="text-[10px] font-bold text-violet-400 mb-1">{comparisonLabel}</p>
                      <p className="text-lg font-black text-violet-600">{formatCurrency(compare.fc.total)}</p>
                      <p className="text-[10px] font-bold text-slate-400">{compare.fc.count}건</p>
                    </div>
                  </div>
                </div>

                {/* PT 매출 */}
                <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-black text-blue-700">PT 매출</span>
                    </div>
                    <span className={cn(
                      "text-xs font-black px-2 py-1 rounded-lg",
                      getChangeIndicator(current.pt.total, compare.pt.total).bgColor,
                      getChangeIndicator(current.pt.total, compare.pt.total).color
                    )}>
                      {getChangePercent(current.pt.total, compare.pt.total)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white border border-blue-100">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">당월</p>
                      <p className="text-lg font-black text-blue-700">{formatCurrency(current.pt.total)}</p>
                      <p className="text-[10px] font-bold text-slate-400">{current.pt.count}건</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-blue-100">
                      <p className="text-[10px] font-bold text-violet-400 mb-1">{comparisonLabel}</p>
                      <p className="text-lg font-black text-violet-600">{formatCurrency(compare.pt.total)}</p>
                      <p className="text-[10px] font-bold text-slate-400">{compare.pt.count}건</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FC 매출 탭 */}
          {activeTab === "fc" && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-amber-50">
                    <tr>
                      <th className="p-4 text-left font-black text-amber-700 text-xs">항목</th>
                      <th className="p-4 text-center font-black text-slate-600 text-xs">당월 매출</th>
                      <th className="p-4 text-center font-black text-slate-600 text-xs">당월 건수</th>
                      <th className="p-4 text-center font-black text-violet-600 text-xs">{comparisonLabel} 매출</th>
                      <th className="p-4 text-center font-black text-violet-600 text-xs">{comparisonLabel} 건수</th>
                      <th className="p-4 text-center font-black text-slate-600 text-xs">차이</th>
                      <th className="p-4 text-center font-black text-slate-600 text-xs">증감률</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { label: "신규", current: current.fc.newReg, compare: compare.fc.newReg },
                      { label: "리뉴", current: current.fc.renewal, compare: compare.fc.renewal },
                      { label: "기간변경", current: current.fc.third, compare: compare.fc.third },
                      { label: "부가상품", current: current.fc.fourth, compare: compare.fc.fourth },
                      { label: "환불", current: current.fc.refund, compare: compare.fc.refund, isNegative: true },
                    ].map(row => (
                      <tr key={row.label} className="hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-700">{row.label}</td>
                        <td className="p-4 text-center font-bold text-slate-800">{formatCurrency(row.current.amount)}</td>
                        <td className="p-4 text-center font-bold text-slate-500">{row.current.count}건</td>
                        <td className="p-4 text-center font-bold text-violet-600">{formatCurrency(row.compare.amount)}</td>
                        <td className="p-4 text-center font-bold text-violet-500">{row.compare.count}건</td>
                        <td className={cn("p-4 text-center font-bold", row.current.amount - row.compare.amount >= 0 ? "text-emerald-600" : "text-rose-600")}>
                          {row.current.amount - row.compare.amount >= 0 ? "+" : ""}{formatCurrency(row.current.amount - row.compare.amount)}
                        </td>
                        <td className="p-4 text-center">
                          <span className={cn(
                            "text-xs font-black px-2 py-1 rounded-lg",
                            getChangeIndicator(row.current.amount, row.compare.amount).bgColor,
                            getChangeIndicator(row.current.amount, row.compare.amount).color
                          )}>
                            {getChangePercent(row.current.amount, row.compare.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-amber-100">
                    <tr>
                      <td className="p-4 font-black text-amber-800">합계</td>
                      <td className="p-4 text-center font-black text-amber-800">{formatCurrency(current.fc.total)}</td>
                      <td className="p-4 text-center font-black text-amber-700">{current.fc.count}건</td>
                      <td className="p-4 text-center font-black text-violet-700">{formatCurrency(compare.fc.total)}</td>
                      <td className="p-4 text-center font-black text-violet-600">{compare.fc.count}건</td>
                      <td className={cn("p-4 text-center font-black", current.fc.total - compare.fc.total >= 0 ? "text-emerald-600" : "text-rose-600")}>
                        {current.fc.total - compare.fc.total >= 0 ? "+" : ""}{formatCurrency(current.fc.total - compare.fc.total)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={cn(
                          "text-xs font-black px-2 py-1 rounded-lg",
                          getChangeIndicator(current.fc.total, compare.fc.total).bgColor,
                          getChangeIndicator(current.fc.total, compare.fc.total).color
                        )}>
                          {getChangePercent(current.fc.total, compare.fc.total)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* PT 매출 탭 */}
          {activeTab === "pt" && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="p-4 text-left font-black text-blue-700 text-xs">항목</th>
                      <th className="p-4 text-center font-black text-slate-600 text-xs">당월 매출</th>
                      <th className="p-4 text-center font-black text-slate-600 text-xs">당월 건수</th>
                      <th className="p-4 text-center font-black text-violet-600 text-xs">{comparisonLabel} 매출</th>
                      <th className="p-4 text-center font-black text-violet-600 text-xs">{comparisonLabel} 건수</th>
                      <th className="p-4 text-center font-black text-slate-600 text-xs">차이</th>
                      <th className="p-4 text-center font-black text-slate-600 text-xs">증감률</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { label: "신규", current: current.pt.newReg, compare: compare.pt.newReg },
                      { label: "리뉴", current: current.pt.renewal, compare: compare.pt.renewal },
                      { label: "세션변경", current: current.pt.third, compare: compare.pt.third },
                      { label: "양도", current: current.pt.fourth, compare: compare.pt.fourth },
                      { label: "환불", current: current.pt.refund, compare: compare.pt.refund, isNegative: true },
                    ].map(row => (
                      <tr key={row.label} className="hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-700">{row.label}</td>
                        <td className="p-4 text-center font-bold text-slate-800">{formatCurrency(row.current.amount)}</td>
                        <td className="p-4 text-center font-bold text-slate-500">{row.current.count}건</td>
                        <td className="p-4 text-center font-bold text-violet-600">{formatCurrency(row.compare.amount)}</td>
                        <td className="p-4 text-center font-bold text-violet-500">{row.compare.count}건</td>
                        <td className={cn("p-4 text-center font-bold", row.current.amount - row.compare.amount >= 0 ? "text-emerald-600" : "text-rose-600")}>
                          {row.current.amount - row.compare.amount >= 0 ? "+" : ""}{formatCurrency(row.current.amount - row.compare.amount)}
                        </td>
                        <td className="p-4 text-center">
                          <span className={cn(
                            "text-xs font-black px-2 py-1 rounded-lg",
                            getChangeIndicator(row.current.amount, row.compare.amount).bgColor,
                            getChangeIndicator(row.current.amount, row.compare.amount).color
                          )}>
                            {getChangePercent(row.current.amount, row.compare.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-blue-100">
                    <tr>
                      <td className="p-4 font-black text-blue-800">합계</td>
                      <td className="p-4 text-center font-black text-blue-800">{formatCurrency(current.pt.total)}</td>
                      <td className="p-4 text-center font-black text-blue-700">{current.pt.count}건</td>
                      <td className="p-4 text-center font-black text-violet-700">{formatCurrency(compare.pt.total)}</td>
                      <td className="p-4 text-center font-black text-violet-600">{compare.pt.count}건</td>
                      <td className={cn("p-4 text-center font-black", current.pt.total - compare.pt.total >= 0 ? "text-emerald-600" : "text-rose-600")}>
                        {current.pt.total - compare.pt.total >= 0 ? "+" : ""}{formatCurrency(current.pt.total - compare.pt.total)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={cn(
                          "text-xs font-black px-2 py-1 rounded-lg",
                          getChangeIndicator(current.pt.total, compare.pt.total).bgColor,
                          getChangeIndicator(current.pt.total, compare.pt.total).color
                        )}>
                          {getChangePercent(current.pt.total, compare.pt.total)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* 직원별 탭 */}
          {activeTab === "staff" && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="p-4 text-center font-black text-slate-600 text-xs w-12">순위</th>
                      <th className="p-4 text-left font-black text-purple-700 text-xs">직원명</th>
                      <th className="p-4 text-center font-black text-amber-600 text-xs">당월 FC</th>
                      <th className="p-4 text-center font-black text-blue-600 text-xs">당월 PT</th>
                      <th className="p-4 text-center font-black text-slate-600 text-xs">당월 총매출</th>
                      <th className="p-4 text-center font-black text-violet-600 text-xs">{comparisonLabel} 총매출</th>
                      <th className="p-4 text-center font-black text-slate-600 text-xs">차이</th>
                      <th className="p-4 text-center font-black text-slate-600 text-xs">증감률</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {current.staffStats.map((staff, i) => {
                      const compareStaff = compare.staffStats.find(s => s.name === staff.name);
                      const compareTotal = compareStaff?.total || 0;
                      const difference = staff.total - compareTotal;
                      const renderMedal = (rank: number) => {
                        if (rank === 0) return <span className="text-xl">🥇</span>;
                        if (rank === 1) return <span className="text-xl">🥈</span>;
                        if (rank === 2) return <span className="text-xl">🥉</span>;
                        return <span className="text-sm font-black text-slate-500">{rank + 1}</span>;
                      };
                      return (
                        <tr key={staff.name} className="hover:bg-slate-50">
                          <td className="p-4 text-center">{renderMedal(i)}</td>
                          <td className="p-4 font-black text-slate-800">{staff.name}</td>
                          <td className="p-4 text-center">
                            <p className="font-bold text-amber-600">{formatCurrency(staff.fc.total)}</p>
                            <p className="text-[10px] text-slate-400">{staff.fc.totalCount}건</p>
                          </td>
                          <td className="p-4 text-center">
                            <p className="font-bold text-blue-600">{formatCurrency(staff.pt.total)}</p>
                            <p className="text-[10px] text-slate-400">{staff.pt.totalCount}건</p>
                          </td>
                          <td className="p-4 text-center font-black text-purple-700">{formatCurrency(staff.total)}</td>
                          <td className="p-4 text-center font-bold text-violet-600">{formatCurrency(compareTotal)}</td>
                          <td className={cn("p-4 text-center font-bold", difference >= 0 ? "text-emerald-600" : "text-rose-600")}>
                            {difference >= 0 ? "+" : ""}{formatCurrency(difference)}
                          </td>
                          <td className="p-4 text-center">
                            <span className={cn(
                              "text-xs font-black px-2 py-1 rounded-lg",
                              getChangeIndicator(staff.total, compareTotal).bgColor,
                              getChangeIndicator(staff.total, compareTotal).color
                            )}>
                              {getChangePercent(staff.total, compareTotal)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-purple-100">
                    <tr>
                      <td colSpan={2} className="p-4 font-black text-purple-800">합계</td>
                      <td className="p-4 text-center font-black text-amber-700">{formatCurrency(current.fc.total)}</td>
                      <td className="p-4 text-center font-black text-blue-700">{formatCurrency(current.pt.total)}</td>
                      <td className="p-4 text-center font-black text-purple-800">{formatCurrency(current.totalSales)}</td>
                      <td className="p-4 text-center font-black text-violet-700">{formatCurrency(compare.totalSales)}</td>
                      <td className={cn("p-4 text-center font-black", current.totalSales - compare.totalSales >= 0 ? "text-emerald-600" : "text-rose-600")}>
                        {current.totalSales - compare.totalSales >= 0 ? "+" : ""}{formatCurrency(current.totalSales - compare.totalSales)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={cn(
                          "text-xs font-black px-2 py-1 rounded-lg",
                          getChangeIndicator(current.totalSales, compare.totalSales).bgColor,
                          getChangeIndicator(current.totalSales, compare.totalSales).color
                        )}>
                          {getChangePercent(current.totalSales, compare.totalSales)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 pb-8 pt-4 border-t border-slate-100">
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-12 px-8 rounded-2xl font-black text-slate-600 border-slate-200 hover:bg-slate-50"
            >
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
