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
import { Plus, Trash2, X, Activity, Package, Calendar as CalendarIcon, CreditCard, Banknote, PlusCircle, Sparkles } from "lucide-react";
import { MembershipProduct } from "@/types/membership";
import { cn } from "@/lib/utils";

interface MembershipFormData {
  name: string;
  total_sessions: string;
  amount: string;
  method: string;
  start_date: string;
  end_date: string;
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

      const isPTTypeProduct = product.membership_type === 'PT' || product.membership_type === 'PPT' || product.membership_type === 'GPT';
      let calculatedEndDate = "";

      if (isPTTypeProduct && product.default_sessions && product.days_per_session) {
        const totalDays = product.default_sessions * product.days_per_session;
        const startDate = new Date(membershipForm.start_date);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + totalDays);
        calculatedEndDate = endDate.toISOString().split('T')[0];
      } else if (product.validity_months) {
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
      <DialogContent className="max-w-3xl bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px]">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <PlusCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">회원권 & 부가상품 추가</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <p className="text-sm text-slate-400 font-bold">{memberName}님의 신규 이용 내역 등록</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">회원권과 부가상품을 동시에 등록할 수 있습니다</DialogDescription>
          <button
            onClick={handleClose}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-[#f8fafc]">
          {/* 1. 회원권 섹션 */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">회원권 정보 설정</h3>
              </div>
              <span className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest">Main Product</span>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Product *</Label>
                <Select value={selectedProductId} onValueChange={handleProductSelect}>
                  <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-100 transition-all">
                    <SelectValue placeholder="등록할 회원권 상품을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-2xl border-slate-100 shadow-2xl p-2">
                    {products.length === 0 ? (
                      <div className="p-8 text-center space-y-2">
                        <Package className="w-10 h-10 text-slate-200 mx-auto" />
                        <p className="text-sm text-slate-400 font-bold">등록된 상품이 없습니다.</p>
                      </div>
                    ) : (
                      products.map(product => (
                        <SelectItem key={product.id} value={product.id} className="rounded-xl py-3 focus:bg-blue-50">
                          <div className="flex items-center justify-between w-full gap-4">
                            <span className="font-bold">{product.name}</span>
                            <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                              {product.default_sessions || 0}회 / {product.default_price.toLocaleString()}원
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sessions</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={membershipForm.total_sessions}
                      onChange={(e) => setMembershipForm({...membershipForm, total_sessions: e.target.value})}
                      placeholder="30"
                      className="h-12 bg-slate-50 border-none rounded-2xl font-black text-xl pr-12 focus:ring-2 focus:ring-blue-100"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">회</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price *</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={membershipForm.amount}
                      onChange={(e) => setMembershipForm({...membershipForm, amount: e.target.value})}
                      placeholder="1,000,000"
                      className="h-12 bg-slate-50 border-none rounded-2xl font-black text-xl pr-12 focus:ring-2 focus:ring-blue-100"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">원</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment</Label>
                  <Select value={membershipForm.method} onValueChange={(v) => setMembershipForm({...membershipForm, method: v})}>
                    <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-xl">
                      <SelectItem value="card">카드 결제</SelectItem>
                      <SelectItem value="cash">현금 결제</SelectItem>
                      <SelectItem value="transfer">계좌 이체</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</Label>
                  <div className="relative group">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      type="date"
                      value={membershipForm.start_date}
                      onChange={(e) => setMembershipForm({...membershipForm, start_date: e.target.value})}
                      className="h-12 pl-11 bg-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</Label>
                  <div className="relative group">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                    <Input
                      type="date"
                      value={membershipForm.end_date}
                      onChange={(e) => setMembershipForm({...membershipForm, end_date: e.target.value})}
                      className="h-12 pl-11 bg-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-rose-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. 부가상품 섹션 */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">부가상품 추가 (옵션)</h3>
              </div>
              <Button
                type="button"
                onClick={onAddAddon}
                className="h-10 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 font-black gap-2 shadow-lg shadow-purple-100 hover:-translate-y-0.5 transition-all text-white"
              >
                <Plus className="w-4 h-4" />
                부가상품 추가
              </Button>
            </div>

            <div className="space-y-6">
              {addons.map((addon, index) => (
                <div key={index} className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative group animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="absolute -top-3 left-8 px-4 py-1 bg-purple-600 text-white text-[10px] font-black rounded-full shadow-lg">
                    ADD-ON #{index + 1}
                  </div>
                  <button
                    onClick={() => onRemoveAddon(index)}
                    className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-rose-50 text-rose-500 opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type *</Label>
                      <Select value={addon.addon_type} onValueChange={(v) => onUpdateAddon(index, "addon_type", v)}>
                        <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold">
                          <SelectValue placeholder="선택" />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-xl">
                          <SelectItem value="개인락커">개인락커</SelectItem>
                          <SelectItem value="물품락커">물품락커</SelectItem>
                          <SelectItem value="운동복">운동복</SelectItem>
                          <SelectItem value="양말">양말</SelectItem>
                          <SelectItem value="기타">기타</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        {addon.addon_type === "기타" ? "Name *" : (addon.addon_type.includes("락커") ? "Locker No." : "Detail")}
                      </Label>
                      <Input
                        value={addon.addon_type === "기타" ? addon.custom_addon_name : addon.locker_number}
                        onChange={(e) => onUpdateAddon(index, addon.addon_type === "기타" ? "custom_addon_name" : "locker_number", e.target.value)}
                        placeholder={addon.addon_type === "기타" ? "상품명 입력" : "번호 입력"}
                        className="h-12 bg-slate-50 border-none rounded-2xl font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price *</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={addon.amount}
                          onChange={(e) => onUpdateAddon(index, "amount", e.target.value)}
                          placeholder="50,000"
                          className="h-12 bg-slate-50 border-none rounded-2xl font-black text-lg pr-10"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">원</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Method</Label>
                      <Select value={addon.method} onValueChange={(v) => onUpdateAddon(index, "method", v)}>
                        <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-xl">
                          <SelectItem value="card">카드</SelectItem>
                          <SelectItem value="cash">현금</SelectItem>
                          <SelectItem value="transfer">이체</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</Label>
                      <Input
                        type="date"
                        value={addon.start_date}
                        onChange={(e) => onUpdateAddon(index, "start_date", e.target.value)}
                        className="h-12 bg-white border-none rounded-2xl font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={addon.duration}
                          onChange={(e) => onUpdateAddon(index, "duration", e.target.value)}
                          placeholder="기간"
                          className="h-12 bg-white border-none rounded-2xl font-black text-lg flex-1"
                        />
                        <Select value={addon.duration_type} onValueChange={(v) => onUpdateAddon(index, "duration_type", v)}>
                          <SelectTrigger className="h-12 w-24 bg-white border-none rounded-2xl font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white rounded-xl">
                            <SelectItem value="months">개월</SelectItem>
                            <SelectItem value="days">일</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-slate-400">Calculated Expiry</Label>
                      <div className="h-12 bg-slate-100 rounded-2xl flex items-center px-4 font-black text-slate-500">
                        {addon.end_date || "날짜 미정"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {addons.length === 0 && (
                <div className="bg-slate-50 rounded-[32px] p-12 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Sparkles className="w-8 h-8 text-slate-200" />
                  </div>
                  <div>
                    <p className="text-slate-900 font-black tracking-tight">추가 구매 혜택을 등록하세요</p>
                    <p className="text-sm text-slate-400 font-bold">락커, 운동복 등의 부가상품을 한 번에 등록할 수 있습니다.</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <DialogFooter className="px-10 py-8 bg-white border-t flex items-center justify-end gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            className="h-14 px-8 rounded-2xl font-black text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"
          >
            취소
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isLoading}
            className="h-14 px-10 rounded-2xl bg-[#2F80ED] hover:bg-[#2570d6] font-black gap-3 shadow-xl shadow-blue-100 hover:-translate-y-1 transition-all text-white"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">등록 처리 중...</span>
            ) : (
              <>
                <PlusCircle className="w-5 h-5" />
                선택한 상품 일괄 등록
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
