"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ReportStatusBadge } from "./ReportStatusBadge";
import { ClipboardCheck, X, User, Calendar as CalendarIcon, Info, CheckCircle2, XCircle, MessageSquare, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

type ReportStatus = "submitted" | "approved" | "rejected";

interface ScheduleReport {
  id: string;
  status: ReportStatus;
  year_month: string;
  stats?: Record<string, number>;
  submitted_at?: string;
  staffs?: {
    name?: string;
    job_title?: string;
  };
}

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  report: ScheduleReport | null;
  onSubmit: (params: { approved: boolean; adminMemo?: string; unlockOnReject?: boolean }) => Promise<void>;
};

export function ApproveModal({ open, onOpenChange, report, onSubmit }: Props) {
  const [adminMemo, setAdminMemo] = useState("");
  const [unlockOnReject, setUnlockOnReject] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!report) return null;

  const handleApprove = async (approved: boolean) => {
    setIsSubmitting(true);
    try {
      await onSubmit({ approved, adminMemo, unlockOnReject });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px]">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ClipboardCheck className="w-7 h-7 text-white" />
            </div>
            <div>
                <h2 className="text-2xl font-black text-white !text-white tracking-tight" style={{ color: 'white' }}>월간 스케줄 승인 검토</h2>
              <div className="flex items-center gap-2 mt-1">
                <ReportStatusBadge status={report.status} />
                <p className="text-sm text-white/80 font-bold ml-2">강사의 제출 내역을 확인하고 최종 승인합니다</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">월간 스케줄을 승인합니다</DialogDescription>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-[#f8fafc]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 리포트 정보 섹션 */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900">제출자 정보</h3>
              </div>
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl">👤</div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900">{report.staffs?.name ?? "알 수 없음"}</h4>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{report.staffs?.job_title ?? "Position N/A"}</p>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-50 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Month</p>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-emerald-500" />
                      <span className="font-black text-slate-900">{report.year_month}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Submitted At</p>
                    <p className="text-xs font-bold text-slate-600">
                      {report.submitted_at ? new Date(report.submitted_at).toLocaleDateString("ko-KR") : "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-600 rounded-[32px] p-8 text-white shadow-xl shadow-emerald-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-emerald-200" />
                    <span className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">Monthly Stats Summary</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  {Object.entries(report.stats || {}).slice(0, 4).map(([k, v]) => (
                    <div key={k} className="space-y-1">
                      <p className="text-[10px] font-bold text-emerald-200/60 truncate">{k}</p>
                      <p className="text-xl font-black">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 승인 설정 섹션 */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900">검토 코멘트</h3>
              </div>
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Feedback</Label>
                  <Textarea
                    value={adminMemo}
                    onChange={(e) => setAdminMemo(e.target.value)}
                    placeholder="강사에게 전달할 피드백이나 거절 사유를 입력하세요..."
                    className="min-h-[140px] bg-slate-50 border-none rounded-2xl font-bold p-6 focus:ring-2 focus:ring-slate-100 resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-50">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={cn(
                      "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                      unlockOnReject ? "bg-emerald-500 border-emerald-500" : "bg-white border-slate-200 group-hover:border-slate-300"
                    )}>
                      {unlockOnReject && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={unlockOnReject}
                      onChange={(e) => setUnlockOnReject(e.target.checked)}
                    />
                    <span className="text-xs font-bold text-slate-600">거절 시 스케줄 잠금 해제 (수정 후 재제출 허용)</span>
                  </label>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm shrink-0">
                  <Info className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                  스케줄을 승인하면 해당 월의 스케줄이 최종 정산 데이터에 반영됩니다. 거절 시 강사가 내용을 수정하여 다시 제출할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-10 py-8 bg-white border-t flex items-center justify-end gap-3 flex-shrink-0">
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleApprove(false)}
            className="h-14 px-8 rounded-2xl font-black text-rose-500 border-rose-100 hover:bg-rose-50 hover:border-rose-200 transition-all gap-2"
          >
            <XCircle className="w-5 h-5" />
            승인 거절
          </Button>
          <Button
            onClick={() => handleApprove(true)}
            disabled={isSubmitting}
            className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-black font-black gap-3 shadow-xl shadow-slate-100 hover:-translate-y-1 transition-all text-white"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">승인 처리 중...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                최종 승인 완료
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
