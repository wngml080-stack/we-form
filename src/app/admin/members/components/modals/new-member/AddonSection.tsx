"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { AddonItem } from "./useNewMemberForm";

interface AddonSectionProps {
  newMemberAddons: AddonItem[];
  addNewMemberAddon: () => void;
  removeNewMemberAddon: (index: number) => void;
  updateNewMemberAddon: (index: number, field: keyof AddonItem, value: string) => void;
}

export function AddonSection({
  newMemberAddons,
  addNewMemberAddon,
  removeNewMemberAddon,
  updateNewMemberAddon
}: AddonSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="font-semibold text-sm text-gray-700">부가상품 추가 (선택)</h3>
        <Button type="button" variant="outline" size="sm" onClick={addNewMemberAddon} className="text-xs">
          <Plus className="w-3 h-3 mr-1" />
          부가상품 추가
        </Button>
      </div>

      {newMemberAddons.map((addon, index) => (
        <div key={index} className="border rounded-lg p-4 bg-gray-50 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">부가상품 #{index + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeNewMemberAddon(index)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">상품 유형 *</Label>
              <Select
                value={addon.addon_type}
                onValueChange={(v) => updateNewMemberAddon(index, "addon_type", v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="개인락커">개인락커</SelectItem>
                  <SelectItem value="물품락커">물품락커</SelectItem>
                  <SelectItem value="운동복">운동복</SelectItem>
                  <SelectItem value="양말">양말</SelectItem>
                  <SelectItem value="기타">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {addon.addon_type === "기타" && (
              <div className="space-y-1">
                <Label className="text-xs">상품명 *</Label>
                <Input
                  value={addon.custom_addon_name}
                  onChange={(e) => updateNewMemberAddon(index, "custom_addon_name", e.target.value)}
                  placeholder="상품명"
                  className="h-9"
                />
              </div>
            )}

            {(addon.addon_type === "개인락커" || addon.addon_type === "물품락커") && (
              <div className="space-y-1">
                <Label className="text-xs">락커 번호</Label>
                <Input
                  value={addon.locker_number}
                  onChange={(e) => updateNewMemberAddon(index, "locker_number", e.target.value)}
                  placeholder="예: 15"
                  className="h-9"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">금액 *</Label>
              <Input
                type="number"
                value={addon.amount}
                onChange={(e) => updateNewMemberAddon(index, "amount", e.target.value)}
                placeholder="50000"
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">결제방법</Label>
              <Select
                value={addon.method}
                onValueChange={(v) => updateNewMemberAddon(index, "method", v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="card">카드</SelectItem>
                  <SelectItem value="cash">현금</SelectItem>
                  <SelectItem value="transfer">계좌이체</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">기간</Label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  value={addon.duration}
                  onChange={(e) => updateNewMemberAddon(index, "duration", e.target.value)}
                  placeholder="숫자"
                  className="h-9 flex-1"
                />
                <Select
                  value={addon.duration_type}
                  onValueChange={(v) => updateNewMemberAddon(index, "duration_type", v)}
                >
                  <SelectTrigger className="h-9 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="months">개월</SelectItem>
                    <SelectItem value="days">일</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      ))}

      {newMemberAddons.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">
          락커, 운동복 등 부가상품을 함께 등록할 수 있습니다.
        </p>
      )}
    </div>
  );
}
