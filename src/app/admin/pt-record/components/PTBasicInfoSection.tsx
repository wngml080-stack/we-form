"use client";

import { User, Phone, Calendar, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PTFormData, goalTypeOptions } from "../types";
import { formatPhoneNumberOnChange } from "@/lib/utils/phone-format";

interface Props {
  formData: PTFormData;
  updateFormData: <K extends keyof PTFormData>(key: K, value: PTFormData[K]) => void;
}

export function PTBasicInfoSection({ formData, updateFormData }: Props) {
  const updateBasicInfo = (key: keyof PTFormData["basicInfo"], value: string | string[]) => {
    updateFormData("basicInfo", {
      ...formData.basicInfo,
      [key]: value,
    });
  };

  const toggleGoalType = (goalType: string) => {
    const currentGoals = formData.basicInfo.goalTypes;
    if (currentGoals.includes(goalType)) {
      updateBasicInfo("goalTypes", currentGoals.filter((g) => g !== goalType));
    } else {
      updateBasicInfo("goalTypes", [...currentGoals, goalType]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 회원명 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <User className="w-4 h-4" />
            회원명
          </Label>
          <Input
            type="text"
            value={formData.basicInfo.memberName}
            onChange={(e) => updateBasicInfo("memberName", e.target.value)}
            placeholder="회원명을 입력하세요"
            className="h-10"
          />
        </div>

        {/* 전화번호 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            전화번호
          </Label>
          <Input
            type="tel"
            value={formData.basicInfo.phoneNumber}
            onChange={(e) => updateBasicInfo("phoneNumber", formatPhoneNumberOnChange(e.target.value))}
            placeholder="010-0000-0000"
            className="h-10"
          />
        </div>

        {/* 담당 트레이너 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Users className="w-4 h-4" />
            담당 트레이너
          </Label>
          <Input
            type="text"
            value={formData.basicInfo.assignedTrainer}
            onChange={(e) => updateBasicInfo("assignedTrainer", e.target.value)}
            placeholder="트레이너명"
            className="h-10"
          />
        </div>

        {/* 첫만남 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            첫만남
          </Label>
          <Input
            type="date"
            value={formData.basicInfo.firstMeetingDate}
            onChange={(e) => updateBasicInfo("firstMeetingDate", e.target.value)}
            className="h-10"
          />
        </div>
      </div>

      {/* 목표유형 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">목표유형 (복수 선택 가능)</Label>
        <div className="flex flex-wrap gap-2">
          {goalTypeOptions.map((option) => {
            const isSelected = formData.basicInfo.goalTypes.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleGoalType(option.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? option.color + " ring-2 ring-offset-1 ring-current"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
