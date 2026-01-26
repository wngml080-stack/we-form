"use client";

import { UserPlus, X, User, Phone, ShoppingBag, CreditCard, Banknote, Save, Info, Sparkles, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { NewMemberForm } from "../../hooks/useAdminDashboardData";
import { cn } from "@/lib/utils";

interface NewMemberModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: NewMemberForm;
  setForm: (form: NewMemberForm) => void;
  products: any[];
  onSubmit: () => void;
  isSaving: boolean;
}

export function NewMemberModal({
  isOpen, onOpenChange, form, setForm, products, onSubmit, isSaving
}: NewMemberModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl bg-[var(--background)] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-2xl xs:rounded-3xl sm:rounded-[40px]">
        <DialogHeader className="px-10 py-8 bg-[var(--foreground)] flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary-hex)]/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--primary-hex)] to-[var(--primary-active-hex)] flex items-center justify-center shadow-[0_4px_16px_rgba(49,130,246,0.3)]">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">신규 회원 통합 등록</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <p className="text-sm text-slate-400 font-bold">회원 정보와 이용 상품을 한 번에 등록합니다</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">신규 회원을 등록합니다</DialogDescription>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-[var(--background)]">
          {/* 1. 기본 인적 사항 */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary-light-hex)] text-[var(--primary-hex)] flex items-center justify-center text-xs font-black">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-[var(--foreground)] tracking-tight">신규 회원 정보</h3>
            </div>

            <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-8 border border-[#E5E8EB] shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Member Name *</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="성함을 입력하세요"
                      className="h-12 pl-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number *</Label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="010-0000-0000"
                      className="h-12 pl-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. 이용 상품 정보 */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-[var(--secondary-light-hex)] text-[var(--secondary-hex)] flex items-center justify-center text-xs font-black">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-[var(--foreground)] tracking-tight">선택 이용권 정보</h3>
            </div>

            <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-8 border border-[#E5E8EB] shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Product *</Label>
                <Select
                  value={form.membership_name}
                  onValueChange={(productId) => {
                    const product = products.find(p => p.id === productId);
                    if (product) {
                      setForm({
                        ...form,
                        membership_type: product.membership_type,
                        membership_name: product.id,
                        sessions: product.default_sessions?.toString() || "",
                        amount: product.default_price?.toString() || ""
                      });
                    }
                  }}
                >
                  <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-100 transition-all">
                    <SelectValue placeholder="등록할 회원권 상품을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-2xl p-2 shadow-2xl">
                    {products.length === 0 ? (
                      <SelectItem value="" disabled>등록된 상품이 없습니다</SelectItem>
                    ) : (
                      products.map((product) => (
                        <SelectItem key={product.id} value={product.id} className="rounded-xl py-3">
                          <div className="flex items-center justify-between w-full gap-4">
                            <span className="font-bold">{product.name} ({product.membership_type})</span>
                            <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                              {product.default_price?.toLocaleString()}원
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {products.length === 0 && (
                  <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5 ml-1">
                    <Info className="w-3.5 h-3.5" />
                    매출관리 &gt; 상품관리에서 상품을 먼저 등록해주세요.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sessions</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={form.sessions}
                      onChange={(e) => setForm({ ...form, sessions: e.target.value })}
                      placeholder="30"
                      className="h-12 bg-slate-50 border-none rounded-2xl font-black text-xl pr-10 focus:ring-2 focus:ring-blue-100"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">회</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount *</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="1,000,000"
                      className="h-12 bg-slate-50 border-none rounded-2xl font-black text-xl pr-10 focus:ring-2 focus:ring-blue-100"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">원</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Method</Label>
                  <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                    <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-xl">
                      <SelectItem value="card">카드 결제 (Card)</SelectItem>
                      <SelectItem value="cash">현금 결제 (Cash)</SelectItem>
                      <SelectItem value="transfer">계좌 이체 (Transfer)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes / Memo</Label>
                  <Input
                    value={form.memo}
                    onChange={(e) => setForm({ ...form, memo: e.target.value })}
                    placeholder="특이사항을 입력하세요"
                    className="h-12 bg-slate-50 border-none rounded-2xl font-bold"
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="p-6 bg-[var(--primary-light-hex)] rounded-2xl xs:rounded-3xl sm:rounded-[32px] border border-[var(--primary-hex)]/20 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-5 h-5 text-[var(--primary-hex)]" />
            </div>
            <p className="text-xs font-bold text-[var(--primary-hex)] leading-relaxed">
              신규 회원 등록 시 <span className="underline underline-offset-4 decoration-[var(--primary-hex)]/30">자동으로 관리 대상 회원으로 분류</span>되며, 담당 트레이너 및 센터 관리자에게 등록 알림이 전송됩니다.
            </p>
          </div>
        </div>

        <DialogFooter className="px-10 py-8 bg-white border-t border-[#E5E8EB] flex items-center justify-end gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-14 px-8 rounded-2xl font-black text-[var(--foreground-secondary)] border-[#E5E8EB] hover:bg-[var(--background-secondary)] transition-all"
          >
            취소
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSaving}
            className="h-14 px-10 rounded-2xl bg-[var(--foreground)] hover:bg-black font-black gap-3 shadow-xl shadow-slate-100 hover:-translate-y-1 transition-all text-white"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">등록 처리 중...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                신규 회원 등록 완료
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
