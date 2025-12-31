"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPhoneNumberOnChange } from "@/lib/utils/phone-format";
import { CreateFormData } from "./useNewMemberForm";

interface BasicInfoSectionProps {
  createForm: CreateFormData;
  setCreateForm: (form: CreateFormData) => void;
}

export function BasicInfoSection({ createForm, setCreateForm }: BasicInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">필수 정보</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[#0F4C5C]">회원명 <span className="text-red-500">*</span></Label>
          <Input
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            placeholder="홍길동"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#0F4C5C]">연락처 <span className="text-red-500">*</span></Label>
          <Input
            value={createForm.phone}
            onChange={(e) => setCreateForm({ ...createForm, phone: formatPhoneNumberOnChange(e.target.value) })}
            placeholder="010-0000-0000"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[#0F4C5C]">생년월일</Label>
          <Input
            type="date"
            value={createForm.birth_date}
            onChange={(e) => setCreateForm({ ...createForm, birth_date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#0F4C5C]">성별</Label>
          <Select
            value={createForm.gender}
            onValueChange={(v) => setCreateForm({ ...createForm, gender: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="male">남성</SelectItem>
              <SelectItem value="female">여성</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
