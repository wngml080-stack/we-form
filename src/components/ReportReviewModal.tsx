"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

interface ReportReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
  staffName: string;
  yearMonth: string;
  status: "submitted" | "approved" | "rejected";
  submittedAt?: string | null;
  stats?: any;
  onApprove: (reportId: string, adminMemo: string) => Promise<void>;
  onReject: (reportId: string, adminMemo: string) => Promise<void>;
}

export function ReportReviewModal({
  open,
  onOpenChange,
  reportId,
  staffName,
  yearMonth,
  status,
  submittedAt,
  stats,
  onApprove,
  onReject,
}: ReportReviewModalProps) {
  const [adminMemo, setAdminMemo] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await onApprove(reportId, adminMemo);
      setAdminMemo("");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!adminMemo.trim()) {
      alert("반려 사유를 입력해주세요.");
      return;
    }
    setIsLoading(true);
    try {
      await onReject(reportId, adminMemo);
      setAdminMemo("");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "submitted":
        return <Badge variant="secondary">승인 대기</Badge>;
      case "approved":
        return <Badge className="bg-green-500">승인됨</Badge>;
      case "rejected":
        return <Badge variant="destructive">반려됨</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {yearMonth} 스케줄 검토: {staffName}
            {getStatusBadge()}
          </DialogTitle>
          <DialogDescription>
            제출된 월별 스케줄을 검토하고 승인 또는 반려할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">제출일시:</span>
              <div className="font-medium">
                {submittedAt ? new Date(submittedAt).toLocaleString("ko-KR") : "-"}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">상태:</span>
              <div className="font-medium">{getStatusBadge()}</div>
            </div>
          </div>

          {stats && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-semibold mb-3">스케줄 통계</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {Object.entries(stats).map(([key, value]: [string, any]) => {
                  let label = key;
                  if (key.startsWith("status_")) {
                    label = key.replace("status_", "상태: ");
                  } else if (key.startsWith("type_")) {
                    label = key.replace("type_", "타입: ");
                  } else if (key === "total") {
                    label = "총 스케줄";
                  }
                  return (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{label}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="adminMemo">
              {status === "submitted" ? "검토 의견 (선택사항)" : "이전 검토 의견"}
            </Label>
            <Textarea
              id="adminMemo"
              placeholder={
                status === "submitted"
                  ? "승인 또는 반려 사유를 입력하세요. 반려 시 필수입니다."
                  : "의견이 없습니다."
              }
              value={adminMemo}
              onChange={(e) => setAdminMemo(e.target.value)}
              disabled={status !== "submitted" || isLoading}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          {status === "submitted" ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                반려
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                승인
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              닫기
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
