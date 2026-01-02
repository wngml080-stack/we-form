"use client";

import { toast } from "@/lib/toast";
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
  DialogDescription,
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
import { Package, X, Tag, CreditCard, Calendar as CalendarIcon, Info, Save, Activity, Sparkles, CheckCircle2, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

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

  // PT/PPT/GPT 타입인지 확인하는 헬퍼 함수
  const isPTType = (type: MembershipType | '') => {
    return type === 'PT' || type === 'PPT' || type === 'GPT';
  };

  // 부가상품 타입인지 확인하는 헬퍼 함수
  const isAddonType = (type: MembershipType | '') => {
    return type === '부가상품';
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
      toast.warning("상품명을 입력해주세요.");
      return false;
    }

    if (!formData.membership_type) {
      toast.warning("회원권 유형을 선택해주세요.");
      return false;
    }

    const price = parseFloat(formData.default_price);
    if (!formData.default_price || isNaN(price) || price < 0) {
      toast.warning("기본 가격은 0 이상의 숫자를 입력해주세요.");
      return false;
    }

    // PT/PPT 타입 검증
    if (isPTType(formData.membership_type)) {
      const sessions = parseInt(formData.default_sessions);
      if (!formData.default_sessions || isNaN(sessions) || sessions <= 0) {
        toast.warning("기본 횟수는 1 이상의 숫자를 입력해주세요.");
        return false;
      }

      const daysPerSession = parseInt(formData.days_per_session);
      if (!formData.days_per_session || isNaN(daysPerSession) || daysPerSession <= 0) {
        toast.warning("1회당 며칠은 1 이상의 숫자를 입력해주세요.");
        return false;
      }
    }
    // 기타 타입 검증 (헬스, 필라테스 등)
    else {
      if (formData.validity_months) {
        const months = parseInt(formData.validity_months);
        if (isNaN(months) || months <= 0) {
          toast.warning("유효기간은 1 이상의 숫자를 입력해주세요.");
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
      toast.error("상품 저장 중 오류가 발생했습니다.");
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
      <DialogContent className="max-w-2xl bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px]">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {editingProduct ? "이용권 상품 정보 수정" : "신규 이용권 상품 등록"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <p className="text-sm text-slate-400 font-bold">센터에서 판매할 회원권 및 부가상품의 기본 구성 설정</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">상품 정보를 입력합니다</DialogDescription>
          <button
            onClick={handleClose}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 bg-[#f8fafc]">
          {/* 1. 기본 정보 설정 */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Tag className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">상품 기본 구성</h3>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: PT 30회, 헬스 3개월 패키지"
                  className="h-14 bg-slate-50 border-none rounded-2xl font-black text-lg focus:ring-2 focus:ring-blue-100"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Membership Type *</Label>
                  <Select
                    value={formData.membership_type}
                    onValueChange={(value) => setFormData({ ...formData, membership_type: value as MembershipType })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold">
                      <SelectValue placeholder="유형 선택" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-xl">
                      {MEMBERSHIP_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="rounded-lg">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Base Price {isAddonType(formData.membership_type) ? "(Monthly)" : ""} *
                  </Label>
                  <div className="relative group">
                    <Input
                      type="number"
                      value={formData.default_price}
                      onChange={(e) => setFormData({ ...formData, default_price: e.target.value })}
                      placeholder="300,000"
                      className="h-12 bg-slate-50 border-none rounded-2xl font-black text-xl pr-10 focus:ring-2 focus:ring-blue-100"
                      disabled={isSubmitting}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">원</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. 상세 옵션 (PT 전용 또는 기타) */}
          {(formData.membership_type && !isAddonType(formData.membership_type)) && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">이용 기간 및 횟수 설정</h3>
              </div>

              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
                {isPTType(formData.membership_type) ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Sessions *</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={formData.default_sessions}
                            onChange={(e) => setFormData({ ...formData, default_sessions: e.target.value })}
                            placeholder="30"
                            className="h-12 bg-slate-50 border-none rounded-2xl font-black text-xl pr-10"
                            disabled={isSubmitting}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">회</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Days Per Session *</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={formData.days_per_session}
                            onChange={(e) => setFormData({ ...formData, days_per_session: e.target.value })}
                            placeholder="4"
                            className="h-12 bg-slate-50 border-none rounded-2xl font-black text-xl pr-10"
                            disabled={isSubmitting}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">일</span>
                        </div>
                      </div>
                    </div>

                    {calculateTotalDays() && (
                      <div className="bg-blue-600 rounded-[24px] p-8 text-white shadow-xl shadow-blue-100 flex items-center justify-between relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4">
                          <Sparkles className="w-32 h-32" />
                        </div>
                        <div className="space-y-1 relative z-10">
                          <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Calculated Total Validity</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black">{calculateTotalDays()}</span>
                            <span className="text-xl font-black text-blue-200 uppercase tracking-tighter">Days</span>
                          </div>
                        </div>
                        <div className="text-right relative z-10 hidden md:block">
                          <p className="text-xs font-bold text-blue-100 leading-relaxed">
                            {formData.default_sessions}회 × {formData.days_per_session}일 기준으로<br />회원권 종료일이 자동 계산됩니다.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Sessions (Optional)</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={formData.default_sessions}
                          onChange={(e) => setFormData({ ...formData, default_sessions: e.target.value })}
                          placeholder="제한 없음"
                          className="h-12 bg-slate-50 border-none rounded-2xl font-black text-xl pr-10"
                          disabled={isSubmitting}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">회</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Validity (Months, Optional)</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={formData.validity_months}
                          onChange={(e) => setFormData({ ...formData, validity_months: e.target.value })}
                          placeholder="무기한"
                          className="h-12 bg-slate-50 border-none rounded-2xl font-black text-xl pr-10"
                          disabled={isSubmitting}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">월</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 3. 부가 정보 (설명 및 노출 설정) */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">추가 상세 및 노출 설정</h3>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description / Memo</Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="상품에 대한 상세 설명이나 내부 참고용 메모를 입력하세요..."
                  rows={3}
                  className="w-full bg-slate-50 border-none rounded-2xl font-bold p-6 focus:ring-2 focus:ring-slate-100 resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-50">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                    className="h-12 bg-slate-50 border-none rounded-2xl font-bold"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-black text-slate-900">상품 활성화</Label>
                    <p className="text-[10px] font-bold text-slate-400">판매 목록 노출 여부</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      disabled={isSubmitting}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </section>
        </form>

        <DialogFooter className="px-10 py-8 bg-white border-t flex items-center justify-end gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="h-14 px-8 rounded-2xl font-black text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-black font-black gap-3 shadow-xl shadow-slate-100 hover:-translate-y-1 transition-all text-white"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">저장 중...</span>
            ) : (
              <>
                <Save className="w-5 h-5 text-emerald-400" />
                {editingProduct ? "상품 정보 수정 완료" : "신규 상품 등록 완료"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
