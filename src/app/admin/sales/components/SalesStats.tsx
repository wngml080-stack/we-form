"use client";

import { CreditCard, Banknote, Building2, TrendingUp } from "lucide-react";

interface Stats {
  total: number;
  card: number;
  cash: number;
  transfer: number;
  count: number;
}

interface SalesStatsProps {
  stats: Stats;
}

export function SalesStats({ stats }: SalesStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(amount);
  };

  const statItems = [
    { label: "총 매출 합계", value: stats.total, icon: TrendingUp, color: "blue" },
    { label: "카드 결제액", value: stats.card, icon: CreditCard, color: "indigo" },
    { label: "현금 결제액", value: stats.cash, icon: Banknote, color: "emerald" },
    { label: "계좌이체액", value: stats.transfer, icon: Building2, color: "amber" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-500 delay-300">
      {statItems.map((item) => (
        <div key={item.label} className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm group hover:shadow-md transition-all">
          <div className={`w-11 h-11 rounded-2xl mb-4 flex items-center justify-center transition-colors ${
            item.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' :
            item.color === 'indigo' ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white' :
            item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' :
            'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white'
          }`}>
            <item.icon className="w-5.5 h-5.5" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
          <p className="text-xl font-black text-slate-900 mt-1 tracking-tight">
            {formatCurrency(item.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
