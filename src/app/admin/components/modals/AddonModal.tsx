"use client";

import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AddonForm } from "../../hooks/useAdminDashboardData";

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
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            회원이외 부가등록
          </DialogTitle>
          <DialogDescription className="sr-only">부가상품을 등록합니다</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>고객명 *</Label>
              <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="홍길동" />
            </div>
            <div>
              <Label>연락처</Label>
              <Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} placeholder="010-1234-5678" />
            </div>
          </div>
          <div>
            <Label>상품명 *</Label>
            <Input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} placeholder="운동복, 프로틴 등" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>금액 *</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="50000" />
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
