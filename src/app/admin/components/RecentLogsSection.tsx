"use client";

import Link from "next/link";
import { TrendingUp, Clock, ChevronRight } from "lucide-react";

interface Summary {
  new_member: { count: number; amount: number };
  existing_member: { count: number; amount: number };
  addon: { count: number; amount: number };
  other: { count: number; amount: number };
  total: { count: number; amount: number };
}

type SalesLogType = 'new_member' | 'existing_member' | 'addon' | 'other';
type PaymentMethod = 'card' | 'cash' | 'transfer';

interface SalesLog {
  id: string;
  type: SalesLogType;
  member_id?: string;
  member_name: string;
  membership_type?: string;
  memo?: string;
  payment_method: PaymentMethod;
  amount: number;
  created_at: string;
}

interface RecentLogsSectionProps {
  logs: SalesLog[];
  summary?: Summary;
  formatCurrency: (amount: number) => string;
}

export function RecentLogsSection({ logs, summary, formatCurrency }: RecentLogsSectionProps) {
  const typeLabels: Record<string, { label: string; color: string }> = {
    new_member: { label: "신규회원", color: "bg-blue-100 text-blue-600" },
    existing_member: { label: "재등록", color: "bg-indigo-100 text-indigo-600" },
    addon: { label: "부가상품", color: "bg-green-100 text-green-600" },
    other: { label: "기타", color: "bg-gray-100 text-gray-600" }
  };

  const methodLabels: Record<string, string> = {
    card: "카드",
    cash: "현금",
    transfer: "계좌이체"
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#2F80ED]" />
          당일 매출 등록 현황
        </h3>
        <span className="text-xs text-gray-400">{logs.length}건</span>
      </div>
      <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm">오늘 등록된 매출이 없습니다.</p>
          </div>
        ) : (
          logs.map((log) => {
            const typeInfo = typeLabels[log.type] || typeLabels.other;

            return (
              <Link
                key={log.id}
                href={log.member_id ? `/admin/pt-members?member=${log.member_id}` : `/admin/sales`}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-blue-50/50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                  <div>
                    <div className="font-medium text-gray-800 text-sm">{log.member_name}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <span>{log.membership_type || log.memo}</span>
                      <span className="text-gray-300">|</span>
                      <span>{methodLabels[log.payment_method] || log.payment_method}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-gray-900 text-sm">{formatCurrency(log.amount)}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(log.created_at).toLocaleString('ko-KR', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* 카테고리별 합계 */}
      {summary && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            {summary.new_member.count > 0 && (
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <div className="text-xs text-gray-500">신규회원</div>
                <div className="text-sm font-bold text-blue-600">{summary.new_member.count}건</div>
                <div className="text-xs text-gray-600">{formatCurrency(summary.new_member.amount)}</div>
              </div>
            )}
            {summary.existing_member.count > 0 && (
              <div className="text-center p-2 bg-indigo-50 rounded-lg">
                <div className="text-xs text-gray-500">재등록</div>
                <div className="text-sm font-bold text-indigo-600">{summary.existing_member.count}건</div>
                <div className="text-xs text-gray-600">{formatCurrency(summary.existing_member.amount)}</div>
              </div>
            )}
            {summary.addon.count > 0 && (
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <div className="text-xs text-gray-500">부가상품</div>
                <div className="text-sm font-bold text-green-600">{summary.addon.count}건</div>
                <div className="text-xs text-gray-600">{formatCurrency(summary.addon.amount)}</div>
              </div>
            )}
            {summary.other.count > 0 && (
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500">기타</div>
                <div className="text-sm font-bold text-gray-600">{summary.other.count}건</div>
                <div className="text-xs text-gray-600">{formatCurrency(summary.other.amount)}</div>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center p-3 bg-[#2F80ED]/5 rounded-xl">
            <span className="font-bold text-gray-700">총 합계</span>
            <span className="text-xl font-bold text-[#2F80ED]">{formatCurrency(summary.total.amount)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
