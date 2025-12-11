import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ReportStatusBadge } from "./ReportStatusBadge";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  report: any | null;
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
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>월간 스케줄 승인</span>
            <ReportStatusBadge status={report.status} />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">강사</div>
              <div className="font-bold">{report.staffs?.name ?? "-"} {report.staffs?.job_title ?? ""}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">월</div>
              <div className="font-bold">{report.year_month}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">제출일</div>
              <div className="font-semibold">{report.submitted_at ? new Date(report.submitted_at).toLocaleString("ko-KR") : "-"}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">확인일</div>
              <div className="font-semibold">{report.reviewed_at ? new Date(report.reviewed_at).toLocaleString("ko-KR") : "-"}</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">통계 요약</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(report.stats || {}).slice(0, 6).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-semibold">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-bold text-gray-600">관리자 메모</div>
            <Textarea
              value={adminMemo}
              onChange={(e) => setAdminMemo(e.target.value)}
              placeholder="메모를 입력하세요"
              className="min-h-[80px]"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={unlockOnReject}
              onChange={(e) => setUnlockOnReject(e.target.checked)}
            />
            거절 시 스케줄 잠금 해제 (수정 후 재제출 허용)
          </label>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" disabled={isSubmitting} onClick={() => handleApprove(false)}>
            거절
          </Button>
          <Button disabled={isSubmitting} onClick={() => handleApprove(true)}>
            승인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

