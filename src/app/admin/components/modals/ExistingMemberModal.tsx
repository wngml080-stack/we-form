"use client";

import { Users, X, Search, CheckCircle2, Save, ShoppingBag, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ExistingMemberForm, Product, MemberSearchResult } from "../../hooks/useAdminDashboardData";

interface ExistingMemberModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: ExistingMemberForm;
  setForm: (form: ExistingMemberForm) => void;
  products: Product[];
  memberSearchQuery: string;
  setMemberSearchQuery: (query: string) => void;
  memberSearchResults: MemberSearchResult[];
  setMemberSearchResults: (results: MemberSearchResult[]) => void;
  searchMembers: (query: string) => void;
  onSubmit: () => void;
  isSaving: boolean;
}

export function ExistingMemberModal({
  isOpen, onOpenChange, form, setForm, products,
  memberSearchQuery, setMemberSearchQuery, memberSearchResults, setMemberSearchResults,
  searchMembers, onSubmit, isSaving
}: ExistingMemberModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl bg-[var(--background)] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-2xl xs:rounded-3xl sm:rounded-[40px]">
        <DialogHeader className="px-10 py-8 bg-[var(--foreground)] flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary-hex)]/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--primary-hex)] to-[var(--primary-active-hex)] flex items-center justify-center shadow-[0_4px_16px_rgba(49,130,246,0.3)]">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">기존 회원 신규 등록</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <p className="text-sm text-slate-400 font-bold">기존 회원의 추가 회원권 및 상품 구매 등록</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">기존 회원에게 회원권을 추가합니다</DialogDescription>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-[var(--background)]">
          {/* 1. 회원 검색 섹션 */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary-light-hex)] text-[var(--primary-hex)] flex items-center justify-center text-xs font-black">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-[var(--foreground)] tracking-tight">대상 회원 검색</h3>
            </div>

            <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-8 border border-[#E5E8EB] shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-6 relative">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Member *</Label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[var(--primary-hex)] transition-colors" />
                  <Input
                    value={memberSearchQuery}
                    onChange={(e) => {
                      setMemberSearchQuery(e.target.value);
                      searchMembers(e.target.value);
                    }}
                    placeholder="이름 또는 전화번호로 검색하세요"
                    className="h-14 pl-12 bg-[var(--background-secondary)] border-none rounded-2xl font-black text-lg focus:ring-2 focus:ring-[var(--primary-hex)]/20"
                  />
                </div>
              </div>

              {memberSearchResults.length > 0 && (
                <div className="absolute top-full left-8 right-8 z-50 mt-2 bg-white rounded-2xl shadow-2xl border border-[#E5E8EB] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  {memberSearchResults.map((member) => (
                    <div
                      key={member.id}
                      className="p-4 hover:bg-[var(--background-secondary)] cursor-pointer flex justify-between items-center transition-colors group"
                      onClick={() => {
                        setForm({ ...form, member_id: member.id, member_name: member.name });
                        setMemberSearchQuery(member.name);
                        setMemberSearchResults([]);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--primary-light-hex)] text-[var(--primary-hex)] flex items-center justify-center font-black">
                          {member.name[0]}
                        </div>
                        <div>
                          <p className="font-black text-[var(--foreground)]">{member.name}</p>
                          <p className="text-xs font-bold text-slate-400">{member.phone}</p>
                        </div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-[var(--secondary-hex)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              )}

              {form.member_id && (
                <div className="flex items-center gap-3 p-4 bg-[var(--secondary-light-hex)] rounded-2xl border border-[var(--secondary-hex)]/20 animate-in zoom-in-95 duration-300">
                  <div className="w-8 h-8 rounded-full bg-[var(--secondary-hex)] flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[var(--secondary-hex)] uppercase tracking-widest">Selected Member</p>
                    <p className="text-lg font-black text-[var(--foreground)]">{form.member_name} 회원님</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 2. 상품 정보 섹션 */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary-light-hex)] text-[var(--primary-hex)] flex items-center justify-center text-xs font-black">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-[var(--foreground)] tracking-tight">추가 상품 정보</h3>
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
                        membership_type: product.membership_type ?? "",
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
            disabled={isSaving || !form.member_id}
            className="h-14 px-10 rounded-2xl bg-[var(--foreground)] hover:bg-black font-black gap-3 shadow-xl shadow-slate-100 hover:-translate-y-1 transition-all text-white"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">등록 처리 중...</span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                선택 상품 등록 완료
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
