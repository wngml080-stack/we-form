"use client";

import Link from "next/link";
import { History, Clock, ChevronRight } from "lucide-react";

interface RecentLogsSectionProps {
  logs: any[];
  formatCurrency: (amount: number) => string;
}

export function RecentLogsSection({ logs, formatCurrency }: RecentLogsSectionProps) {
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
          <History className="w-5 h-5 text-[#2F80ED]" />
          최근 등록 기록
        </h3>
        <span className="text-xs text-gray-400">{logs.length}건</span>
      </div>
      <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Clock className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm">최근 등록 기록이 없습니다.</p>
          </div>
        ) : (
          logs.map((log) => {
            const typeInfo = typeLabels[log.type] || typeLabels.other;

            return (
              <Link
                key={log.id}
                href={log.member_id ? `/admin/members?member=${log.member_id}` : `/admin/sales`}
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
                        month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
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
    </div>
  );
}
