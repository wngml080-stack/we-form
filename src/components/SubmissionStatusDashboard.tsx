"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

interface MonthlyReport {
  id: string;
  staff_id: string;
  staff_name: string;
  staff_email?: string;
  year_month: string;
  status: "submitted" | "approved" | "rejected";
  submitted_at: string | null;
  reviewed_at: string | null;
  stats?: any;
}

interface SubmissionStatusDashboardProps {
  yearMonth: string;
  reports: MonthlyReport[];
  onReview: (reportId: string, staffName: string) => void;
}

export function SubmissionStatusDashboard({
  yearMonth,
  reports,
  onReview,
}: SubmissionStatusDashboardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return (
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" />
            승인 대기
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="default" className="flex items-center gap-1 w-fit bg-green-500">
            <CheckCircle2 className="h-3 w-3" />
            승인됨
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            <XCircle className="h-3 w-3" />
            반려됨
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1 w-fit">
            <AlertCircle className="h-3 w-3" />
            미제출
          </Badge>
        );
    }
  };

  const submittedCount = reports.filter((r) => r.status === "submitted").length;
  const approvedCount = reports.filter((r) => r.status === "approved").length;
  const rejectedCount = reports.filter((r) => r.status === "rejected").length;

  return (
    <Card className="p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">{yearMonth} 월별 스케줄 제출 현황</h2>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            승인 대기: <span className="font-semibold">{submittedCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            승인 완료: <span className="font-semibold">{approvedCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            반려됨: <span className="font-semibold">{rejectedCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">전체: {reports.length}</span>
          </div>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          제출된 스케줄이 없습니다.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>직원명</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>제출일시</TableHead>
                <TableHead>처리일시</TableHead>
                <TableHead>통계</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.staff_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {report.staff_email || "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell className="text-sm">
                    {report.submitted_at
                      ? new Date(report.submitted_at).toLocaleString("ko-KR")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {report.reviewed_at
                      ? new Date(report.reviewed_at).toLocaleString("ko-KR")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {report.stats?.total ? (
                      <span className="text-muted-foreground">
                        총 {report.stats.total}건
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReview(report.id, report.staff_name)}
                    >
                      {report.status === "submitted" ? "검토" : "상세"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
