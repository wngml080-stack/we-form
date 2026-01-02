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
import { Package, X, Calendar as CalendarIcon, Info, Save, CreditCard, Banknote, History, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "card": return "카드";
      case "cash": return "현금";
      case "transfer": return "계좌이체";
      default: return method;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px]">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">부가상품 수정</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                <p className="text-sm text-slate-400 font-bold">{memberName}님의 이용 정보 변경</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">부가상품의 이용 기간 및 정보를 수정합니다</DialogDescription>
          <button
            onClick={handleClose}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-[#f8fafc]">
          {/* 상품 정보 요약 카드 */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                <Info className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Product Type</p>
                <h4 className="text-xl font-black text-slate-900">
                  {formData.addon_type === "기타" ? formData.custom_addon_name : formData.addon_type}
                </h4>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Method</p>
              <div className="flex items-center gap-2 justify-end">
                {formData.method === "card" ? <CreditCard className="w-4 h-4 text-purple-500" /> : <Banknote className="w-4 h-4 text-emerald-500" />}
                <span className="text-lg font-black text-slate-900">{getMethodLabel(formData.method)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8">
              {/* 기간 설정 섹션 */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">이용 기간 설정</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</Label>
                    <div className="relative group">
                      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                      <Input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</Label>
                    <div className="relative group">
                      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                      <Input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-rose-100 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 금액 정보 섹션 (읽기 전용 스타일) */}
              <div className="bg-slate-900 rounded-[32px] p-8 text-white space-y-4 shadow-xl shadow-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Paid</span>
                  <History className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">{formData.amount ? Number(formData.amount).toLocaleString() : "0"}</span>
                  <span className="text-xl font-black text-slate-500 tracking-tighter">KRW</span>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Fixed Value</span>
                  <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Read Only</span>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* 상세 정보 섹션 */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-black">
                    <Save className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">추가 상세 정보</h3>
                </div>

                <div className="space-y-4">
                  {(formData.addon_type === "개인락커" || formData.addon_type === "물품락커") && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Locker Number</Label>
                      <div className="relative">
                        <Input
                          value={formData.locker_number}
                          onChange={(e) => setFormData({ ...formData, locker_number: e.target.value })}
                          placeholder="예: 15"
                          className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-purple-100 pl-11"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">NO.</div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes / Memo</Label>
                    <Input
                      value={formData.memo}
                      onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                      placeholder="추가 메모를 입력하세요"
                      className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-purple-100"
                    />
                  </div>
                </div>
              </div>

              {/* 안내 팁 */}
              <div className="bg-indigo-50 rounded-[32px] p-8 border border-indigo-100 space-y-4">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Quick Tip</span>
                </div>
                <p className="text-sm font-bold text-indigo-900 leading-relaxed">
                  이용 기간은 반드시 <span className="text-indigo-600 underline underline-offset-4">종료일 기준으로 자동 계산되지 않으므로</span>, 직접 시작일과 종료일을 확인하여 수정해주세요.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-10 py-8 bg-white border-t flex items-center justify-end gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            className="h-14 px-8 rounded-2xl font-black text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-black font-black gap-3 shadow-xl shadow-slate-100 hover:-translate-y-1 transition-all text-white"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">수정 중...</span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                정보 수정 완료
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
