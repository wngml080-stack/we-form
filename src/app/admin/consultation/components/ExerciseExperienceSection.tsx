"use client";

import { Dumbbell, Lightbulb } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConsultationFormData, DropoutReason, ExerciseExperience } from "../types";

interface Props {
  formData: ConsultationFormData;
  updateFormData: <K extends keyof ConsultationFormData>(
    key: K,
    value: ConsultationFormData[K]
  ) => void;
}

export function ExerciseExperienceSection({ formData, updateFormData }: Props) {
  const updateExperience = (index: number, key: keyof ExerciseExperience, value: boolean | number) => {
    const newExperiences = [...formData.exerciseExperiences];
    newExperiences[index] = { ...newExperiences[index], [key]: value };
    updateFormData("exerciseExperiences", newExperiences);
  };

  const updateDropoutReason = (key: keyof DropoutReason, value: boolean | string) => {
    updateFormData("dropoutReasons", {
      ...formData.dropoutReasons,
      [key]: value,
    });
  };

  const dropoutReasonOptions = [
    { key: "noChange" as const, label: "변화가 없어서 흥미를 잃음" },
    { key: "jointPain" as const, label: "관절이 아파서 중단" },
    { key: "dietFailure" as const, label: "식단 조절 실패" },
    { key: "noConfidence" as const, label: "혼자서 하는 운동에 확신이 없었음" },
    { key: "noTime" as const, label: "시간이 부족해서" },
    { key: "costIssue" as const, label: "비용 문제" },
    { key: "trainerMismatch" as const, label: "트레이너와 안 맞아서" },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
          <span className="text-green-600 font-bold">2</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900">운동 경험</h2>
      </div>

      {/* 과거 경험 */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="text-green-500">✓</span> 과거 경험
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-600">종류</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600 w-20">경험</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600 w-36">기간</th>
              </tr>
            </thead>
            <tbody>
              {formData.exerciseExperiences.map((exp, index) => (
                <tr key={exp.type} className="border-b border-gray-100">
                  <td className="py-3 px-3 text-gray-700">{exp.type}</td>
                  <td className="py-3 px-3 text-center">
                    <Checkbox
                      checked={exp.hasExperience}
                      onCheckedChange={(checked) => updateExperience(index, "hasExperience", !!checked)}
                    />
                  </td>
                  <td className="py-3 px-3">
                    {exp.type !== "운동 경험 없음" && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">약</span>
                        <Input
                          type="number"
                          min={0}
                          value={exp.months || ""}
                          onChange={(e) => updateExperience(index, "months", parseInt(e.target.value) || 0)}
                          className="w-16 h-8 text-sm text-center"
                          disabled={!exp.hasExperience}
                        />
                        <span className="text-gray-500 text-xs">개월</span>
                      </div>
                    )}
                    {exp.type === "운동 경험 없음" && (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 계속 유지하지 못한 이유 */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="text-green-500">✓</span> 계속 유지하지 못한 이유
        </h3>

        <div className="space-y-3">
          {dropoutReasonOptions.map((option) => (
            <div key={option.key} className="flex items-center gap-3">
              <Checkbox
                id={option.key}
                checked={formData.dropoutReasons[option.key] as boolean}
                onCheckedChange={(checked) => updateDropoutReason(option.key, !!checked)}
              />
              <Label htmlFor={option.key} className="text-sm text-gray-700 cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}

          <div className="flex items-center gap-3">
            <Checkbox
              id="dropoutOther"
              checked={formData.dropoutReasons.other}
              onCheckedChange={(checked) => updateDropoutReason("other", !!checked)}
            />
            <Label htmlFor="dropoutOther" className="text-sm text-gray-700 cursor-pointer">
              기타
            </Label>
            {formData.dropoutReasons.other && (
              <Input
                type="text"
                placeholder="기타 이유 입력"
                value={formData.dropoutReasons.otherText}
                onChange={(e) => updateDropoutReason("otherText", e.target.value)}
                className="w-48 h-8 text-sm"
              />
            )}
          </div>
        </div>
      </div>

      {/* 트레이너 메모 */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-700 font-medium">트레이너 메모</p>
        </div>
        <p className="text-sm text-gray-600 italic">
          이 회원이 다시 중단하지 않으려면 어떤 점을 신경 써야 할까?
        </p>
        <Textarea
          placeholder="트레이너 메모를 작성해주세요"
          value={formData.trainerMemo}
          onChange={(e) => updateFormData("trainerMemo", e.target.value)}
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
}
