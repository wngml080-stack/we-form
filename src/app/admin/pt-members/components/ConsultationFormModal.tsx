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
import { ConsultationFormData, initialFormData } from "@/app/admin/consultation/types";
import { BasicInfoSection } from "@/app/admin/consultation/components/BasicInfoSection";
import { VisitSourceSection } from "@/app/admin/consultation/components/VisitSourceSection";
import { ExerciseExperienceSection } from "@/app/admin/consultation/components/ExerciseExperienceSection";
import { PhysicalDiagnosisSection } from "@/app/admin/consultation/components/PhysicalDiagnosisSection";
import { GoalSettingSection } from "@/app/admin/consultation/components/GoalSettingSection";
import { AvailableTimeSection } from "@/app/admin/consultation/components/AvailableTimeSection";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (formData: ConsultationFormData) => void;
  memberName?: string;
  memberPhone?: string;
  existingData?: ConsultationFormData;
}

import { cn } from "@/lib/utils";
import { FileText, Save, Download, Sparkles, Clock, Info } from "lucide-react";

export function ConsultationFormModal({ isOpen, onClose, onSave, memberName, memberPhone, existingData }: Props) {
  const [formData, setFormData] = useState<ConsultationFormData>(() => {
    if (existingData) {
      return existingData;
    }
    return {
      ...initialFormData,
      memberName: memberName || "",
      phoneNumber: memberPhone || "",
    };
  });
  const [isSaving, setIsSaving] = useState(false);
  const [initialData, setInitialData] = useState<ConsultationFormData>(formData);
  const contentRef = useRef<HTMLDivElement>(null);

  // props가 변경되면 formData 업데이트
  useEffect(() => {
    if (isOpen) {
      const newFormData = existingData
        ? existingData
        : {
            ...initialFormData,
            memberName: memberName || "",
            phoneNumber: memberPhone || "",
          };
      setFormData(newFormData);
      setInitialData(newFormData);
    }
  }, [isOpen, memberName, memberPhone, existingData]);

  const updateFormData = <K extends keyof ConsultationFormData>(
    key: K,
    value: ConsultationFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    // 회원명 필수 체크
    if (!formData.memberName.trim()) {
      alert("회원명을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      // TODO: API 연동 - 현재는 콘솔에만 출력
      console.log("저장할 데이터:", formData);

      // 저장 성공 시 콜백 호출 (전체 폼 데이터 전달)
      if (onSave) {
        onSave(formData);
      }

      alert(`${formData.memberName} 회원의 상담기록이 저장되었습니다.`);
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl bg-[#f8fafc] p-0 border-none rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <DialogTitle className="sr-only">{formData.memberName || "회원"} 상담기록지</DialogTitle>
        {/* 헤더 */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-500 rounded-3xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.memberName}
                    onChange={(e) => updateFormData("memberName", e.target.value)}
                    placeholder="회원명 입력"
                    className="text-2xl font-black tracking-tight bg-transparent border-none outline-none w-auto max-w-[200px] text-white placeholder:text-white/20"
                  />
                  <h2 className="text-2xl font-black tracking-tight">상담기록지</h2>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-amber-500/20 text-amber-200 border-none text-[10px] font-black uppercase tracking-widest px-2 py-0.5">Consultation Sheet</Badge>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Personal Training Needs Analysis</p>
                </div>
              </div>
            </div>
            <div className="hidden md:flex flex-col items-end opacity-40">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                <Sparkles className="w-3 h-3" /> Step by Step
              </div>
              <p className="text-[9px] mt-1 font-medium">We:form Coaching System</p>
            </div>
          </div>
        </div>

        {/* 스크롤 가능한 컨텐츠 영역 */}
        <div ref={contentRef} data-export-content className="flex-1 overflow-y-auto p-8 space-y-8 bg-white custom-scrollbar">
          {/* 사용 시점 안내 */}
          <div className="bg-amber-50/50 border border-amber-100/50 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
              <Info className="w-4 h-4" />
            </div>
            <p className="text-amber-900 text-[11px] font-bold leading-relaxed">
              <strong>사용 가이드:</strong> 첫 방문 상담 및 정기 상담 시 활용하세요. <br/>
              회원님의 니즈를 파악하여 최적화된 운동 프로그램 설계를 돕습니다.
            </p>
          </div>

          <div className="space-y-10">
            {/* 기본 정보 섹션 */}
            <div className="bg-[#f8fafc] p-8 rounded-[32px] border border-slate-50">
              <BasicInfoSection formData={formData} updateFormData={updateFormData} />
            </div>

            {/* 1. 방문 경로 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Visit Channel</h3>
              </div>
              <VisitSourceSection formData={formData} updateFormData={updateFormData} />
            </div>

            {/* 2. 운동 경험 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Experience</h3>
              </div>
              <ExerciseExperienceSection formData={formData} updateFormData={updateFormData} />
            </div>

            {/* 3. 신체 기능 & 생활 습관 진단 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Physical Status</h3>
              </div>
              <PhysicalDiagnosisSection formData={formData} updateFormData={updateFormData} />
            </div>

            {/* 4. 목표 설정 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Goal Setting</h3>
              </div>
              <GoalSettingSection formData={formData} updateFormData={updateFormData} />
            </div>

            {/* 5. 운동 가능 시간 */}
            <div className="space-y-4 pb-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Availability</h3>
              </div>
              <AvailableTimeSection formData={formData} updateFormData={updateFormData} />
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
              className="h-14 px-10 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black shadow-lg shadow-amber-100 transition-all flex items-center gap-2"
            >
              {isSaving ? <Clock className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSaving ? "처리 중..." : "상담 기록 저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
