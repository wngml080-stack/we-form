"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { MembershipProduct } from "@/types/membership";
import { AddonItem } from "./useExistingSalesForm";

interface AddonProductsSectionProps {
  addons: AddonItem[];
  addonProducts: MembershipProduct[];
  onAddAddon: () => void;
  onRemoveAddon: (index: number) => void;
  onUpdateAddon: (index: number, field: keyof AddonItem, value: string) => void;
}

export function AddonProductsSection({
  addons, addonProducts, onAddAddon, onRemoveAddon, onUpdateAddon
}: AddonProductsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="font-semibold text-sm text-gray-700">부가상품 추가 (선택)</h3>
        <Button type="button" variant="outline" size="sm" onClick={onAddAddon} className="text-xs">
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
              <Label className="text-xs">부가상품 선택 *</Label>
              <Select value={addon.product_id} onValueChange={(v) => onUpdateAddon(index, "product_id", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="상품 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {addonProducts.length > 0 ? (
                    addonProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.default_price.toLocaleString()}원)
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>등록된 부가상품이 없습니다</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

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
              <Select value={addon.method} onValueChange={(v) => onUpdateAddon(index, "method", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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
                  onChange={(e) => onUpdateAddon(index, "duration", e.target.value)}
                  placeholder="숫자"
                  className="h-9 flex-1"
                />
                <Select value={addon.duration_type} onValueChange={(v) => onUpdateAddon(index, "duration_type", v)}>
                  <SelectTrigger className="h-9 w-20"><SelectValue /></SelectTrigger>
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

      {addons.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">
          {addonProducts.length > 0
            ? "부가상품을 추가하려면 위의 '부가상품 추가' 버튼을 클릭하세요."
            : "상품관리에서 부가상품 유형의 상품을 먼저 등록해주세요."}
        </p>
      )}
    </div>
  );
}
