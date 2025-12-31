"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { MembershipProduct } from "@/types/membership";
import { ExistingSalesFormData, MembershipItem, MemberMembershipInfo, getLatestEndDateByType, getNextDay, isPTType, calculateEndDate } from "./useExistingSalesForm";

interface ExistingMembershipSectionProps {
  formData: ExistingSalesFormData;
  setFormData: (data: ExistingSalesFormData) => void;
  products: MembershipProduct[];
  selectedProductId: string;
  memberships: MembershipItem[];
  memberMemberships?: MemberMembershipInfo[];
  onProductSelect: (productId: string) => void;
  addMembership: () => void;
  removeMembership: (index: number) => void;
  updateMembership: (index: number, field: keyof MembershipItem, value: string) => void;
  batchUpdateMembership: (index: number, updates: Partial<MembershipItem>) => void;
}

export function ExistingMembershipSection({
  formData, setFormData, products, selectedProductId, memberships, memberMemberships,
  onProductSelect, addMembership, removeMembership, updateMembership, batchUpdateMembership
}: ExistingMembershipSectionProps) {
  // 기본 회원권의 최소 시작일 계산 (같은 유형의 기존 회원권 종료일 다음 날)
  const minStartDate = useMemo(() => {
    if (!memberMemberships || !formData.membership_type) return undefined;
    const latestEndDate = getLatestEndDateByType(memberMemberships, formData.membership_type);
    if (latestEndDate) {
      const today = new Date().toISOString().split("T")[0];
      if (latestEndDate >= today) {
        return getNextDay(latestEndDate);
      }
    }
    return undefined;
  }, [memberMemberships, formData.membership_type]);

  // 필터링된 상품 목록을 useMemo로 계산 (Select 컴포넌트 DOM 이슈 방지)
  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.membership_type !== "부가상품" &&
      (!formData.membership_type || p.membership_type === formData.membership_type)
    );
  }, [products, formData.membership_type]);

  // 선택된 상품과 할인율 계산
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  const discountInfo = useMemo(() => {
    if (!selectedProduct) return null;
    const originalPrice = selectedProduct.default_price;
    const currentAmount = parseFloat(formData.amount) || 0;
    if (originalPrice <= 0) return null;
    const discountPercent = Math.round(((originalPrice - currentAmount) / originalPrice) * 100);
    return { originalPrice, discountPercent };
  }, [selectedProduct, formData.amount]);

  // 회원권 유형 변경 핸들러
  const handleMembershipTypeChange = (newType: string) => {
    // 새로운 유형에 대한 최소 시작일 확인
    const newLatestEndDate = getLatestEndDateByType(memberMemberships, newType);
    let newStartDate = formData.start_date;

    if (newLatestEndDate) {
      const today = new Date().toISOString().split("T")[0];
      if (newLatestEndDate >= today) {
        const newMinStartDate = getNextDay(newLatestEndDate);
        // 현재 시작일이 새 유형의 최소 시작일보다 이전이면 자동 조정
        if (formData.start_date < newMinStartDate) {
          newStartDate = newMinStartDate;
          toast.info(`같은 유형(${newType})의 기존 회원권이 있어 시작일이 ${newMinStartDate}로 변경됩니다.`);
        }
      }
    }

    setFormData({ ...formData, membership_type: newType, start_date: newStartDate });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="font-semibold text-sm text-gray-700">회원권</h3>
        <Button type="button" variant="outline" size="sm" onClick={addMembership} className="text-xs">
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
            <Select value={formData.membership_type} onValueChange={handleMembershipTypeChange}>
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
            <Input
              type="number"
              value={formData.additional_sessions}
              readOnly
              placeholder="30"
              className="h-9 bg-gray-100"
            />
          </div>
          {isPTType(formData.membership_type) ? (
            <div className="space-y-1">
              <Label className="text-xs">1회당 유효일수</Label>
              <Input
                type="number"
                value={formData.days_per_session}
                readOnly
                placeholder="7"
                className="h-9 bg-gray-100"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs">개월수 <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={formData.duration_months}
                readOnly
                placeholder="3"
                className="h-9 bg-gray-100"
              />
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
                  {formData.membership_type
                    ? `${formData.membership_type} 유형의 상품이 없습니다.`
                    : "등록된 상품이 없습니다."}<br />
                  상품 관리 탭에서 먼저 상품을 등록해주세요.
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
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value, total_amount: e.target.value })}
              placeholder="1000000"
              className="h-9"
            />
            {discountInfo && (
              <p className="text-xs text-red-500">
                정가 {discountInfo.originalPrice.toLocaleString()}원 대비 {discountInfo.discountPercent}% 할인
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">결제방법</Label>
            <Select value={formData.method} onValueChange={(v) => setFormData({ ...formData, method: v })}>
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
            <Input
              value={formData.card_info}
              onChange={(e) => setFormData({ ...formData, card_info: e.target.value })}
              placeholder="예: 신한카드"
              className="h-9"
            />
          </div>
        </div>

        {/* Row 4: 시작날짜 / 종료일 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">시작날짜 <span className="text-red-500">*</span></Label>
            <Input
              type="date"
              value={formData.start_date}
              min={minStartDate}
              onChange={(e) => {
                const newStartDate = e.target.value;
                if (minStartDate && newStartDate < minStartDate) {
                  toast.error(`같은 유형의 기존 회원권이 있어 ${minStartDate} 이후로만 시작일을 설정할 수 있습니다.`);
                  return;
                }
                const newEndDate = calculateEndDate(
                  newStartDate,
                  formData.membership_type,
                  formData.additional_sessions,
                  formData.days_per_session,
                  formData.duration_months
                );
                setFormData({ ...formData, start_date: newStartDate, end_date: newEndDate });
              }}
              className="h-9"
            />
            {minStartDate && (
              <p className="text-xs text-gray-500">
                같은 유형 기존 회원권 종료 후 {minStartDate}부터 가능
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">종료일 (자동계산)</Label>
            <Input
              type="date"
              value={formData.end_date}
              readOnly
              className="h-9 bg-gray-100"
            />
          </div>
        </div>
      </div>

      {/* 추가 회원권 */}
      {memberships.map((membership, index) => (
        <AdditionalMembershipCard
          key={membership.id}
          membership={membership}
          index={index}
          products={products}
          memberMemberships={memberMemberships}
          onRemove={() => removeMembership(index)}
          onUpdate={(field, value) => updateMembership(index, field, value)}
          onBatchUpdate={(updates) => batchUpdateMembership(index, updates)}
        />
      ))}
    </div>
  );
}

