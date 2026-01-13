"use client";

import { useState } from "react";
import { X, Book, FileText, Dumbbell, RefreshCw, ChevronDown, ChevronUp, CheckCircle2, Clock, Target, Activity, Users, Calendar, ClipboardList, Sparkles, MessageSquare } from "lucide-react";
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
  color: string;
}

const sections: Section[] = [
  { id: "consultation", title: "상담 기록지 작성", icon: <FileText className="w-5 h-5" />, color: "blue" },
  { id: "ot", title: "OT 수업 기록", icon: <Dumbbell className="w-5 h-5" />, color: "amber" },
  { id: "pt", title: "PT 회원 관리", icon: <Activity className="w-5 h-5" />, color: "rose" },
  { id: "workflow", title: "회원 관리 흐름", icon: <RefreshCw className="w-5 h-5" />, color: "emerald" },
  { id: "tips", title: "기록 작성 팁", icon: <ClipboardList className="w-5 h-5" />, color: "indigo" },
];

export function MemberManualModal({ isOpen, onClose }: Props) {
  const [expandedSection, setExpandedSection] = useState<SectionId | null>("consultation");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
          <div className="flex items-center gap-3">
            <Book className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-slate-900">회원 관리 매뉴얼</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
          {sections.map((section) => {
            const isExpanded = expandedSection === section.id;
            return (
              <div key={section.id} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg text-white", 
                      section.color === "blue" ? "bg-blue-500" :
                      section.color === "amber" ? "bg-amber-500" :
                      section.color === "rose" ? "bg-rose-500" :
                      section.color === "emerald" ? "bg-emerald-500" : "bg-indigo-500"
                    )}>
                      {section.icon}
                    </div>
                    <span className="font-bold text-slate-800">{section.title}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 space-y-4 border-t border-slate-100">
                    {section.id === "consultation" && (
                      <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                          <h4 className="font-black text-blue-900 mb-2">상담 기록지 작성 방법</h4>
                          <ul className="space-y-2 text-slate-700">
                            <li>• 회원의 운동 목표와 현재 상태를 정확히 파악하세요</li>
                            <li>• 기존 부상 이력이나 주의사항을 반드시 기록하세요</li>
                            <li>• 회원의 선호 운동 스타일과 시간대를 확인하세요</li>
                            <li>• 상담 내용은 간결하고 명확하게 작성하세요</li>
                          </ul>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl">
                          <h4 className="font-black text-slate-900 mb-2">필수 기록 항목</h4>
                          <ul className="space-y-1 text-slate-600">
                            <li>✓ 운동 목표 (체중 감량, 근력 증가, 재활 등)</li>
                            <li>✓ 현재 운동 경험 및 수준</li>
                            <li>✓ 건강 상태 및 주의사항</li>
                            <li>✓ 선호하는 운동 시간대</li>
                            <li>✓ 기대하는 결과 및 목표 기간</li>
                          </ul>
                        </div>
                      </div>
                    )}
                    {section.id === "ot" && (
                      <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                          <h4 className="font-black text-amber-900 mb-2">OT 수업 기록 가이드</h4>
                          <ul className="space-y-2 text-slate-700">
                            <li>• 회원의 초기 체형 및 자세를 사진으로 기록하세요</li>
                            <li>• 인바디 측정 결과를 상세히 기록하세요</li>
                            <li>• 운동 프로그램 초안을 작성하고 회원과 공유하세요</li>
                            <li>• 회원의 피드백과 반응을 기록하세요</li>
                          </ul>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl">
                          <h4 className="font-black text-slate-900 mb-2">OT 체크리스트</h4>
                          <ul className="space-y-1 text-slate-600">
                            <li>✓ 인바디 측정 및 기록</li>
                            <li>✓ 체형 분석 및 사진 촬영</li>
                            <li>✓ 운동 프로그램 초안 작성</li>
                            <li>✓ 회원 목표 및 기대사항 확인</li>
                            <li>✓ 첫 PT 수업 일정 확정</li>
                          </ul>
                        </div>
                      </div>
                    )}
                    {section.id === "pt" && (
                      <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                          <h4 className="font-black text-rose-900 mb-2">PT 회원 관리 핵심</h4>
                          <ul className="space-y-2 text-slate-700">
                            <li>• 매 수업 후 회원의 진행 상황을 기록하세요</li>
                            <li>• 회원의 컨디션과 피드백을 확인하고 반영하세요</li>
                            <li>• 운동 프로그램을 회원의 진행도에 맞게 조정하세요</li>
                            <li>• 정기적으로 목표 달성도를 점검하세요</li>
                          </ul>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl">
                          <h4 className="font-black text-slate-900 mb-2">수업 기록 필수 사항</h4>
                          <ul className="space-y-1 text-slate-600">
                            <li>✓ 오늘 수행한 운동 내용 및 세트/횟수</li>
                            <li>✓ 회원의 컨디션 및 피드백</li>
                            <li>✓ 다음 수업 계획 및 준비사항</li>
                            <li>✓ 특이사항 및 주의할 점</li>
                          </ul>
                        </div>
                      </div>
                    )}
                    {section.id === "workflow" && (
                      <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                          <h4 className="font-black text-emerald-900 mb-2">회원 관리 흐름도</h4>
                          <div className="space-y-3 text-slate-700">
                            <div className="flex items-start gap-3">
                              <span className="font-black text-emerald-600">1단계</span>
                              <div>
                                <p className="font-bold">상담 및 등록</p>
                                <p className="text-xs text-slate-500">회원 정보 입력, 목표 설정, 상담 기록 작성</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <span className="font-black text-emerald-600">2단계</span>
                              <div>
                                <p className="font-bold">OT 수업 진행</p>
                                <p className="text-xs text-slate-500">인바디 측정, 체형 분석, 초기 프로그램 작성</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <span className="font-black text-emerald-600">3단계</span>
                              <div>
                                <p className="font-bold">정기 PT 수업</p>
                                <p className="text-xs text-slate-500">프로그램 진행, 기록 관리, 목표 점검</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <span className="font-black text-emerald-600">4단계</span>
                              <div>
                                <p className="font-bold">재평가 및 조정</p>
                                <p className="text-xs text-slate-500">정기 인바디, 목표 재설정, 프로그램 업데이트</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {section.id === "tips" && (
                      <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                          <h4 className="font-black text-indigo-900 mb-2">효과적인 기록 작성 팁</h4>
                          <ul className="space-y-2 text-slate-700">
                            <li>• <strong>구체적으로 기록:</strong> "좋았다"보다 "상체 근력이 향상되어 바벨 무게를 5kg 증가시킬 수 있었다"</li>
                            <li>• <strong>정기적으로 업데이트:</strong> 매 수업 후 즉시 기록하는 습관을 기르세요</li>
                            <li>• <strong>회원 피드백 반영:</strong> 회원의 말을 그대로 기록하고 분석하세요</li>
                            <li>• <strong>사진 활용:</strong> 변화를 시각적으로 확인할 수 있도록 정기적으로 사진을 촬영하세요</li>
                          </ul>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl">
                          <h4 className="font-black text-slate-900 mb-2">주의사항</h4>
                          <ul className="space-y-1 text-slate-600">
                            <li>⚠️ 개인정보 보호: 기록은 안전하게 관리하세요</li>
                            <li>⚠️ 객관적 기록: 주관적 판단보다 사실 중심으로 기록하세요</li>
                            <li>⚠️ 정기 점검: 주기적으로 기록을 검토하고 개선하세요</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end">
          <Button onClick={onClose}>닫기</Button>
        </div>
      </div>
    </div>
  );
}
