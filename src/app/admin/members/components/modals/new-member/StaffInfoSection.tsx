"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateFormData, StaffMember } from "./useNewMemberForm";

interface StaffInfoSectionProps {
  createForm: CreateFormData;
  setCreateForm: (form: CreateFormData) => void;
  staffList: StaffMember[];
}

export function StaffInfoSection({ createForm, setCreateForm, staffList }: StaffInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">담당자 정보</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[#0F4C5C]">등록자</Label>
          <Select
            value={createForm.registered_by}
            onValueChange={(v) => setCreateForm({ ...createForm, registered_by: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent className="bg-white max-h-[200px]">
              {staffList.map((staff) => (
                <SelectItem key={staff.id} value={staff.id}>
                  {staff.name} ({staff.job_title})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-[#0F4C5C]">담당트레이너</Label>
          <Select
            value={createForm.trainer_id}
            onValueChange={(v) => setCreateForm({ ...createForm, trainer_id: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent className="bg-white max-h-[200px]">
              {staffList.map((staff) => (
                <SelectItem key={staff.id} value={staff.id}>
                  {staff.name} ({staff.job_title})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
