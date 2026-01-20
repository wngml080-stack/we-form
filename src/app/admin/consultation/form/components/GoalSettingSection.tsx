"use client";

import { ConsultationFormData } from "../types";

interface GoalSettingSectionProps {
  formData: ConsultationFormData;
  updateFormData: <K extends keyof ConsultationFormData>(
    key: K,
    value: ConsultationFormData[K]
  ) => void;
}

const primaryGoals = [
  "체중 감량",
  "근육량 증가",
  "체력 향상",
  "유연성 향상",
  "통증 개선",
  "자세 교정",
  "스트레스 해소",
  "재활/회복",
];

const targetPeriods = [
  "1개월",
  "3개월",
  "6개월",
  "1년 이상",
];

export function GoalSettingSection({ formData, updateFormData }: GoalSettingSectionProps) {
  const toggleSecondaryGoal = (goal: string) => {
    const current = formData.secondaryGoals || [];
    if (current.includes(goal)) {
      updateFormData("secondaryGoals", current.filter((g) => g !== goal));
    } else {
      updateFormData("secondaryGoals", [...current, goal]);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">4. 목표 설정</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            가장 중요한 운동 목표는 무엇인가요?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {primaryGoals.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => updateFormData("primaryGoal", goal)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.primaryGoal === goal
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            추가로 달성하고 싶은 목표가 있으신가요? (복수 선택 가능)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {primaryGoals
              .filter((goal) => goal !== formData.primaryGoal)
              .map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleSecondaryGoal(goal)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.secondaryGoals?.includes(goal)
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {goal}
                </button>
              ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            목표 달성 희망 기간
          </label>
          <div className="flex flex-wrap gap-2">
            {targetPeriods.map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => updateFormData("targetPeriod", period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.targetPeriod === period
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
