"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  ShoppingBag,
  UserPlus,
  Users2,
  MapPin,
  TrendingUp,
  BarChart3,
  ArrowRight
} from "lucide-react";
import { getCategoryColor } from "../utils/categoryColors";

interface Payment {
  id: string;
  amount: number;
  membership_category: string;
  sale_type: string;
  registrar?: string;
  visit_route?: string;
}

interface SalesAnalysisProps {
  payments: Payment[];
}

export function SalesAnalysis({ payments }: SalesAnalysisProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(Math.round(amount)) + "원";
  };

  const formatPercent = (value: number) => {
    return value.toFixed(1) + "%";
  };

  const totalAmount = useMemo(() => 
    payments.reduce((sum, p) => sum + (p.amount || 0), 0)
  , [payments]);

  // 1. 상품 및 분류별 통계
  const categoryStats = useMemo(() => {
    const groups: Record<string, { count: number; amount: number }> = {};
    payments.forEach(p => {
      const cat = p.membership_category || "미지정";
      if (!groups[cat]) groups[cat] = { count: 0, amount: 0 };
      groups[cat].count++;
      groups[cat].amount += p.amount || 0;
    });

    return Object.entries(groups)
      .map(([name, data]) => ({
        name,
        ...data,
        avg: data.count > 0 ? data.amount / data.count : 0,
        share: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [payments, totalAmount]);

  // 2. 등록 유형별 분석
  const saleTypeStats = useMemo(() => {
    const groups: Record<string, { count: number; amount: number }> = {};
    payments.forEach(p => {
      const type = p.sale_type || "미지정";
      if (!groups[type]) groups[type] = { count: 0, amount: 0 };
      groups[type].count++;
      groups[type].amount += p.amount || 0;
    });

    return Object.entries(groups)
      .map(([name, data]) => ({
        name,
        ...data,
        share: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [payments, totalAmount]);

  // 3. 직원별 성과
  const registrarStats = useMemo(() => {
    const groups: Record<string, { count: number; amount: number }> = {};
    payments.forEach(p => {
      const name = p.registrar || "미지정";
      if (!groups[name]) groups[name] = { count: 0, amount: 0 };
      groups[name].count++;
      groups[name].amount += p.amount || 0;
    });

    return Object.entries(groups)
      .map(([name, data]) => ({
        name,
        ...data,
        share: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [payments, totalAmount]);

  // 4. 유입 경로별 분석
  const inflowStats = useMemo(() => {
    const groups: Record<string, { count: number; amount: number }> = {};
    payments.forEach(p => {
      const route = p.visit_route || "미지정";
      if (!groups[route]) groups[route] = { count: 0, amount: 0 };
      groups[route].count++;
      groups[route].amount += p.amount || 0;
    });

    return Object.entries(groups)
      .map(([name, data]) => ({
        name,
        count: data.count,
        amount: data.amount,
        avg: data.count > 0 ? data.amount / data.count : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [payments]);

  if (payments.length === 0) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in duration-700">
      {/* 1. 상품 분류별 통계 */}
      <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-black text-slate-900 text-sm">상품 분류별 매출</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product Analysis</span>
        </div>
        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="pb-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">분류</th>
                <th className="pb-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">건수</th>
                <th className="pb-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">매출액</th>
                <th className="pb-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">객단가</th>
                <th className="pb-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">비중</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {categoryStats.map((item) => {
                const colors = getCategoryColor(item.name);
                return (
                  <tr key={item.name} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", colors.bg)} />
                        <span className="text-xs font-black text-slate-700">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-xs font-bold text-slate-600">{item.count}건</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className={cn("text-xs font-black", colors.text)}>{formatCurrency(item.amount)}</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-[11px] font-bold text-slate-500">{formatCurrency(item.avg)}</span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[11px] font-black text-slate-900">{formatPercent(item.share)}</span>
                        <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn("h-full", colors.bg)} style={{ width: `${item.share}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. 등록 유형별 분석 */}
      <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="font-black text-slate-900 text-sm">등록 유형별 분석</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type Analysis</span>
        </div>
        <div className="space-y-4">
          {saleTypeStats.map((item) => (
            <div key={item.name} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    item.name === "신규" ? "bg-blue-500" : 
                    item.name === "재등록" ? "bg-emerald-500" : "bg-amber-500"
                  )} />
                  <span className="text-xs font-black text-slate-700">{item.name}</span>
                  <span className="text-[10px] font-bold text-slate-400 px-1.5 py-0.5 bg-white rounded-md border border-slate-100">{item.count}건</span>
                </div>
                <span className="text-sm font-black text-slate-900">{formatCurrency(item.amount)}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={cn(
                    "h-full transition-all duration-1000",
                    item.name === "신규" ? "bg-blue-500" : 
                    item.name === "재등록" ? "bg-emerald-500" : "bg-amber-500"
                  )} style={{ width: `${item.share}%` }} />
                </div>
                <span className="text-[11px] font-black text-slate-500 min-w-[40px] text-right">{formatPercent(item.share)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

