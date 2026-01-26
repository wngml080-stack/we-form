"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { useAuth } from "@/contexts/AuthContext";
import { LeaveRequest, StaffRole } from "@/types/database";

// 클라이언트용 isAdmin 함수
function isAdmin(role: StaffRole | string): boolean {
  return ["system_admin", "company_admin", "admin"].includes(role);
}
import { Check, X, Clock, Calendar, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import LeaveRequestModal from "./modals/LeaveRequestModal";

const STATUS_MAP = {
  pending: { label: "대기중", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  approved: { label: "승인됨", color: "bg-green-100 text-green-800 border-green-200" },
  rejected: { label: "반려됨", color: "bg-[#FFEBEB] text-red-800 border-red-200" },
  cancelled: { label: "취소됨", color: "bg-[#F4F5F7] text-gray-800 border-[#E5E8EB]" },
};

export default function LeaveRequestList() {
  const { branchFilter } = useAdminFilter();
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [year, setYear] = useState(new Date().getFullYear());
  const [showRequestModal, setShowRequestModal] = useState(false);

  // 승인/반려 다이얼로그 상태
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: "approve" | "reject" | null;
    requestId: string | null;
  }>({ open: false, type: null, requestId: null });
  const [rejectReason, setRejectReason] = useState("");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);
  const canManage = user && isAdmin(user.role);

  useEffect(() => {
    fetchRequests();
  }, [branchFilter.selectedGymId, statusFilter, year]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year: year.toString() });
      if (branchFilter.selectedGymId) {
        params.append("gym_id", branchFilter.selectedGymId);
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/admin/leave/requests?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "휴가 신청 목록을 불러올 수 없습니다.");
      }

      setRequests(data.requests || []);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      toast.error("휴가 신청 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const response = await fetch(`/api/admin/leave/requests/${requestId}/approve`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "승인 처리 중 오류가 발생했습니다.");
      }

      toast.success("휴가가 승인되었습니다.");
      fetchRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error(error instanceof Error ? error.message : "승인 처리 중 오류가 발생했습니다.");
    }
    setActionDialog({ open: false, type: null, requestId: null });
  };

  const handleReject = async (requestId: string) => {
    if (!rejectReason.trim()) {
      toast.error("반려 사유를 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(`/api/admin/leave/requests/${requestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejection_reason: rejectReason }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "반려 처리 중 오류가 발생했습니다.");
      }

      toast.success("휴가가 반려되었습니다.");
      setRejectReason("");
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error(error instanceof Error ? error.message : "반려 처리 중 오류가 발생했습니다.");
    }
    setActionDialog({ open: false, type: null, requestId: null });
  };

  const formatDateRange = (start: string, end: string, isHalfDay: boolean, halfDayType: string | null) => {
    const startDate = new Date(start).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
    const endDate = new Date(end).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });

    if (isHalfDay) {
      return `${startDate} (${halfDayType === "morning" ? "오전" : "오후"})`;
    }
    if (start === end) {
      return startDate;
    }
    return `${startDate} ~ ${endDate}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg font-bold">휴가 신청 목록</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={year.toString()} onValueChange={v => setYear(parseInt(v))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}년</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="pending">대기중</SelectItem>
                  <SelectItem value="approved">승인됨</SelectItem>
                  <SelectItem value="rejected">반려됨</SelectItem>
                  <SelectItem value="cancelled">취소됨</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowRequestModal(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                휴가 신청
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-[#8B95A1]">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>휴가 신청 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>신청자</TableHead>
                    <TableHead>휴가 유형</TableHead>
                    <TableHead>기간</TableHead>
                    <TableHead>일수</TableHead>
                    <TableHead>사유</TableHead>
                    <TableHead>상태</TableHead>
                    {canManage && <TableHead className="text-center">관리</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map(req => {
                    const staff = req.staff as { name: string } | undefined;
                    const leaveType = req.leave_type as { name: string; color: string } | undefined;
                    const status = STATUS_MAP[req.status as keyof typeof STATUS_MAP];

                    return (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{staff?.name || "Unknown"}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            style={{
                              backgroundColor: `${leaveType?.color}20`,
                              borderColor: leaveType?.color,
                              color: leaveType?.color,
                            }}
                          >
                            {leaveType?.name || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#8B95A1]" />
                            {formatDateRange(req.start_date, req.end_date, req.is_half_day, req.half_day_type)}
                          </div>
                        </TableCell>
                        <TableCell>{req.total_days}일</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={req.reason || ""}>
                          {req.reason || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={status?.color}>
                            {status?.label}
                          </Badge>
                        </TableCell>
                        {canManage && (
                          <TableCell>
                            {req.status === "pending" && (
                              <div className="flex justify-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-[#03C75A] hover:text-green-700 hover:bg-green-50"
                                  onClick={() => setActionDialog({ open: true, type: "approve", requestId: req.id })}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-[#FF5247] hover:text-red-700 hover:bg-[#FFEBEB]"
                                  onClick={() => setActionDialog({ open: true, type: "reject", requestId: req.id })}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                            {req.status === "approved" && (
                              <span className="text-xs text-[#8B95A1] flex items-center justify-center gap-1">
                                <Clock className="w-3 h-3" />
                                처리완료
                              </span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 승인 확인 다이얼로그 */}
      <AlertDialog
        open={actionDialog.open && actionDialog.type === "approve"}
        onOpenChange={open => !open && setActionDialog({ open: false, type: null, requestId: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>휴가 승인</AlertDialogTitle>
            <AlertDialogDescription>
              이 휴가 신청을 승인하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#03C75A] hover:bg-green-700"
              onClick={() => actionDialog.requestId && handleApprove(actionDialog.requestId)}
            >
              승인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 반려 확인 다이얼로그 */}
      <AlertDialog
        open={actionDialog.open && actionDialog.type === "reject"}
        onOpenChange={open => {
          if (!open) {
            setActionDialog({ open: false, type: null, requestId: null });
            setRejectReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>휴가 반려</AlertDialogTitle>
            <AlertDialogDescription>
              반려 사유를 입력해주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="반려 사유를 입력하세요..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#FF5247] hover:bg-red-700"
              onClick={() => actionDialog.requestId && handleReject(actionDialog.requestId)}
            >
              반려
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 휴가 신청 모달 */}
      {showRequestModal && (
        <LeaveRequestModal
          open={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => {
            setShowRequestModal(false);
            fetchRequests();
          }}
        />
      )}
    </div>
  );
}
