"use client";

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

interface MembershipEditFormData {
  id: string;
  name: string;
  membership_type: string;
  start_date: string;
  end_date: string;
  total_sessions: string;
  used_sessions: string;
}

interface MembershipEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  formData: MembershipEditFormData;
  setFormData: (data: MembershipEditFormData) => void;
  isLoading: boolean;
  onSubmit: () => void;
}

export function MembershipEditModal({
  isOpen,
  onClose,
  memberName,
  formData,
  setFormData,
  isLoading,
  onSubmit,
}: MembershipEditModalProps) {
  const remainingSessions = (parseInt(formData.total_sessions) || 0) - (parseInt(formData.used_sessions) || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-md">
        <DialogHeader>
          <DialogTitle>회원권 수정 - {memberName}</DialogTitle>
          <DialogDescription className="sr-only">회원권 정보를 수정합니다</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* 회원권명 (읽기 전용) */}
          <div className="space-y-2">
            <Label className="text-gray-700">회원권명</Label>
            <Input
              value={formData.name}
              disabled
              className="bg-gray-50"
            />
          </div>

          {/* 회원권 유형 (읽기 전용) */}
          <div className="space-y-2">
            <Label className="text-gray-700">회원권 유형</Label>
            <Input
              value={formData.membership_type}
              disabled
              className="bg-gray-50"
            />
          </div>

          {/* 시작일 */}
          <div className="space-y-2">
            <Label className="text-gray-700">시작일</Label>
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({...formData, start_date: e.target.value})}
            />
          </div>

          {/* 종료일 */}
          <div className="space-y-2">
            <Label className="text-gray-700">종료일</Label>
            <Input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({...formData, end_date: e.target.value})}
            />
          </div>

          {/* 총 횟수 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700">총 횟수</Label>
              <Input
                type="number"
                value={formData.total_sessions}
                onChange={(e) => setFormData({...formData, total_sessions: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">사용 횟수</Label>
              <Input
                type="number"
                value={formData.used_sessions}
                onChange={(e) => setFormData({...formData, used_sessions: e.target.value})}
              />
            </div>
          </div>

          {/* 잔여 횟수 표시 */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <span className="text-blue-700 font-medium">
              잔여 횟수: {remainingSessions}회
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button
            onClick={onSubmit}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            disabled={isLoading}
          >
            {isLoading ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
