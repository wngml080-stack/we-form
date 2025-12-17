"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, Send, XCircle } from "lucide-react";

type SubmissionStatus = "not_submitted" | "submitted" | "approved" | "rejected";

interface MonthlySubmissionBannerProps {
  yearMonth: string; // "YYYY-MM"
  status: SubmissionStatus;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  adminMemo?: string | null;
  onSubmit: () => Promise<void>;
  onResubmit?: () => Promise<void>;
}

function calculateDeadline(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-05`;
}

function getDaysUntilDeadline(yearMonth: string): number {
  const deadline = calculateDeadline(yearMonth);
  const deadlineDate = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function MonthlySubmissionBanner({
  yearMonth,
  status,
  submittedAt,
  reviewedAt,
  adminMemo,
  onSubmit,
  onResubmit,
}: MonthlySubmissionBannerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const deadline = calculateDeadline(yearMonth);
  const daysUntil = getDaysUntilDeadline(yearMonth);
  const isOverdue = daysUntil < 0;

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onSubmit();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResubmit = async () => {
    if (!onResubmit) return;
    setIsLoading(true);
    try {
      await onResubmit();
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "submitted":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            승인 대기
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-500">
            <CheckCircle2 className="h-3 w-3" />
            승인됨
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            반려됨
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            미제출
          </Badge>
        );
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "submitted":
        return (
          <div className="text-sm text-muted-foreground">
            제출일시: {submittedAt ? new Date(submittedAt).toLocaleString("ko-KR") : "-"}
          </div>
        );
      case "approved":
        return (
          <div className="text-sm text-muted-foreground">
            <div>승인일시: {reviewedAt ? new Date(reviewedAt).toLocaleString("ko-KR") : "-"}</div>
            {adminMemo && <div className="mt-1 text-green-600">메모: {adminMemo}</div>}
          </div>
        );
      case "rejected":
        return (
          <div className="text-sm text-muted-foreground">
            <div>반려일시: {reviewedAt ? new Date(reviewedAt).toLocaleString("ko-KR") : "-"}</div>
            {adminMemo && <div className="mt-1 text-red-600">사유: {adminMemo}</div>}
          </div>
        );
      default:
        return (
          <div className="text-sm text-muted-foreground">
            {isOverdue ? (
              <span className="text-red-600 font-medium">마감일이 {Math.abs(daysUntil)}일 지났습니다!</span>
            ) : daysUntil === 0 ? (
              <span className="text-orange-600 font-medium">오늘이 마감일입니다!</span>
            ) : (
              <span>마감일까지 {daysUntil}일 남았습니다</span>
            )}
          </div>
        );
    }
  };

  return (
    <Card className="p-4 mb-4 border-l-4 border-l-blue-500">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">{yearMonth} 월별 스케줄 제출</h3>
            {getStatusBadge()}
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">
              제출 마감일: <span className="font-medium">{deadline}</span>
            </div>
            {getStatusMessage()}
          </div>
        </div>
        <div className="ml-4">
          {status === "not_submitted" && (
            <Button onClick={handleSubmit} disabled={isLoading} className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              제출하기
            </Button>
          )}
          {status === "rejected" && onResubmit && (
            <Button onClick={handleResubmit} disabled={isLoading} className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              재제출
            </Button>
          )}
          {status === "submitted" && (
            <Button disabled variant="secondary">
              승인 대기 중
            </Button>
          )}
          {status === "approved" && (
            <Button disabled variant="outline">
              승인 완료
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
