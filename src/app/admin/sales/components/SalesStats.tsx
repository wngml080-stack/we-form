"use client";

import { CreditCard, Banknote, Building2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  total: number;
  card: number;
  cash: number;
  transfer: number;
  count: number;
}

interface SalesStatsProps {
  stats: Stats;
  onTotalClick?: () => void;
  layout?: "horizontal" | "vertical";
}

export function SalesStats({ stats, onTotalClick, layout = "horizontal" }: SalesStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", { 
      style: "currency", 
      currency: "KRW",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const statItems = [
    { label: "총 매출 합계", value: stats.total, icon: TrendingUp, color: "blue", clickable: true },
    { label: "카드 결제액", value: stats.card, icon: CreditCard, color: "indigo", clickable: false },
    { label: "현금 결제액", value: stats.cash, icon: Banknote, color: "emerald", clickable: false },
    { label: "계좌이체액", value: stats.transfer, icon: Building2, color: "amber", clickable: false },
  ];

  if (layout === "vertical") {
    return (
      <div className="space-y-3">
        {statItems.map((item) => (
          <div
            key={item.label}
            className={`p-4 rounded-2xl border transition-all duration-200 group ${
              item.clickable && onTotalClick
                ? 'bg-[var(--primary-hex)] border-[var(--primary-hover-hex)] cursor-pointer hover:scale-[1.02] shadow-[0_4px_16px_rgba(49,130,246,0.25)]'
                : 'bg-[var(--background-secondary)] border-[#E5E8EB] hover:bg-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]'
            }`}
            onClick={item.clickable && onTotalClick ? onTotalClick : undefined}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                item.clickable
                  ? "bg-white/20 text-white"
                  : cn(
                      item.color === 'indigo' && "bg-indigo-100 text-indigo-600",
                      item.color === 'emerald' && "bg-[var(--secondary-light-hex)] text-[var(--secondary-hex)]",
                      item.color === 'amber' && "bg-[var(--accent-light-hex)] text-[var(--accent-hex)]",
                    )
              )}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  item.clickable ? "text-blue-100" : "text-[var(--foreground-muted)]"
                )}>
                  {item.label}
                </p>
                <p className={cn(
                  "text-lg font-black tracking-tight truncate",
                  item.clickable ? "text-white" : "text-[var(--foreground)]"
                )}>
                  {formatCurrency(item.value)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-500 delay-300">
      {statItems.map((item) => (
        <div
          key={item.label}
          className={`bg-white rounded-2xl p-5 border border-[#E5E8EB] shadow-[0_2px_8px_rgba(0,0,0,0.04)] group hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200 ${item.clickable && onTotalClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
          onClick={item.clickable && onTotalClick ? onTotalClick : undefined}
        >
          <div className={`w-11 h-11 rounded-2xl mb-4 flex items-center justify-center transition-colors ${
            item.color === 'blue' ? 'bg-[var(--primary-light-hex)] text-[var(--primary-hex)] group-hover:bg-[var(--primary-hex)] group-hover:text-white' :
            item.color === 'indigo' ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white' :
            item.color === 'emerald' ? 'bg-[var(--secondary-light-hex)] text-[var(--secondary-hex)] group-hover:bg-[var(--secondary-hex)] group-hover:text-white' :
            'bg-[var(--accent-light-hex)] text-[var(--accent-hex)] group-hover:bg-[var(--accent-hex)] group-hover:text-white'
          }`}>
            <item.icon className="w-5.5 h-5.5" />
          </div>
          <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest">{item.label}</p>
          <p className="text-xl font-black text-[var(--foreground)] mt-1 tracking-tight">
            {formatCurrency(item.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
