"use client";

import { useState, useEffect } from "react";
import { FileText, Save, X, MessageSquare, Lightbulb, User, Calendar as CalendarIcon, Clock, CheckCircle2, Info, ChevronDown, ChevronUp, Target, TrendingUp, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ReRegistrationConsultation,
  createInitialConsultation,
  MemberReaction,
  ConcernFactors,
  calculateConsultationCompletion,
  concernResponses,
} from "../types";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    formData: Omit<ReRegistrationConsultation, "id" | "createdAt" | "updatedAt">
  ) => void;
  existingData?: ReRegistrationConsultation | null;
}

export function ConsultationRecordModal({
  isOpen,
  onClose,
  onSave,
  existingData,
}: Props) {
  const [formData, setFormData] = useState(createInitialConsultation());
  const [isSaving, setIsSaving] = useState(false);
  const [showGuide, setShowGuide] = useState(true); // 기본적으로 열려있도록 설정

  useEffect(() => {
    if (isOpen) {
      if (existingData) {
        const { id, createdAt, updatedAt, ...rest } = existingData;
        setFormData(rest);
      } else {
        setFormData(createInitialConsultation());
      }
    }
  }, [isOpen, existingData]);

  const updateField = <K extends keyof typeof formData>(
    key: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateConcernFactor = (
    key: keyof ConcernFactors,
    value: boolean | string
  ) => {
    setFormData((prev) => ({
      ...prev,
      concernFactors: { ...prev.concernFactors, [key]: value },
    }));
  };

  const updateChecklistItem = (stageIndex: number, itemKey: string, value: boolean) => {
    setFormData((prev) => {
      const newChecklists = [...prev.stageChecklists];
      const stage = { ...newChecklists[stageIndex] };
      stage.items = { ...stage.items, [itemKey]: value };
      newChecklists[stageIndex] = stage as any;
      return { ...prev, stageChecklists: newChecklists };
    });
  };

  const handleSave = async () => {
    if (!formData.memberName.trim()) {
      alert("회원명을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      onSave(formData);
      onClose();
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    const hasChanges =
      formData.memberName ||
      formData.memberReaction ||
      formData.responseStrategy;
    if (hasChanges && !confirm("작성 중인 내용을 닫으시겠습니까?")) {
      return;
    }
    onClose();
  };

  const completionRate = calculateConsultationCompletion(
    formData as ReRegistrationConsultation
  );

  const reactionOptions: {
    value: MemberReaction;
    label: string;
    emoji: string;
    color: string;
    bg: string;
    border: string;
  }[] = [
    {
      value: "positive",
      label: "긍정적",
      emoji: "😊",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    {
      value: "considering",
      label: "고민 중",
      emoji: "🤔",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    {
      value: "negative",
      label: "부정적",
      emoji: "😐",
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-200",
    },
  ];

  const concernOptions: {
    key: keyof Omit<ConcernFactors, "otherText">;
    label: string;
    emoji: string;
    response?: string;
  }[] = [
    { key: "cost", label: "비용 부담", emoji: "💰", response: concernResponses.cost },
    { key: "time", label: "시간 부족", emoji: "⏰", response: concernResponses.time },
    {
      key: "effectDoubt",
      label: "효과 의문",
      emoji: "📉",
      response: concernResponses.effectDoubt,
    },
    { key: "selfTraining", label: "혼자 운동", emoji: "🏃" },
    { key: "otherGym", label: "타 센터", emoji: "🔄" },
    { key: "personalReason", label: "개인 사정", emoji: "👤" },
    { key: "other", label: "기타", emoji: "📝" },
  ];

  const selectedConcernWithResponse = concernOptions.find(
    (c) =>
      formData.concernFactors[c.key as keyof typeof formData.concernFactors] &&
      c.response
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-white border-none shadow-2xl rounded-[40px]">
        {/* 헤더 */}
        <DialogHeader className="px-10 py-8 border-b bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="sr-only">재등록 상담 기록</DialogTitle>
          <DialogDescription className="sr-only">
            재등록 상담 기록 양식
          </DialogDescription>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-black !text-white tracking-tight">
                    재등록 상담 기록
                  </h2>
                  {formData.progressPercentage > 0 && formData.progressPercentage <= 30 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 rounded-lg backdrop-blur-md border border-orange-400/30">
                      <Target className="w-3 h-3 text-orange-300" />
                      <span className="text-xs font-black text-orange-200 uppercase tracking-widest">
                        {formData.progressPercentage <= 10 ? "마감 임박" : "30% 핵심 타이밍"}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg backdrop-blur-md border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                    <span className="text-xs font-black text-blue-100 uppercase tracking-widest">
                      {completionRate}% Complete
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-400 font-bold mt-1">
                  {existingData ? "기존 기록을 수정합니다" : "회원의 소중한 목소리를 기록하세요"}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
            >
              <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </DialogHeader>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-[#f8fafc]">
          {/* 재등록 가이드 (접을 수 있는 섹션) */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[32px] p-6 border border-blue-100 shadow-sm">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-blue-600" />
                <span className="text-base font-black text-slate-900">재등록 관리 가이드</span>
              </div>
              {showGuide ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
            {showGuide && (
              <div className="mt-6 space-y-6 text-sm text-slate-700 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* 왜 30%인가? 분석표 */}
                <div className="bg-white/60 rounded-2xl p-5 space-y-4 border border-blue-100/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <p className="font-black text-slate-900">왜 30% 시점인가?</p>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-blue-100">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-blue-100/50 text-blue-900">
                          <th className="px-3 py-2 text-left font-black">시점</th>
                          <th className="px-3 py-2 text-left font-black">문제점 및 효과</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-50">
                        <tr>
                          <td className="px-3 py-2 font-bold text-slate-500">너무 빠름 (50%+)</td>
                          <td className="px-3 py-2 text-slate-600">아직 결과가 충분히 안 나와서 설득력 부족</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-bold text-slate-500">너무 늦음 (10%)</td>
                          <td className="px-3 py-2 text-slate-600">급하게 느껴져서 거부감 발생</td>
                        </tr>
                        <tr className="bg-blue-600 text-white font-bold">
                          <td className="px-3 py-2">30% (최적)</td>
                          <td className="px-3 py-2">충분한 변화 확인 + 여유 있는 결정 시간</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[11px] text-blue-600 font-bold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    신규 회원 유치 비용은 기존 유지 비용의 5~7배입니다.
                  </p>
                </div>

                {/* 단계별 목표 요약 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white/60 rounded-xl p-3 border border-slate-100">
                    <p className="font-bold text-slate-900 text-xs mb-1">Stage 1: 100% → 70%</p>
                    <p className="text-[11px] text-slate-600">신뢰 구축 & 작은 변화 인식</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3 border border-slate-100">
                    <p className="font-bold text-slate-900 text-xs mb-1">Stage 2: 70% → 50%</p>
                    <p className="text-[11px] text-slate-600">중간 점검 & 목표 재확인</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3 border-2 border-orange-200 shadow-sm shadow-orange-100">
                    <p className="font-bold text-orange-600 text-xs mb-1">Stage 3: 50% → 30% 🚨</p>
                    <p className="text-[11px] text-slate-600">재등록 상담 시작 (핵심 타이밍)</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3 border border-slate-100">
                    <p className="font-bold text-slate-900 text-xs mb-1">Stage 4: 30% → 10%</p>
                    <p className="text-[11px] text-slate-600">최종 결정 유도</p>
                  </div>
                </div>

                {/* DO / DON'T 팁 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100">
                    <p className="font-black text-emerald-700 text-xs mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> DO ✅ (권장사항)
                    </p>
                    <ul className="space-y-1.5 text-[11px] text-emerald-800 font-medium">
                      <li>• 변화 수치를 시각화해서 보여주기</li>
                      <li>• 3개월 후의 미래 비전 제시하기</li>
                      <li>• 혜택은 정보 제공 관점에서 전달</li>
                      <li>• 30% 시점부터 여유 있게 준비</li>
                    </ul>
                  </div>
                  <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100">
                    <p className="font-black text-rose-700 text-xs mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> DON'T ❌ (주의사항)
                    </p>
                    <ul className="space-y-1.5 text-[11px] text-rose-800 font-medium">
                      <li>• 마지막에 급하게 묻지 않기</li>
                      <li>• "하실 거죠?" 직접적 질문 피하기</li>
                      <li>• 혜택만 지나치게 강조하지 않기</li>
                      <li>• 거절 시 태도 변화 주의하기</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 섹션 1: 기본 정보 */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-3 text-lg font-black text-slate-900">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm">1</div>
                기본 상담 정보
              </h3>
              {formData.progressPercentage > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-black text-slate-600">
                    {formData.progressPercentage > 70 ? "Stage 1" : 
                     formData.progressPercentage > 50 ? "Stage 2" :
                     formData.progressPercentage > 30 ? "Stage 3 🚨" :
                     formData.progressPercentage > 10 ? "Stage 4" : "Stage 5"}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Member Name *</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    value={formData.memberName}
                    onChange={(e) => updateField("memberName", e.target.value)}
                    placeholder="회원명을 입력하세요"
                    className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Date</Label>
                <div className="relative group">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <Input
                    type="date"
                    value={formData.consultationDate}
                    onChange={(e) => updateField("consultationDate", e.target.value)}
                    className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Trainer</Label>
                <Input
                  value={formData.assignedTrainer}
                  onChange={(e) => updateField("assignedTrainer", e.target.value)}
                  placeholder="담당 트레이너"
                  className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Remaining Sessions</Label>
                <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-2xl">
                  <Input
                    type="number"
                    value={formData.remainingSessions || ""}
                    onChange={(e) => {
                      const remaining = parseInt(e.target.value) || 0;
                      updateField("remainingSessions", remaining);
                      if (formData.totalSessions > 0) {
                        const percentage = Math.round((remaining / formData.totalSessions) * 100);
                        updateField("progressPercentage", percentage);
                      }
                    }}
                    className="h-10 bg-white border-none rounded-xl font-bold text-center focus:ring-2 focus:ring-blue-100"
                    min={0}
                  />
                  <span className="text-slate-300 font-black">/</span>
                  <Input
                    type="number"
                    value={formData.totalSessions || ""}
                    onChange={(e) => {
                      const total = parseInt(e.target.value) || 0;
                      updateField("totalSessions", total);
                      if (total > 0 && formData.remainingSessions > 0) {
                        const percentage = Math.round((formData.remainingSessions / total) * 100);
                        updateField("progressPercentage", percentage);
                      }
                    }}
                    className="h-10 bg-white border-none rounded-xl font-bold text-center focus:ring-2 focus:ring-blue-100"
                    min={0}
                  />
                  <span className="text-xs font-black text-slate-400 pr-3">Sessions</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Progress Rate</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={formData.progressPercentage || ""}
                    onChange={(e) => updateField("progressPercentage", parseInt(e.target.value) || 0)}
                    className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100 pr-10"
                    min={0}
                    max={100}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">%</span>
                </div>
                {formData.progressPercentage <= 30 && formData.progressPercentage > 0 && (
                  <p className="text-xs text-orange-600 font-bold mt-1 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    30% 핵심 타이밍 - 재등록 상담 최적 시점입니다
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 섹션 2: 단계별 필수 체크리스트 (가이드 기반) */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-3 text-lg font-black text-slate-900">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">2</div>
                현재 단계 필수 체크리스트
              </h3>
              <div className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                Stage {formData.progressPercentage > 70 ? "1" : 
                       formData.progressPercentage > 50 ? "2" :
                       formData.progressPercentage > 30 ? "3" :
                       formData.progressPercentage > 10 ? "4" : "5"}
              </div>
            </div>

            <div className="bg-slate-50 rounded-[24px] p-6 space-y-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                {formData.progressPercentage > 70 ? "Stage 1: 신뢰 구축 및 작은 변화 인식" : 
                 formData.progressPercentage > 50 ? "Stage 2: 중간 점검 및 목표 재확인" :
                 formData.progressPercentage > 30 ? "Stage 3: 재등록 상담 시작 (핵심)" :
                 formData.progressPercentage > 10 ? "Stage 4: 최종 결정 유도" : "Stage 5: 결과 및 후속 조치"}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Stage 1 Checklist */}
                {formData.progressPercentage > 70 && (
                  <>
                    {[
                      { key: "roadmapShared", label: "OT에서 12주 로드맵 공유 완료" },
                      { key: "habitFormation", label: "첫 2주: 운동 습관 형성 집중" },
                      { key: "firstInbody", label: "4주차: 첫 번째 인바디 측정" },
                      { key: "dataOrganized", label: "변화 데이터 정리 (체중/근육 등)" },
                      { key: "positiveFeedback", label: "긍정적 변화 피드백 전달" },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-indigo-200 transition-all">
                        <input
                          type="checkbox"
                          checked={(formData.stageChecklists[0].items as any)[item.key]}
                          onChange={(e) => updateChecklistItem(0, item.key, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-bold text-slate-700">{item.label}</span>
                      </label>
                    ))}
                  </>
                )}

                {/* Stage 2 Checklist */}
                {formData.progressPercentage <= 70 && formData.progressPercentage > 50 && (
                  <>
                    {[
                      { key: "goalProgress", label: "목표 달성도 점검" },
                      { key: "satisfaction", label: "프로그램 만족도 확인" },
                      { key: "remainingPlan", label: "남은 기간 계획 논의" },
                      { key: "goalReset", label: "필요시 목표 재설정" },
                      { key: "memberFeedback", label: "회원 피드백 청취" },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-indigo-200 transition-all">
                        <input
                          type="checkbox"
                          checked={(formData.stageChecklists[1].items as any)[item.key]}
                          onChange={(e) => updateChecklistItem(1, item.key, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-bold text-slate-700">{item.label}</span>
                      </label>
                    ))}
                  </>
                )}

                {/* Stage 3 Checklist (CORE) */}
                {formData.progressPercentage <= 50 && formData.progressPercentage > 30 && (
                  <>
                    {[
                      { key: "dataVisualization", label: "전체 변화 데이터 시각화 준비" },
                      { key: "beforeAfterPhotos", label: "비포/애프터 사진 정리" },
                      { key: "futureRoadmap", label: "향후 3~6개월 로드맵 준비" },
                      { key: "promotionCheck", label: "현재 프로모션/이벤트 확인" },
                      { key: "consultationDone", label: "재등록 상담 진행" },
                      { key: "reactionRecorded", label: "회원 반응 기록" },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-orange-100 cursor-pointer hover:border-orange-200 transition-all">
                        <input
                          type="checkbox"
                          checked={(formData.stageChecklists[2].items as any)[item.key]}
                          onChange={(e) => updateChecklistItem(2, item.key, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm font-bold text-slate-700">{item.label}</span>
                      </label>
                    ))}
                  </>
                )}

                {/* Stage 4 Checklist */}
                {formData.progressPercentage <= 30 && formData.progressPercentage > 10 && (
                  <>
                    {[
                      { key: "lastBenefit", label: "마지막 혜택 안내" },
                      { key: "concernResolved", label: "고민 요인 파악 및 해소" },
                      { key: "afterPlan", label: "종료 후 계획 논의" },
                      { key: "finalDecision", label: "최종 결정 확인" },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-indigo-200 transition-all">
                        <input
                          type="checkbox"
                          checked={(formData.stageChecklists[3].items as any)[item.key]}
                          onChange={(e) => updateChecklistItem(3, item.key, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-bold text-slate-700">{item.label}</span>
                      </label>
                    ))}
                  </>
                )}

                {/* Stage 5 Checklist */}
                {formData.progressPercentage <= 10 && (
                  <div className="col-span-full space-y-4">
                    <div className="flex gap-2">
                      {["reRegistered", "paused", "terminated"].map((outcome) => (
                        <Button
                          key={outcome}
                          variant={formData.finalOutcome === outcome ? "default" : "outline"}
                          onClick={() => updateField("finalOutcome", outcome as any)}
                          className={cn(
                            "flex-1 h-12 rounded-xl font-black text-xs",
                            formData.finalOutcome === outcome && outcome === "reRegistered" ? "bg-emerald-600 hover:bg-emerald-700" :
                            formData.finalOutcome === outcome && outcome === "paused" ? "bg-amber-600 hover:bg-amber-700" :
                            formData.finalOutcome === outcome && outcome === "terminated" ? "bg-rose-600 hover:bg-rose-700" : ""
                          )}
                        >
                          {outcome === "reRegistered" ? "✅ 재등록 완료" : 
                           outcome === "paused" ? "⏸️ 휴회" : "❌ 종료"}
                        </Button>
                      ))}
                    </div>
                    
                    {formData.finalOutcome && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                        {formData.finalOutcome === "reRegistered" && [
                          { key: "newRegistration", label: "새 등록 정보 업데이트" },
                          { key: "nextGoal", label: "다음 단계 목표 설정" },
                          { key: "programUpgrade", label: "프로그램 업그레이드 논의" },
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-emerald-100 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(formData.stageChecklists[4].items as any)[item.key]}
                              onChange={(e) => updateChecklistItem(4, item.key, e.target.checked)}
                              className="w-4 h-4 rounded border-emerald-300 text-emerald-600"
                            />
                            <span className="text-sm font-bold text-emerald-800">{item.label}</span>
                          </label>
                        ))}
                        
                        {formData.finalOutcome === "paused" && [
                          { key: "pausePeriod", label: "휴회 기간 확인" },
                          { key: "returnDate", label: "복귀 예정일 기록" },
                          { key: "monthlyContact", label: "월 1회 안부 연락 스케줄" },
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-amber-100 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(formData.stageChecklists[4].items as any)[item.key]}
                              onChange={(e) => updateChecklistItem(4, item.key, e.target.checked)}
                              className="w-4 h-4 rounded border-amber-300 text-amber-600"
                            />
                            <span className="text-sm font-bold text-amber-800">{item.label}</span>
                          </label>
                        ))}

                        {formData.finalOutcome === "terminated" && [
                          { key: "terminationReason", label: "종료 사유 기록" },
                          { key: "exerciseGuide", label: "개인 운동 가이드 제공" },
                          { key: "futureContact", label: "3개월 후 연락 스케줄 등록" },
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-rose-100 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(formData.stageChecklists[4].items as any)[item.key]}
                              onChange={(e) => updateChecklistItem(4, item.key, e.target.checked)}
                              className="w-4 h-4 rounded border-rose-300 text-rose-600"
                            />
                            <span className="text-sm font-bold text-rose-800">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 섹션 3: 회원 반응 */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
            <h3 className="flex items-center gap-3 text-lg font-black text-slate-900">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm">3</div>
              회원 반응 평가
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reactionOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateField("memberReaction", formData.memberReaction === option.value ? "" : option.value)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all",
                    formData.memberReaction === option.value
                      ? cn("bg-white border-blue-500 shadow-xl shadow-blue-50 -translate-y-1")
                      : "bg-slate-50 border-transparent hover:bg-white hover:border-slate-200"
                  )}
                >
                  <span className="text-4xl mb-1">{option.emoji}</span>
                  <span className={cn("text-base font-black", formData.memberReaction === option.value ? "text-blue-600" : "text-slate-500")}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>

            {formData.memberReaction && (
              <div className={cn(
                "rounded-2xl p-4 border-2 mt-4",
                formData.memberReaction === "positive" ? "bg-emerald-50 border-emerald-200" :
                formData.memberReaction === "considering" ? "bg-amber-50 border-amber-200" :
                "bg-rose-50 border-rose-200"
              )}>
                <div className="flex items-start gap-3">
                  <Lightbulb className={cn(
                    "w-5 h-5 mt-0.5 shrink-0",
                    formData.memberReaction === "positive" ? "text-emerald-600" :
                    formData.memberReaction === "considering" ? "text-amber-600" :
                    "text-rose-600"
                  )} />
                  <div>
                    <p className="text-xs font-black text-slate-700 mb-1">상황별 대응 가이드</p>
                    {formData.memberReaction === "positive" && (
                      <p className="text-sm text-slate-600 leading-relaxed font-bold">
                        😊 긍정적: 재등록 의향이 있습니다. 현재 프로모션을 안내하고 향후 3~6개월 로드맵을 제시하여 결정을 확정하세요.
                      </p>
                    )}
                    {formData.memberReaction === "considering" && (
                      <p className="text-sm text-slate-600 leading-relaxed font-bold">
                        🤔 고민 중: 추가 상담이 필요합니다. 고민 요인을 정확히 파악하여 다음 상담 일정을 잡으세요.
                      </p>
                    )}
                    {formData.memberReaction === "negative" && (
                      <p className="text-sm text-slate-600 leading-relaxed font-bold">
                        😐 부정적: 재등록 의향이 없습니다. 종료 사유를 기록하고 개인 운동 가이드를 제공하여 좋은 관계를 유지하세요.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 섹션 4: 고민 요인 */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
            <h3 className="flex items-center gap-3 text-lg font-black text-slate-900">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-sm">4</div>
              주요 고민 요인 (복수 선택)
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {concernOptions.map((concern) => (
                <button
                  key={concern.key}
                  onClick={() => updateConcernFactor(concern.key, !formData.concernFactors[concern.key])}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                    formData.concernFactors[concern.key]
                      ? "bg-rose-50 border-rose-200 text-rose-600"
                      : "bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-200"
                  )}
                >
                  <span className="text-2xl">{concern.emoji}</span>
                  <span className="text-xs font-black tracking-tighter">{concern.label}</span>
                </button>
              ))}
            </div>

            {formData.concernFactors.other && (
              <Input
                value={formData.concernFactors.otherText}
                onChange={(e) => updateConcernFactor("otherText", e.target.value)}
                placeholder="기타 고민 요인을 자세히 적어주세요"
                className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100 transition-all mt-4"
              />
            )}

            {selectedConcernWithResponse && (
              <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-100 mt-6 animate-in slide-in-from-top-2">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-blue-100 uppercase tracking-widest mb-2">
                      Professional Tip
                    </p>
                    <div className="space-y-3">
                      {formData.concernFactors.cost && (
                        <p className="text-sm font-bold leading-relaxed italic border-l-2 border-white/30 pl-3">
                          💰 비용 부담 시: "장기 등록하시면 회당 단가가 낮아져요. 3개월보다 6개월이 회당 OO원 저렴해요."
                        </p>
                      )}
                      {formData.concernFactors.time && (
                        <p className="text-sm font-bold leading-relaxed italic border-l-2 border-white/30 pl-3">
                          ⏰ 시간 부족 시: "주 2회가 부담되시면 주 1회로 조정해볼까요? 페이스 유지하는 게 중요해요."
                        </p>
                      )}
                      {formData.concernFactors.effectDoubt && (
                        <p className="text-sm font-bold leading-relaxed italic border-l-2 border-white/30 pl-3">
                          📉 효과 의문 시: "지금까지 OOkg 빠지셨잖아요. 여기서 멈추면 요요 올 수 있어서, 유지 기간이 필요해요."
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 섹션 5: 전략 & 계획 */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
            <div className="space-y-4">
              <h3 className="flex items-center gap-3 text-lg font-black text-slate-900">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">5</div>
                대응 전략 & 후속 계획
              </h3>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-900 mb-2">상황별 추천 멘트 (💬)</p>
                    <div className="space-y-2 text-sm text-slate-700">
                      {formData.progressPercentage > 70 && (
                        <p className="italic leading-relaxed">
                          "회원님, 벌써 한 달이 됐네요! 체지방 1.2kg 빠지고 근육량 0.5kg 늘었어요. 꾸준히 오신 보람이 있죠?"
                        </p>
                      )}
                      {formData.progressPercentage <= 70 && formData.progressPercentage > 50 && (
                        <p className="italic leading-relaxed">
                          "절반 왔어요! 지금 페이스면 목표 충분히 달성 가능해요. 남은 기간 어떤 부분에 더 집중할까요?"
                        </p>
                      )}
                      {formData.progressPercentage <= 50 && formData.progressPercentage > 30 && (
                        <p className="italic leading-relaxed font-bold text-blue-700">
                          "회원님, 지금까지 정말 잘 오셨어요. 이 페이스로 3개월만 더 하시면 목표 체중 충분히 가능해요. 마침 이번 달 재등록 이벤트가 있는데, 어차피 계속하실 거라면 혜택 챙기시는 게 합리적이에요!"
                        </p>
                      )}
                      {formData.progressPercentage <= 30 && formData.progressPercentage > 10 && (
                        <p className="italic leading-relaxed font-bold text-orange-700">
                          "이번 주까지 재등록하시면 2회 추가 혜택이 있어요. 혹시 고민되시는 부분 있으시면 말씀해주세요!"
                        </p>
                      )}
                      {formData.progressPercentage <= 10 && formData.finalOutcome === "terminated" && (
                        <p className="italic leading-relaxed text-rose-700">
                          "그동안 정말 수고하셨어요. 혼자 운동하실 때 참고하시라고 루틴 정리해드릴게요. 언제든 다시 오시면 환영해요!"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Response Strategy</Label>
                  <Textarea
                    value={formData.responseStrategy}
                    onChange={(e) => updateField("responseStrategy", e.target.value)}
                    placeholder="고민 요인에 대한 맞춤형 전략을 기록하세요&#10;&#10;예시:&#10;- 비용 부담: 장기 등록 시 회당 단가 절감 안내&#10;- 시간 부족: 주 1회로 조정 제안&#10;- 효과 의문: 지금까지의 변화 데이터 시각화"
                    className="min-h-[160px] bg-slate-50 border-none rounded-3xl font-bold p-6 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Follow-up Plan</Label>
                  <Textarea
                    value={formData.followUpPlan}
                    onChange={(e) => updateField("followUpPlan", e.target.value)}
                    placeholder="다음 미팅 일정이나 필요한 자료를 기록하세요&#10;&#10;예시:&#10;- 다음 연락: 2024.01.15 (월) 오후 2시&#10;- 준비 자료: 비포/애프터 사진, 변화 데이터 시트&#10;- 논의 사항: 재등록 프로모션 상세 안내"
                    className="min-h-[160px] bg-slate-50 border-none rounded-3xl font-bold p-6 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-50">
              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Next Contact Date</Label>
              <div className="relative w-48 group">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  type="date"
                  value={formData.nextContactDate || ""}
                  onChange={(e) => updateField("nextContactDate", e.target.value)}
                  className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="px-10 py-8 border-t bg-white flex justify-end gap-3 flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="h-14 px-8 rounded-2xl font-black text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black gap-3 shadow-xl shadow-blue-100 hover:-translate-y-1 transition-all"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">저장 중...</span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                기록 완료하기
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
