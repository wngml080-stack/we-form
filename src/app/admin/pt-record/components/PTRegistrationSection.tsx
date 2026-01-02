"use client";

import { ClipboardList, Calendar, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PTFormData } from "../types";

interface Props {
  formData: PTFormData;
  updateFormData: <K extends keyof PTFormData>(key: K, value: PTFormData[K]) => void;
}

export function PTRegistrationSection({ formData, updateFormData }: Props) {
  const updateRegistrationInfo = (key: keyof PTFormData["registrationInfo"], value: number | string) => {
    updateFormData("registrationInfo", {
      ...formData.registrationInfo,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
          <ClipboardList className="w-4 h-4 text-white" />
        </span>
        <h3 className="text-lg font-semibold text-gray-900">회원 등록 정보</h3>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 총 세션 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              총 세션
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                value={formData.registrationInfo.totalSessions || ""}
                onChange={(e) => updateRegistrationInfo("totalSessions", parseInt(e.target.value) || 0)}
                className="h-10"
                placeholder="0"
              />
              <span className="text-gray-500">회</span>
            </div>
          </div>

          {/* 잔여 세션 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              잔여 세션
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                value={formData.registrationInfo.remainingSessions || ""}
                onChange={(e) => updateRegistrationInfo("remainingSessions", parseInt(e.target.value) || 0)}
                className="h-10"
                placeholder="0"
              />
              <span className="text-gray-500">회</span>
            </div>
          </div>

          {/* 만료일 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              만료일
            </Label>
            <Input
              type="date"
              value={formData.registrationInfo.expiryDate}
              onChange={(e) => updateRegistrationInfo("expiryDate", e.target.value)}
              className="h-10"
            />
          </div>
        </div>

        {/* 세션 진행률 표시 */}
        {formData.registrationInfo.totalSessions > 0 && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">세션 진행률</span>
              <span className="font-medium text-blue-700">
                {formData.registrationInfo.totalSessions - formData.registrationInfo.remainingSessions} / {formData.registrationInfo.totalSessions}회 완료
              </span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2.5">
              <div
                className="bg-blue-500 h-2.5 rounded-full transition-all"
                style={{
                  width: `${Math.round(((formData.registrationInfo.totalSessions - formData.registrationInfo.remainingSessions) / formData.registrationInfo.totalSessions) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
