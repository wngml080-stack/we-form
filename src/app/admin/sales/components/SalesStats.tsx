"use client";

import { DollarSign, CreditCard, Banknote } from "lucide-react";
import { Stats, formatCurrency } from "../hooks/useSalesPageData";

interface SalesStatsProps {
  stats: Stats;
}

export function SalesStats({ stats }: SalesStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div className="bg-[#2F80ED] text-white rounded-xl p-4 sm:p-5 shadow-sm col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-medium">총 매출</span>
          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="text-xl sm:text-2xl font-bold">{formatCurrency(stats.total)}</div>
        <div className="text-xs mt-1 opacity-80">{stats.count}건</div>
      </div>

      <div className="bg-white border rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm text-gray-600">카드 결제</span>
          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
        </div>
        <div className="text-lg sm:text-xl font-bold text-blue-600">{formatCurrency(stats.card)}</div>
        <div className="text-xs text-gray-500 mt-1">
          {((stats.card / stats.total) * 100 || 0).toFixed(1)}%
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm text-gray-600">현금 결제</span>
          <Banknote className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
        </div>
        <div className="text-lg sm:text-xl font-bold text-emerald-600">{formatCurrency(stats.cash)}</div>
        <div className="text-xs text-gray-500 mt-1">
          {((stats.cash / stats.total) * 100 || 0).toFixed(1)}%
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm text-gray-600">계좌이체</span>
          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
        </div>
        <div className="text-lg sm:text-xl font-bold text-purple-600">{formatCurrency(stats.transfer)}</div>
        <div className="text-xs text-gray-500 mt-1">
          {((stats.transfer / stats.total) * 100 || 0).toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
