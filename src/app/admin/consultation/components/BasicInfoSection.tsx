"use client";

import { Calendar, Phone, User, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConsultationFormData } from "../types";
import { formatPhoneNumberOnChange } from "@/lib/utils/phone-format";

interface Props {
  formData: ConsultationFormData;
  updateFormData: <K extends keyof ConsultationFormData>(
    key: K,
    value: ConsultationFormData[K]
  ) => void;
}

export function BasicInfoSection({ formData, updateFormData }: Props) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 첫만남 */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Calendar className="w-4 h-4 text-gray-500" />
            첫만남
          </Label>
          <Input
            type="date"
            value={formData.firstMeetingDate}
            onChange={(e) => updateFormData("firstMeetingDate", e.target.value)}
            className="w-full"
          />
        </div>

        {/* 전화번호 */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Phone className="w-4 h-4 text-gray-500" />
            전화번호
          </Label>
          <Input
            type="tel"
            placeholder="010-0000-0000"
            value={formData.phoneNumber}
            onChange={(e) => updateFormData("phoneNumber", formatPhoneNumberOnChange(e.target.value))}
            className="w-full"
          />
        </div>

        {/* 담당트레이너 */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Users className="w-4 h-4 text-gray-500" />
            담당트레이너
          </Label>
          <Input
            type="text"
            placeholder="트레이너 이름"
            value={formData.assignedTrainer}
            onChange={(e) => updateFormData("assignedTrainer", e.target.value)}
            className="w-full"
          />
        </div>

        {/* 유형 */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <User className="w-4 h-4 text-gray-500" />
            유형
          </Label>
          <Select
            value={formData.consultationType}
            onValueChange={(value) => updateFormData("consultationType", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="유형 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="신규">신규</SelectItem>
              <SelectItem value="재등록">재등록</SelectItem>
              <SelectItem value="PT추가">PT추가</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
