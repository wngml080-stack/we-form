"use client";

import { useState, useEffect, useRef } from "react";
import domtoimage from "dom-to-image-more";
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
  const [isExporting, setIsExporting] = useState(false);
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

  const handleExportImage = async () => {
    if (!contentRef.current) return;

    setIsExporting(true);
    try {
      const element = contentRef.current;
      const scrollTop = element.scrollTop;
      element.scrollTop = 0;

      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await domtoimage.toPng(element, {
        quality: 1,
        bgcolor: "#ffffff",
        height: element.scrollHeight,
        width: element.scrollWidth,
        style: {
          overflow: "visible",
          height: "auto",
          maxHeight: "none",
        }
      });

      element.scrollTop = scrollTop;

      const link = document.createElement("a");
      const fileName = `PT회원관리_${formData.basicInfo.memberName || "신규"}_${new Date().toISOString().split("T")[0]}.png`;
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert("이미지가 저장되었습니다.");
    } catch (error) {
      console.error("이미지 저장 실패:", error);
      alert("이미지 저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsExporting(false);
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
        {/* 헤더 */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-rose-500 rounded-3xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                <Target className="w-7 h-7 text-white" />
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
                  <h2 className="text-2xl font-black tracking-tight">PT 코칭 관리</h2>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/10 ml-2">
                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black text-rose-200">DATA READY {completionRate}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {selectedGoalLabels.length > 0 ? (
                    selectedGoalLabels.map((label) => (
                      <Badge key={label} className="bg-rose-500/20 text-rose-200 border-none text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
                        {label}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Goals not specified yet</p>
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
        <div ref={contentRef} data-export-content className="flex-1 overflow-y-auto p-8 space-y-8 bg-white custom-scrollbar">
          <div className="space-y-10">
            {/* 기본 정보 섹션 */}
            <div className="bg-[#f8fafc] p-8 rounded-[32px] border border-slate-50">
              <PTBasicInfoSection formData={formData} updateFormData={updateFormData} />
            </div>

            {/* 회원 등록 정보 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-rose-500 rounded-full"></div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Registration Info</h3>
              </div>
              <PTRegistrationSection formData={formData} updateFormData={updateFormData} />
            </div>

            {/* 처음 만난 날 측정 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-rose-500 rounded-full"></div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Initial Assessment</h3>
              </div>
              <PTInitialMeasurementSection formData={formData} updateFormData={updateFormData} />
            </div>

            {/* 세션 상세 기록 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-rose-500 rounded-full"></div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Session Records</h3>
              </div>
              <PTSessionRecordSection formData={formData} updateFormData={updateFormData} />
            </div>

            {/* 비포 사진 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-rose-500 rounded-full"></div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Progress Photos</h3>
              </div>
              <PTBeforePhotosSection formData={formData} updateFormData={updateFormData} />
            </div>

            {/* 댓글 */}
            <div className="space-y-4 pb-4">
              <div className="flex items-center gap-2 px-1">
                <MessageCircle className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Coaching Notes</h3>
              </div>
              <Textarea
                placeholder="코칭 관련 특이사항이나 추가 메모를 작성하세요"
                value={formData.comments}
                onChange={(e) => updateFormData("comments", e.target.value)}
                className="min-h-[120px] bg-[#f8fafc] border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-rose-100 transition-all resize-none p-4"
              />
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-8 bg-white border-t border-slate-50 flex items-center justify-between flex-shrink-0">
          <Button
            variant="ghost"
            onClick={handleExportImage}
            disabled={isExporting}
            className="h-14 px-6 rounded-2xl font-black text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            {isExporting ? "이미지 생성 중..." : "이미지 저장"}
          </Button>
          
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
