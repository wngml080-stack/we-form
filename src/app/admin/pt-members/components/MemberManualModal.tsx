"use client";

import { useState } from "react";
import { X, Book, FileText, Dumbbell, RefreshCw, ChevronDown, ChevronUp, CheckCircle2, Target, Activity, ClipboardList, Sparkles, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type SectionId = "consultation" | "ot" | "pt" | "workflow" | "tips";

interface Section {
  id: SectionId;
  title: string;
  icon: React.ReactNode;
}

const sections: Section[] = [
  { id: "consultation", title: "상담 기록지 작성", icon: <FileText className="w-5 h-5" /> },
  { id: "ot", title: "OT 수업 기록", icon: <Dumbbell className="w-5 h-5" /> },
  { id: "pt", title: "PT 회원 관리", icon: <Activity className="w-5 h-5" /> },
  { id: "workflow", title: "회원 관리 흐름", icon: <RefreshCw className="w-5 h-5" /> },
  { id: "tips", title: "기록 작성 팁", icon: <ClipboardList className="w-5 h-5" /> },
];

export function MemberManualModal({ isOpen, onClose }: Props) {
  const [expandedSection, setExpandedSection] = useState<SectionId | null>("workflow");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191F28]/30 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border-none animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between px-10 py-10 border-b border-[var(--border-light)]">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-[24px] bg-[var(--primary-light-hex)] flex items-center justify-center shadow-sm">
              <Book className="w-7 h-7 text-[var(--primary-hex)]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">회원 관리 매뉴얼</h2>
              <p className="text-base text-[var(--foreground-muted)] font-bold tracking-tight opacity-70">성공적인 센터 운영을 위한 표준 가이드라인</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 flex items-center justify-center bg-[var(--background-secondary)] rounded-full hover:bg-[var(--background-tertiary)] transition-all active:scale-90"
          >
            <X className="w-6 h-6 text-[var(--foreground-muted)]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
          {sections.map((section) => {
            const isExpanded = expandedSection === section.id;
            return (
              <div key={section.id} className={cn(
                "rounded-[32px] transition-all duration-300 border overflow-hidden",
                isExpanded ? "border-[var(--primary-hex)] bg-[var(--primary-light-hex)]/30" : "border-[var(--border-light)] bg-white hover:border-[var(--border)]"
              )}>
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                  className="w-full flex items-center justify-between px-8 py-6 transition-all"
                >
                  <div className="flex items-center gap-5">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-all", 
                      isExpanded ? "bg-[var(--primary-hex)] text-white" : "bg-[var(--background-secondary)] text-[var(--foreground-subtle)]"
                    )}>
                      {section.icon}
                    </div>
                    <span className={cn("text-xl font-extrabold tracking-tight", 
                      isExpanded ? "text-[var(--foreground)]" : "text-[var(--foreground-secondary)]"
                    )}>{section.title}</span>
                  </div>
                  {isExpanded ? (
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <ChevronUp className="w-5 h-5 text-[var(--primary-hex)]" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--background-secondary)] flex items-center justify-center">
                      <ChevronDown className="w-5 h-5 text-[var(--foreground-subtle)]" />
                    </div>
                  )}
                </button>
                {isExpanded && (
                  <div className="px-8 pb-8 pt-2 animate-in slide-in-from-top-2 duration-300">
                    {section.id === "consultation" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-[24px] border border-[var(--primary-hex)]/10 shadow-sm">
                          <h4 className="text-base font-extrabold text-[var(--primary-hex)] mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> 작성 가이드
                          </h4>
                          <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-sm text-[var(--foreground-secondary)] font-bold">
                              <span className="text-[var(--primary-hex)]">•</span>
                              회원의 운동 목표와 현재 상태를 정확히 파악하세요
                            </li>
                            <li className="flex items-start gap-3 text-sm text-[var(--foreground-secondary)] font-bold">
                              <span className="text-[var(--primary-hex)]">•</span>
                              기존 부상 이력이나 주의사항을 반드시 기록하세요
                            </li>
                            <li className="flex items-start gap-3 text-sm text-[var(--foreground-secondary)] font-bold">
                              <span className="text-[var(--primary-hex)]">•</span>
                              회원의 선호 운동 스타일과 시간대를 확인하세요
                            </li>
                          </ul>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-[24px] border border-[var(--border-light)] shadow-sm">
                          <h4 className="text-base font-extrabold text-[var(--foreground)] mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 필수 항목
                          </h4>
                          <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-sm text-[var(--foreground-muted)] font-bold">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              운동 목표 및 현재 운동 경험
                            </li>
                            <li className="flex items-center gap-3 text-sm text-[var(--foreground-muted)] font-bold">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              건강 상태 및 주의사항
                            </li>
                            <li className="flex items-center gap-3 text-sm text-[var(--foreground-muted)] font-bold">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              기대 결과 및 목표 기간
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                    {section.id === "ot" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-[24px] border border-amber-100 shadow-sm">
                          <h4 className="text-base font-extrabold text-amber-600 mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> 기록 가이드
                          </h4>
                          <ul className="space-y-3 text-sm text-[var(--foreground-secondary)] font-bold">
                            <li>• 회원의 초기 체형 및 자세를 사진으로 기록하세요</li>
                            <li>• 인바디 측정 결과를 상세히 기록하세요</li>
                            <li>• 운동 프로그램 초안을 작성하고 회원과 공유하세요</li>
                          </ul>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-[24px] border border-[var(--border-light)] shadow-sm">
                          <h4 className="text-base font-extrabold text-[var(--foreground)] mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-amber-500" /> 체크리스트
                          </h4>
                          <ul className="space-y-3 text-sm text-[var(--foreground-muted)] font-bold">
                            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 인바디 측정 및 체형 분석</li>
                            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 초기 운동 프로그램 설계</li>
                            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 첫 PT 수업 일정 확정</li>
                          </ul>
                        </div>
                      </div>
                    )}
                    {section.id === "pt" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-[24px] border border-rose-100 shadow-sm">
                          <h4 className="text-base font-extrabold text-rose-600 mb-4 flex items-center gap-2">
                            <Target className="w-4 h-4" /> 관리 핵심
                          </h4>
                          <ul className="space-y-3 text-sm text-[var(--foreground-secondary)] font-bold">
                            <li>• 매 수업 후 회원의 진행 상황을 즉시 기록하세요</li>
                            <li>• 회원의 컨디션과 피드백을 실시간 반영하세요</li>
                            <li>• 정기적으로 목표 달성도를 점검하고 공유하세요</li>
                          </ul>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-[24px] border border-[var(--border-light)] shadow-sm">
                          <h4 className="text-base font-extrabold text-[var(--foreground)] mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-rose-500" /> 필수 기록
                          </h4>
                          <ul className="space-y-3 text-sm text-[var(--foreground-muted)] font-bold">
                            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> 수행 운동 종목 및 강도</li>
                            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> 회원 피드백 및 특이사항</li>
                            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> 다음 수업 계획</li>
                          </ul>
                        </div>
                      </div>
                    )}
                    {section.id === "workflow" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          {[
                            { step: "1단계", title: "상담/등록", desc: "정보 입력 및 목표 설정" },
                            { step: "2단계", title: "OT 진행", desc: "체형분석 및 초기 설계" },
                            { step: "3단계", title: "PT 수업", desc: "프로그램 실행 및 기록" },
                            { step: "4단계", title: "재평가", desc: "성과 분석 및 재등록" },
                          ].map((item, i) => (
                            <div key={i} className="bg-white p-5 rounded-[24px] border border-emerald-100 shadow-sm relative">
                              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{item.step}</span>
                              <h5 className="font-extrabold text-[var(--foreground)] mt-1">{item.title}</h5>
                              <p className="text-[11px] text-[var(--foreground-muted)] font-bold mt-1 leading-tight">{item.desc}</p>
                              {i < 3 && <div className="hidden sm:block absolute top-1/2 -right-4 -translate-y-1/2 z-10"><ArrowRight className="w-4 h-4 text-emerald-200" /></div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {section.id === "tips" && (
                      <div className="space-y-6">
                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-[24px] border border-indigo-100 shadow-sm">
                          <h4 className="text-base font-extrabold text-indigo-600 mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> 효과적인 작성 팁
                          </h4>
                          <ul className="space-y-4 text-sm text-[var(--foreground-secondary)] font-bold">
                            <li className="flex gap-3">
                              <span className="text-indigo-400">01</span>
                              <span><strong>데이터 기반 기록:</strong> "좋았다"보다는 수치와 구체적인 변화를 기록하세요.</span>
                            </li>
                            <li className="flex gap-3">
                              <span className="text-indigo-400">02</span>
                              <span><strong>실시간 업데이트:</strong> 기억이 생생할 때 매 수업 직후 기록하는 습관을 들이세요.</span>
                            </li>
                            <li className="flex gap-3">
                              <span className="text-indigo-400">03</span>
                              <span><strong>시각 자료 활용:</strong> 인바디 변화나 체형 사진을 활용해 성과를 증명하세요.</span>
                            </li>
                          </ul>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-100">
                          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                          <p className="text-xs text-rose-700 font-bold">개인정보가 포함된 기록은 외부에 노출되지 않도록 각별히 주의하시기 바랍니다.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-10 py-8 bg-[var(--background-secondary)]/30 border-t border-[var(--border-light)] flex justify-end">
          <Button 
            onClick={onClose}
            className="h-14 px-12 rounded-2xl bg-[var(--foreground)] hover:bg-black font-extrabold text-white text-base shadow-lg transition-all active:scale-[0.98]"
          >
            이해했습니다
          </Button>
        </div>
      </div>
    </div>
  );
}
