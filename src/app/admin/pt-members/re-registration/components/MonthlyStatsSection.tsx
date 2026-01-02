"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Pause,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MonthlyStats } from "../types";

interface Props {
  stats: MonthlyStats;
  getMonthlyStats: (month: string) => MonthlyStats;
  hideHeaderCard?: boolean;
}

export function MonthlyStatsSection({ stats, getMonthlyStats }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const currentStats =
    selectedMonth === stats.month ? stats : getMonthlyStats(selectedMonth);
  const isAboveTarget = currentStats.reRegistrationRate >= currentStats.targetRate;

  const navigateMonth = (direction: "prev" | "next") => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const newDate = new Date(year, month - 1 + (direction === "next" ? 1 : -1));
    setSelectedMonth(
      `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    return `${year}년 ${parseInt(month)}월`;
  };

  const reasonLabels: Record<string, string> = {
    cost: "비용",
    time: "시간",
    effectDoubt: "효과 의문",
    selfTraining: "혼자 운동",
    otherGym: "다른 곳",
    personalReason: "개인 사정",
    other: "기타",
  };

  const sortedReasons = Object.entries(currentStats.reasonAnalysis)
    .map(([key, count]) => ({
      key,
      label: reasonLabels[key] || key,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const totalReasons = sortedReasons.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 월 선택 네비게이션 - 더 세련된 디자인 */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateMonth("prev")}
          className="hover:bg-blue-50 hover:text-blue-600 rounded-xl"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">분석 기간</span>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            {formatMonth(selectedMonth)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateMonth("next")}
          className="hover:bg-blue-50 hover:text-blue-600 rounded-xl"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* 요약 카드 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "대상자", value: currentStats.targetCount, color: "blue", icon: Users },
          { label: "재등록", value: currentStats.reRegisteredCount, color: "emerald", icon: RefreshCw },
          { label: "휴회", value: currentStats.pausedCount, color: "amber", icon: Pause },
          { label: "종료", value: currentStats.terminatedCount, color: "red", icon: XCircle },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm group hover:shadow-md transition-all">
            <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center transition-colors ${
              item.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' :
              item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' :
              item.color === 'amber' ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white' :
              'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white'
            }`}>
              <item.icon className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{item.value}<span className="text-sm font-normal text-slate-400 ml-1">명</span></p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 재등록률 성과 카드 */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 tracking-tight">재등록 성과</h3>
                <p className="text-xs text-slate-500 mt-0.5">목표 대비 달성률 분석</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-lg border-none">
              Goal {currentStats.targetRate}%
            </Badge>
          </div>

          {currentStats.targetCount === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Info className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">분석할 대상자가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-end gap-4">
                <div className="flex items-baseline gap-2">
                  <span className={`text-6xl font-black tracking-tighter ${isAboveTarget ? "text-emerald-600" : "text-red-600"}`}>
                    {currentStats.reRegistrationRate}
                  </span>
                  <span className={`text-2xl font-bold ${isAboveTarget ? "text-emerald-600" : "text-red-600"}`}>%</span>
                </div>
                <div className="pb-2">
                  {isAboveTarget ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold shadow-sm border border-emerald-100">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>목표 달성!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold shadow-sm border border-red-100">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>-{currentStats.targetRate - currentStats.reRegistrationRate}% 부족</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 하이엔드 프로그레스 디자인 */}
              <div className="space-y-3">
                <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
                  <div
                    className={`h-full rounded-full shadow-sm transition-all duration-1000 ease-out ${
                      isAboveTarget ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-red-400 to-red-600"
                    }`}
                    style={{ width: `${Math.min(currentStats.reRegistrationRate, 100)}%` }}
                  />
                  {/* 목표선 커스텀 디자인 */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-slate-900 z-10 shadow-[0_0_8px_rgba(0,0,0,0.2)]"
                    style={{ left: `${currentStats.targetRate}%` }}
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rounded-full"></div>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>0%</span>
                  <span className="text-slate-900" style={{ marginLeft: `${currentStats.targetRate - 10}%` }}>Target</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 미등록 사유 가로 차트 카드 */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <XCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 tracking-tight">이탈 원인 분석</h3>
              <p className="text-xs text-slate-500 mt-0.5">상담 시 기록된 주요 고민 요인</p>
            </div>
          </div>

          {totalReasons === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Info className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">기록된 이탈 사유가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {sortedReasons.map((reason, idx) => {
                const percentage = totalReasons > 0 ? Math.round((reason.count / totalReasons) * 100) : 0;
                return (
                  <div key={reason.key} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700">{reason.label}</span>
                      <span className="text-slate-400">{reason.count}건 ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out delay-${idx * 100} ${
                          idx === 0 ? "bg-blue-500" : idx === 1 ? "bg-blue-400" : "bg-blue-200"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 전략 카드 디자인 */}
      <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full -mr-48 -mt-48 blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/20 rounded-full -ml-32 -mb-32 blur-[80px]"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">재등록 마스터 전략</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-4 text-emerald-400 font-bold text-sm uppercase tracking-widest">
                <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-none">Focus</Badge>
                <span>성공 루틴</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  </div>
                  <span><strong>데이터 시각화:</strong> 변화 수치를 리포트로 만들어 공유하세요.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  </div>
                  <span><strong>미래 비전:</strong> &quot;다음 3개월&quot;의 목표를 구체적으로 제안하세요.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  </div>
                  <span><strong>심리적 준비:</strong> 잔여 30% 시점부터 미리 준비하세요.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-4 text-red-400 font-bold text-sm uppercase tracking-widest">
                <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-none">Warning</Badge>
                <span>주의 사항</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  </div>
                  <span><strong>급한 제안:</strong> 마지막 수업 날 묻는 것은 확률을 낮춥니다.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  </div>
                  <span><strong>할인 강조:</strong> 가격이 아니라 가치를 먼저 전달하세요.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  </div>
                  <span><strong>태도 변화:</strong> 거절하더라도 한결같이 친절하게 대하세요.</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-blue-400 font-bold italic">&quot;재등록 관리는 세일즈가 아니라, 더 나은 결과로 이끄는 진정성 있는 조언입니다.&quot;</p>
          </div>
        </div>
      </div>
    </div>
  );
}
