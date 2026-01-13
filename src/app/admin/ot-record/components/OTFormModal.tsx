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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { OTFormData, initialOTFormData, calculateOTFormCompletion } from "../types";
import { OTBasicInfoSection } from "./OTBasicInfoSection";
import { BodyCompositionSection } from "./BodyCompositionSection";
import { PostureAssessmentSection } from "./PostureAssessmentSection";
import { MovementAssessmentSection } from "./MovementAssessmentSection";
import { FitnessTestSection } from "./FitnessTestSection";
import { IntensityAdaptationSection } from "./IntensityAdaptationSection";
import { OTSessionRecordSection } from "./OTSessionRecordSection";
import { ProgramDesignSection } from "./ProgramDesignSection";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (formData: OTFormData) => void;
  memberName?: string;
  memberPhone?: string;
  existingData?: OTFormData;
}

import { cn } from "@/lib/utils";
import { FileText, Save, Download, Sparkles, Clock, Activity, MessageCircle, Info } from "lucide-react";

export function OTFormModal({ isOpen, onClose, onSave, memberName, memberPhone, existingData }: Props) {
  const [formData, setFormData] = useState<OTFormData>(() => {
    if (existingData) {
      return existingData;
    }
    return {
      ...initialOTFormData,
      basicInfo: {
        ...initialOTFormData.basicInfo,
        memberName: memberName || "",
        phoneNumber: memberPhone || "",
      },
    };
  });
  const [isSaving, setIsSaving] = useState(false);
  const [initialData, setInitialData] = useState<OTFormData>(formData);
  const contentRef = useRef<HTMLDivElement>(null);

  // props가 변경되면 formData 업데이트
  useEffect(() => {
    if (isOpen) {
      const newFormData = existingData
        ? existingData
        : {
            ...initialOTFormData,
            basicInfo: {
              ...initialOTFormData.basicInfo,
              memberName: memberName || "",
              phoneNumber: memberPhone || "",
            },
          };
      setFormData(newFormData);
      setInitialData(newFormData);
    }
  }, [isOpen, memberName, memberPhone, existingData]);

  const updateFormData = <K extends keyof OTFormData>(
    key: K,
    value: OTFormData[K]
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
      console.log("저장할 OT 데이터:", formData);

      if (onSave) {
        onSave(formData);
      }

      alert(`${formData.basicInfo.memberName} 회원의 OT 기록이 저장되었습니다.`);
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

  const completionRate = calculateOTFormCompletion(formData);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl bg-[#f8fafc] p-0 border-none rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <DialogTitle className="sr-only">OT 수업 기록지</DialogTitle>
        <DialogDescription className="sr-only">회원 OT 수업 기록을 작성하고 관리합니다.</DialogDescription>
        {/* 헤더 */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Activity className="w-7 h-7 text-white" />
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
                    className="text-2xl font-black tracking-tight bg-transparent border-none outline-none w-auto max-w-[200px] text-white placeholder:text-white/20"
                  />
                  <h2 className="text-2xl font-black tracking-tight">OT 수업 기록지</h2>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/10 ml-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black text-emerald-200">PROGRESS {completionRate}%</span>
                  </div>
                </div>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                  Baseline Measurement & Program Foundation
                </p>
              </div>
            </div>
            <div className="hidden md:flex flex-col items-end opacity-40">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                <Sparkles className="w-3 h-3" /> Scientific Assessment
              </div>
              <p className="text-[9px] mt-1 font-medium">We:form Coaching System</p>
            </div>
          </div>
        </div>

        {/* 스크롤 가능한 컨텐츠 영역 */}
        <div ref={contentRef} data-export-content className="flex-1 overflow-y-auto p-8 space-y-8 bg-white custom-scrollbar">
          {/* 사용 시점 안내 */}
          <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <Info className="w-4 h-4" />
            </div>
            <p className="text-emerald-900 text-[11px] font-bold leading-relaxed">
              <strong>가이드:</strong> 등록 후 첫 OT 수업 시 활용하세요. <br/>
              신체 평가 및 기준선 측정을 통해 객관적인 프로그램 설계 근거를 마련합니다.
            </p>
          </div>

          <div className="space-y-10">
            {/* 기본 정보 섹션 */}
            <div className="bg-[#f8fafc] p-8 rounded-[32px] border border-slate-50">
              <OTBasicInfoSection formData={formData} updateFormData={updateFormData} />
            </div>

            {/* 1. 체성분 측정 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Body Composition</h3>
              </div>
              <BodyCompositionSection formData={formData} updateFormData={updateFormData} />
            </div>

            {/* 2. 자세 & 움직임 평가 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Posture & Movement</h3>
              </div>
              <PostureAssessmentSection formData={formData} updateFormData={updateFormData} />
              <div className="mt-4 pt-4 border-t border-slate-50">
                <MovementAssessmentSection formData={formData} updateFormData={updateFormData} />
              </div>
            </div>

            {/* 3. 기초 체력 테스트 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Fitness Test</h3>
              </div>
              <FitnessTestSection formData={formData} updateFormData={updateFormData} />
            </div>

            {/* 4. 운동 강도 적응도 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Intensity Adaptation</h3>
              </div>
              <IntensityAdaptationSection formData={formData} updateFormData={updateFormData} />
            </div>

            {/* 5. OT 회차별 수업 기록 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Session Summary</h3>
              </div>
              <OTSessionRecordSection formData={formData} updateFormData={updateFormData} />
            </div>

            {/* 6. 수업 프로그램 설계 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Program Design</h3>
              </div>
              <ProgramDesignSection formData={formData} updateFormData={updateFormData} />
            </div>

            {/* 댓글 */}
            <div className="space-y-4 pb-4">
              <div className="flex items-center gap-2 px-1">
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Additional Notes</h3>
              </div>
              <Textarea
                placeholder="회원님 관련 특이사항이나 수업 중 발견된 특성을 기록하세요"
                value={formData.comments}
                onChange={(e) => updateFormData("comments", e.target.value)}
                className="min-h-[120px] bg-[#f8fafc] border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-emerald-100 transition-all resize-none p-4"
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
              className="h-14 px-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 transition-all flex items-center gap-2"
            >
              {isSaving ? <Clock className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSaving ? "저장 처리 중..." : "OT 기록 저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
