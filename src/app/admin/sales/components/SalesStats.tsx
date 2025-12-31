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
    { label: "총 매출", value: stats.total, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "카드", value: stats.card, icon: CreditCard, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "현금", value: stats.cash, icon: Banknote, color: "text-green-600", bg: "bg-green-50" },
    { label: "계좌이체", value: stats.transfer, icon: Building2, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <div key={item.label} className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className={`text-lg font-bold ${item.color}`}>{formatCurrency(item.value)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
