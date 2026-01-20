"use client";

import { ConsultationFormData } from "../types";

interface PhysicalDiagnosisSectionProps {
  formData: ConsultationFormData;
  updateFormData: <K extends keyof ConsultationFormData>(
    key: K,
    value: ConsultationFormData[K]
  ) => void;
}

const healthConditions = [
  "고혈압",
  "당뇨",
  "심장질환",
  "관절질환",
  "척추질환",
  "호흡기질환",
  "없음",
];

const painAreas = [
  "목",
  "어깨",
  "허리",
  "무릎",
  "손목/발목",
  "골반",
  "없음",
];

const sleepQualities = ["매우 좋음", "좋음", "보통", "나쁨", "매우 나쁨"];
const stressLevels = ["매우 낮음", "낮음", "보통", "높음", "매우 높음"];

export function PhysicalDiagnosisSection({ formData, updateFormData }: PhysicalDiagnosisSectionProps) {
  const toggleHealthCondition = (condition: string) => {
    const current = formData.healthConditions || [];
    if (condition === "없음") {
      updateFormData("healthConditions", ["없음"]);
    } else if (current.includes(condition)) {
      updateFormData("healthConditions", current.filter((c) => c !== condition));
    } else {
      updateFormData("healthConditions", [...current.filter((c) => c !== "없음"), condition]);
    }
  };

  const togglePainArea = (area: string) => {
    const current = formData.painAreas || [];
    if (area === "없음") {
      updateFormData("painAreas", ["없음"]);
    } else if (current.includes(area)) {
      updateFormData("painAreas", current.filter((a) => a !== area));
    } else {
      updateFormData("painAreas", [...current.filter((a) => a !== "없음"), area]);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">3. 신체 기능 & 생활 습관 진단</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            현재 앓고 계신 질환이 있으신가요? (복수 선택 가능)
          </label>
          <div className="flex flex-wrap gap-2">
            {healthConditions.map((condition) => (
              <button
                key={condition}
                type="button"
                onClick={() => toggleHealthCondition(condition)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.healthConditions?.includes(condition)
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {condition}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            통증이 있는 부위가 있으신가요? (복수 선택 가능)
          </label>
          <div className="flex flex-wrap gap-2">
            {painAreas.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => togglePainArea(area)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.painAreas?.includes(area)
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">수면의 질</label>
          <div className="flex flex-wrap gap-2">
            {sleepQualities.map((quality) => (
              <button
                key={quality}
                type="button"
                onClick={() => updateFormData("sleepQuality", quality)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.sleepQuality === quality
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {quality}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">스트레스 수준</label>
          <div className="flex flex-wrap gap-2">
            {stressLevels.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => updateFormData("stressLevel", level)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.stressLevel === level
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
