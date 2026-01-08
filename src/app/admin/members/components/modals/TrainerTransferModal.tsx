"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, X, UserCheck, AlertCircle, FileText } from "lucide-react";

// 인계 사유 옵션
const TRANSFER_REASONS = [
  { value: "resignation", label: "퇴사" },
  { value: "leave", label: "휴가/휴직" },
  { value: "member_request", label: "회원 요청" },
  { value: "workload", label: "업무 조정" },
  { value: "other", label: "기타" },
];

interface StaffMember {
  id: string;
  name: string;
}

interface TrainerTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  category: string; // 종목명 (PT, 헬스, 필라테스 등)
  fromTrainer: StaffMember | null;
  staffList: StaffMember[];
  isLoading: boolean;
  onSubmit: (data: {
    to_trainer_id: string;
    reason: string;
    reason_detail?: string;
  }) => void;
  // 종목별 트레이너 인계일 경우
  memberTrainerId?: string;
  isPtTransfer?: boolean;
}

export function TrainerTransferModal({
  isOpen,
  onClose,
  memberName,
  category,
  fromTrainer,
  staffList,
  isLoading,
  onSubmit,
  memberTrainerId,
  isPtTransfer = false,
}: TrainerTransferModalProps) {
  const [toTrainerId, setToTrainerId] = useState("");
  const [reason, setReason] = useState("");
  const [reasonDetail, setReasonDetail] = useState("");

  const handleSubmit = () => {
    if (!toTrainerId || !reason) {
      return;
    }
    if (reason === "other" && !reasonDetail.trim()) {
      return;
    }

    onSubmit({
      to_trainer_id: toTrainerId,
      reason,
      reason_detail: reason === "other" ? reasonDetail : undefined,
    });
  };

  const handleClose = () => {
    setToTrainerId("");
    setReason("");
    setReasonDetail("");
    onClose();
  };

  const isValid = toTrainerId && reason && (reason !== "other" || reasonDetail.trim());

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px]">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <UserCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">트레이너 인계</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <p className="text-sm text-slate-400 font-bold">{memberName}님의 {category} 담당 변경</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            트레이너 인계 절차 - 사유 필수 입력
          </DialogDescription>
          <button
            onClick={handleClose}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-[#f8fafc]">
          {/* 현재 → 변경 트레이너 표시 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ArrowRight className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">인계 정보</h3>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between gap-6">
                {/* 기존 트레이너 */}
                <div className="flex-1 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">From</p>
                  <div className="h-20 bg-slate-50 rounded-2xl flex items-center justify-center">
                    <span className="font-black text-lg text-slate-600">
                      {fromTrainer?.name || "미지정"}
                    </span>
                  </div>
                </div>

                {/* 화살표 */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <ArrowRight className="w-6 h-6 text-amber-600" />
                  </div>
                </div>

                {/* 새 트레이너 선택 */}
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">To *</p>
                  <Select value={toTrainerId} onValueChange={setToTrainerId}>
                    <SelectTrigger className="h-20 bg-slate-50 border-none rounded-2xl font-black text-lg focus:ring-2 focus:ring-amber-100">
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-2xl p-2 shadow-2xl">
                      {staffList
                        .filter(s => s.id !== fromTrainer?.id)
                        .map(staff => (
                          <SelectItem key={staff.id} value={staff.id} className="rounded-xl focus:bg-amber-50">
                            <span className="font-bold">{staff.name} 트레이너</span>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </section>

          {/* 인계 사유 선택 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">인계 사유 *</h3>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {TRANSFER_REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`h-14 rounded-2xl font-bold transition-all ${
                      reason === r.value
                        ? "bg-amber-500 text-white shadow-lg shadow-amber-200"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {reason === "other" && (
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    기타 사유 상세 *
                  </Label>
                  <Textarea
                    value={reasonDetail}
                    onChange={(e) => setReasonDetail(e.target.value)}
                    placeholder="인계 사유를 상세히 입력해주세요..."
                    className="min-h-[100px] bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-amber-100 resize-none"
                  />
                </div>
              )}
            </div>
          </section>

          {/* 안내 메시지 */}
          <div className="bg-amber-50 rounded-2xl p-6 flex items-start gap-4">
            <FileText className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-900">인계 이력이 기록됩니다</p>
              <p className="text-xs text-amber-700">
                트레이너 인계 시 사유와 함께 이력이 저장되어 회원 활동 로그에서 확인할 수 있습니다.
              </p>
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
            disabled={isLoading || !isValid}
            className="h-14 px-10 rounded-2xl bg-amber-500 hover:bg-amber-600 font-black gap-3 shadow-xl shadow-amber-100 hover:-translate-y-1 transition-all text-white disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">인계 처리 중...</span>
            ) : (
              <>
                <UserCheck className="w-5 h-5" />
                트레이너 인계 완료
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
