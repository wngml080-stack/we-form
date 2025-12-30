"use client";

import { useState } from "react";
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
import { toast } from "@/lib/toast";

interface Membership {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  total_sessions: number;
  used_sessions: number;
  status: string;
}

interface HoldMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  membership: Membership | null;
  onSuccess: () => void;
}

export function HoldMembershipModal({
  isOpen,
  onClose,
  memberId,
  membership,
  onSuccess,
}: HoldMembershipModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [holdDays, setHoldDays] = useState("7");
  const [holdStartDate, setHoldStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [holdReason, setHoldReason] = useState("");

  if (!membership) return null;

  // 홀딩 후 예상 종료일 계산
  const calculateNewEndDate = () => {
    if (!membership.end_date || !holdDays) return "-";
    const endDate = new Date(membership.end_date);
    endDate.setDate(endDate.getDate() + parseInt(holdDays));
    return endDate.toISOString().split("T")[0];
  };

  // 홀딩 종료일 계산
  const calculateHoldEndDate = () => {
    if (!holdStartDate || !holdDays) return "-";
    const startDate = new Date(holdStartDate);
    startDate.setDate(startDate.getDate() + parseInt(holdDays) - 1);
    return startDate.toISOString().split("T")[0];
  };

  const handleSubmit = async () => {
    if (!holdDays || parseInt(holdDays) < 1) {
      toast.warning("홀딩 기간을 1일 이상 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/members/${memberId}/membership/hold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId: membership.id,
          holdDays: parseInt(holdDays),
          holdStartDate,
          holdReason,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "홀딩 처리에 실패했습니다.");
      }

      toast.success(`회원권이 ${holdDays}일 홀딩되었습니다. 종료일: ${result.data.newEndDate}`);
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "홀딩 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setHoldDays("7");
    setHoldStartDate(new Date().toISOString().split("T")[0]);
    setHoldReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white max-w-md">
        <DialogHeader>
          <DialogTitle>회원권 홀딩</DialogTitle>
          <DialogDescription>
            홀딩 기간만큼 회원권 종료일이 자동으로 연장됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 회원권 정보 */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="font-semibold text-blue-900">{membership.name}</p>
            <p className="text-sm text-blue-700 mt-1">
              현재 종료일: {membership.end_date || "-"}
            </p>
          </div>

          {/* 홀딩 기간 */}
          <div className="space-y-2">
            <Label htmlFor="holdDays">홀딩 기간 (일) *</Label>
            <Input
              id="holdDays"
              type="number"
              min="1"
              max="365"
              value={holdDays}
              onChange={(e) => setHoldDays(e.target.value)}
              placeholder="7"
            />
            <p className="text-xs text-gray-500">
              홀딩 기간만큼 종료일이 연장됩니다.
            </p>
          </div>

          {/* 홀딩 시작일 */}
          <div className="space-y-2">
            <Label htmlFor="holdStartDate">홀딩 시작일</Label>
            <Input
              id="holdStartDate"
              type="date"
              value={holdStartDate}
              onChange={(e) => setHoldStartDate(e.target.value)}
            />
          </div>

          {/* 홀딩 사유 */}
          <div className="space-y-2">
            <Label htmlFor="holdReason">홀딩 사유 (선택)</Label>
            <Input
              id="holdReason"
              value={holdReason}
              onChange={(e) => setHoldReason(e.target.value)}
              placeholder="예: 출장, 여행, 부상 등"
            />
          </div>

          {/* 예상 결과 */}
          <div className="bg-amber-50 p-3 rounded-lg space-y-1">
            <p className="text-sm font-medium text-amber-900">홀딩 적용 결과</p>
            <div className="text-sm text-amber-700 space-y-1">
              <p>홀딩 기간: {holdStartDate} ~ {calculateHoldEndDate()}</p>
              <p>새 종료일: <span className="font-semibold">{calculateNewEndDate()}</span></p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isLoading ? "처리 중..." : "홀딩하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
