"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreateFormData } from "./useNewMemberForm";

interface InbodyInfoSectionProps {
  createForm: CreateFormData;
  setCreateForm: (form: CreateFormData) => void;
}

export function InbodyInfoSection({ createForm, setCreateForm }: InbodyInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">인바디 정보 (선택)</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label className="text-[#0F4C5C]">몸무게 (kg)</Label>
          <Input
            type="number"
            step="0.1"
            value={createForm.weight}
            onChange={(e) => setCreateForm({ ...createForm, weight: e.target.value })}
            placeholder="70.5"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#0F4C5C]">체지방량 (kg)</Label>
          <Input
            type="number"
            step="0.1"
            value={createForm.body_fat_mass}
            onChange={(e) => setCreateForm({ ...createForm, body_fat_mass: e.target.value })}
            placeholder="15.2"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#0F4C5C]">골격근량 (kg)</Label>
          <Input
            type="number"
            step="0.1"
            value={createForm.skeletal_muscle_mass}
            onChange={(e) => setCreateForm({ ...createForm, skeletal_muscle_mass: e.target.value })}
            placeholder="32.1"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#0F4C5C]">운동목적</Label>
          <Input
            value={createForm.exercise_goal}
            onChange={(e) => setCreateForm({ ...createForm, exercise_goal: e.target.value })}
            placeholder="다이어트, 근력강화 등"
          />
        </div>
      </div>
    </div>
  );
}
