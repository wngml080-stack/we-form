"use client";

import { User, Phone, Calendar, Users, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OTFormData } from "../types";

interface Props {
  formData: OTFormData;
  updateFormData: <K extends keyof OTFormData>(key: K, value: OTFormData[K]) => void;
}

export function OTBasicInfoSection({ formData, updateFormData }: Props) {
  const updateBasicInfo = (key: keyof OTFormData["basicInfo"], value: string) => {
    updateFormData("basicInfo", {
      ...formData.basicInfo,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <User className="w-4 h-4" />
            회원명
          </Label>
          <Input
            type="text"
            placeholder="회원명을 입력하세요"
            value={formData.basicInfo.memberName}
            onChange={(e) => updateBasicInfo("memberName", e.target.value)}
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Phone className="w-4 h-4" />
            전화번호
          </Label>
          <Input
            type="tel"
            placeholder="010-0000-0000"
            value={formData.basicInfo.phoneNumber}
            onChange={(e) => updateBasicInfo("phoneNumber", e.target.value)}
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Users className="w-4 h-4" />
            담당트레이너
          </Label>
          <Input
            type="text"
            placeholder="담당 트레이너"
            value={formData.basicInfo.assignedTrainer}
            onChange={(e) => updateBasicInfo("assignedTrainer", e.target.value)}
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
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

        <div className="space-y-2 md:col-span-2">
          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Target className="w-4 h-4" />
            목표유형
          </Label>
          <Input
            type="text"
            placeholder="예: 다이어트, 근력 강화, 재활 등"
            value={formData.basicInfo.goalType}
            onChange={(e) => updateBasicInfo("goalType", e.target.value)}
            className="h-10"
          />
        </div>
      </div>
    </div>
  );
}
