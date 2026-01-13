"use client";

import { useState, use } from "react";
import { FileText, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsultationFormData, initialFormData } from "./types";
import { BasicInfoSection } from "./components/BasicInfoSection";
import { VisitSourceSection } from "./components/VisitSourceSection";
import { ExerciseExperienceSection } from "./components/ExerciseExperienceSection";
import { PhysicalDiagnosisSection } from "./components/PhysicalDiagnosisSection";
import { GoalSettingSection } from "./components/GoalSettingSection";
import { AvailableTimeSection } from "./components/AvailableTimeSection";

export default function ConsultationFormPage(props: {
  params: Promise<any>;
  searchParams: Promise<any>;
}) {
  // Next.js 15+에서 params와 searchParams는 Promise이므로 unwrap해야 합니다.
  use(props.params);
  use(props.searchParams);

  const [formData, setFormData] = useState<ConsultationFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  const updateFormData = <K extends keyof ConsultationFormData>(
    key: K,
    value: ConsultationFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    if (confirm("작성 중인 내용을 모두 초기화하시겠습니까?")) {
      setFormData(initialFormData);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: API 연동
      console.log("저장할 데이터:", formData);
      alert("저장되었습니다.");
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">신규 상담기록지 양식</h1>
            <p className="text-sm text-gray-500">등록 전 세일즈 &amp; 니즈 파악</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            초기화
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-primary hover:bg-primary/90">
            <Save className="w-4 h-4" />
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>

      {/* 사용 시점 안내 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-amber-800 text-sm font-medium">
          <strong>사용 시점:</strong> 첫 방문 상담 시 &amp; 회원님 수업 전 작성 후 제출 방식
        </p>
      </div>

      {/* 기본 정보 섹션 */}
      <BasicInfoSection formData={formData} updateFormData={updateFormData} />

      {/* 1. 방문 경로 */}
      <VisitSourceSection formData={formData} updateFormData={updateFormData} />

      {/* 2. 운동 경험 */}
      <ExerciseExperienceSection formData={formData} updateFormData={updateFormData} />

      {/* 3. 신체 기능 & 생활 습관 진단 */}
      <PhysicalDiagnosisSection formData={formData} updateFormData={updateFormData} />

      {/* 4. 목표 설정 */}
      <GoalSettingSection formData={formData} updateFormData={updateFormData} />

      {/* 5. 운동 가능 시간 */}
      <AvailableTimeSection formData={formData} updateFormData={updateFormData} />

      {/* 하단 저장 버튼 */}
      <div className="flex justify-end gap-2 pt-6 border-t">
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          초기화
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4" />
          {isSaving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}
