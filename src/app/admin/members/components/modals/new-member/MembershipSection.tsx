"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { MembershipProduct } from "@/types/membership";
import { CreateFormData, MembershipItem, isPTType } from "./useNewMemberForm";

interface MembershipSectionProps {
  createForm: CreateFormData;
  selectedProductId: string;
  products: MembershipProduct[];
  newMemberMemberships: MembershipItem[];
  onProductSelect: (productId: string) => void;
  updateFormWithEndDate: (field: keyof CreateFormData, value: string) => void;
  setCreateForm: (form: CreateFormData) => void;
  addNewMemberMembership: () => void;
  removeNewMemberMembership: (index: number) => void;
  updateNewMemberMembership: (index: number, field: keyof MembershipItem, value: string) => void;
}

export function MembershipSection({
  createForm, selectedProductId, products, newMemberMemberships,
  onProductSelect, updateFormWithEndDate, setCreateForm,
  addNewMemberMembership, removeNewMemberMembership, updateNewMemberMembership
}: MembershipSectionProps) {
  // 필터링된 상품 목록을 useMemo로 계산 (Select 컴포넌트 DOM 이슈 방지)
  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.membership_type !== "부가상품" &&
      (!createForm.membership_type || p.membership_type === createForm.membership_type)
    );
  }, [products, createForm.membership_type]);

  // 선택된 상품과 할인율 계산
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  const discountInfo = useMemo(() => {
    if (!selectedProduct) return null;
    const originalPrice = selectedProduct.default_price;
    const currentAmount = parseFloat(createForm.membership_amount) || 0;
    if (originalPrice <= 0) return null;
    const discountPercent = Math.round(((originalPrice - currentAmount) / originalPrice) * 100);
    return { originalPrice, discountPercent };
  }, [selectedProduct, createForm.membership_amount]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="font-semibold text-sm text-gray-700">회원권</h3>
        <Button type="button" variant="outline" size="sm" onClick={addNewMemberMembership} className="text-xs">
          <Plus className="w-3 h-3 mr-1" />
          회원권 추가
        </Button>
      </div>

      {/* 기본 회원권 */}
      <div className="border rounded-lg p-4 bg-blue-50/50 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-blue-700">기본 회원권</span>
        </div>

        {/* Row 1: 회원권 유형 / 등록세션(회) / 유효기간 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">회원권 유형</Label>
            <Select value={createForm.membership_type} onValueChange={(v) => updateFormWithEndDate("membership_type", v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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
          <div className="space-y-1">
            <Label className="text-xs">등록세션 (회) <span className="text-red-500">*</span></Label>
            <Input type="number" value={createForm.total_sessions} readOnly className="h-9 bg-gray-100" placeholder="30" />
          </div>
          {isPTType(createForm.membership_type) ? (
            <div className="space-y-1">
              <Label className="text-xs">1회당 유효일수</Label>
              <Input type="number" value={createForm.days_per_session} readOnly className="h-9 bg-gray-100" placeholder="7" />
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs">개월수 <span className="text-red-500">*</span></Label>
              <Input type="number" value={createForm.duration_months} readOnly className="h-9 bg-gray-100" placeholder="3" />
            </div>
          )}
        </div>

        {/* Row 2: 회원권명 */}
        <div className="space-y-1">
          <Label className="text-xs">회원권명 <span className="text-red-500">*</span></Label>
          <Select
            value={filteredProducts.some(p => p.id === selectedProductId) ? selectedProductId : ""}
            onValueChange={onProductSelect}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="상품을 선택하세요" />
            </SelectTrigger>
            <SelectContent className="bg-white max-h-[200px]">
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">
                  {products.length === 0
                    ? <>등록된 상품이 없습니다.<br />상품 관리 탭에서 먼저 상품을 등록해주세요.</>
                    : <>선택한 회원권 유형에 해당하는 상품이 없습니다.</>
                  }
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - {product.default_sessions || 0}회 / {product.default_price.toLocaleString()}원
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Row 3: 등록금액 / 결제방법 / 결제카드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">등록금액 (원) <span className="text-red-500">*</span></Label>
            <Input type="number" value={createForm.membership_amount} onChange={(e) => setCreateForm({ ...createForm, membership_amount: e.target.value })} placeholder="1000000" className="h-9" />
            {discountInfo && (
              <p className="text-xs text-red-500">
                정가 {discountInfo.originalPrice.toLocaleString()}원 대비 {discountInfo.discountPercent}% 할인
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">결제방법</Label>
            <Select value={createForm.payment_method} onValueChange={(v) => setCreateForm({ ...createForm, payment_method: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="card">카드</SelectItem>
                <SelectItem value="cash">현금</SelectItem>
                <SelectItem value="transfer">계좌이체</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">결제카드 (수기입력)</Label>
            <Input value={createForm.card_info} onChange={(e) => setCreateForm({ ...createForm, card_info: e.target.value })} placeholder="예: 신한카드" className="h-9" />
          </div>
        </div>

        {/* Row 4: 시작날짜 / 종료일 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">시작날짜 <span className="text-red-500">*</span></Label>
            <Input type="date" value={createForm.start_date} onChange={(e) => updateFormWithEndDate("start_date", e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">종료일 (자동계산)</Label>
            <Input type="date" value={createForm.end_date} readOnly className="h-9 bg-gray-100" />
          </div>
        </div>
      </div>

      {/* 추가 회원권 */}
      {newMemberMemberships.map((membership, index) => (
        <AdditionalMembershipCard
          key={membership.id}
          membership={membership}
          index={index}
          products={products}
          onRemove={() => removeNewMemberMembership(index)}
          onUpdate={(field, value) => updateNewMemberMembership(index, field, value)}
        />
      ))}
    </div>
  );
}

// 추가 회원권 카드 컴포넌트
function AdditionalMembershipCard({
  membership, index, products, onRemove, onUpdate
}: {
  membership: MembershipItem;
  index: number;
  products: MembershipProduct[];
  onRemove: () => void;
  onUpdate: (field: keyof MembershipItem, value: string) => void;
}) {
  // 필터링된 상품 목록을 useMemo로 계산 (Select 컴포넌트 DOM 이슈 방지)
  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.membership_type !== "부가상품" &&
      (!membership.membership_type || p.membership_type === membership.membership_type)
    );
  }, [products, membership.membership_type]);

  // 선택된 상품과 할인율 계산
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === membership.product_id);
  }, [products, membership.product_id]);

  const discountInfo = useMemo(() => {
    if (!selectedProduct) return null;
    const originalPrice = selectedProduct.default_price;
    const currentAmount = parseFloat(membership.amount) || 0;
    if (originalPrice <= 0) return null;
    const discountPercent = Math.round(((originalPrice - currentAmount) / originalPrice) * 100);
    return { originalPrice, discountPercent };
  }, [selectedProduct, membership.amount]);

  const handleProductSelect = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      onUpdate("product_id", productId);
      onUpdate("membership_name", product.name);
      onUpdate("membership_type", product.membership_type || "PT");
      onUpdate("total_sessions", product.default_sessions?.toString() || "0");
      onUpdate("amount", product.default_price.toString());
      onUpdate("days_per_session", product.days_per_session?.toString() || "7");
      onUpdate("duration_months", product.validity_months?.toString() || "");
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">추가 회원권 #{index + 1}</span>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-red-500 hover:text-red-700 hover:bg-red-50">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Row 1: 회원권 유형 / 등록세션(회) / 유효기간 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">회원권 유형</Label>
          <Select value={membership.membership_type} onValueChange={(v) => onUpdate("membership_type", v)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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
        <div className="space-y-1">
          <Label className="text-xs">등록세션 (회) <span className="text-red-500">*</span></Label>
          <Input type="number" value={membership.total_sessions} readOnly className="h-9 bg-gray-100" placeholder="30" />
        </div>
        {isPTType(membership.membership_type) ? (
          <div className="space-y-1">
            <Label className="text-xs">1회당 유효일수</Label>
            <Input type="number" value={membership.days_per_session} readOnly className="h-9 bg-gray-100" placeholder="7" />
          </div>
        ) : (
          <div className="space-y-1">
            <Label className="text-xs">개월수 <span className="text-red-500">*</span></Label>
            <Input type="number" value={membership.duration_months} readOnly className="h-9 bg-gray-100" placeholder="3" />
          </div>
        )}
      </div>

      {/* Row 2: 회원권명 */}
      <div className="space-y-1">
        <Label className="text-xs">회원권명 <span className="text-red-500">*</span></Label>
        <Select
          value={filteredProducts.some(p => p.id === membership.product_id) ? membership.product_id : ""}
          onValueChange={handleProductSelect}
        >
          <SelectTrigger className="h-9"><SelectValue placeholder="상품을 선택하세요" /></SelectTrigger>
          <SelectContent className="bg-white max-h-[200px]">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">
                선택한 회원권 유형에 해당하는 상품이 없습니다.
              </div>
            ) : (
              filteredProducts.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} - {product.default_sessions || 0}회 / {product.default_price.toLocaleString()}원
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Row 3: 등록금액 / 결제방법 / 결제카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">등록금액 (원) <span className="text-red-500">*</span></Label>
          <Input type="number" value={membership.amount} onChange={(e) => onUpdate("amount", e.target.value)} placeholder="1000000" className="h-9" />
          {discountInfo && (
            <p className="text-xs text-red-500">
              정가 {discountInfo.originalPrice.toLocaleString()}원 대비 {discountInfo.discountPercent}% 할인
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">결제방법</Label>
          <Select value={membership.payment_method} onValueChange={(v) => onUpdate("payment_method", v)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="card">카드</SelectItem>
              <SelectItem value="cash">현금</SelectItem>
              <SelectItem value="transfer">계좌이체</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">결제카드 (수기입력)</Label>
          <Input value={membership.card_info} onChange={(e) => onUpdate("card_info", e.target.value)} placeholder="예: 신한카드" className="h-9" />
        </div>
      </div>

      {/* Row 4: 시작날짜 / 종료일 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">시작날짜 <span className="text-red-500">*</span></Label>
          <Input type="date" value={membership.start_date} onChange={(e) => onUpdate("start_date", e.target.value)} className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">종료일 (자동계산)</Label>
          <Input type="date" value={membership.end_date} readOnly className="h-9 bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
