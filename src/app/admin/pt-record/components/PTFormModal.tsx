"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PTFormData, initialPTFormData, calculatePTFormCompletion, goalTypeOptions } from "../types";
import { PTBasicInfoSection } from "./PTBasicInfoSection";
import { PTRegistrationSection } from "./PTRegistrationSection";
import { PTInitialMeasurementSection } from "./PTInitialMeasurementSection";
import { PTSessionRecordSection } from "./PTSessionRecordSection";
import { PTBeforePhotosSection } from "./PTBeforePhotosSection";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (formData: PTFormData) => void;
  memberName?: string;
  memberPhone?: string;
  existingData?: PTFormData;
}

import { cn } from "@/lib/utils";
import { FileText, Save, Download, Sparkles, Clock, Target, MessageCircle } from "lucide-react";

export function PTFormModal({ isOpen, onClose, onSave, memberName, memberPhone, existingData }: Props) {
  const [formData, setFormData] = useState<PTFormData>(() => {
    if (existingData) {
      return existingData;
    }
    return {
      ...initialPTFormData,
      basicInfo: {
        ...initialPTFormData.basicInfo,
        memberName: memberName || "",
        phoneNumber: memberPhone || "",
      },
    };
  });
  const [isSaving, setIsSaving] = useState(false);
  const [initialData, setInitialData] = useState<PTFormData>(formData);
  const contentRef = useRef<HTMLDivElement>(null);

  // props가 변경되면 formData 업데이트
  useEffect(() => {
    if (isOpen) {
      const newFormData = existingData
        ? existingData
        : {
            ...initialPTFormData,
            basicInfo: {
              ...initialPTFormData.basicInfo,
              memberName: memberName || "",
              phoneNumber: memberPhone || "",
            },
          };
      setFormData(newFormData);
      setInitialData(newFormData);
    }
  }, [isOpen, memberName, memberPhone, existingData]);

  const updateFormData = <K extends keyof PTFormData>(
    key: K,
    value: PTFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    // 회원명 필수 체크
    if (!formData.basicInfo.memberName.trim()) {
      alert("회원명을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      console.log("저장할 PT 데이터:", formData);

      if (onSave) {
        onSave(formData);
      }

      alert(`${formData.basicInfo.memberName} 회원의 PT 기록이 저장되었습니다.`);
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);
    if (hasChanges) {
      if (confirm("작성 중인 내용이 있습니다. 정말 닫으시겠습니까?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const completionRate = calculatePTFormCompletion(formData);

  // 선택된 목표 유형 표시용
  const selectedGoalLabels = formData.basicInfo.goalTypes
    .map((g) => goalTypeOptions.find((o) => o.value === g)?.label)
    .filter(Boolean);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl bg-[#f8fafc] p-0 border-none rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <DialogTitle className="sr-only">PT 코칭 관리</DialogTitle>
        {/* 헤더 */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.basicInfo.memberName}
                    onChange={(e) => updateFormData("basicInfo", {
                      ...formData.basicInfo,
                      memberName: e.target.value,
                    })}
                    placeholder="회원명 입력"
                    className="text-2xl font-bold tracking-tight bg-transparent border-none outline-none w-auto max-w-[200px] text-white placeholder:text-white/20"
                  />
                  <h2 className="text-2xl font-bold tracking-tight">PT 코칭 관리</h2>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/10 ml-2">
                    <span className="text-[10px] font-bold text-rose-200">기록률 {completionRate}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {selectedGoalLabels.length > 0 ? (
                    selectedGoalLabels.map((label) => (
                      <Badge key={label} className="bg-rose-500/20 text-rose-200 border-none text-[10px] font-bold px-2 py-0.5">
                        {label}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-white/40 text-[10px] font-medium">관리 목표를 설정해주세요</p>
                  )}
                </div>
              </div>
            </div>
            <div className="hidden md:flex flex-col items-end opacity-40">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                <Sparkles className="w-3 h-3" /> Performance Tracking
              </div>
              <p className="text-[9px] mt-1 font-medium">We:form Coaching System</p>
            </div>
          </div>
        </div>

        {/* 스크롤 가능한 컨텐츠 영역 */}
        <div ref={contentRef} data-export-content className="flex-1 overflow-y-auto p-6 space-y-6 bg-white custom-scrollbar">
          <div className="space-y-8">
            {/* 기본 정보 섹션 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <PTBasicInfoSection formData={formData} updateFormData={updateFormData} />
            </div>

            {/* 회원 등록 정보 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-rose-500 rounded-full"></div>
                <h3 className="text-sm font-bold text-slate-800">등록 정보</h3>
              </div>
              <PTRegistrationSection formData={formData} updateFormData={updateFormData} />
            </div>

            {/* 처음 만난 날 측정 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-rose-500 rounded-full"></div>
                <h3 className="text-sm font-bold text-slate-800">초기 측정 기록</h3>
              </div>
              <PTInitialMeasurementSection formData={formData} updateFormData={updateFormData} />
            </div>

            {/* 세션 상세 기록 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-rose-500 rounded-full"></div>
                <h3 className="text-sm font-bold text-slate-800">세션 상세 기록</h3>
              </div>
              <PTSessionRecordSection formData={formData} updateFormData={updateFormData} />
            </div>

            {/* 비포 사진 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-rose-500 rounded-full"></div>
                <h3 className="text-sm font-bold text-slate-800">변화 기록 (사진)</h3>
              </div>
              <PTBeforePhotosSection formData={formData} updateFormData={updateFormData} />
            </div>

            {/* 댓글 */}
            <div className="space-y-4 pb-4">
              <div className="flex items-center gap-2 px-1">
                <MessageCircle className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-800">코칭 메모</h3>
              </div>
              <Textarea
                placeholder="코칭 관련 특이사항이나 추가 메모를 작성하세요"
                value={formData.comments}
                onChange={(e) => updateFormData("comments", e.target.value)}
                className="min-h-[120px] bg-slate-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-rose-100 transition-all resize-none p-4"
              />
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-8 bg-white border-t border-slate-50 flex items-center justify-end flex-shrink-0">
          <div className="flex gap-3">
            <Button variant="ghost" onClick={handleClose} className="h-14 px-6 rounded-2xl font-black text-slate-400 hover:text-slate-900 transition-all">
              취소
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving} 
              className="h-14 px-10 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-100 transition-all flex items-center gap-2"
            >
              {isSaving ? <Clock className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSaving ? "데이터 저장 중..." : "코칭 기록 저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
