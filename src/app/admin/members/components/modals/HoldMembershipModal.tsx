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
import { Pause, X, Calendar as CalendarIcon, Info, CheckCircle2, Save, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <DialogContent className="max-w-2xl bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px]">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Pause className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">회원권 일시 정지(홀딩)</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <p className="text-sm text-slate-400 font-bold">부득이한 사정으로 인한 이용 기간 연장 처리</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">홀딩 기간만큼 회원권 종료일이 자동으로 연장됩니다</DialogDescription>
          <button
            onClick={handleClose}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-[#f8fafc]">
          {/* 현재 회원권 정보 */}
          <div className="bg-blue-600 rounded-[32px] p-8 text-white shadow-xl shadow-blue-100 flex items-center justify-between overflow-hidden relative">
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4">
              <CalendarIcon className="w-48 h-48" />
            </div>
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-xl font-black">{membership.name}</h4>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Current Expiry</p>
                  <p className="text-lg font-black">{membership.end_date || "-"}</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-lg font-black">{membership.total_sessions - membership.used_sessions}회 잔여</p>
                </div>
              </div>
            </div>
            <div className="text-right relative z-10">
              <span className="px-4 py-2 bg-white/20 rounded-2xl text-xs font-black uppercase tracking-widest">Selected Membership</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 설정 섹션 */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-black">1</div>
                <h3 className="text-lg font-black text-slate-900">홀딩 조건 설정</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Hold Duration (Days) *</Label>
                  <div className="relative group">
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={holdDays}
                      onChange={(e) => setHoldDays(e.target.value)}
                      placeholder="7"
                      className="h-14 bg-slate-50 border-none rounded-2xl font-black text-2xl pr-12 focus:ring-2 focus:ring-amber-100"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black">Days</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</Label>
                  <div className="relative group">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-amber-500 transition-colors" />
                    <Input
                      type="date"
                      value={holdStartDate}
                      onChange={(e) => setHoldStartDate(e.target.value)}
                      className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-amber-100 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Reason</Label>
                  <Input
                    value={holdReason}
                    onChange={(e) => setHoldReason(e.target.value)}
                    placeholder="예: 출장, 여행, 부상 등..."
                    className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              </div>
            </div>

            {/* 결과 섹션 */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8 flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">2</div>
                <h3 className="text-lg font-black text-slate-900">홀딩 적용 결과</h3>
              </div>

              <div className="flex-1 space-y-6">
                <div className="bg-slate-900 rounded-3xl p-8 text-white space-y-6 shadow-xl shadow-slate-200">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hold Period</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">From</p>
                      <p className="text-lg font-black">{holdStartDate}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-700" />
                    <div className="text-center flex-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">To</p>
                      <p className="text-lg font-black">{calculateHoldEndDate()}</p>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">New Expiry Date</span>
                      <span className="text-xl font-black text-emerald-400">{calculateNewEndDate()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-xs font-bold text-amber-700 leading-relaxed">
                    홀딩 기간만큼 회원권 종료일이 자동으로 연장됩니다. 해당 기간 동안은 수업 예약이 불가능합니다.
                  </p>
                </div>
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
            className="h-14 px-10 rounded-2xl bg-amber-600 hover:bg-amber-700 font-black gap-3 shadow-xl shadow-amber-100 hover:-translate-y-1 transition-all"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">처리 중...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                홀딩 적용하기
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
