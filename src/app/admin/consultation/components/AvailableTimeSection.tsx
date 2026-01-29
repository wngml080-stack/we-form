"use client";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ConsultationFormData } from "../types";

interface Props {
  formData: ConsultationFormData;
  updateFormData: <K extends keyof ConsultationFormData>(
    key: K,
    value: ConsultationFormData[K]
  ) => void;
}

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const TIME_SLOTS = [
  { key: "morning" as const, label: "오전 (06-12시)" },
  { key: "afternoon" as const, label: "오후 (12-18시)" },
  { key: "evening" as const, label: "저녁 (18-22시)" },
];

export function AvailableTimeSection({ formData, updateFormData }: Props) {
  const updateTimeSlot = (
    slot: "morning" | "afternoon" | "evening",
    dayIndex: number,
    value: boolean
  ) => {
    const newSlot = [...formData.availableTime[slot]];
    newSlot[dayIndex] = value;
    updateFormData("availableTime", {
      ...formData.availableTime,
      [slot]: newSlot,
    });
  };

  const updateWeeklyCount = (value: number) => {
    updateFormData("availableTime", {
      ...formData.availableTime,
      preferredWeeklyCount: value,
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
          <span className="text-cyan-600 font-bold">5</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900">운동 가능 시간</h2>
      </div>

      {/* 선호 시간대 */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="text-cyan-500">✓</span> 선호 시간대
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-600 w-36">시간대</th>
                {DAYS.map((day) => (
                  <th key={day} className="text-center py-2 px-2 font-medium text-gray-600 w-12">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot) => (
                <tr key={slot.key} className="border-b border-gray-100">
                  <td className="py-3 px-3 text-gray-700">{slot.label}</td>
                  {DAYS.map((_, dayIndex) => (
                    <td key={dayIndex} className="py-3 px-2 text-center">
                      <Checkbox
                        checked={formData.availableTime[slot.key][dayIndex]}
                        onCheckedChange={(checked) =>
                          updateTimeSlot(slot.key, dayIndex, !!checked)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 희망 주당 운동 횟수 */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Label className="text-sm font-medium text-gray-700">희망 주당 운동 횟수:</Label>
        <span className="text-sm text-gray-500">주</span>
        <Input
          type="number"
          min={0}
          max={7}
          value={formData.availableTime.preferredWeeklyCount ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            updateWeeklyCount(value === "" ? 0 : parseInt(value) || 0);
          }}
          className="w-16 h-9 text-sm text-center"
        />
        <span className="text-sm text-gray-500">회</span>
      </div>
    </div>
  );
}
