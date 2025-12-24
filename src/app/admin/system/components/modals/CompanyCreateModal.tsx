"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CreateCompanyForm } from "../../hooks/useSystemData";

interface CompanyCreateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: CreateCompanyForm;
  setForm: (form: CreateCompanyForm) => void;
  onSubmit: () => void;
}

export function CompanyCreateModal({ isOpen, onOpenChange, form, setForm, onSubmit }: CompanyCreateModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>고객사 추가</DialogTitle>
          <DialogDescription className="sr-only">새로운 고객사를 추가합니다</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>회사명 *</Label>
            <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="회사명을 입력하세요"/>
          </div>
          <div className="space-y-2">
            <Label>대표자명 *</Label>
            <Input value={form.representative_name} onChange={(e) => setForm({...form, representative_name: e.target.value})} placeholder="대표자명을 입력하세요"/>
          </div>
          <div className="space-y-2">
            <Label>연락처</Label>
            <Input value={form.contact_phone} onChange={(e) => setForm({...form, contact_phone: e.target.value})} placeholder="010-0000-0000"/>
          </div>
          <div className="space-y-2">
            <Label>상태</Label>
            <Select value={form.status} onValueChange={(v) => setForm({...form, status: v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="pending">승인대기</SelectItem>
                <SelectItem value="active">운영중</SelectItem>
                <SelectItem value="suspended">이용정지</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={onSubmit} className="bg-[#2F80ED]">추가</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
