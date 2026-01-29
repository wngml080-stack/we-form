"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Users,
  LayoutGrid,
  Target,
  Coins,
  Receipt,
  PieChart,
  UserCheck,
  MessageSquare,
  RefreshCw,
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

interface Expense {
  id: string;
  amount: number;
  category: string;
  sub_category?: string;
  expense_date: string;
}

interface InquiryStats {
  today: number;
  week: number;
  month: number;
  pending: number;
  conversionRate: number;
}

interface RenewalMember {
  id: string;
  name: string;
  phone: string;
  membershipName: string;
  endDate: string;
  trainerName: string;
  status: 'pending' | 'contacted' | 'completed' | 'cancelled';
}

interface DetailedAnalysisProps {
  currentPayments: Payment[];
  previousPayments?: Payment[];
  lastYearPayments?: Payment[];
  currentExpenses?: Expense[];
  previousExpenses?: Expense[];
  selectedGymId?: string | null;
  selectedCompanyId?: string | null;
  isInitialized?: boolean;
}

export function DetailedAnalysis({
  currentPayments,
  previousPayments: _previousPayments = [],
  lastYearPayments: _lastYearPayments = [],
  currentExpenses = [],
  previousExpenses: _previousExpenses = [],
  selectedGymId,
  selectedCompanyId: _selectedCompanyId,
  isInitialized = true
}: DetailedAnalysisProps) {
  // 문의 통계 상태
  const [inquiryStats, setInquiryStats] = useState<InquiryStats>({
    today: 0,
    week: 0,
    month: 0,
    pending: 0,
    conversionRate: 0
  });
  const [byChannel, setByChannel] = useState<Record<string, number>>({});
  const [byStatus, setByStatus] = useState<Record<string, number>>({});
  const [inquiryLoading, setInquiryLoading] = useState(false);

  // 리뉴 대상자 상태 (추후 DB 연동 시 실제 데이터로 대체)
  const [renewalMembers] = useState<RenewalMember[]>([
    { id: "1", name: "김민수", phone: "010-1234-5678", membershipName: "헬스 3개월", endDate: "2026-01-20", trainerName: "이강사", status: "pending" },
    { id: "2", name: "이지연", phone: "010-9876-5432", membershipName: "PT 20회", endDate: "2026-01-15", trainerName: "박코치", status: "contacted" },
  ]);

  // 문의 통계 조회
  const fetchInquiryStats = useCallback(async () => {
    if (!selectedGymId || !isInitialized) return;

    setInquiryLoading(true);
    try {
      const response = await fetch(`/api/admin/inquiries/stats?gym_id=${selectedGymId}`);
      const data = await response.json();

      if (response.ok) {
        setInquiryStats(data.stats || { today: 0, week: 0, month: 0, pending: 0, conversionRate: 0 });
        setByChannel(data.byChannel || {});
        setByStatus(data.byStatus || {});
      }
    } catch (error) {
      console.error("Failed to fetch inquiry stats:", error);
    } finally {
      setInquiryLoading(false);
    }
  }, [selectedGymId, isInitialized]);

  useEffect(() => {
    fetchInquiryStats();
  }, [fetchInquiryStats]);

  // 리뉴 대상자 통계 계산
  const renewalStats = useMemo(() => {
    const total = renewalMembers.length;
    const pending = renewalMembers.filter(m => m.status === 'pending').length;
    const contacted = renewalMembers.filter(m => m.status === 'contacted').length;
    const completed = renewalMembers.filter(m => m.status === 'completed').length;
    const cancelled = renewalMembers.filter(m => m.status === 'cancelled').length;
    const conversionRate = total > 0 ? (completed / total) * 100 : 0;

    return { total, pending, contacted, completed, cancelled, conversionRate };
  }, [renewalMembers]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(Math.round(amount)) + "원";
  };


  // --- 데이터 가공 로직 ---
  const getStats = (payments: Payment[], expenses: Expense[]) => {
    const fc = payments.filter(p => p.membership_category === "회원권" || p.membership_category === "헬스");
    const pt = payments.filter(p => p.membership_category?.toUpperCase().includes("PT"));

    const calculateFcDetailed = (list: Payment[]) => {
      const newReg = list.filter(p => p.sale_type === "신규");
      const renewal = list.filter(p => p.sale_type === "재등록" || p.sale_type === "리뉴");
      const periodChange = list.filter(p => p.sale_type === "기간변경");
      const addon = list.filter(p => p.sale_type === "부가상품");
      const refund = list.filter(p => p.sale_type === "환불");

      const total = list.reduce((sum, p) => sum + p.amount, 0);
      const count = list.length;
      const avg = count > 0 ? total / count : 0;

      return { total, count, avg, categories: { newReg, renewal, periodChange, addon, refund } };
    };

    const calculatePtDetailed = (list: Payment[]) => {
      const newReg = list.filter(p => p.sale_type === "신규");
      const renewal = list.filter(p => p.sale_type === "재등록" || p.sale_type === "리뉴");
      const sessionChange = list.filter(p => p.sale_type === "세션변경");
      const transfer = list.filter(p => p.sale_type === "양도");
      const refund = list.filter(p => p.sale_type === "환불");

      const total = list.reduce((sum, p) => sum + p.amount, 0);
      const count = list.length;
      const avg = count > 0 ? total / count : 0;

      return { total, count, avg, categories: { newReg, renewal, sessionChange, transfer, refund } };
    };

    const calculate = (list: Payment[]) => {
      const total = list.reduce((sum, p) => sum + p.amount, 0);
      const count = list.length;
      const avg = count > 0 ? total / count : 0;
      const newReg = list.filter(p => p.sale_type === "신규");
      const renewal = list.filter(p => p.sale_type === "재등록" || p.sale_type === "리뉴");

      const periods = {
        "1개월": list.filter(p => p.membership_name?.includes("1개월")),
        "3개월": list.filter(p => p.membership_name?.includes("3개월")),
        "6개월": list.filter(p => p.membership_name?.includes("6개월")),
        "12개월": list.filter(p => p.membership_name?.includes("12개월")),
      };

      const sessions = {
        "10회": list.filter(p => p.membership_name?.includes("10회")),
        "20회": list.filter(p => p.membership_name?.includes("20회")),
        "30회": list.filter(p => p.membership_name?.includes("30회")),
        "50회": list.filter(p => p.membership_name?.includes("50회")),
      };

      return { total, count, avg, newReg, renewal, periods, sessions };
    };

    const fcDetailed = calculateFcDetailed(fc);
    const ptDetailed = calculatePtDetailed(pt);

    const expenseTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // 대분류별 색상 설정
    const categoryColors: Record<string, string> = {
      "운영비": "slate",
      "마케팅비": "purple",
      "인건비": "blue",
      "세금": "red",
      "지원금": "emerald",
      "예비비": "amber",
      "수익분배금": "violet",
    };

    // 대분류별로 계정과목(sub_category) 그룹핑
    const expenseStructure: Record<string, { color: string; items: Record<string, number> }> = {};

    expenses.forEach(e => {
      const category = e.category || "기타";
      const subCategory = e.sub_category || "미분류";

      if (!expenseStructure[category]) {
        expenseStructure[category] = {
          color: categoryColors[category] || "slate",
          items: {}
        };
      }

      if (!expenseStructure[category].items[subCategory]) {
        expenseStructure[category].items[subCategory] = 0;
      }

      expenseStructure[category].items[subCategory] += e.amount || 0;
    });

    // 대분류별 합계 계산
    const expenseByCategory = Object.fromEntries(
      Object.entries(expenseStructure).map(([cat, data]) => [
        cat,
        Object.values(data.items).reduce((sum, amount) => sum + amount, 0)
      ])
    ) as Record<string, number>;

    const taxStats = {
      vat: (payments.reduce((sum, p) => sum + p.amount, 0) / 1.1) * 0.1,
      withholding: expenseByCategory["인건비"] * 0.033,
      incomeTax: (payments.reduce((sum, p) => sum + p.amount, 0) - expenseTotal) * 0.1,
    };

    const staffGroups: Record<string, {
      fc: { newReg: number; newRegCount: number; renewal: number; renewalCount: number; periodChange: number; periodChangeCount: number; addon: number; addonCount: number; total: number; totalCount: number };
      pt: { newReg: number; newRegCount: number; renewal: number; renewalCount: number; sessionChange: number; sessionChangeCount: number; transfer: number; transferCount: number; total: number; totalCount: number };
      total: number;
    }> = {};
    payments.forEach(p => {
      const name = p.registrar || "미지정";
      if (!staffGroups[name]) staffGroups[name] = {
        fc: { newReg: 0, newRegCount: 0, renewal: 0, renewalCount: 0, periodChange: 0, periodChangeCount: 0, addon: 0, addonCount: 0, total: 0, totalCount: 0 },
        pt: { newReg: 0, newRegCount: 0, renewal: 0, renewalCount: 0, sessionChange: 0, sessionChangeCount: 0, transfer: 0, transferCount: 0, total: 0, totalCount: 0 },
        total: 0
      };
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

    const staffStats = Object.entries(staffGroups)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);

    return {
      fc: calculate(fc),
      pt: calculate(pt),
      fcDetailed,
      ptDetailed,
      staffStats,
      expenseTotal,
      expenseByCategory,
      expenseStructure,
      taxStats,
      totalSales: payments.reduce((sum, p) => sum + p.amount, 0)
    };
  };

  const current = useMemo(() => getStats(currentPayments, currentExpenses), [currentPayments, currentExpenses]);

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* 1. 최상단 요약 대시보드 - 더 세련된 카드 디자인 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 총 매출 카드 (어두운 테마) */}
        <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group border border-slate-800">
          <div className="absolute -right-6 -top-6 opacity-10 group-hover:scale-110 transition-transform duration-1000">
            <TrendingUp size={160} />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Monthly Revenue</p>
                <h3 className="text-xl font-heading font-black !text-white">총 매출 합계</h3>
              </div>
            </div>
            <div>
              <p className="text-3xl font-heading font-black text-white tracking-tight">{formatCurrency(current.totalSales)}</p>
              <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {currentPayments.length}건의 매출 기록
              </p>
            </div>
          </div>
        </div>

        {/* 총 지출 카드 */}
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-500">
          <div className="absolute -right-6 -top-6 opacity-5 group-hover:scale-110 transition-transform duration-1000 text-rose-600">
            <TrendingDown size={160} />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-100">
                <Receipt className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Monthly Expenses</p>
                <h3 className="text-xl font-heading font-black text-slate-900">총 지출 합계</h3>
              </div>
            </div>
            <div>
              <p className="text-3xl font-heading font-black text-rose-600 tracking-tight">{formatCurrency(current.expenseTotal)}</p>
              <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {currentExpenses.length}건의 지출 기록
              </p>
            </div>
          </div>
        </div>

        {/* 예상 이익 카드 */}
        <div className="bg-emerald-50 rounded-[32px] p-8 border border-emerald-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-500">
          <div className="absolute -right-6 -top-6 opacity-10 group-hover:scale-110 transition-transform duration-1000 text-emerald-600">
            <Target size={160} />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <LayoutGrid className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-[0.2em]">Monthly Net Profit</p>
                <h3 className="text-xl font-heading font-black text-emerald-900">예상 영업 이익</h3>
              </div>
            </div>
            <div>
              <p className="text-3xl font-heading font-black text-emerald-600 tracking-tight">
                {formatCurrency(current.totalSales - current.expenseTotal)}
              </p>
              <div className="mt-2 text-[10px] text-emerald-600/60 font-black uppercase tracking-wider">
                최종 정산 추정치 (세전 기준)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FC (회원권) 성과 섹션 */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden p-8 space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-heading font-black text-slate-900">FC 매출 세부 성과</h3>
            <p className="text-xs font-bold text-slate-400">신규/리뉴 등록 및 이용권 기간별 분석</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="overflow-hidden rounded-3xl border border-slate-100 lg:col-span-8">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="w-[12%] p-4 text-center font-black text-slate-500 uppercase text-[10px] tracking-widest">항목 구분</th>
                  <th className="p-4 text-center font-black text-slate-500 uppercase text-[10px] tracking-widest">신규</th>
                  <th className="p-4 text-center font-black text-slate-500 uppercase text-[10px] tracking-widest">리뉴</th>
                  <th className="p-4 text-center font-black text-slate-500 uppercase text-[10px] tracking-widest">기간변경</th>
                  <th className="p-4 text-center font-black text-slate-500 uppercase text-[10px] tracking-widest">부가상품</th>
                  <th className="p-4 text-center font-black text-slate-500 uppercase text-[10px] tracking-widest">환불</th>
                  <th className="p-4 text-center font-black text-amber-600 bg-amber-50/50 uppercase text-[10px] tracking-widest">합계</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-4 text-center font-black text-slate-700 bg-slate-50/30">FC 매출</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{formatCurrency(current.fcDetailed.categories.newReg.reduce((s,p)=>s+p.amount,0))}</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{formatCurrency(current.fcDetailed.categories.renewal.reduce((s,p)=>s+p.amount,0))}</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{formatCurrency(current.fcDetailed.categories.periodChange.reduce((s,p)=>s+p.amount,0))}</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{formatCurrency(current.fcDetailed.categories.addon.reduce((s,p)=>s+p.amount,0))}</td>
                  <td className="p-4 text-center font-heading font-bold text-rose-500">{current.fcDetailed.categories.refund.reduce((s,p)=>s+p.amount,0) > 0 ? "-" : ""}{formatCurrency(current.fcDetailed.categories.refund.reduce((s,p)=>s+p.amount,0))}</td>
                  <td className="p-4 text-center font-heading font-black text-amber-600 bg-amber-50/30">{formatCurrency(current.fcDetailed.total)}</td>
                </tr>
                <tr className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-4 text-center font-black text-slate-700 bg-slate-50/30">등록건수</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{current.fcDetailed.categories.newReg.length}건</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{current.fcDetailed.categories.renewal.length}건</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{current.fcDetailed.categories.periodChange.length}건</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{current.fcDetailed.categories.addon.length}건</td>
                  <td className="p-4 text-center font-heading font-bold text-rose-500">{current.fcDetailed.categories.refund.length > 0 ? "-" : ""}{current.fcDetailed.categories.refund.length}건</td>
                  <td className="p-4 text-center font-heading font-black text-amber-600 bg-amber-50/30">{current.fcDetailed.count}건</td>
                </tr>
                <tr className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-4 text-center font-black text-slate-700 bg-slate-50/30">객단가</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{current.fcDetailed.categories.newReg.length > 0 ? formatCurrency(current.fcDetailed.categories.newReg.reduce((s,p)=>s+p.amount,0) / current.fcDetailed.categories.newReg.length) : "-"}</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{current.fcDetailed.categories.renewal.length > 0 ? formatCurrency(current.fcDetailed.categories.renewal.reduce((s,p)=>s+p.amount,0) / current.fcDetailed.categories.renewal.length) : "-"}</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{current.fcDetailed.categories.periodChange.length > 0 ? formatCurrency(current.fcDetailed.categories.periodChange.reduce((s,p)=>s+p.amount,0) / current.fcDetailed.categories.periodChange.length) : "-"}</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{current.fcDetailed.categories.addon.length > 0 ? formatCurrency(current.fcDetailed.categories.addon.reduce((s,p)=>s+p.amount,0) / current.fcDetailed.categories.addon.length) : "-"}</td>
                  <td className="p-4 text-center font-heading font-bold text-rose-500">{current.fcDetailed.categories.refund.length > 0 ? "-" + formatCurrency(current.fcDetailed.categories.refund.reduce((s,p)=>s+p.amount,0) / current.fcDetailed.categories.refund.length) : "-"}</td>
                  <td className="p-4 text-center font-heading font-black text-amber-600 bg-amber-50/30">{current.fcDetailed.count > 0 ? formatCurrency(current.fcDetailed.total / current.fcDetailed.count) : "-"}</td>
                </tr>
                <tr className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-4 text-center font-black text-slate-700 bg-slate-50/30">비중%</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-500">{current.fcDetailed.total > 0 ? ((current.fcDetailed.categories.newReg.reduce((s,p)=>s+p.amount,0) / current.fcDetailed.total) * 100).toFixed(1) : 0}%</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-500">{current.fcDetailed.total > 0 ? ((current.fcDetailed.categories.renewal.reduce((s,p)=>s+p.amount,0) / current.fcDetailed.total) * 100).toFixed(1) : 0}%</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-500">{current.fcDetailed.total > 0 ? ((current.fcDetailed.categories.periodChange.reduce((s,p)=>s+p.amount,0) / current.fcDetailed.total) * 100).toFixed(1) : 0}%</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-500">{current.fcDetailed.total > 0 ? ((current.fcDetailed.categories.addon.reduce((s,p)=>s+p.amount,0) / current.fcDetailed.total) * 100).toFixed(1) : 0}%</td>
                  <td className="p-4 text-center font-heading font-bold text-rose-500">{current.fcDetailed.total > 0 && current.fcDetailed.categories.refund.reduce((s,p)=>s+p.amount,0) > 0 ? "-" : ""}{current.fcDetailed.total > 0 ? ((current.fcDetailed.categories.refund.reduce((s,p)=>s+p.amount,0) / current.fcDetailed.total) * 100).toFixed(1) : 0}%</td>
                  <td className="p-4 text-center font-heading font-black text-amber-600 bg-amber-50/30">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="lg:col-span-4 space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Period Analysis</h4>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(current.fc.periods).map(([period, items]) => {
                  const amount = (items as Payment[]).reduce((s, p) => s + p.amount, 0);
                  const count = (items as Payment[]).length;
                  return (
                    <div key={period} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition-colors">
                      <p className="text-[10px] font-black text-slate-400 mb-1">{period}</p>
                      <p className="text-sm font-heading font-black text-slate-900">{count}건</p>
                      <p className="text-[10px] font-heading font-bold text-amber-600">{formatCurrency(amount)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
        </div>
      </div>

      {/* 3. PT (수업) 성과 섹션 */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden p-8 space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-heading font-black text-slate-900">PT 매출 세부 성과</h3>
            <p className="text-xs font-bold text-slate-400">신규/리뉴 등록 및 세션별 분석</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="overflow-hidden rounded-3xl border border-slate-100 lg:col-span-8">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="w-[12%] p-4 text-center font-black text-slate-500 uppercase text-[10px] tracking-widest">항목 구분</th>
                  <th className="p-4 text-center font-black text-slate-500 uppercase text-[10px] tracking-widest">신규</th>
                  <th className="p-4 text-center font-black text-slate-500 uppercase text-[10px] tracking-widest">리뉴</th>
                  <th className="p-4 text-center font-black text-slate-500 uppercase text-[10px] tracking-widest">세션변경</th>
                  <th className="p-4 text-center font-black text-slate-500 uppercase text-[10px] tracking-widest">양도</th>
                  <th className="p-4 text-center font-black text-slate-500 uppercase text-[10px] tracking-widest">환불</th>
                  <th className="p-4 text-center font-black text-blue-600 bg-blue-50/50 uppercase text-[10px] tracking-widest">합계</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-4 text-center font-black text-slate-700 bg-slate-50/30">PT 매출</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{formatCurrency(current.ptDetailed.categories.newReg.reduce((s,p)=>s+p.amount,0))}</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{formatCurrency(current.ptDetailed.categories.renewal.reduce((s,p)=>s+p.amount,0))}</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{formatCurrency(current.ptDetailed.categories.sessionChange.reduce((s,p)=>s+p.amount,0))}</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{formatCurrency(current.ptDetailed.categories.transfer.reduce((s,p)=>s+p.amount,0))}</td>
                  <td className="p-4 text-center font-heading font-bold text-rose-500">{current.ptDetailed.categories.refund.reduce((s,p)=>s+p.amount,0) > 0 ? "-" : ""}{formatCurrency(current.ptDetailed.categories.refund.reduce((s,p)=>s+p.amount,0))}</td>
                  <td className="p-4 text-center font-heading font-black text-blue-600 bg-blue-50/30">{formatCurrency(current.ptDetailed.total)}</td>
                </tr>
                <tr className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-4 text-center font-black text-slate-700 bg-slate-50/30">등록건수</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{current.ptDetailed.categories.newReg.length}건</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{current.ptDetailed.categories.renewal.length}건</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{current.ptDetailed.categories.sessionChange.length}건</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{current.ptDetailed.categories.transfer.length}건</td>
                  <td className="p-4 text-center font-heading font-bold text-rose-500">{current.ptDetailed.categories.refund.length > 0 ? "-" : ""}{current.ptDetailed.categories.refund.length}건</td>
                  <td className="p-4 text-center font-heading font-black text-blue-600 bg-blue-50/30">{current.ptDetailed.count}건</td>
                </tr>
                <tr className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-4 text-center font-black text-slate-700 bg-slate-50/30">객단가</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{current.ptDetailed.categories.newReg.length > 0 ? formatCurrency(current.ptDetailed.categories.newReg.reduce((s,p)=>s+p.amount,0) / current.ptDetailed.categories.newReg.length) : "-"}</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{current.ptDetailed.categories.renewal.length > 0 ? formatCurrency(current.ptDetailed.categories.renewal.reduce((s,p)=>s+p.amount,0) / current.ptDetailed.categories.renewal.length) : "-"}</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{current.ptDetailed.categories.sessionChange.length > 0 ? formatCurrency(current.ptDetailed.categories.sessionChange.reduce((s,p)=>s+p.amount,0) / current.ptDetailed.categories.sessionChange.length) : "-"}</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-800">{current.ptDetailed.categories.transfer.length > 0 ? formatCurrency(current.ptDetailed.categories.transfer.reduce((s,p)=>s+p.amount,0) / current.ptDetailed.categories.transfer.length) : "-"}</td>
                  <td className="p-4 text-center font-heading font-bold text-rose-500">{current.ptDetailed.categories.refund.length > 0 ? "-" + formatCurrency(current.ptDetailed.categories.refund.reduce((s,p)=>s+p.amount,0) / current.ptDetailed.categories.refund.length) : "-"}</td>
                  <td className="p-4 text-center font-heading font-black text-blue-600 bg-blue-50/30">{current.ptDetailed.count > 0 ? formatCurrency(current.ptDetailed.total / current.ptDetailed.count) : "-"}</td>
                </tr>
                <tr className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-4 text-center font-black text-slate-700 bg-slate-50/30">비중%</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-500">{current.ptDetailed.total > 0 ? ((current.ptDetailed.categories.newReg.reduce((s,p)=>s+p.amount,0) / current.ptDetailed.total) * 100).toFixed(1) : 0}%</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-500">{current.ptDetailed.total > 0 ? ((current.ptDetailed.categories.renewal.reduce((s,p)=>s+p.amount,0) / current.ptDetailed.total) * 100).toFixed(1) : 0}%</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-500">{current.ptDetailed.total > 0 ? ((current.ptDetailed.categories.sessionChange.reduce((s,p)=>s+p.amount,0) / current.ptDetailed.total) * 100).toFixed(1) : 0}%</td>
                  <td className="p-4 text-center font-heading font-bold text-slate-500">{current.ptDetailed.total > 0 ? ((current.ptDetailed.categories.transfer.reduce((s,p)=>s+p.amount,0) / current.ptDetailed.total) * 100).toFixed(1) : 0}%</td>
                  <td className="p-4 text-center font-heading font-bold text-rose-500">{current.ptDetailed.total > 0 && current.ptDetailed.categories.refund.reduce((s,p)=>s+p.amount,0) > 0 ? "-" : ""}{current.ptDetailed.total > 0 ? ((current.ptDetailed.categories.refund.reduce((s,p)=>s+p.amount,0) / current.ptDetailed.total) * 100).toFixed(1) : 0}%</td>
                  <td className="p-4 text-center font-heading font-black text-blue-600 bg-blue-50/30">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Session Analysis</h4>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(current.pt.sessions).map(([session, items]) => {
                const amount = (items as Payment[]).reduce((s, p) => s + p.amount, 0);
                const count = (items as Payment[]).length;
                return (
                  <div key={session} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                    <p className="text-[10px] font-black text-slate-400 mb-1">{session}</p>
                    <p className="text-sm font-heading font-black text-slate-900">{count}건</p>
                    <p className="text-[10px] font-heading font-bold text-blue-600">{formatCurrency(amount)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. 직원별 매출 기여도 - FC / PT 분리 */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden p-8 space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
            <UserCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-heading font-black text-slate-900">직원별 매출 기여도</h3>
            <p className="text-xs font-bold text-slate-400">FC 매출 / PT 매출 상세 내역</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-sm">
          <table className="w-full text-sm table-fixed min-w-[1200px]">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-200">
                <th rowSpan={2} className="w-[5%] p-4 text-center font-black text-slate-600 text-xs border-r border-slate-200">순위</th>
                <th rowSpan={2} className="w-[8%] p-4 text-center font-black text-slate-600 text-xs border-r border-slate-200">직원명</th>
                <th colSpan={5} className="p-3 text-center font-black text-amber-700 bg-amber-100/80 text-xs border-r border-slate-200">FC 매출</th>
                <th colSpan={5} className="p-3 text-center font-black text-blue-700 bg-blue-100/80 text-xs border-r border-slate-200">PT 매출</th>
                <th rowSpan={2} className="w-[10%] p-4 text-center font-black text-purple-700 bg-purple-100/80 text-xs border-r border-slate-200">총 매출</th>
                <th rowSpan={2} className="w-[7%] p-4 text-center font-black text-slate-600 text-xs">기여율</th>
              </tr>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="w-[7%] p-2 text-center font-bold text-amber-600 text-[10px]">신규</th>
                <th className="w-[7%] p-2 text-center font-bold text-amber-600 text-[10px]">리뉴</th>
                <th className="w-[7%] p-2 text-center font-bold text-amber-600 text-[10px]">기간변경</th>
                <th className="w-[7%] p-2 text-center font-bold text-amber-600 text-[10px]">부가상품</th>
                <th className="w-[7%] p-2 text-center font-black text-amber-700 text-[10px] bg-amber-50 border-r border-slate-200">소계</th>
                <th className="w-[7%] p-2 text-center font-bold text-blue-600 text-[10px]">신규</th>
                <th className="w-[7%] p-2 text-center font-bold text-blue-600 text-[10px]">리뉴</th>
                <th className="w-[7%] p-2 text-center font-bold text-blue-600 text-[10px]">세션변경</th>
                <th className="w-[7%] p-2 text-center font-bold text-blue-600 text-[10px]">양도</th>
                <th className="w-[7%] p-2 text-center font-black text-blue-700 text-[10px] bg-blue-50 border-r border-slate-200">소계</th>
              </tr>
            </thead>
            <tbody>
              {current.staffStats.map((staff, i) => {
                const share = current.totalSales > 0 ? (staff.total / current.totalSales) * 100 : 0;
                const renderMedal = (rank: number) => {
                  if (rank === 0) return <span className="text-2xl">🥇</span>;
                  if (rank === 1) return <span className="text-2xl">🥈</span>;
                  if (rank === 2) return <span className="text-2xl">🥉</span>;
                  return <span className="text-sm font-black text-slate-500">{rank + 1}</span>;
                };
                const isEven = i % 2 === 0;
                return (
                  <tr key={staff.name} className={cn(
                    "hover:bg-blue-50/50 transition-colors border-b border-slate-100",
                    isEven ? "bg-white" : "bg-slate-50/30"
                  )}>
                    <td className="p-4 text-center border-r border-slate-100">
                      <div className="flex items-center justify-center">
                        {renderMedal(i)}
                      </div>
                    </td>
                    <td className="p-4 text-center font-black text-slate-800 text-sm border-r border-slate-100">{staff.name}</td>
                    <td className="p-3 text-center">
                      <p className="text-sm font-bold text-slate-700">{formatCurrency(staff.fc.newReg)}</p>
                      <p className="text-[10px] font-medium text-slate-500">{staff.fc.newRegCount}건</p>
                    </td>
                    <td className="p-3 text-center">
                      <p className="text-sm font-bold text-slate-700">{formatCurrency(staff.fc.renewal)}</p>
                      <p className="text-[10px] font-medium text-slate-500">{staff.fc.renewalCount}건</p>
                    </td>
                    <td className="p-3 text-center">
                      <p className="text-sm font-bold text-slate-700">{formatCurrency(staff.fc.periodChange)}</p>
                      <p className="text-[10px] font-medium text-slate-500">{staff.fc.periodChangeCount}건</p>
                    </td>
                    <td className="p-3 text-center">
                      <p className="text-sm font-bold text-slate-700">{formatCurrency(staff.fc.addon)}</p>
                      <p className="text-[10px] font-medium text-slate-500">{staff.fc.addonCount}건</p>
                    </td>
                    <td className="p-3 text-center bg-amber-50/50 border-r border-slate-100">
                      <p className="text-sm font-black text-amber-700">{formatCurrency(staff.fc.total)}</p>
                      <p className="text-[10px] font-medium text-amber-600">{staff.fc.totalCount}건</p>
                    </td>
                    <td className="p-3 text-center">
                      <p className="text-sm font-bold text-slate-700">{formatCurrency(staff.pt.newReg)}</p>
                      <p className="text-[10px] font-medium text-slate-500">{staff.pt.newRegCount}건</p>
                    </td>
                    <td className="p-3 text-center">
                      <p className="text-sm font-bold text-slate-700">{formatCurrency(staff.pt.renewal)}</p>
                      <p className="text-[10px] font-medium text-slate-500">{staff.pt.renewalCount}건</p>
                    </td>
                    <td className="p-3 text-center">
                      <p className="text-sm font-bold text-slate-700">{formatCurrency(staff.pt.sessionChange)}</p>
                      <p className="text-[10px] font-medium text-slate-500">{staff.pt.sessionChangeCount}건</p>
                    </td>
                    <td className="p-3 text-center">
                      <p className="text-sm font-bold text-slate-700">{formatCurrency(staff.pt.transfer)}</p>
                      <p className="text-[10px] font-medium text-slate-500">{staff.pt.transferCount}건</p>
                    </td>
                    <td className="p-3 text-center bg-blue-50/50 border-r border-slate-100">
                      <p className="text-sm font-black text-blue-700">{formatCurrency(staff.pt.total)}</p>
                      <p className="text-[10px] font-medium text-blue-600">{staff.pt.totalCount}건</p>
                    </td>
                    <td className="p-4 text-center bg-purple-50/50 border-r border-slate-100">
                      <p className="text-base font-black text-purple-700">{formatCurrency(staff.total)}</p>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="text-sm font-black text-slate-800">{share.toFixed(1)}%</span>
                        <div className="w-14 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
                            style={{ width: `${Math.min(share, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gradient-to-r from-slate-100 to-slate-50 border-t-2 border-slate-300">
              <tr>
                <td colSpan={2} className="p-4 text-center font-black text-slate-800 text-sm border-r border-slate-200">합계</td>
                <td className="p-3 text-center text-sm font-bold text-slate-700">{formatCurrency(current.fcDetailed.categories.newReg.reduce((s,p)=>s+p.amount,0))}</td>
                <td className="p-3 text-center text-sm font-bold text-slate-700">{formatCurrency(current.fcDetailed.categories.renewal.reduce((s,p)=>s+p.amount,0))}</td>
                <td className="p-3 text-center text-sm font-bold text-slate-700">{formatCurrency(current.fcDetailed.categories.periodChange.reduce((s,p)=>s+p.amount,0))}</td>
                <td className="p-3 text-center text-sm font-bold text-slate-700">{formatCurrency(current.fcDetailed.categories.addon.reduce((s,p)=>s+p.amount,0))}</td>
                <td className="p-3 text-center text-sm font-black text-amber-700 bg-amber-50 border-r border-slate-200">{formatCurrency(current.fc.total)}</td>
                <td className="p-3 text-center text-sm font-bold text-slate-700">{formatCurrency(current.ptDetailed.categories.newReg.reduce((s,p)=>s+p.amount,0))}</td>
                <td className="p-3 text-center text-sm font-bold text-slate-700">{formatCurrency(current.ptDetailed.categories.renewal.reduce((s,p)=>s+p.amount,0))}</td>
                <td className="p-3 text-center text-sm font-bold text-slate-700">{formatCurrency(current.ptDetailed.categories.sessionChange.reduce((s,p)=>s+p.amount,0))}</td>
                <td className="p-3 text-center text-sm font-bold text-slate-700">{formatCurrency(current.ptDetailed.categories.transfer.reduce((s,p)=>s+p.amount,0))}</td>
                <td className="p-3 text-center text-sm font-black text-blue-700 bg-blue-50 border-r border-slate-200">{formatCurrency(current.pt.total)}</td>
                <td className="p-4 text-center text-base font-black text-purple-700 bg-purple-50 border-r border-slate-200">{formatCurrency(current.totalSales)}</td>
                <td className="p-4 text-center font-black text-slate-800 text-sm">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* 5. 당월 활동 분석 - 신규/리뉴 통합 */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-black text-slate-900">당월 활동 분석</h3>
              <p className="text-[10px] font-bold text-slate-400">신규 등록 & 문의현황 / 리뉴 확보 현황</p>
            </div>
            {inquiryLoading && (
              <RefreshCw className="w-4 h-4 text-slate-400 animate-spin ml-auto" />
            )}
          </div>

          {/* 신규 등록 & 문의현황 */}
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
              <span className="text-sm font-black text-blue-700">신규 등록 & 문의현황</span>
            </div>

            {/* 주요 지표 카드 */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-3 rounded-xl bg-white border border-blue-100 text-center">
                <p className="text-[9px] font-bold text-slate-400 mb-1">신규등록</p>
                <p className="text-xl font-black text-blue-600">{current.fc.newReg.length + current.pt.newReg.length}<span className="text-xs font-bold text-slate-400">명</span></p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-blue-100 text-center">
                <p className="text-[9px] font-bold text-slate-400 mb-1">문의건수</p>
                <p className="text-xl font-black text-blue-600">{inquiryStats.month}<span className="text-xs font-bold text-slate-400">건</span></p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-blue-100 text-center">
                <p className="text-[9px] font-bold text-slate-400 mb-1">문의→등록</p>
                <p className="text-xl font-black text-emerald-600">{Math.round(inquiryStats.month * inquiryStats.conversionRate / 100)}<span className="text-xs font-bold text-slate-400">건</span></p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-blue-100 text-center">
                <p className="text-[9px] font-bold text-slate-400 mb-1">이전문의→등록</p>
                <p className="text-xl font-black text-purple-600">-<span className="text-xs font-bold text-slate-400">건</span></p>
              </div>
            </div>

            {/* 예약 및 문의후 미등록 */}
            <div className="flex items-center justify-between px-2 py-2 bg-rose-50 rounded-xl border border-rose-100">
              <span className="text-xs font-bold text-rose-600">예약 및 문의후 미등록</span>
              <span className="text-sm font-black text-rose-600">
                {inquiryStats.pending}명
                <span className="text-[10px] font-bold text-rose-400 ml-1">
                  ({inquiryStats.month > 0 ? ((inquiryStats.pending / inquiryStats.month) * 100).toFixed(0) : 0}%)
                </span>
              </span>
            </div>

            {/* 채널별 문의건수 & 마케팅 유입 */}
            <div className="space-y-2 pt-2 border-t border-blue-100">
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-black text-slate-500 whitespace-nowrap min-w-[100px]">채널별 문의건수</span>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(byChannel).length > 0 ? (
                    Object.entries(byChannel).map(([channel, count]) => (
                      <span key={channel} className="text-[10px] font-bold text-blue-600 bg-white px-2 py-0.5 rounded-lg border border-blue-200">
                        {channel === 'kakao' ? '카카오' : channel === 'phone' ? '전화' : channel === 'walk_in' ? '방문' : channel === 'instagram' ? '인스타' : channel === 'naver' ? '네이버' : channel === 'other' ? '기타' : channel}{count}건
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400">데이터 없음</span>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-black text-slate-500 whitespace-nowrap min-w-[100px]">마케팅 유입건수</span>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] font-bold text-purple-600 bg-white px-2 py-0.5 rounded-lg border border-purple-200">카카오 -명</span>
                  <span className="text-[10px] font-bold text-purple-600 bg-white px-2 py-0.5 rounded-lg border border-purple-200">블로그 -명</span>
                </div>
              </div>
            </div>
          </div>

          {/* 리뉴 확보 현황 */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                <span className="text-sm font-black text-emerald-700">리뉴 확보 현황</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400">만기자 총 인원: </span>
                <span className="text-sm font-black text-emerald-600">{renewalStats.total}명</span>
              </div>
            </div>

            {/* 퍼널 프로그레스 */}
            <div className="grid grid-cols-4 gap-2">
              {/* 담당만기자 */}
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-white border-2 border-slate-200 text-center min-h-[80px] flex flex-col justify-center">
                  <p className="text-[9px] font-bold text-slate-400 mb-1">담당만기자</p>
                  <p className="text-xl font-black text-slate-700">{renewalStats.total}<span className="text-xs font-bold text-slate-400">명</span></p>
                  <div className="flex justify-center gap-1 mt-1">
                    <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">미연락</span>
                    <span className="text-[8px] font-bold text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded">예약</span>
                  </div>
                </div>
                <p className="text-center text-[10px] font-black text-emerald-600">전환율 {renewalStats.total > 0 ? ((renewalStats.contacted / renewalStats.total) * 100).toFixed(0) : 0}%</p>
              </div>

              {/* 약속 만기자 */}
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-white border-2 border-blue-200 text-center min-h-[80px] flex flex-col justify-center">
                  <p className="text-[9px] font-bold text-blue-400 mb-1">약속 만기자</p>
                  <p className="text-xl font-black text-blue-600">{renewalStats.contacted}<span className="text-xs font-bold text-slate-400">명</span></p>
                </div>
                <p className="text-center text-[10px] font-black text-emerald-600">전환율 {renewalStats.contacted > 0 ? ((renewalStats.completed / renewalStats.contacted) * 100).toFixed(0) : 0}%</p>
              </div>

              {/* 약속이외 만기자 */}
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-white border-2 border-amber-200 text-center min-h-[80px] flex flex-col justify-center">
                  <p className="text-[9px] font-bold text-amber-500 mb-1">약속이외 만기자</p>
                  <p className="text-xl font-black text-amber-600">{renewalStats.pending}<span className="text-xs font-bold text-slate-400">명</span></p>
                </div>
                <p className="text-center text-[10px] font-black text-emerald-600">전환율 0%</p>
              </div>

              {/* 만료자 */}
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-white border-2 border-rose-200 text-center min-h-[80px] flex flex-col justify-center">
                  <p className="text-[9px] font-bold text-rose-400 mb-1">만료자</p>
                  <p className="text-xl font-black text-rose-600">{renewalStats.cancelled}<span className="text-xs font-bold text-slate-400">명</span></p>
                </div>
                <p className="text-center text-[10px] font-black text-slate-400">X</p>
              </div>
            </div>
          </div>

          {/* 하단 요약 */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 rounded-2xl">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400">총 등록건수: </span>
                <span className="text-sm font-black text-white">{current.fcDetailed.count + current.ptDetailed.count}건</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400">총매출: </span>
                <span className="text-sm font-black text-emerald-400">{formatCurrency(current.totalSales)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400">객단가: </span>
                <span className="text-sm font-black text-blue-400">
                  {(current.fcDetailed.count + current.ptDetailed.count) > 0
                    ? formatCurrency(current.totalSales / (current.fcDetailed.count + current.ptDetailed.count))
                    : "0원"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. 지출 및 세무 요약 - 대분류 / 계정과목 구조 */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-600/20">
              <PieChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-black text-slate-900">지출 구조</h3>
              <p className="text-[10px] font-bold text-slate-400">대분류 / 계정과목별 분석</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase">Total</p>
              <p className="text-lg font-heading font-black text-rose-600">{formatCurrency(current.expenseTotal)}</p>
            </div>
          </div>

          {/* 대분류별 컴팩트 리스트 */}
          <div className="space-y-2">
            {Object.entries(current.expenseStructure).map(([category, data]) => {
              const categoryTotal = Object.values(data.items).reduce((sum, amount) => sum + amount, 0);
              const categoryShare = current.expenseTotal > 0 ? (categoryTotal / current.expenseTotal) * 100 : 0;
              const items = Object.entries(data.items).filter(([_, amount]) => amount > 0);
              const colorClasses: Record<string, { bg: string; text: string; dot: string }> = {
                blue: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
                rose: { bg: "bg-rose-100", text: "text-rose-700", dot: "bg-rose-500" },
                purple: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
                amber: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
                slate: { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-500" },
                red: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
                emerald: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
                violet: { bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500" },
              };
              const colors = colorClasses[data.color] || colorClasses.slate;

              if (categoryTotal === 0) return null;

              return (
                <div key={category} className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2.5 h-2.5 rounded-full", colors.dot)} />
                      <span className={cn("text-xs font-black", colors.text)}>{category}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-800">{formatCurrency(categoryTotal)}</span>
                      <span className="text-[10px] font-bold text-slate-400 ml-1">({categoryShare.toFixed(1)}%)</span>
                    </div>
                  </div>
                  {items.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {items.slice(0, 4).map(([item, amount]) => (
                        <span key={item} className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item}: {formatCurrency(amount)}
                        </span>
                      ))}
                      {items.length > 4 && (
                        <span className="text-[10px] font-medium text-slate-400">+{items.length - 4}개</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 세무 추정 컴팩트 */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-slate-900 text-center">
              <p className="text-[9px] font-bold text-slate-400 mb-0.5">부가세</p>
              <p className="text-sm font-black text-white">{formatCurrency(current.taxStats.vat)}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center">
              <p className="text-[9px] font-bold text-blue-400 mb-0.5">원천징수</p>
              <p className="text-sm font-black text-blue-600">{formatCurrency(current.taxStats.withholding)}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
              <p className="text-[9px] font-bold text-emerald-400 mb-0.5">순이익</p>
              <p className="text-sm font-black text-emerald-600">{formatCurrency(current.totalSales - current.expenseTotal)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
