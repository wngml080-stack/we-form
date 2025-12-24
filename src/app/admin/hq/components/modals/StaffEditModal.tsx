"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { StaffEditForm } from "../../hooks/useHqData";

interface StaffEditModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  staffEditForm: StaffEditForm;
  setStaffEditForm: (form: StaffEditForm) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function StaffEditModal({
  isOpen,
  onOpenChange,
  staffEditForm,
  setStaffEditForm,
  onSubmit,
  isLoading
}: StaffEditModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>직원 정보 수정</DialogTitle>
          <DialogDescription className="sr-only">직원 정보를 수정합니다</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>직책</Label>
            <Input
              value={staffEditForm.job_title}
              onChange={(e) => setStaffEditForm({ ...staffEditForm, job_title: e.target.value })}
              placeholder="예: 대표, 부점장, 트레이너 등"
            />
          </div>
          <div className="space-y-2">
            <Label>권한</Label>
            <Select value={staffEditForm.role} onValueChange={(v) => setStaffEditForm({ ...staffEditForm, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="company_admin">본사 관리자</SelectItem>
                <SelectItem value="admin">관리자</SelectItem>
                <SelectItem value="staff">직원</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>재직 상태</Label>
            <Select value={staffEditForm.employment_status} onValueChange={(v) => setStaffEditForm({ ...staffEditForm, employment_status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="재직">재직</SelectItem>
                <SelectItem value="휴직">휴직</SelectItem>
                <SelectItem value="퇴사">퇴사</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={onSubmit}
            className="bg-[#2F80ED] hover:bg-[#1c6cd7]"
            disabled={isLoading}
          >
            저장하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
