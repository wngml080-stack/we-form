"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { MembershipProduct } from "@/types/membership";

interface MembershipFormData {
  name: string;
  total_sessions: string;
  amount: string;
  method: string;
  start_date: string;
  end_date: string;
  // Additional member fields (used when creating new member with membership)
  member_name: string;
  member_phone: string;
  birth_date: string;
  gender: string;
  exercise_goal: string;
  weight: string;
  body_fat_mass: string;
  skeletal_muscle_mass: string;
  trainer_id: string;
  memo: string;
}

interface AddonItem {
  addon_type: string;
  custom_addon_name: string;
  locker_number: string;
  amount: string;
  method: string;
  start_date: string;
  duration: string;
  duration_type: string;
  end_date: string;
}

interface AddMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  products: MembershipProduct[];
  selectedProductId: string;
  setSelectedProductId: (id: string) => void;
  membershipForm: MembershipFormData;
  setMembershipForm: React.Dispatch<React.SetStateAction<MembershipFormData>>;
  addons: AddonItem[];
  onAddAddon: () => void;
  onRemoveAddon: (index: number) => void;
  onUpdateAddon: (index: number, field: keyof AddonItem, value: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
}

export function AddMembershipModal({
  isOpen,
  onClose,
  memberName,
  products,
  selectedProductId,
  setSelectedProductId,
  membershipForm,
  setMembershipForm,
  addons,
  onAddAddon,
  onRemoveAddon,
  onUpdateAddon,
  isLoading,
  onSubmit,
}: AddMembershipModalProps) {
  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProductId(productId);

      // PT/PPT/GPT 타입인 경우 총 유효일수 계산
      const isPTTypeProduct = product.membership_type === 'PT' || product.membership_type === 'PPT' || product.membership_type === 'GPT';
      let calculatedEndDate = "";

      if (isPTTypeProduct && product.default_sessions && product.days_per_session) {
        const totalDays = product.default_sessions * product.days_per_session;
        const startDate = new Date(membershipForm.start_date);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + totalDays);
        calculatedEndDate = endDate.toISOString().split('T')[0];
      } else if (product.validity_months) {
        // 기타 타입: 유효기간(개월) 사용
        const startDate = new Date(membershipForm.start_date);
        const endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + product.validity_months);
        calculatedEndDate = endDate.toISOString().split('T')[0];
      }

      setMembershipForm({
        ...membershipForm,
        name: product.name,
        total_sessions: product.default_sessions?.toString() || "",
        amount: product.default_price.toString(),
        end_date: calculatedEndDate
      });
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent className="bg-white max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>회원권 추가 - {memberName}</DialogTitle>
          <DialogDescription className="sr-only">회원권을 추가합니다</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* 1. 회원권 섹션 */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-semibold text-sm text-gray-700">회원권</h3>
            </div>

            <div className="border rounded-lg p-4 bg-blue-50/50 space-y-3">
              {/* 상품 선택 */}
              <div className="space-y-2">
                <Label className="text-xs">회원권명 <span className="text-red-500">*</span></Label>
                <Select
                  value={selectedProductId}
                  onValueChange={handleProductSelect}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="상품을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-[200px]">
                    {products.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        등록된 상품이 없습니다.<br />
                        상품 관리 탭에서 먼저 상품을 등록해주세요.
                      </div>
                    ) : (
                      products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.default_sessions || 0}회 / {product.default_price.toLocaleString()}원
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">총 횟수</Label>
                  <Input
                    type="number"
                    value={membershipForm.total_sessions}
                    onChange={(e) => setMembershipForm({...membershipForm, total_sessions: e.target.value})}
                    placeholder="30"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">판매금액 (원) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    value={membershipForm.amount}
                    onChange={(e) => setMembershipForm({...membershipForm, amount: e.target.value})}
                    placeholder="1000000"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">결제방법</Label>
                  <Select value={membershipForm.method} onValueChange={(v) => setMembershipForm({...membershipForm, method: v})}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="card">카드</SelectItem>
                      <SelectItem value="cash">현금</SelectItem>
                      <SelectItem value="transfer">계좌이체</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">시작일</Label>
                  <Input
                    type="date"
                    value={membershipForm.start_date}
                    onChange={(e) => setMembershipForm({...membershipForm, start_date: e.target.value})}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">종료일</Label>
                  <Input
                    type="date"
                    value={membershipForm.end_date}
                    onChange={(e) => setMembershipForm({...membershipForm, end_date: e.target.value})}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. 부가상품 추가 섹션 */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-semibold text-sm text-gray-700">부가상품 추가 (선택)</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddAddon}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                부가상품 추가
              </Button>
            </div>

            {addons.map((addon, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">부가상품 #{index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveAddon(index)}
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
                      onValueChange={(v) => onUpdateAddon(index, "addon_type", v)}
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
                        onChange={(e) => onUpdateAddon(index, "custom_addon_name", e.target.value)}
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
                        onChange={(e) => onUpdateAddon(index, "locker_number", e.target.value)}
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
                      onChange={(e) => onUpdateAddon(index, "amount", e.target.value)}
                      placeholder="50000"
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">결제방법</Label>
                    <Select
                      value={addon.method}
                      onValueChange={(v) => onUpdateAddon(index, "method", v)}
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
                    <Label className="text-xs">시작일</Label>
                    <Input
                      type="date"
                      value={addon.start_date}
                      onChange={(e) => onUpdateAddon(index, "start_date", e.target.value)}
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">기간</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        value={addon.duration}
                        onChange={(e) => onUpdateAddon(index, "duration", e.target.value)}
                        placeholder="숫자"
                        className="h-9 flex-1"
                      />
                      <Select
                        value={addon.duration_type}
                        onValueChange={(v) => onUpdateAddon(index, "duration_type", v)}
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

                  <div className="space-y-1">
                    <Label className="text-xs">종료일 (자동계산)</Label>
                    <Input
                      type="date"
                      value={addon.end_date}
                      readOnly
                      className="h-9 bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            ))}

            {addons.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">
                락커, 운동복 등 부가상품을 함께 등록할 수 있습니다.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>취소</Button>
          <Button onClick={onSubmit} className="bg-[#2F80ED] hover:bg-[#2570d6] text-white font-semibold" disabled={isLoading}>
            {isLoading ? "등록 중..." : "등록하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
