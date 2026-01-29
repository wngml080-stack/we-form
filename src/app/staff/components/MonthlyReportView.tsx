"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type MonthlyStatsData = {
  PT?: number;
  OT?: number;
  Consulting?: number;
  completed?: number;
  no_show_deducted?: number;
  no_show?: number;
  service?: number;
  total?: number;
};

interface MonthlyReportViewProps {
  month: number;
  monthlyStats: MonthlyStatsData | null;
  isMonthApproved: boolean;
  isMonthLocked: boolean;
  submissionStatus: string;
  onSubmitMonth: () => void;
}

export function MonthlyReportView({
  month, monthlyStats, isMonthApproved, isMonthLocked, submissionStatus, onSubmitMonth
}: MonthlyReportViewProps) {
  return (
    <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-300 p-4 md:p-0">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          📊 {month}월 수업 리포트
        </h3>
        {isMonthApproved ? (
          <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> 마감 승인됨
          </span>
        ) : (
          <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> 작성 중
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'PT 진행', value: monthlyStats?.PT, bg: 'bg-blue-50', text: 'text-blue-600' },
          { label: 'OT 진행', value: monthlyStats?.OT, bg: 'bg-purple-50', text: 'text-purple-600' },
          { label: '상담', value: monthlyStats?.Consulting, bg: 'bg-green-50', text: 'text-green-600' },
          { label: '총 일정', value: monthlyStats?.total, bg: 'bg-gray-100', text: 'text-gray-600' },
        ].map((stat, idx) => (
          <div key={idx} className={cn("rounded-2xl p-5 flex flex-col gap-2 transition-transform hover:scale-105", stat.bg)}>
            <span className={cn("text-xs font-bold uppercase tracking-wider", stat.text)}>{stat.label}</span>
            <span className={cn("text-3xl font-black", stat.text.replace('600', '900'))}>
              {stat.value || 0}<span className="text-sm font-medium ml-1 text-gray-500">건</span>
            </span>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8">
        <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">상세 현황</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { label: '출석 완료', icon: '🟢', value: monthlyStats?.completed },
            { label: '노쇼 (차감)', icon: '🔴', value: monthlyStats?.no_show_deducted },
            { label: '단순 노쇼', icon: '⚪', value: monthlyStats?.no_show },
            { label: '서비스', icon: '🔵', value: monthlyStats?.service },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="font-bold text-gray-700 text-sm">{item.label}</span>
              </div>
              <span className="font-bold text-gray-900">{item.value || 0}회</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-gray-100">
        <Button
          disabled={isMonthLocked}
          className="w-full h-14 text-lg font-bold bg-[#2F80ED] hover:bg-[#1c6cd7] shadow-lg shadow-blue-200 disabled:shadow-none disabled:bg-gray-200 disabled:text-gray-400 rounded-xl transition-all"
          onClick={onSubmitMonth}
        >
          {submissionStatus === "approved"
            ? "승인 완료 (수정 불가)"
            : submissionStatus === "submitted"
            ? "승인 대기 중 (수정 불가)"
            : "관리자에게 스케줄 전송 (마감)"}
        </Button>
        <p className="text-xs text-gray-400 text-center mt-3">
          * 매월 1일 ~ 5일 사이에 전송해주세요. 전송 후에는 수정이 불가능합니다.
        </p>
      </div>
    </div>
  );
}
