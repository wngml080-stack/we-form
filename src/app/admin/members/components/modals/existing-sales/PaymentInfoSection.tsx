"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExistingSalesFormData } from "./useExistingSalesForm";

interface PaymentInfoSectionProps {
  formData: ExistingSalesFormData;
  setFormData: (data: ExistingSalesFormData) => void;
}

export function PaymentInfoSection({ formData, setFormData }: PaymentInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">결제 정보</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[#0F4C5C]">회원권 유형 <span className="text-red-500">*</span></Label>
          <Select value={formData.membership_type} onValueChange={(v) => setFormData({ ...formData, membership_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="헬스">헬스</SelectItem>
              <SelectItem value="필라테스">필라테스</SelectItem>
              <SelectItem value="PT">PT</SelectItem>
              <SelectItem value="PPT">PPT</SelectItem>
              <SelectItem value="GPT">GPT</SelectItem>
              <SelectItem value="골프">골프</SelectItem>
              <SelectItem value="GX">GX</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-[#0F4C5C]">결제 방법 <span className="text-red-500">*</span></Label>
          <Select value={formData.method} onValueChange={(v) => setFormData({ ...formData, method: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="card">카드</SelectItem>
              <SelectItem value="cash">현금</SelectItem>
              <SelectItem value="transfer">계좌이체</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[#0F4C5C]">이번 결제 금액 (원) <span className="text-red-500">*</span></Label>
          <Input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="1000000"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#0F4C5C]">전체 금액 (원)</Label>
          <Input
            type="number"
            value={formData.total_amount}
            onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
            placeholder="분할 시 전체 금액"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-[#0F4C5C]">분할 횟수</Label>
          <Input
            type="number"
            value={formData.installment_count}
            onChange={(e) => setFormData({ ...formData, installment_count: e.target.value })}
            placeholder="1"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#0F4C5C]">현재 회차</Label>
          <Input
            type="number"
            value={formData.installment_current}
            onChange={(e) => setFormData({ ...formData, installment_current: e.target.value })}
            placeholder="1"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#0F4C5C]">방문루트</Label>
          <Input
            value={formData.visit_route}
            onChange={(e) => setFormData({ ...formData, visit_route: e.target.value })}
            placeholder="지인추천, 온라인 등"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[#0F4C5C]">메모</Label>
        <Textarea
          value={formData.memo}
          onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
          placeholder="특이사항이나 메모를 입력하세요"
          rows={3}
        />
      </div>
    </div>
  );
}