// 추가 회원권 카드 컴포넌트
function AdditionalMembershipCard({
  membership, index, products, memberMemberships, onRemove, onUpdate, onBatchUpdate
}: {
  membership: MembershipItem;
  index: number;
  products: MembershipProduct[];
  memberMemberships?: MemberMembershipInfo[];
  onRemove: () => void;
  onUpdate: (field: keyof MembershipItem, value: string) => void;
  onBatchUpdate: (updates: Partial<MembershipItem>) => void;
}) {
  // 추가 회원권의 최소 시작일 계산
  const minStartDate = useMemo(() => {
    if (!memberMemberships || !membership.membership_type) return undefined;
    const latestEndDate = getLatestEndDateByType(memberMemberships, membership.membership_type);
    if (latestEndDate) {
      const today = new Date().toISOString().split("T")[0];
      if (latestEndDate >= today) {
        return getNextDay(latestEndDate);
      }
    }
    return undefined;
  }, [memberMemberships, membership.membership_type]);

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
      const membershipType = product.membership_type || "PT";

      // 같은 유형의 기존 회원권 종료일 확인
      let startDate = new Date().toISOString().split("T")[0];
      if (memberMemberships) {
        const latestEndDate = getLatestEndDateByType(memberMemberships, membershipType);
        if (latestEndDate) {
          const today = new Date().toISOString().split("T")[0];
          // 기존 회원권 종료일이 오늘 이후라면, 종료일 다음 날부터 시작
          if (latestEndDate >= today) {
            startDate = getNextDay(latestEndDate);
            toast.info(`같은 유형(${membershipType})의 기존 회원권이 ${latestEndDate}까지 있어서 ${startDate}부터 시작합니다.`);
          }
        }
      }

      // 배치 업데이트로 모든 필드를 한번에 업데이트
      onBatchUpdate({
        product_id: productId,
        membership_name: product.name,
        membership_type: membershipType,
        total_sessions: product.default_sessions?.toString() || "0",
        amount: product.default_price.toString(),
        start_date: startDate,
      });
    }
  };

  // 회원권 유형 변경 핸들러 (시작일 재검증 포함)
  const handleMembershipTypeChange = (newType: string) => {
    // 새로운 유형에 대한 최소 시작일 계산
    let newMinStartDate: string | undefined;
    if (memberMemberships) {
      const latestEndDate = getLatestEndDateByType(memberMemberships, newType);
      if (latestEndDate) {
        const today = new Date().toISOString().split("T")[0];
        if (latestEndDate >= today) {
          newMinStartDate = getNextDay(latestEndDate);
        }
      }
    }

    // 현재 시작일이 새로운 최소 시작일보다 이전이면 시작일도 업데이트
    if (newMinStartDate && membership.start_date < newMinStartDate) {
      toast.info(`같은 유형(${newType})의 기존 회원권이 있어 시작일이 ${newMinStartDate}로 변경됩니다.`);
      onBatchUpdate({
        membership_type: newType,
        start_date: newMinStartDate,
      });
    } else {
      onUpdate("membership_type", newType);
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
          <Select value={membership.membership_type} onValueChange={handleMembershipTypeChange}>
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
          <Input
            type="number"
            value={membership.total_sessions}
            readOnly
            placeholder="30"
            className="h-9 bg-gray-100"
          />
        </div>
        {isPTType(membership.membership_type) ? (
          <div className="space-y-1">
            <Label className="text-xs">1회당 유효일수</Label>
            <Input
              type="number"
              value={membership.days_per_session}
              readOnly
              placeholder="7"
              className="h-9 bg-gray-100"
            />
          </div>
        ) : (
          <div className="space-y-1">
            <Label className="text-xs">개월수 <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              value={membership.duration_months}
              readOnly
              placeholder="3"
              className="h-9 bg-gray-100"
            />
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
                {membership.membership_type
                  ? `${membership.membership_type} 유형의 상품이 없습니다.`
                  : "등록된 상품이 없습니다."}
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
          <Input
            type="number"
            value={membership.amount}
            onChange={(e) => onUpdate("amount", e.target.value)}
            placeholder="1000000"
            className="h-9"
          />
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
          <Input
            value={membership.card_info}
            onChange={(e) => onUpdate("card_info", e.target.value)}
            placeholder="예: 신한카드"
            className="h-9"
          />
        </div>
      </div>

      {/* Row 4: 시작날짜 / 종료일 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">시작날짜 <span className="text-red-500">*</span></Label>
          <Input
            type="date"
            value={membership.start_date}
            min={minStartDate}
            onChange={(e) => {
              const newStartDate = e.target.value;
              if (minStartDate && newStartDate < minStartDate) {
                toast.error(`같은 유형의 기존 회원권이 있어 ${minStartDate} 이후로만 시작일을 설정할 수 있습니다.`);
                return;
              }
              onUpdate("start_date", newStartDate);
            }}
            className="h-9"
          />
          {minStartDate && (
            <p className="text-xs text-gray-500">
              같은 유형 기존 회원권 종료 후 {minStartDate}부터 가능
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">종료일 (자동계산)</Label>
          <Input
            type="date"
            value={membership.end_date}
            readOnly
            className="h-9 bg-gray-100"
          />
        </div>
      </div>
    </div>
  );
}
