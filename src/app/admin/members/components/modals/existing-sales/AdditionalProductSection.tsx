"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MembershipProduct } from "@/types/membership";
import { ExistingSalesFormData } from "./useExistingSalesForm";

interface AdditionalProductSectionProps {
  formData: ExistingSalesFormData;
  setFormData: (data: ExistingSalesFormData) => void;
  products: MembershipProduct[];
  selectedProductId: string;
  onProductSelect: (productId: string) => void;
}

export function AdditionalProductSection({
  formData, setFormData, products, selectedProductId, onProductSelect
}: AdditionalProductSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">회원권 정보</h3>
      <div className="space-y-2">
        <Label className="text-[#0F4C5C]">회원권명 <span className="text-red-500">*</span></Label>
        <Select value={selectedProductId} onValueChange={onProductSelect}>
          <SelectTrigger>
            <SelectValue placeholder="상품을 선택하세요" />
          </SelectTrigger>
          <SelectContent className="bg-white max-h-[200px]">
            {products.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">
                등록된 상품이 없습니다.<br />상품 관리 탭에서 먼저 상품을 등록해주세요.
              </div>
            ) : (
              products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} - {product.default_sessions || 0}회 / {product.default_price.toLocaleString()}원
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {selectedProductId && (
          <div className="bg-blue-50 p-3 rounded text-sm">
            <div className="text-blue-900 font-medium mb-1">선택한 상품 정보</div>
            <div className="text-blue-700">
              기본 횟수: {formData.total_sessions}회 / 기본 가격: {parseInt(formData.amount || "0").toLocaleString()}원
            </div>
            <div className="text-xs text-blue-600 mt-1">* 필요시 횟수와 금액을 수정할 수 있습니다.</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-[#0F4C5C]">총 횟수 (회) <span className="text-red-500">*</span></Label>
          <Input
            type="number"
            value={formData.total_sessions}
            onChange={(e) => setFormData({ ...formData, total_sessions: e.target.value })}
            placeholder="30"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#0F4C5C]">시작일</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#0F4C5C]">만료일</Label>
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
