"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CreditCard, 
  LayoutGrid,
  BarChart3,
  ArrowRight,
  Target,
  Coins,
  Receipt,
  PieChart,
  CalendarDays,
  UserCheck
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
  expense_date: string;
}

interface DetailedAnalysisProps {
  currentPayments: Payment[];
  previousPayments?: Payment[];
  lastYearPayments?: Payment[];
  currentExpenses?: Expense[];
  previousExpenses?: Expense[];
}

export function DetailedAnalysis({ 
  currentPayments, 
  previousPayments = [], 
  lastYearPayments = [],
  currentExpenses = [],
  previousExpenses = []
}: DetailedAnalysisProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(Math.round(amount)) + "원";
  };

  const formatPercent = (current: number, compare: number) => {
    if (!compare || compare === 0) return <span className="text-slate-400 font-bold">-</span>;
    const value = ((current - compare) / compare) * 100;
    const isPositive = value >= 0;
    return (
      <span className={cn(
        "font-black font-heading text-[10px]",
        isPositive ? "text-emerald-500" : "text-rose-500"
      )}>
        {isPositive ? "▲" : "▼"} {Math.abs(value).toFixed(1)}%
      </span>
    );
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
    const expenseByCategory = {
      "임대료/관리비": expenses.filter(e => e.category?.includes("임대") || e.category?.includes("관리")).reduce((s, e) => s + e.amount, 0),
      "인건비": expenses.filter(e => e.category?.includes("인건") || e.category?.includes("급여")).reduce((s, e) => s + e.amount, 0),
      "마케팅": expenses.filter(e => e.category?.includes("마케팅") || e.category?.includes("광고")).reduce((s, e) => s + e.amount, 0),
      "운영비": expenses.filter(e => e.category?.includes("운영") || e.category?.includes("소모품")).reduce((s, e) => s + e.amount, 0),
      "기타": expenses.filter(e => !["임대", "관리", "인건", "급여", "마케팅", "광고", "운영", "소모품"].some(k => e.category?.includes(k))).reduce((s, e) => s + e.amount, 0),
    };

    const taxStats = {
      vat: (payments.reduce((sum, p) => sum + p.amount, 0) / 1.1) * 0.1,
      withholding: expenseByCategory["인건비"] * 0.033,
      incomeTax: (payments.reduce((sum, p) => sum + p.amount, 0) - expenseTotal) * 0.1,
    };

    const staffGroups: Record<string, { fc: number; pt: number; total: number }> = {};
    payments.forEach(p => {
      const name = p.registrar || "미지정";
      if (!staffGroups[name]) staffGroups[name] = { fc: 0, pt: 0, total: 0 };
      const isFc = p.membership_category === "회원권" || p.membership_category === "헬스";
      const isPt = p.membership_category?.toUpperCase().includes("PT");
      if (isFc) staffGroups[name].fc += p.amount;
      if (isPt) staffGroups[name].pt += p.amount;
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
      taxStats,
      totalSales: payments.reduce((sum, p) => sum + p.amount, 0)
    };
  };

  const current = useMemo(() => getStats(currentPayments, currentExpenses), [currentPayments, currentExpenses]);
  const prev = useMemo(() => getStats(previousPayments, previousExpenses), [previousPayments, previousExpenses]);

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
              <div className="mt-2 flex items-center gap-2 bg-white/5 w-fit px-3 py-1 rounded-full border border-white/10">
                {formatPercent(current.totalSales, prev.totalSales)}
                <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">vs 전월</span>
              </div>
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
              <div className="mt-2 flex items-center gap-2 bg-rose-50/50 w-fit px-3 py-1 rounded-full border border-rose-100">
                {formatPercent(current.expenseTotal, prev.expenseTotal)}
                <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">vs 전월</span>
              </div>
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
            <h3 className="text-2xl font-heading font-black text-slate-900">FC 회원권 세부 성과</h3>
            <p className="text-xs font-bold text-slate-400">신규/리뉴 등록 및 이용권 기간별 분석</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 overflow-hidden rounded-3xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-5 text-left font-black text-slate-500 uppercase text-[10px] tracking-widest">항목 구분</th>
                  <th className="p-5 text-center font-black text-slate-500 uppercase text-[10px] tracking-widest">신규</th>
                  <th className="p-5 text-center font-black text-slate-500 uppercase text-[10px] tracking-widest">리뉴</th>
                  <th className="p-5 text-center font-black text-slate-500 uppercase text-[10px] tracking-widest">환불/기타</th>
                  <th className="p-5 text-center font-black text-amber-600 bg-amber-50/50 uppercase text-[10px] tracking-widest">당월 합계</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-5 font-black text-slate-700 bg-slate-50/30">FC 매출</td>
                  <td className="p-5 text-center font-heading font-bold">{formatCurrency(current.fcDetailed.categories.newReg.reduce((s,p)=>s+p.amount,0))}</td>
                  <td className="p-5 text-center font-heading font-bold">{formatCurrency(current.fcDetailed.categories.renewal.reduce((s,p)=>s+p.amount,0))}</td>
                  <td className="p-5 text-center font-heading font-bold text-rose-500">{formatCurrency(current.fcDetailed.categories.refund.reduce((s,p)=>s+p.amount,0))}</td>
                  <td className="p-5 text-center font-heading font-black text-amber-600 bg-amber-50/30">{formatCurrency(current.fcDetailed.total)}</td>
                </tr>
                <tr className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-5 font-black text-slate-700 bg-slate-50/30">등록건수</td>
                  <td className="p-5 text-center font-heading font-bold">{current.fcDetailed.categories.newReg.length}건</td>
                  <td className="p-5 text-center font-heading font-bold">{current.fcDetailed.categories.renewal.length}건</td>
                  <td className="p-5 text-center font-heading font-bold">{current.fcDetailed.categories.refund.length}건</td>
                  <td className="p-5 text-center font-heading font-black text-amber-600 bg-amber-50/30">{current.fcDetailed.count}건</td>
                </tr>
                <tr className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-5 font-black text-slate-700 bg-slate-50/30">비중%</td>
                  <td className="p-5 text-center font-heading font-bold text-slate-400">{current.fcDetailed.total > 0 ? ((current.fcDetailed.categories.newReg.reduce((s,p)=>s+p.amount,0) / current.fcDetailed.total) * 100).toFixed(1) : 0}%</td>
                  <td className="p-5 text-center font-heading font-bold text-slate-400">{current.fcDetailed.total > 0 ? ((current.fcDetailed.categories.renewal.reduce((s,p)=>s+p.amount,0) / current.fcDetailed.total) * 100).toFixed(1) : 0}%</td>
                  <td className="p-5 text-center font-heading font-bold text-slate-400">-</td>
                  <td className="p-5 text-center font-heading font-black text-amber-600 bg-amber-50/30">100%</td>
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
            <h3 className="text-2xl font-heading font-black text-slate-900">PT 수업 세부 성과</h3>
            <p className="text-xs font-bold text-slate-400">신규/리뉴 등록 및 세션별 분석</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 overflow-hidden rounded-3xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-5 text-left font-black text-slate-500 uppercase text-[10px] tracking-widest">항목 구분</th>
                  <th className="p-5 text-center font-black text-slate-500 uppercase text-[10px] tracking-widest">신규</th>
                  <th className="p-5 text-center font-black text-slate-500 uppercase text-[10px] tracking-widest">리뉴</th>
                  <th className="p-5 text-center font-black text-slate-500 uppercase text-[10px] tracking-widest">환불/기타</th>
                  <th className="p-5 text-center font-black text-blue-600 bg-blue-50/50 uppercase text-[10px] tracking-widest">당월 합계</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-5 font-black text-slate-700 bg-slate-50/30">PT 매출</td>
                  <td className="p-5 text-center font-heading font-bold">{formatCurrency(current.ptDetailed.categories.newReg.reduce((s,p)=>s+p.amount,0))}</td>
                  <td className="p-5 text-center font-heading font-bold">{formatCurrency(current.ptDetailed.categories.renewal.reduce((s,p)=>s+p.amount,0))}</td>
                  <td className="p-5 text-center font-heading font-bold text-rose-500">{formatCurrency(current.ptDetailed.categories.refund.reduce((s,p)=>s+p.amount,0))}</td>
                  <td className="p-5 text-center font-heading font-black text-blue-600 bg-blue-50/30">{formatCurrency(current.ptDetailed.total)}</td>
                </tr>
                <tr className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-5 font-black text-slate-700 bg-slate-50/30">등록건수</td>
                  <td className="p-5 text-center font-heading font-bold">{current.ptDetailed.categories.newReg.length}건</td>
                  <td className="p-5 text-center font-heading font-bold">{current.ptDetailed.categories.renewal.length}건</td>
                  <td className="p-5 text-center font-heading font-bold">{current.ptDetailed.categories.refund.length}건</td>
                  <td className="p-5 text-center font-heading font-black text-blue-600 bg-blue-50/30">{current.ptDetailed.count}건</td>
                </tr>
                <tr className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-5 font-black text-slate-700 bg-slate-50/30">비중%</td>
                  <td className="p-5 text-center font-heading font-bold text-slate-400">{current.ptDetailed.total > 0 ? ((current.ptDetailed.categories.newReg.reduce((s,p)=>s+p.amount,0) / current.ptDetailed.total) * 100).toFixed(1) : 0}%</td>
                  <td className="p-5 text-center font-heading font-bold text-slate-400">{current.ptDetailed.total > 0 ? ((current.ptDetailed.categories.renewal.reduce((s,p)=>s+p.amount,0) / current.ptDetailed.total) * 100).toFixed(1) : 0}%</td>
                  <td className="p-5 text-center font-heading font-bold text-slate-400">-</td>
                  <td className="p-5 text-center font-heading font-black text-blue-600 bg-blue-50/30">100%</td>
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* 4. 직원 성과 순위 - 랭킹 보드 스타일 */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-heading font-black text-slate-900">직원별 매출 기여도</h3>
              <p className="text-xs font-bold text-slate-400">지점 매출 성과 랭킹 (FC + PT)</p>
            </div>
          </div>

          <div className="space-y-4">
            {current.staffStats.map((staff, i) => {
              const share = current.totalSales > 0 ? (staff.total / current.totalSales) * 100 : 0;
              return (
                <div key={staff.name} className="group p-4 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-500">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black",
                        i === 0 ? "bg-amber-100 text-amber-600" : 
                        i === 1 ? "bg-slate-200 text-slate-600" :
                        i === 2 ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-400"
                      )}>
                        {i + 1}
                      </div>
                      <span className="font-black text-slate-700">{staff.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-heading font-black text-slate-900">{formatCurrency(staff.total)}</p>
                      <p className="text-[10px] font-black text-purple-600">{share.toFixed(1)}% 기여</p>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-1000 ease-out" 
                      style={{ width: `${share}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. 지출 및 세무 요약 - 모던한 리포트 스타일 */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-600/20">
              <PieChart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-heading font-black text-slate-900">지출 구조 및 세무 추정</h3>
              <p className="text-xs font-bold text-slate-400">항목별 지출 분석 및 예상 세금 추정치</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(current.expenseByCategory).map(([cat, amount]) => {
                const share = current.expenseTotal > 0 ? ((amount as number) / current.expenseTotal) * 100 : 0;
                return (
                  <div key={cat} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                      <span className="text-sm font-bold text-slate-600">{cat}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-heading font-black text-slate-900">{formatCurrency(amount as number)}</p>
                        <p className="text-[10px] font-black text-slate-400">{share.toFixed(1)}%</p>
                      </div>
                      <div className="w-16">
                        {formatPercent(amount as number, prev.expenseByCategory[cat as keyof typeof prev.expenseByCategory] as number)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="p-5 rounded-[28px] bg-slate-900 text-white relative overflow-hidden group">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">VAT (10%)</p>
                <p className="text-lg font-heading font-black text-white">{formatCurrency(current.taxStats.vat)}</p>
                <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                  <Receipt size={48} />
                </div>
              </div>
              <div className="p-5 rounded-[28px] bg-blue-50 border border-blue-100 relative overflow-hidden group">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Withholding (3.3%)</p>
                <p className="text-lg font-heading font-black text-blue-600">{formatCurrency(current.taxStats.withholding)}</p>
                <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:rotate-12 transition-transform duration-500 text-blue-600">
                  <Coins size={48} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
