"use client";

import { ConsultationFormData } from "../types";

interface ExerciseExperienceSectionProps {
  formData: ConsultationFormData;
  updateFormData: <K extends keyof ConsultationFormData>(
    key: K,
    value: ConsultationFormData[K]
  ) => void;
}

const exerciseTypes = [
  "헬스/웨이트",
  "필라테스",
  "요가",
  "크로스핏",
  "러닝/마라톤",
  "수영",
  "구기종목",
  "홈트레이닝",
  "기타",
];

const frequencies = [
  "거의 안함",
  "주 1-2회",
  "주 3-4회",
  "주 5회 이상",
];

export function ExerciseExperienceSection({ formData, updateFormData }: ExerciseExperienceSectionProps) {
  const toggleExerciseType = (type: string) => {
    const current = formData.exerciseTypes || [];
    if (current.includes(type)) {
      updateFormData("exerciseTypes", current.filter((t) => t !== type));
    } else {
      updateFormData("exerciseTypes", [...current, type]);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">2. 운동 경험</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            현재 또는 과거 운동 경험이 있으신가요?
          </label>
          <div className="flex gap-2">
            {["있음", "없음"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => updateFormData("exerciseExperience", option)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.exerciseExperience === option
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {formData.exerciseExperience === "있음" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                어떤 운동을 하셨나요? (복수 선택 가능)
              </label>
              <div className="flex flex-wrap gap-2">
                {exerciseTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleExerciseType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.exerciseTypes?.includes(type)
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                운동 빈도
              </label>
              <div className="flex flex-wrap gap-2">
                {frequencies.map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => updateFormData("exerciseFrequency", freq)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.exerciseFrequency === freq
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
