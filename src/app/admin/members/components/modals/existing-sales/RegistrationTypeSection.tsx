"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Member, ExistingSalesFormData } from "./useExistingSalesForm";

interface RegistrationTypeSectionProps {
  formData: ExistingSalesFormData;
  selectedMember: Member | null;
  onTypeChange: (type: string) => void;
}

export function RegistrationTypeSection({
  formData, selectedMember, onTypeChange
}: RegistrationTypeSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">등록 타입</h3>
      <div className="space-y-2">
        <Label className="text-[#0F4C5C]">
          등록 타입 <span className="text-red-500">*</span>
        </Label>
        <Select value={formData.registration_type} onValueChange={onTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="선택" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="리뉴">리뉴 (회원권 갱신)</SelectItem>
            <SelectItem value="기간변경">기간(세션)변경</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedMember && selectedMember.activeMembership && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm font-semibold text-blue-900 mb-2">현재 활성 회원권</div>
          <div className="text-sm text-blue-700 space-y-1">
            <div>• 회원권: {selectedMember.activeMembership.name}</div>
            <div>
              • 잔여횟수: {selectedMember.activeMembership.total_sessions - selectedMember.activeMembership.used_sessions} / {selectedMember.activeMembership.total_sessions}회
            </div>
            {selectedMember.activeMembership.end_date && (
              <div>• 만료일: {new Date(selectedMember.activeMembership.end_date).toLocaleDateString("ko-KR")}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
