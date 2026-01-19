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
  ArrowRight
} from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  membership_category: string;
  sale_type: string;
  payment_date: string;
  registrar?: string;
}

interface DetailedAnalysisProps {
  currentPayments: Payment[];
  previousPayments?: Payment[];
  lastYearPayments?: Payment[];
}

export function DetailedAnalysis({ 
  currentPayments, 
  previousPayments = [], 
  lastYearPayments = [] 
}: DetailedAnalysisProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(Math.round(amount)) + "원";
  };

  const formatPercent = (current: number, compare: number) => {
    if (compare === 0) return <span className="text-slate-400 font-bold">-</span>;
    const value = ((current - compare) / compare) * 100;
    const isPositive = value >= 0;
    return (
      <span className={cn(
        "font-black font-heading",
        isPositive ? "text-emerald-600" : "text-rose-600"
      )}>
        {isPositive ? "↑" : "↓"} {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

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
    if (compare === 0) return <span className="text-slate-400 font-bold">-</span>;
    const value = ((current - compare) / compare) * 100;
    const isPositive = value >= 0;
    return (
      <span className={cn(
        "font-black font-heading",
        isPositive ? "text-emerald-600" : "text-rose-600"
      )}>
        {isPositive ? "↑" : "↓"} {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  // --- 데이터 가공 로직 ---
  const getStats = (payments: Payment[], expenses: Expense[]) => {
    const fc = payments.filter(p => p.membership_category === "회원권" || p.membership_category === "헬스");
    const pt = payments.filter(p => p.membership_category?.toUpperCase().includes("PT"));
    
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

    // 지출 통계
    const expenseTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const expenseByCategory = {
      "임대료/관리비": expenses.filter(e => e.category?.includes("임대") || e.category?.includes("관리")).reduce((s, e) => s + e.amount, 0),
      "인건비": expenses.filter(e => e.category?.includes("인건") || e.category?.includes("급여")).reduce((s, e) => s + e.amount, 0),
      "마케팅": expenses.filter(e => e.category?.includes("마케팅") || e.category?.includes("광고")).reduce((s, e) => s + e.amount, 0),
      "운영비": expenses.filter(e => e.category?.includes("운영") || e.category?.includes("소모품")).reduce((s, e) => s + e.amount, 0),
      "기타": expenses.filter(e => !["임대", "관리", "인건", "급여", "마케팅", "광고", "운영", "소모품"].some(k => e.category?.includes(k))).reduce((s, e) => s + e.amount, 0),
    };

    // 세무 데이터 (추정치)
    const taxStats = {
      vat: (payments.reduce((sum, p) => sum + p.amount, 0) / 1.1) * 0.1, // 매출 부가세 (10%)
      withholding: expenseByCategory["인건비"] * 0.033, // 원천세 (3.3%)
      incomeTax: (payments.reduce((sum, p) => sum + p.amount, 0) - expenseTotal) * 0.1, // 종합소득세 추정
    };

    // 직원별 통계
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
      staffStats,
      expenseTotal,
      expenseByCategory,
      taxStats
    };
  };

  const current = useMemo(() => getStats(currentPayments, currentExpenses), [currentPayments, currentExpenses]);
  const prev = useMemo(() => getStats(previousPayments, previousExpenses), [previousPayments, previousExpenses]);
  const lastYear = useMemo(() => getStats(lastYearPayments, []), [lastYearPayments]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 gap-8">
        {/* 1. FC 세부성과 - 매출/인원 */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-slate-900 px-6 py-4">
            <h3 className="font-heading font-black text-white text-base tracking-tight">FC 세부성과 - 매출/인원 분석</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-center font-black text-slate-400 border-r border-slate-100">구분</th>
                  <th className="p-2 text-center font-black text-slate-500 border-r border-slate-100 bg-slate-100/30">리뉴 (당월)</th>
                  <th className="p-2 text-center font-black text-slate-500 border-r border-slate-100 bg-slate-100/30">신규 (당월)</th>
                  <th className="p-2 text-center font-black text-blue-600 border-r border-slate-100 bg-blue-50/30">합계 (당월)</th>
                  <th className="p-2 text-center font-black text-slate-500 border-r border-slate-100">전월 합계</th>
                  <th className="p-2 text-center font-black text-slate-500">전월대비 증감</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-black text-slate-700 border-r border-slate-100">FC 매출</td>
                  <td className="p-4 text-right border-r border-slate-100 font-heading">{formatCurrency(current.fc.renewal.reduce((s,p)=>s+p.amount,0))}</td>
                  <td className="p-4 text-right border-r border-slate-100 font-heading">{formatCurrency(current.fc.newReg.reduce((s,p)=>s+p.amount,0))}</td>
                  <td className="p-4 text-right border-r border-slate-100 font-heading font-black text-blue-600 bg-blue-50/5">{formatCurrency(current.fc.total)}</td>
                  <td className="p-4 text-right border-r border-slate-100 font-heading text-slate-500">{formatCurrency(prev.fc.total)}</td>
                  <td className="p-4 text-center">{formatPercent(current.fc.total, prev.fc.total)}</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-black text-slate-700 border-r border-slate-100">인원</td>
                  <td className="p-4 text-right border-r border-slate-100 font-heading">{current.fc.renewal.length}명</td>
                  <td className="p-4 text-right border-r border-slate-100 font-heading">{current.fc.newReg.length}명</td>
                  <td className="p-4 text-right border-r border-slate-100 font-heading font-black text-blue-600 bg-blue-50/5">{current.fc.count}명</td>
                  <td className="p-4 text-right border-r border-slate-100 font-heading text-slate-500">{prev.fc.count}명</td>
                  <td className="p-4 text-center">{formatPercent(current.fc.count, prev.fc.count)}</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-black text-slate-700 border-r border-slate-100">객단가</td>
                  <td className="p-4 text-right border-r border-slate-100 font-heading">{formatCurrency(current.fc.renewal.reduce((s,p)=>s+p.amount,0)/(current.fc.renewal.length||1))}</td>
                  <td className="p-4 text-right border-r border-slate-100 font-heading">{formatCurrency(current.fc.newReg.reduce((s,p)=>s+p.amount,0)/(current.fc.newReg.length||1))}</td>
                  <td className="p-4 text-right border-r border-slate-100 font-heading font-black text-blue-600 bg-blue-50/5">{formatCurrency(current.fc.avg)}</td>
                  <td className="p-4 text-right border-r border-slate-100 font-heading text-slate-500">{formatCurrency(prev.fc.avg)}</td>
                  <td className="p-4 text-center">{formatPercent(current.fc.avg, prev.fc.avg)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. FC 세부성과 - 이용권 기간별 */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-slate-800 px-6 py-4">
            <h3 className="font-heading font-black text-white text-base tracking-tight">FC 세부성과 - 이용권 기간별 분석 (당월)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-center font-black text-slate-400 border-r border-slate-100">구분</th>
                  {["1개월", "3개월", "6개월", "12개월", "합계"].map(h => (
                    <th key={h} className="p-2 text-center font-black text-slate-500 border-r border-slate-100">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-black text-slate-700 border-r border-slate-100">FC 매출</td>
                  {["1개월", "3개월", "6개월", "12개월"].map(p => (
                    <td key={p} className="p-4 text-right border-r border-slate-100 font-heading">
                      {formatCurrency(current.fc.periods[p as keyof typeof current.fc.periods]?.reduce((s:any,i:any)=>s+i.amount,0)||0)}
                    </td>
                  ))}
                  <td className="p-4 text-right font-black text-blue-600 bg-blue-50/5 font-heading">{formatCurrency(current.fc.total)}</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-black text-slate-700 border-r border-slate-100">인원</td>
                  {["1개월", "3개월", "6개월", "12개월"].map(p => (
                    <td key={p} className="p-4 text-right border-r border-slate-100 font-heading">
                      {(current.fc.periods[p as keyof typeof current.fc.periods]?.length||0)}명
                    </td>
                  ))}
                  <td className="p-4 text-right font-black text-blue-600 bg-blue-50/5 font-heading">{current.fc.count}명</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. PT 세부성과 - 매출/인원 */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-emerald-900 px-6 py-4">
            <h3 className="font-heading font-black text-white text-base tracking-tight">PT 세부성과 - 매출/인원 분석</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-center font-black text-slate-400 border-r border-slate-100">구분</th>
                  <th className="p-2 text-center font-black text-slate-500 border-r border-slate-100 bg-emerald-50/10">리뉴 (당월)</th>
                  <th className="p-2 text-center font-black text-slate-500 border-r border-slate-100 bg-emerald-50/10">신규 (당월)</th>
                  <th className="p-2 text-center font-black text-emerald-600 border-r border-slate-100 bg-emerald-50/30">합계 (당월)</th>
                  <th className="p-2 text-center font-black text-slate-500 border-r border-slate-100">전월 합계</th>
                  <th className="p-2 text-center font-black text-slate-500">전월대비 증감</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-black text-slate-700 border-r border-slate-100">PT 매출</td>
                  <td className="p-4 text-right border-r border-slate-100 font-heading">{formatCurrency(current.pt.renewal.reduce((s,p)=>s+p.amount,0))}</td>
                  <td className="p-4 text-right border-r border-slate-100 font-heading">{formatCurrency(current.pt.newReg.reduce((s,p)=>s+p.amount,0))}</td>
                  <td className="p-4 text-right border-r border-slate-100 font-heading font-black text-emerald-600 bg-emerald-50/5">{formatCurrency(current.pt.total)}</td>
                  <td className="p-4 text-right border-r border-slate-100 font-heading text-slate-500">{formatCurrency(prev.pt.total)}</td>
                  <td className="p-4 text-center">{formatPercent(current.pt.total, prev.pt.total)}</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-black text-slate-700 border-r border-slate-100">인원</td>
                  <td className="p-4 text-right border-r border-slate-100 font-heading">{current.pt.renewal.length}명</td>
                  <td className="p-4 text-right border-r border-slate-100 font-heading">{current.pt.newReg.length}명</td>
                  <td className="p-4 text-right border-r border-slate-100 font-heading font-black text-emerald-600 bg-emerald-50/5">{current.pt.count}명</td>
                  <td className="p-4 text-right border-r border-slate-100 font-heading text-slate-500">{prev.pt.count}명</td>
                  <td className="p-4 text-center">{formatPercent(current.pt.count, prev.pt.count)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. PT 세부성과 - 계약 세션별 */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-emerald-800 px-6 py-4">
            <h3 className="font-heading font-black text-white text-base tracking-tight">PT 세부성과 - 계약 세션별 분석 (당월)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-center font-black text-slate-400 border-r border-slate-100">구분</th>
                  {["10회", "20회", "30회", "50회", "합계"].map(h => (
                    <th key={h} className="p-2 text-center font-black text-slate-500 border-r border-slate-100">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-black text-slate-700 border-r border-slate-100">PT 매출</td>
                  {["10회", "20회", "30회", "50회"].map(s => (
                    <td key={s} className="p-4 text-right border-r border-slate-100 font-heading">
                      {formatCurrency(current.pt.sessions[s as keyof typeof current.pt.sessions]?.reduce((sum:any,i:any)=>sum+i.amount,0)||0)}
                    </td>
                  ))}
                  <td className="p-4 text-right font-black text-emerald-600 bg-emerald-50/5 font-heading">{formatCurrency(current.pt.total)}</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-black text-slate-700 border-r border-slate-100">인원</td>
                  {["10회", "20회", "30회", "50회"].map(s => (
                    <td key={s} className="p-4 text-right border-r border-slate-100 font-heading">
                      {(current.pt.sessions[s as keyof typeof current.pt.sessions]?.length||0)}명
                    </td>
                  ))}
                  <td className="p-4 text-right font-black text-emerald-600 bg-emerald-50/5 font-heading">{current.pt.count}명</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. 직원별 매출 성과 요약 */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-purple-900 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-heading font-black text-white text-base tracking-tight">직원별 매출 성과 요약 (당월)</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-left font-black text-slate-400 border-r border-slate-100">직원명</th>
                  <th className="p-4 text-right font-black text-blue-600 border-r border-slate-100 bg-blue-50/30 font-heading">FC 매출</th>
                  <th className="p-4 text-right font-black text-emerald-600 border-r border-slate-100 bg-emerald-50/30 font-heading">PT 매출</th>
                  <th className="p-4 text-right font-black text-slate-900 bg-slate-100/50 font-heading">합계 매출</th>
                  <th className="p-4 text-right font-black text-slate-400">매출 비중</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {current.staffStats.map((staff, i) => (
                  <tr key={`staff-${i}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-black text-slate-700 border-r border-slate-100">{staff.name}</td>
                    <td className="p-4 text-right font-bold text-blue-600 border-r border-slate-100 bg-blue-50/5 font-heading">{formatCurrency(staff.fc)}</td>
                    <td className="p-4 text-right font-bold text-emerald-600 border-r border-slate-100 bg-emerald-50/5 font-heading">{formatCurrency(staff.pt)}</td>
                    <td className="p-4 text-right font-black text-slate-900 bg-slate-100/20 border-r border-slate-100 font-heading">{formatCurrency(staff.total)}</td>
                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-black text-slate-600 font-heading">
                          {current.fc.total + current.pt.total > 0 
                            ? ((staff.total / (current.fc.total + current.pt.total)) * 100).toFixed(1)
                            : 0}%
                        </span>
                        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500" 
                            style={{ width: `${(staff.total / (current.fc.total + current.pt.total || 1)) * 100}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. 지출 및 세무 분석 */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-rose-900 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-heading font-black text-white text-base tracking-tight">지출 분석 및 세무 데이터 (추정)</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* 지출 상세 */}
            <div className="p-6 border-r border-slate-100">
              <h4 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-widest">분류별 지출 상세</h4>
              <div className="space-y-4">
                {Object.entries(current.expenseByCategory).map(([cat, amount]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">{cat}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-slate-900 font-heading">{formatCurrency(amount as number)}</span>
                      <div className="w-24 text-right">
                        {formatPercent(amount as number, prev.expenseByCategory[cat as keyof typeof prev.expenseByCategory] as number)}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black text-rose-600">총 지출 합계</span>
                  <span className="text-sm font-black text-rose-600 font-heading">{formatCurrency(current.expenseTotal)}</span>
                </div>
              </div>
            </div>
            {/* 세무 추정 */}
            <div className="p-6 bg-slate-50/30">
              <h4 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-widest">세무/정산 추정치</h4>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-slate-500">매출 부가세 (10% 추정)</span>
                    <span className="text-xs font-black text-slate-900 font-heading">{formatCurrency(current.taxStats.vat)}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">당월 전체 매출 기준 부가세액</p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-slate-500">인건비 원천세 (3.3% 추정)</span>
                    <span className="text-xs font-black text-slate-900 font-heading">{formatCurrency(current.taxStats.withholding)}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">지출 인건비 기준 프리랜서 원천세액</p>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-black text-indigo-600">예상 순수익 (매출-지출)</span>
                    <span className="text-sm font-black text-indigo-700 font-heading">{formatCurrency(current.fc.total + current.pt.total - current.expenseTotal)}</span>
                  </div>
                  <p className="text-[10px] text-indigo-400">부가세 및 제세공과금 제외 전 단순 차액</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 7. 종합 정산 리포트 요약 */}
        <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <TrendingUp size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                <LayoutGrid className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-black">종합 실적 정산 리포트</h3>
                <p className="text-xs text-slate-400 font-bold">Comprehensive Performance Report</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-white/10">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Sales</p>
                <p className="text-2xl font-heading font-black text-blue-400">{formatCurrency(current.fc.total + current.pt.total)}</p>
                <div className="mt-2 text-xs">
                  {formatPercent(current.fc.total + current.pt.total, prev.fc.total + prev.pt.total)} <span className="text-slate-500">vs Last Month</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Expenses</p>
                <p className="text-2xl font-heading font-black text-rose-400">{formatCurrency(current.expenseTotal)}</p>
                <div className="mt-2 text-xs">
                  {formatPercent(current.expenseTotal, prev.expenseTotal)} <span className="text-slate-500">vs Last Month</span>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Estimated Net Profit</p>
                <p className="text-2xl font-heading font-black text-emerald-400">{formatCurrency(current.fc.total + current.pt.total - current.expenseTotal)}</p>
                <div className="mt-2 text-xs text-emerald-500/80 font-bold">
                  최종 영업 이익 (추정치)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
