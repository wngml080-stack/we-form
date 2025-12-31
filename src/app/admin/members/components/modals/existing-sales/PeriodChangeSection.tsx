"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExistingSalesFormData } from "./useExistingSalesForm";

interface PeriodChangeSectionProps {
  formData: ExistingSalesFormData;
  setFormData: (data: ExistingSalesFormData) => void;
}

export function PeriodChangeSection({ formData, setFormData }: PeriodChangeSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">기간 정보</h3>
      <div className="space-y-2">
        <Label className="text-[#0F4C5C]">
          새 만료일 <span className="text-red-500">*</span>
        </Label>
        <Input
          type="date"
          value={formData.end_date}
          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
        />
      </div>
    </div>
  );
}
