"use client";

import { useState, useEffect } from "react";
import { FileText, Save, X, MessageSquare, Lightbulb } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  ReRegistrationConsultation,
  createInitialConsultation,
  MemberReaction,
  ConcernFactors,
  calculateConsultationCompletion,
  concernResponses,
} from "../types";

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
  }[] = [
    {
      value: "positive",
      label: "긍정적 (재등록 의향 있음)",
      emoji: "😊",
      color: "text-green-600",
    },
    {
      value: "considering",
      label: "고민 중 (추가 상담 필요)",
      emoji: "🤔",
      color: "text-yellow-600",
    },
    {
      value: "negative",
      label: "부정적 (재등록 의향 없음)",
      emoji: "😐",
      color: "text-red-600",
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
      label: "효과에 대한 의문",
      emoji: "📉",
      response: concernResponses.effectDoubt,
    },
    { key: "selfTraining", label: "혼자 운동하고 싶음", emoji: "🏃" },
    { key: "otherGym", label: "다른 곳 알아보는 중", emoji: "🔄" },
    { key: "personalReason", label: "개인 사정 (이사, 직장 등)", emoji: "👤" },
    { key: "other", label: "기타", emoji: "📝" },
  ];

  // 선택된 고민 요인에 대한 대응 전략 표시
  const selectedConcernWithResponse = concernOptions.find(
    (c) =>
      formData.concernFactors[c.key as keyof typeof formData.concernFactors] &&
      c.response
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* 헤더 */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <DialogTitle className="sr-only">재등록 상담 기록</DialogTitle>
          <DialogDescription className="sr-only">
            재등록 상담 기록 양식
          </DialogDescription>
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-700">
                    재등록 상담 기록
                  </span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {completionRate}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {existingData ? "기존 상담 수정" : "새 상담 기록 작성"}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* 스크롤 가능한 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          {/* 1. 상담 정보 */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
                1
              </span>
              상담 정보
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">회원명 *</Label>
                <Input
                  value={formData.memberName}
                  onChange={(e) => updateField("memberName", e.target.value)}
                  placeholder="회원명"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">상담일</Label>
                <Input
                  type="date"
                  value={formData.consultationDate}
                  onChange={(e) =>
                    updateField("consultationDate", e.target.value)
                  }
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">담당 트레이너</Label>
                <Input
                  value={formData.assignedTrainer}
                  onChange={(e) =>
                    updateField("assignedTrainer", e.target.value)
                  }
                  placeholder="트레이너명"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">잔여 세션</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={formData.remainingSessions || ""}
                    onChange={(e) =>
                      updateField(
                        "remainingSessions",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="h-9 w-20"
                    min={0}
                  />
                  <span className="text-sm text-gray-500">/</span>
                  <Input
                    type="number"
                    value={formData.totalSessions || ""}
                    onChange={(e) =>
                      updateField(
                        "totalSessions",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="h-9 w-20"
                    min={0}
                  />
                  <span className="text-sm text-gray-500">회</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">진행률</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={formData.progressPercentage || ""}
                    onChange={(e) =>
                      updateField(
                        "progressPercentage",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="h-9 w-20"
                    min={0}
                    max={100}
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 회원 반응 */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
                2
              </span>
              회원 반응
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {reactionOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() =>
                    updateField(
                      "memberReaction",
                      formData.memberReaction === option.value ? "" : option.value
                    )
                  }
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    formData.memberReaction === option.value
                      ? "border-blue-400 bg-blue-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl">{option.emoji}</span>
                  <span className={`text-sm font-medium ${option.color}`}>
                    {option.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. 고민 요인 */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
                3
              </span>
              고민 요인 (복수 선택)
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {concernOptions.map((concern) => (
                <div
                  key={concern.key}
                  onClick={() =>
                    updateConcernFactor(
                      concern.key,
                      !formData.concernFactors[concern.key]
                    )
                  }
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    formData.concernFactors[concern.key]
                      ? "border-orange-400 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span>{concern.emoji}</span>
                  <span className="text-sm text-gray-700">{concern.label}</span>
                </div>
              ))}
            </div>

            {formData.concernFactors.other && (
              <Input
                value={formData.concernFactors.otherText}
                onChange={(e) =>
                  updateConcernFactor("otherText", e.target.value)
                }
                placeholder="기타 고민 요인을 입력하세요"
                className="h-9"
              />
            )}

            {/* 대응 전략 힌트 */}
            {selectedConcernWithResponse && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-yellow-800 mb-1">
                      추천 대응 멘트
                    </p>
                    <p className="text-sm text-yellow-700 italic">
                      {selectedConcernWithResponse.response}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. 대응 전략 */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
                4
              </span>
              대응 전략
            </h3>

            <Textarea
              value={formData.responseStrategy}
              onChange={(e) => updateField("responseStrategy", e.target.value)}
              placeholder="고민 요인에 대한 대응 전략을 작성하세요"
              className="min-h-[100px]"
            />
          </div>

          {/* 5. 후속 계획 */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
                5
              </span>
              후속 계획
            </h3>

            <Textarea
              value={formData.followUpPlan}
              onChange={(e) => updateField("followUpPlan", e.target.value)}
              placeholder="다음 단계 및 후속 계획을 작성하세요 (예: 다음 주 화요일 2차 상담 예정)"
              className="min-h-[100px]"
            />

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">다음 연락 예정일</Label>
              <Input
                type="date"
                value={formData.nextContactDate || ""}
                onChange={(e) => updateField("nextContactDate", e.target.value)}
                className="h-9 w-48"
              />
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2 flex-shrink-0">
          <Button variant="outline" onClick={handleClose}>
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "저장 중..." : "저장하기"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
