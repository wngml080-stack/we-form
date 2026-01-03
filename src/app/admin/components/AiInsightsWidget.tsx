"use client";

import { useState } from "react";
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, ChevronRight, RefreshCw, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AiInsightsWidgetProps {
  stats: any;
  gymName: string;
}

export function AiInsightsWidget({ stats, gymName }: AiInsightsWidgetProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRefresh = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 2000);
  };

  const insights = [
    {
      type: "opportunity",
      icon: TrendingUp,
      title: "재등록 가능성 높은 회원",
      description: "이번 주 만료 예정인 회원 5명 중 3명이 최근 출석률 90%를 기록했습니다. 재등록 상담을 제안해보세요.",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      badge: "매출 기회"
    },
    {
      type: "warning",
      icon: AlertCircle,
      title: "이탈 위험군 감지",
      description: "최근 2주간 출석이 없는 회원이 8명 발견되었습니다. 안부 문자를 통해 케어가 필요한 시점입니다.",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      badge: "회원 관리"
    },
    {
      type: "info",
      icon: CheckCircle2,
      title: "운영 효율성 분석",
      description: "화요일 오후 7시 수업의 노쇼(No-show) 발생률이 평소보다 20% 높습니다. 예약 알림 시간을 조정해보는 건 어떨까요?",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      badge: "운영 최적화"
    }
  ];

  return (
    <Card className="relative overflow-hidden border border-slate-100 hover:shadow-[0_8px_16px_rgba(0,0,0,0.06),0_16px_32px_rgba(0,0,0,0.08)] transition-all duration-300 ease-bounce-in shadow-xl bg-white rounded-[32px] p-6 lg:p-8">
      {/* Background decoration - More dynamic */}
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
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">We:form AI Analyst Intelligence</p>
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
              <p className="text-lg font-black text-slate-900 tracking-tight">데이터를 치밀하게 분석 중입니다...</p>
              <p className="text-sm font-bold text-slate-400">{gymName}의 모든 운영 로그를 대조하고 있어요.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.map((insight, index) => (
              <div 
                key={index}
                className={cn(
                  "group relative p-6 rounded-[32px] border-2 border-transparent transition-all cursor-pointer hover:shadow-2xl hover:-translate-y-1 overflow-hidden",
                  insight.bgColor,
                  "hover:border-white shadow-sm"
                )}
              >
                {/* Subtle shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-md group-hover:scale-110 transition-transform duration-300", insight.color)}>
                      <insight.icon className="w-6 h-6" />
                    </div>
                    <Badge variant="outline" className="bg-white/80 border-none text-[10px] font-black uppercase tracking-tighter shadow-sm px-3 py-1">
                      {insight.badge}
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
            ))}
          </div>
        )}

        {!isAnalyzing && (
          <div className="pt-6 flex items-center justify-between border-t border-slate-100/50 mt-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Last Intelligence Update: {new Date().toLocaleTimeString('ko-KR')}
              </p>
            </div>
            <Button variant="ghost" className="h-10 px-5 rounded-2xl bg-slate-50 text-xs font-black text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all group">
              상세 분석 리포트 보기
              <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

