"use client";

import { Textarea } from "@/components/ui/textarea";
import { CreateFormData } from "./useNewMemberForm";

interface MemoSectionProps {
  createForm: CreateFormData;
  setCreateForm: (form: CreateFormData) => void;
}

export function MemoSection({ createForm, setCreateForm }: MemoSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">메모</h3>

      <div className="space-y-2">
        <Textarea
          value={createForm.memo}
          onChange={(e) => setCreateForm({ ...createForm, memo: e.target.value })}
          placeholder="특이사항이나 메모를 입력하세요"
          rows={3}
        />
      </div>
    </div>
  );
}
