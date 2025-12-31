"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
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
import { showSuccess, showError } from "@/lib/utils/error-handler";

interface AddonPayment {
  id: string;
  member_id?: string;
  amount: number;
  method: string;
  memo?: string;
  start_date?: string;
  end_date?: string;
}

interface AddonEditFormData {
  addon_type: string;
  custom_addon_name: string;
  locker_number: string;
  amount: string;
  duration_type: "months" | "days";
  duration: string;
  start_date: string;
  end_date: string;
  method: string;
  memo: string;
}

interface AddonEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  memberId?: string;
  addon: AddonPayment | null;
  onSuccess: () => void;
}

export function AddonEditModal({
  isOpen,
  onClose,
  memberName,
  memberId,
  addon,
  onSuccess,
}: AddonEditModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AddonEditFormData>({
    addon_type: "",
    custom_addon_name: "",
    locker_number: "",
    amount: "",
    duration_type: "months",
    duration: "",
    start_date: "",
    end_date: "",
    method: "card",
    memo: "",
  });

  // Parse addon data when modal opens
  useEffect(() => {
    if (addon && isOpen) {
      const memo = addon.memo || "";

      // Parse addon type and locker number from memo
      let addonType = "기타";
      let lockerNumber = "";
      let customName = memo;

      if (memo.includes("개인락커")) {
        addonType = "개인락커";
        const lockerMatch = memo.match(/개인락커\s*(\d+)번?/);
        if (lockerMatch) lockerNumber = lockerMatch[1];
        customName = "";
      } else if (memo.includes("물품락커")) {
        addonType = "물품락커";
        const lockerMatch = memo.match(/물품락커\s*(\d+)번?/);
        if (lockerMatch) lockerNumber = lockerMatch[1];
        customName = "";
      } else if (memo.includes("운동복")) {
        addonType = "운동복";
        customName = "";
      } else if (memo.includes("양말")) {
        addonType = "양말";
        customName = "";
      }

      // Extract additional memo after dash
      const dashIndex = memo.indexOf(" - ");
      const additionalMemo = dashIndex > -1 ? memo.substring(dashIndex + 3).trim() : "";

      setFormData({
        addon_type: addonType,
        custom_addon_name: addonType === "기타" ? customName.split(" (")[0].trim() : "",
        locker_number: lockerNumber,
        amount: addon.amount?.toString() || "",
        duration_type: "months",
        duration: "",
        start_date: addon.start_date || "",
        end_date: addon.end_date || "",
        method: addon.method || "card",
        memo: additionalMemo,
      });
    }
  }, [addon, isOpen]);

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!addon) return;

    if (!formData.addon_type) {
      toast.warning("부가상품 유형을 선택해주세요.");
      return;
    }

    if (!formData.amount) {
      toast.warning("금액을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      // Build addon name
      let addonName =
        formData.addon_type === "기타"
          ? formData.custom_addon_name
          : formData.addon_type;

      // Add locker number if applicable
      if (
        (formData.addon_type === "개인락커" ||
          formData.addon_type === "물품락커") &&
        formData.locker_number
      ) {
        addonName += ` ${formData.locker_number}번`;
      }

      // Build period info
      let periodInfo = "";
      if (formData.duration) {
        const durationLabel =
          formData.duration_type === "months" ? "개월" : "일";
        periodInfo = ` (${formData.duration}${durationLabel})`;
      }
      if (formData.start_date && formData.end_date) {
        periodInfo += ` ${formData.start_date} ~ ${formData.end_date}`;
      }

      const amount = parseFloat(formData.amount);
      const targetMemberId = memberId || addon.member_id;

      if (!targetMemberId) {
        throw new Error("회원 ID를 찾을 수 없습니다.");
      }

      const requestData = {
        paymentId: addon.id,
        amount: amount,
        method: formData.method,
        memo: `${addonName}${periodInfo}${formData.memo ? ` - ${formData.memo}` : ""}`,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      const response = await fetch(`/api/admin/members/${targetMemberId}/addon`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "수정에 실패했습니다.");
      }

      showSuccess("부가상품이 수정되었습니다!");
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error("부가상품 수정 오류:", error);
      showError(error.message || "부가상품 수정에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>부가상품 수정</DialogTitle>
          <DialogDescription className="text-gray-500">
            {memberName}님의 부가상품을 수정합니다
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* 부가상품 유형 (수정 불가) */}
          <div className="space-y-2">
            <Label className="text-gray-500">부가상품 유형</Label>
            <Input
              value={formData.addon_type === "기타" ? formData.custom_addon_name : formData.addon_type}
              disabled
              className="bg-gray-100 text-gray-500"
            />
          </div>

          {/* 락커 번호 (수정 가능) */}
          {(formData.addon_type === "개인락커" ||
            formData.addon_type === "물품락커") && (
            <div className="space-y-2">
              <Label>락커 번호</Label>
              <Input
                value={formData.locker_number}
                onChange={(e) =>
                  setFormData({ ...formData, locker_number: e.target.value })
                }
                placeholder="예: 15"
              />
            </div>
          )}

          {/* 금액 (수정 불가) */}
          <div className="space-y-2">
            <Label className="text-gray-500">금액</Label>
            <Input
              type="text"
              value={formData.amount ? `${Number(formData.amount).toLocaleString()}원` : ""}
              disabled
              className="bg-gray-100 text-gray-500"
            />
          </div>

          {/* 결제방법 (수정 불가) */}
          <div className="space-y-2">
            <Label className="text-gray-500">결제방법</Label>
            <Input
              value={formData.method === "card" ? "카드" : formData.method === "cash" ? "현금" : formData.method === "transfer" ? "계좌이체" : formData.method}
              disabled
              className="bg-gray-100 text-gray-500"
            />
          </div>

          {/* 시작일 / 종료일 (수정 가능) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>시작일</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>종료일</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
              />
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-2">
            <Label>메모</Label>
            <Input
              value={formData.memo}
              onChange={(e) =>
                setFormData({ ...formData, memo: e.target.value })
              }
              placeholder="추가 메모"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? "저장 중..." : "저장하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
