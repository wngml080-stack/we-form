"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { StaffEditForm } from "../../hooks/useSystemData";

interface StaffEditModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: StaffEditForm;
  setForm: (form: StaffEditForm) => void;
  onSubmit: () => void;
}

export function StaffEditModal({ isOpen, onOpenChange, form, setForm, onSubmit }: StaffEditModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>직원 정보 수정</DialogTitle>
          <DialogDescription className="sr-only">직원 정보를 수정합니다</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>이름 *</Label>
            <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="직원 이름"/>
          </div>
          <div className="space-y-2">
            <Label>연락처</Label>
            <Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="010-0000-0000"/>
          </div>
          <div className="space-y-2">
            <Label>직책</Label>
            <Input value={form.job_title} onChange={(e) => setForm({...form, job_title: e.target.value})} placeholder="예: 트레이너, 매니저"/>
          </div>
          <div className="space-y-2">
            <Label>권한</Label>
            <Select value={form.role} onValueChange={(v) => setForm({...form, role: v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="system_admin">시스템 관리자</SelectItem>
                <SelectItem value="company_admin">본사 관리자</SelectItem>
                <SelectItem value="admin">지점 관리자</SelectItem>
                <SelectItem value="staff">직원</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>재직 상태</Label>
            <Select value={form.employment_status} onValueChange={(v) => setForm({...form, employment_status: v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="재직">재직</SelectItem>
                <SelectItem value="퇴사">퇴사</SelectItem>
                <SelectItem value="가입대기">가입대기</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={onSubmit} className="bg-[#2F80ED]">저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
