"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ExistingMemberForm } from "../../hooks/useAdminDashboardData";

interface ExistingMemberModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: ExistingMemberForm;
  setForm: (form: ExistingMemberForm) => void;
  products: any[];
  memberSearchQuery: string;
  setMemberSearchQuery: (query: string) => void;
  memberSearchResults: any[];
  setMemberSearchResults: (results: any[]) => void;
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
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            기존회원 등록
          </DialogTitle>
          <DialogDescription className="sr-only">기존 회원에게 회원권을 추가합니다</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>회원 검색 *</Label>
            <Input
              value={memberSearchQuery}
              onChange={(e) => {
                setMemberSearchQuery(e.target.value);
                searchMembers(e.target.value);
              }}
              placeholder="이름 또는 전화번호로 검색"
            />
            {memberSearchResults.length > 0 && (
              <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
                {memberSearchResults.map((member) => (
                  <div
                    key={member.id}
                    className="p-2 hover:bg-blue-50 cursor-pointer flex justify-between"
                    onClick={() => {
                      setForm({ ...form, member_id: member.id, member_name: member.name });
                      setMemberSearchQuery(member.name);
                      setMemberSearchResults([]);
                    }}
                  >
                    <span className="font-medium">{member.name}</span>
                    <span className="text-gray-400 text-sm">{member.phone}</span>
                  </div>
                ))}
              </div>
            )}
            {form.member_id && (
              <div className="mt-2 text-sm text-green-600">선택됨: {form.member_name}</div>
            )}
          </div>
          <div>
            <Label>상품 선택 *</Label>
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
              <SelectTrigger><SelectValue placeholder="상품을 선택하세요" /></SelectTrigger>
              <SelectContent>
                {products.length === 0 ? (
                  <SelectItem value="" disabled>등록된 상품이 없습니다</SelectItem>
                ) : (
                  products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.membership_type}) - {product.default_price?.toLocaleString()}원
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {products.length === 0 && (
              <p className="text-xs text-orange-500 mt-1">매출관리 &gt; 상품관리에서 상품을 먼저 등록해주세요.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>횟수</Label>
              <Input type="number" value={form.sessions} onChange={(e) => setForm({ ...form, sessions: e.target.value })} placeholder="30" />
            </div>
            <div>
              <Label>결제금액 *</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="1000000" />
            </div>
          </div>
          <div>
            <Label>결제방법</Label>
            <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="card">카드</SelectItem>
                <SelectItem value="cash">현금</SelectItem>
                <SelectItem value="transfer">계좌이체</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>메모</Label>
            <Input value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} placeholder="특이사항" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={onSubmit} disabled={isSaving}>{isSaving ? "등록 중..." : "등록"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
