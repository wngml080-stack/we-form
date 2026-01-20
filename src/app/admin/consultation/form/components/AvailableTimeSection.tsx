"use client";

import { ConsultationFormData } from "../types";

interface AvailableTimeSectionProps {
  formData: ConsultationFormData;
  updateFormData: <K extends keyof ConsultationFormData>(
    key: K,
    value: ConsultationFormData[K]
  ) => void;
}

const weekDays = ["월", "화", "수", "목", "금", "토", "일"];

const preferredTimes = [
  "오전 (06:00-12:00)",
  "오후 (12:00-18:00)",
  "저녁 (18:00-22:00)",
  "상관없음",
];

const sessionDurations = ["30분", "50분", "60분", "90분"];

export function AvailableTimeSection({ formData, updateFormData }: AvailableTimeSectionProps) {
  const toggleDay = (day: string) => {
    const current = formData.availableDays || [];
    if (current.includes(day)) {
      updateFormData("availableDays", current.filter((d) => d !== day));
    } else {
      updateFormData("availableDays", [...current, day]);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">5. 운동 가능 시간</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            운동 가능한 요일 (복수 선택 가능)
          </label>
          <div className="flex gap-2">
            {weekDays.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                  formData.availableDays?.includes(day)
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            선호하는 운동 시간대
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {preferredTimes.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => updateFormData("preferredTime", time)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.preferredTime === time
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            희망 수업 시간
          </label>
          <div className="flex flex-wrap gap-2">
            {sessionDurations.map((duration) => (
              <button
                key={duration}
                type="button"
                onClick={() => updateFormData("sessionDuration", duration)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.sessionDuration === duration
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {duration}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
