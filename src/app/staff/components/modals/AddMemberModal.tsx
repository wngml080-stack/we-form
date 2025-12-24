"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NewMemberData } from "../../hooks/useStaffPageData";

interface AddMemberModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newMemberData: NewMemberData;
  setNewMemberData: (data: NewMemberData) => void;
  onSubmit: () => void;
}

export function AddMemberModal({ isOpen, onOpenChange, newMemberData, setNewMemberData, onSubmit }: AddMemberModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">새 회원 등록</DialogTitle>
          <DialogDescription className="sr-only">새로운 회원을 등록합니다</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-500">이름 <span className="text-red-500">*</span></Label>
            <Input
              value={newMemberData.name}
              onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
              placeholder="홍길동"
              className="h-11 bg-gray-50 border-gray-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-500">연락처</Label>
            <Input
              value={newMemberData.phone}
              onChange={(e) => setNewMemberData({ ...newMemberData, phone: e.target.value })}
              placeholder="010-0000-0000"
              className="h-11 bg-gray-50 border-gray-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-500">메모</Label>
            <Input
              value={newMemberData.memo}
              onChange={(e) => setNewMemberData({ ...newMemberData, memo: e.target.value })}
              placeholder="특이사항"
              className="h-11 bg-gray-50 border-gray-200"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={onSubmit}
            className="bg-[#2F80ED] hover:bg-[#1c6cd7] text-white w-full h-12 rounded-xl text-lg font-bold"
          >
            등록 완료
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
