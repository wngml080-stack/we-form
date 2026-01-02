"use client";

import { Package, X, User, Phone, ShoppingBag, CreditCard, Banknote, History, Save, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AddonForm } from "../../hooks/useAdminDashboardData";
import { cn } from "@/lib/utils";

interface AddonModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: AddonForm;
  setForm: (form: AddonForm) => void;
  onSubmit: () => void;
  isSaving: boolean;
}

export function AddonModal({
  isOpen, onOpenChange, form, setForm, onSubmit, isSaving
}: AddonModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px]">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">회원 외 부가상품 등록</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <p className="text-sm text-slate-400 font-bold">비회원(워크인) 고객의 단발성 상품 판매 등록</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">부가상품을 등록합니다</DialogDescription>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-[#f8fafc]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 고객 정보 섹션 */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900">고객 인적 사항</h3>
              </div>
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer Name *</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <Input 
                      value={form.customer_name} 
                      onChange={(e) => setForm({ ...form, customer_name: e.target.value })} 
                      placeholder="고객 성함을 입력하세요"
                      className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</Label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <Input 
                      value={form.customer_phone} 
                      onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} 
                      placeholder="010-0000-0000"
                      className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 상품 정보 섹션 */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900">판매 상품 정보</h3>
              </div>
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name *</Label>
                  <Input 
                    value={form.product_name} 
                    onChange={(e) => setForm({ ...form, product_name: e.target.value })} 
                    placeholder="운동복, 단백질 쉐이크 등..."
                    className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price *</Label>
                    <div className="relative group">
                      <Input 
                        type="number" 
                        value={form.amount} 
                        onChange={(e) => setForm({ ...form, amount: e.target.value })} 
                        placeholder="50,000"
                        className="h-12 bg-slate-50 border-none rounded-2xl font-black text-xl pr-10 focus:ring-2 focus:ring-emerald-100"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">원</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment</Label>
                    <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                      <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-emerald-100">
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
              </div>
            </div>
          </div>

          {/* 메모 섹션 */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">
                <History className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-black text-slate-900">추가 기록 사항</h3>
            </div>
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
              <Input 
                value={form.memo} 
                onChange={(e) => setForm({ ...form, memo: e.target.value })} 
                placeholder="특이사항이나 메모를 입력하세요 (예: 재고 부족 시 안내 완료)"
                className="h-14 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>

          <div className="p-6 bg-emerald-50 rounded-[32px] border border-emerald-100 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm shrink-0">
              <Info className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-xs font-bold text-emerald-700 leading-relaxed">
              본 등록은 <span className="underline underline-offset-4 decoration-emerald-200">회원이 아닌 고객</span>에게 부가상품을 직접 판매할 때 사용합니다. 판매된 내역은 금일 매출 및 월간 매출 통계에 즉시 반영됩니다.
            </p>
          </div>
        </div>

        <DialogFooter className="px-10 py-8 bg-white border-t flex items-center justify-end gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-14 px-8 rounded-2xl font-black text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"
          >
            취소
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSaving}
            className="h-14 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black gap-3 shadow-xl shadow-emerald-100 hover:-translate-y-1 transition-all text-white"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">등록 중...</span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                판매 내역 등록
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
