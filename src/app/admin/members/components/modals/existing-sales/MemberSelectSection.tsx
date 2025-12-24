"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Member, ExistingSalesFormData } from "./useExistingSalesForm";

interface MemberSelectSectionProps {
  formData: ExistingSalesFormData;
  memberSearch: string;
  filteredMembers: Member[];
  onSearchChange: (value: string) => void;
  onMemberSelect: (memberId: string) => void;
}

export function MemberSelectSection({
  formData, memberSearch, filteredMembers, onSearchChange, onMemberSelect
}: MemberSelectSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">회원 선택</h3>
      <div className="space-y-2">
        <Label className="text-[#0F4C5C]">
          회원 <span className="text-red-500">*</span>
        </Label>
        <Input
          value={memberSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="회원 이름 또는 전화번호 검색..."
          className="mb-2"
        />
        <Select value={formData.member_id} onValueChange={onMemberSelect}>
          <SelectTrigger>
            <SelectValue placeholder="회원 선택" />
          </SelectTrigger>
          <SelectContent className="bg-white max-h-[200px]">
            {filteredMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name} ({member.phone})
                {member.activeMembership && ` - ${member.activeMembership.name}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
