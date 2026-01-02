"use client";

import { useState, useEffect } from "react";
import { FileText, Save, X, MessageSquare, Lightbulb, User, Calendar as CalendarIcon, Clock, CheckCircle2 } from "lucide-react";
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
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    재등록 상담 기록
                  </h2>
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
          {/* 섹션 1: 기본 정보 */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
            <h3 className="flex items-center gap-3 text-lg font-black text-slate-900">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm">1</div>
              기본 상담 정보
            </h3>

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
                    onChange={(e) => updateField("remainingSessions", parseInt(e.target.value) || 0)}
                    className="h-10 bg-white border-none rounded-xl font-bold text-center focus:ring-2 focus:ring-blue-100"
                    min={0}
                  />
                  <span className="text-slate-300 font-black">/</span>
                  <Input
                    type="number"
                    value={formData.totalSessions || ""}
                    onChange={(e) => updateField("totalSessions", parseInt(e.target.value) || 0)}
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
              </div>
            </div>
          </div>

          {/* 섹션 2: 회원 반응 */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
            <h3 className="flex items-center gap-3 text-lg font-black text-slate-900">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm">2</div>
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
          </div>

          {/* 섹션 3: 고민 요인 */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
            <h3 className="flex items-center gap-3 text-lg font-black text-slate-900">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-sm">3</div>
              주요 고민 요인
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
                  <div>
                    <p className="text-xs font-black text-blue-100 uppercase tracking-widest mb-1">
                      Professional Tip
                    </p>
                    <p className="text-base font-bold leading-relaxed italic">
                      "{selectedConcernWithResponse.response}"
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 섹션 4: 전략 & 계획 */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
            <div className="space-y-4">
              <h3 className="flex items-center gap-3 text-lg font-black text-slate-900">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">4</div>
                대응 전략 & 후속 계획
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Response Strategy</Label>
                  <Textarea
                    value={formData.responseStrategy}
                    onChange={(e) => updateField("responseStrategy", e.target.value)}
                    placeholder="고민 요인에 대한 맞춤형 전략을 기록하세요"
                    className="min-h-[160px] bg-slate-50 border-none rounded-3xl font-bold p-6 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Follow-up Plan</Label>
                  <Textarea
                    value={formData.followUpPlan}
                    onChange={(e) => updateField("followUpPlan", e.target.value)}
                    placeholder="다음 미팅 일정이나 필요한 자료를 기록하세요"
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
