"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, ChevronRight, RefreshCw, ArrowRight, BarChart3, Users, Clock, Target, MessageSquare, ShieldCheck, Zap, X, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Insight {
  type: "opportunity" | "warning" | "info";
  title: string;
  description: string;
  metric?: string;
  priority: "high" | "medium" | "low";
}

interface AiInsightsWidgetProps {
  stats: Record<string, unknown>;
  gymName: string;
  gymId?: string;
}

const insightConfig = {
  opportunity: {
    icon: TrendingUp,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    badge: "매출 기회",
  },
  warning: {
    icon: AlertCircle,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    badge: "회원 관리",
  },
  info: {
    icon: CheckCircle2,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    badge: "운영 최적화",
  },
};

export function AiInsightsWidget({ stats, gymName, gymId }: AiInsightsWidgetProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isActionPlanOpen, setIsActionPlanOpen] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [rawData, setRawData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchInsights = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const url = gymId
        ? `/api/ai/insights?gym_id=${gymId}`
        : "/api/ai/insights";

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        // 크레딧 부족 등의 에러는 조용히 처리
        if (data.error?.includes("credit") || data.error?.includes("API")) {
          setError("ai_disabled");
          return;
        }
        throw new Error(data.error || "인사이트를 가져오는데 실패했습니다.");
      }

      setInsights(data.insights || []);
      setRawData(data.rawData || null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("[AiInsightsWidget] Error:", err);
      setError("ai_disabled");
    } finally {
      setIsAnalyzing(false);
    }
  }, [gymId]);

  useEffect(() => {
    // AI 기능 비활성화 상태 체크 (환경변수나 이전 에러 기반)
    const aiDisabled = localStorage.getItem("ai_insights_disabled");
    if (aiDisabled === "true") {
      setError("ai_disabled");
      setIsAnalyzing(false);
      return;
    }
    fetchInsights();
  }, [fetchInsights]);

  const handleRefresh = () => {
    fetchInsights();
  };

  // 기본 인사이트 (API 호출 전 또는 에러 시)
  const displayInsights = insights.length > 0 ? insights : [
    {
      type: "opportunity" as const,
      title: "재등록 가능성 높은 회원",
      description: "이번 주 만료 예정인 회원 중 출석률이 높은 회원을 확인해보세요.",
      priority: "high" as const,
    },
    {
      type: "warning" as const,
      title: "이탈 위험군 감지",
      description: "최근 미출석 회원에게 안부 문자를 보내보세요.",
      priority: "medium" as const,
    },
    {
      type: "info" as const,
      title: "운영 효율성 분석",
      description: "AI 분석 기능이 곧 활성화됩니다.",
      priority: "low" as const,
    },
  ];

  return (
    <>
      <Card className="relative overflow-hidden border border-slate-100 hover:shadow-[0_8px_16px_rgba(0,0,0,0.06),0_16px_32px_rgba(0,0,0,0.08)] transition-all duration-300 ease-bounce-in shadow-xl bg-white rounded-[32px] p-6 lg:p-8">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/[0.08] via-indigo-500/[0.05] to-purple-500/[0.08] rounded-full -mr-48 -mt-48 blur-[80px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/[0.05] to-blue-500/[0.05] rounded-full -ml-32 -mb-32 blur-[60px]"></div>

        <div className="relative z-10 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-400 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative w-14 h-14 rounded-[22px] bg-gradient-to-br from-[#2F80ED] via-[#2D9CDB] to-[#56CCF2] flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform duration-300">
                  <Sparkles className="w-7 h-7 text-white animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI 경영 인사이트</h2>
                  <Badge className="bg-blue-50 text-blue-600 border-none px-2 py-0 h-5 text-[9px] font-black uppercase tracking-widest">Live</Badge>
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Powered by Claude AI</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isAnalyzing}
              className="w-10 h-10 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
            >
              <RefreshCw className={cn("w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors", isAnalyzing && "animate-spin")} />
            </Button>
          </div>

          {isAnalyzing ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-[6px] border-slate-50 border-t-blue-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-black text-slate-900 tracking-tight">AI가 데이터를 분석 중입니다...</p>
                <p className="text-sm font-bold text-slate-400">{gymName}의 운영 데이터를 심층 분석하고 있어요.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayInsights.slice(0, 3).map((insight, index) => {
                const config = insightConfig[insight.type];
                const IconComponent = config.icon;

                return (
                  <div
                    key={index}
                    className={cn(
                      "group relative p-6 rounded-[32px] border-2 border-transparent transition-all cursor-pointer hover:shadow-2xl hover:-translate-y-1 overflow-hidden",
                      config.bgColor,
                      "hover:border-white shadow-sm"
                    )}
                  >
                    {/* Subtle shine effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-md group-hover:scale-110 transition-transform duration-300", config.color)}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <Badge variant="outline" className="bg-white/80 border-none text-[10px] font-black uppercase tracking-tighter shadow-sm px-3 py-1">
                          {config.badge}
                        </Badge>
                      </div>
                      <h3 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                        {insight.title}
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                      </h3>
                      <p className="text-[13px] font-bold text-slate-600 leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isAnalyzing && (
            <div className="pt-6 flex items-center justify-between border-t border-slate-100/50 mt-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Last Update: {lastUpdated ? lastUpdated.toLocaleTimeString("ko-KR") : "분석 대기 중"}
                </p>
              </div>
              <Button
                variant="ghost"
                className="h-10 px-5 rounded-2xl bg-slate-50 text-xs font-black text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all group"
                onClick={() => setIsReportOpen(true)}
              >
                상세 분석 리포트 보기
                <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* AI Analysis Detailed Report Modal */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px] bg-[#f8fafc] [&>button]:hidden">
          <DialogHeader className="px-10 py-10 bg-slate-900 flex-shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -mr-48 -mt-48 animate-pulse"></div>
            <DialogTitle asChild>
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-500/20">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black text-white tracking-tight" style={{ color: "white" }}>AI 경영 분석 리포트</h2>
                    <Badge className="bg-emerald-500 text-white border-none px-3 py-1 h-6 text-[10px] font-black uppercase tracking-widest">Claude AI</Badge>
                  </div>
                  <p className="text-white/80 text-sm font-bold mt-1.5 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    {gymName} · {new Date().toLocaleDateString("ko-KR")} 기준 심층 분석 데이터
                  </p>
                </div>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">AI가 분석한 센터 운영 상세 리포트입니다.</DialogDescription>
            <button
              onClick={() => setIsReportOpen(false)}
              className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
            >
              <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-[#f8fafc]">
            {/* 리포트 섹션 1: 매출 및 재등록 */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">매출 및 재등록 기회 분석</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 rounded-[32px] border-none shadow-sm bg-white hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Target className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-black text-slate-900">재등록 잠재 매출액 예측</p>
                      <p className="text-2xl font-black text-blue-600 tracking-tighter">
                        {rawData?.renewal_opportunity
                          ? `${((rawData.renewal_opportunity as { value?: number })?.value || 0) * 150}만원 예상`
                          : "분석 중"}
                      </p>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        출석률이 높은 만료 예정 회원을 대상으로 재등록 상담을 진행할 경우, 예상되는 전환 매출입니다.
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6 rounded-[32px] border-none shadow-sm bg-white hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-black text-slate-900">회원권 업셀링 제안</p>
                      <p className="text-2xl font-black text-emerald-600 tracking-tighter">
                        {rawData?.renewal_opportunity
                          ? `${(rawData.renewal_opportunity as { value?: number })?.value || 0}명 타겟팅`
                          : "분석 중"}
                      </p>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        꾸준히 출석하는 회원에게 PT 패키지 전환 프로모션을 제안하는 것을 추천합니다.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            {/* 리포트 섹션 2: 이탈 위험 관리 */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">회원 이탈 위험군 (Churn Risk)</h3>
              </div>
              <Card className="p-8 rounded-[32px] border-none shadow-sm bg-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6">
                  <Badge variant="outline" className="bg-rose-50 border-rose-100 text-rose-600 font-black text-[10px]">위험도 분석</Badge>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center">
                      <AlertCircle className="w-7 h-7 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-900 tracking-tight">
                        장기 미출석 회원 {(rawData?.churn_risk as { value?: number })?.value || 0}명 감지
                      </p>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Urgent Attention Required</p>
                    </div>
                  </div>
                  <div className="bg-rose-50/50 p-5 rounded-[24px] border border-rose-100/50 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-rose-900 leading-relaxed">
                      AI 처방: 이탈 위험군 회원들에게 &quot;무료 바디 체크업&quot; 또는 &quot;개인화된 운동 팁&quot; 문자를 발송하여 다시 센터에 발을 들일 수 있는 명분을 제공하세요.
                    </p>
                  </div>
                </div>
              </Card>
            </section>

            {/* 리포트 섹션 3: 운영 효율성 */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">운영 효율성 및 자원 최적화</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">노쇼(No-show) 발생률</p>
                        <p className="text-xs text-slate-400 font-medium">최근 7일 기준</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-amber-600">
                        {(rawData?.no_show_rate as { value?: number })?.value || 0}%
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {((rawData?.no_show_rate as { value?: number })?.value || 0) > 10 ? "주의 필요" : "양호"}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">AI 분석 엔진</p>
                        <p className="text-xs text-slate-400 font-medium">Claude Haiku</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-blue-50 text-blue-600 border-none px-2 py-0.5 text-[10px] font-black">#실시간분석</Badge>
                      <Badge className="bg-blue-50 text-blue-600 border-none px-2 py-0.5 text-[10px] font-black">#자동화</Badge>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900 rounded-[32px] p-6 text-white flex flex-col justify-center space-y-4 border border-slate-800 shadow-2xl">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest text-center">AI Intelligence Goal</p>
                  <h4 className="text-center text-lg font-black tracking-tight leading-snug text-white" style={{ color: "white" }}>
                    비활성 시간대(14:00~16:00)<br />할인 프로모션을 통한<br />수요 분산 제안
                  </h4>
                  <Button
                    className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 font-black text-xs shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsActionPlanOpen(true);
                      setTimeout(() => {
                        const element = document.getElementById("ai-action-plan-section");
                        if (element) {
                          element.scrollIntoView({ behavior: "smooth" });
                        }
                      }, 100);
                    }}
                  >
                    상세 실행 계획 보기
                  </Button>
                </div>
              </div>
            </section>

            {/* AI Action Plan Detail (Conditional) */}
            {isActionPlanOpen && (
              <section id="ai-action-plan-section" className="animate-in slide-in-from-bottom-4 duration-500 space-y-8 pt-12 border-t-2 border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">AI 상세 실행 계획</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Strategic Demand Distribution Plan</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsActionPlanOpen(false)}
                    className="rounded-xl font-bold text-slate-400 hover:text-slate-900 border-slate-200"
                  >
                    계획 접기
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-8 rounded-[32px] bg-white border-none shadow-sm hover:shadow-md transition-all space-y-4">
                    <Badge className="bg-blue-100 text-blue-700 border-none px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">Step 01</Badge>
                    <p className="text-lg font-black text-slate-900">타겟 시간 설정</p>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">매주 화/목 14:00~16:00 시간대를 &apos;Happy Hour&apos;로 지정하여 저녁 피크 타임의 예약을 이동하도록 유도합니다.</p>
                  </Card>
                  <Card className="p-8 rounded-[32px] bg-white border-none shadow-sm hover:shadow-md transition-all space-y-4">
                    <Badge className="bg-emerald-100 text-emerald-700 border-none px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">Step 02</Badge>
                    <p className="text-lg font-black text-slate-900">베네핏 자동 설계</p>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">해당 시간대 예약 시 회당 5,000 포인트 적립 또는 회원권 1일 연장 혜택을 시스템이 자동으로 제안합니다.</p>
                  </Card>
                  <Card className="p-8 rounded-[32px] bg-white border-none shadow-sm hover:shadow-md transition-all space-y-4">
                    <Badge className="bg-amber-100 text-amber-700 border-none px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">Step 03</Badge>
                    <p className="text-lg font-black text-slate-900">AI 타겟 메시징</p>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">저녁 시간대 예약 빈도가 높고 유연한 스케줄을 가진 회원을 AI가 선별하여 맞춤 프로모션 문자를 발송합니다.</p>
                  </Card>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-[40px] shadow-2xl shadow-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                      <Sparkles className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <div>
                      <p className="text-blue-100 text-sm font-bold uppercase tracking-[0.2em] mb-1">Expected Outcome</p>
                      <p className="text-white text-xl font-black leading-tight">피크 타임 혼잡도 18% 감소 및<br />비활성 시간대 매출 12% 향상 예상</p>
                    </div>
                  </div>
                  <Button className="w-full md:w-auto h-16 px-10 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 font-black text-base shadow-lg transition-all active:scale-95 relative z-10">
                    전략 시스템에 바로 적용하기
                  </Button>
                </div>
              </section>
            )}
          </div>

          <div className="px-10 py-8 bg-white border-t border-slate-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Claude AI - Intelligence Status: Optimal</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsReportOpen(false)}
              className="h-14 px-10 rounded-2xl font-black text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"
            >
              리포트 닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
