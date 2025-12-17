"use client";

import React, { useEffect, useState } from "react";
import {
  MembershipProduct,
  ProductFormData,
  INITIAL_PRODUCT_FORM,
  MEMBERSHIP_TYPE_OPTIONS,
  MembershipType,
} from "@/types/membership";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: ProductFormData) => Promise<void>;
  editingProduct?: MembershipProduct | null;
}

export function ProductModal({
  isOpen,
  onClose,
  onSubmit,
  editingProduct,
}: ProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_PRODUCT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PT/PPT 타입인지 확인하는 헬퍼 함수
  const isPTType = (type: MembershipType | '') => {
    return type === 'PT' || type === 'PPT';
  };

  // PT/PPT의 총 유효일수 계산
  const calculateTotalDays = () => {
    if (!isPTType(formData.membership_type)) return null;
    const sessions = parseInt(formData.default_sessions);
    const daysPerSession = parseInt(formData.days_per_session);
    if (isNaN(sessions) || isNaN(daysPerSession)) return null;
    return sessions * daysPerSession;
  };

  // 수정 모드: 기존 상품 데이터로 폼 초기화
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        membership_type: editingProduct.membership_type,
        default_sessions: editingProduct.default_sessions?.toString() || '',
        default_price: editingProduct.default_price.toString(),
        validity_months: editingProduct.validity_months?.toString() || '',
        days_per_session: editingProduct.days_per_session?.toString() || '',
        description: editingProduct.description || '',
        is_active: editingProduct.is_active,
        display_order: editingProduct.display_order.toString(),
      });
    } else {
      setFormData(INITIAL_PRODUCT_FORM);
    }
  }, [editingProduct, isOpen]);

  // 폼 리셋
  const resetForm = () => {
    setFormData(INITIAL_PRODUCT_FORM);
  };

  // 폼 유효성 검증
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      alert("상품명을 입력해주세요.");
      return false;
    }

    if (!formData.membership_type) {
      alert("회원권 유형을 선택해주세요.");
      return false;
    }

    const price = parseFloat(formData.default_price);
    if (!formData.default_price || isNaN(price) || price < 0) {
      alert("기본 가격은 0 이상의 숫자를 입력해주세요.");
      return false;
    }

    // PT/PPT 타입 검증
    if (isPTType(formData.membership_type)) {
      const sessions = parseInt(formData.default_sessions);
      if (!formData.default_sessions || isNaN(sessions) || sessions <= 0) {
        alert("기본 횟수는 1 이상의 숫자를 입력해주세요.");
        return false;
      }

      const daysPerSession = parseInt(formData.days_per_session);
      if (!formData.days_per_session || isNaN(daysPerSession) || daysPerSession <= 0) {
        alert("1회당 며칠은 1 이상의 숫자를 입력해주세요.");
        return false;
      }
    }
    // 기타 타입 검증 (헬스, 필라테스 등)
    else {
      if (formData.validity_months) {
        const months = parseInt(formData.validity_months);
        if (isNaN(months) || months <= 0) {
          alert("유효기간은 1 이상의 숫자를 입력해주세요.");
          return false;
        }
      }
    }

    return true;
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      resetForm();
      onClose();
    } catch (error) {
      console.error("상품 저장 실패:", error);
      alert("상품 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모달 닫기 핸들러
  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingProduct ? "상품 수정" : "상품 등록"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 상품명 */}
          <div className="space-y-2">
            <Label htmlFor="name">
              상품명 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="예: PT 30회, 헬스 3개월"
              disabled={isSubmitting}
            />
          </div>

          {/* 회원권 유형 */}
          <div className="space-y-2">
            <Label htmlFor="membership_type">
              회원권 유형 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.membership_type}
              onValueChange={(value) =>
                setFormData({ ...formData, membership_type: value as MembershipType })
              }
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="회원권 유형 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {MEMBERSHIP_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PT/PPT 타입: 기본 횟수 & 1회당 며칠 */}
          {isPTType(formData.membership_type) && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_sessions">
                    기본 횟수 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="default_sessions"
                    type="number"
                    min="1"
                    value={formData.default_sessions}
                    onChange={(e) =>
                      setFormData({ ...formData, default_sessions: e.target.value })
                    }
                    placeholder="30"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="days_per_session">
                    1회당 며칠 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="days_per_session"
                    type="number"
                    min="1"
                    value={formData.days_per_session}
                    onChange={(e) =>
                      setFormData({ ...formData, days_per_session: e.target.value })
                    }
                    placeholder="4"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500">
                    예: 4일 (1회당 4일씩 사용)
                  </p>
                </div>
              </div>

              {/* 총 유효일수 표시 */}
              {calculateTotalDays() && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-900">
                    <strong>총 유효일수:</strong> {calculateTotalDays()}일
                    ({formData.default_sessions}회 × {formData.days_per_session}일)
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    회원권 등록 시 이 일수만큼 종료일이 자동 설정됩니다
                  </p>
                </div>
              )}
            </>
          )}

          {/* 기타 타입: 횟수 & 유효기간 (개월) - 둘 다 선택사항 */}
          {!isPTType(formData.membership_type) && formData.membership_type && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default_sessions_other">기본 횟수 (선택)</Label>
                <Input
                  id="default_sessions_other"
                  type="number"
                  min="1"
                  value={formData.default_sessions}
                  onChange={(e) =>
                    setFormData({ ...formData, default_sessions: e.target.value })
                  }
                  placeholder="비워두면 무제한"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500">
                  비워두면 횟수 제한 없음
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validity_months">유효기간 (개월, 선택)</Label>
                <Input
                  id="validity_months"
                  type="number"
                  min="1"
                  value={formData.validity_months}
                  onChange={(e) =>
                    setFormData({ ...formData, validity_months: e.target.value })
                  }
                  placeholder="비워두면 무기한"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500">
                  비워두면 기간 제한 없음
                </p>
              </div>
            </div>
          )}

          {/* 기본 가격 & 표시 순서 (2열) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default_price">
                기본 가격 (원) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="default_price"
                type="number"
                min="0"
                step="1000"
                value={formData.default_price}
                onChange={(e) =>
                  setFormData({ ...formData, default_price: e.target.value })
                }
                placeholder="300000"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">표시 순서</Label>
              <Input
                id="display_order"
                type="number"
                min="0"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: e.target.value })
                }
                placeholder="0"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                낮은 숫자가 먼저 표시됩니다
              </p>
            </div>
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label htmlFor="description">설명 / 메모</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="상품에 대한 추가 설명을 입력하세요"
              rows={3}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 활성 상태 */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              disabled={isSubmitting}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              활성 상태 (비활성화하면 매출 등록 시 선택 불가)
            </Label>
          </div>

          {/* 버튼 */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "저장 중..."
                : editingProduct
                ? "수정"
                : "등록"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
