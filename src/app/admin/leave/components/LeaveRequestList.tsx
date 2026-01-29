"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { useAuth } from "@/contexts/AuthContext";
import { LeaveRequest, StaffRole } from "@/types/database";
import { Check, X, Clock, Calendar, FileText, Plus, User, Trash2 } from "lucide-react";
import { toast } from "sonner";
import LeaveRequestModal from "./modals/LeaveRequestModal";
import { cn } from "@/lib/utils";

// 클라이언트용 isAdmin 함수
function isAdmin(role: StaffRole | string): boolean {
  return ["system_admin", "company_admin", "admin"].includes(role);
}

const STATUS_MAP = {
  pending: { label: "승인 대기", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", icon: Clock },
  approved: { label: "승인 완료", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", icon: Check },
  rejected: { label: "반려됨", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100", icon: X },
  cancelled: { label: "취소됨", color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-100", icon: Trash2 },
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
    const startDate = new Date(start).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
    const endDate = new Date(end).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });

    if (isHalfDay) {
      return `${startDate} (${halfDayType === "morning" ? "오전" : "오후"} 반차)`;
    }
    if (start === end) {
      return startDate;
    }
    return `${startDate} ~ ${endDate}`;
  };

  return (
    <div className="space-y-8">
      {/* Controls - Modern Toss Style */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Select value={year.toString()} onValueChange={v => setYear(parseInt(v))}>
            <SelectTrigger className="h-11 w-[120px] rounded-2xl bg-[var(--background-secondary)] border-none font-bold text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              {years.map(y => (
                <SelectItem key={y} value={y.toString()} className="rounded-xl font-bold">{y}년</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 w-[130px] rounded-2xl bg-[var(--background-secondary)] border-none font-bold text-sm">
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              <SelectItem value="all" className="rounded-xl font-bold">전체 상태</SelectItem>
              <SelectItem value="pending" className="rounded-xl font-bold">승인 대기</SelectItem>
              <SelectItem value="approved" className="rounded-xl font-bold">승인 완료</SelectItem>
              <SelectItem value="rejected" className="rounded-xl font-bold">반려됨</SelectItem>
              <SelectItem value="cancelled" className="rounded-xl font-bold">취소됨</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={() => setShowRequestModal(true)} 
          className="h-12 px-8 rounded-2xl bg-slate-900 hover:bg-black text-white font-black shadow-xl shadow-slate-200 transition-all active:scale-95 gap-3"
        >
          <Plus className="w-5 h-5 text-blue-400" />
          휴가 신청하기
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white rounded-[32px] animate-pulse border border-gray-50 shadow-sm"></div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-dashed border-gray-200">
          <div className="w-20 h-20 rounded-[28px] bg-gray-50 flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-[var(--foreground-subtle)] font-bold text-lg">아직 신청된 휴가 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map(req => {
            const staff = req.staff as { name: string } | undefined;
            const leaveType = req.leave_type as { name: string; color: string } | undefined;
            const status = STATUS_MAP[req.status as keyof typeof STATUS_MAP] || STATUS_MAP.pending;
            const StatusIcon = status.icon;

            return (
              <div 
                key={req.id} 
                className="group bg-white rounded-[32px] p-8 border border-gray-50 shadow-sm hover:shadow-toss transition-all duration-500"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-[24px] bg-[var(--background-secondary)] flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:shadow-lg transition-all">
                      <User className="w-8 h-8 text-[var(--foreground-subtle)]" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="text-xl font-extrabold text-[var(--foreground)] tracking-tight">{staff?.name}</h4>
                        <Badge
                          variant="outline"
                          className="h-6 px-3 rounded-full border-none font-black text-[10px] uppercase tracking-tighter"
                          style={{
                            backgroundColor: `${leaveType?.color}15`,
                            color: leaveType?.color,
                          }}
                        >
                          {leaveType?.name}
                        </Badge>
                        <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-tighter", status.bg, status.color, status.border)}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-bold text-[var(--foreground-muted)]">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[var(--foreground-subtle)]" />
                          {formatDateRange(req.start_date, req.end_date, req.is_half_day, req.half_day_type)}
                        </div>
                        <div className="w-1 h-1 rounded-full bg-[var(--border)]"></div>
                        <div className="text-[var(--primary-hex)] font-black">총 {req.total_days}일</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:ml-auto">
                    <div className="max-w-[300px] bg-[var(--background-secondary)]/50 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-[var(--foreground-subtle)] uppercase mb-1">Reason</p>
                      <p className="text-sm font-bold text-[var(--foreground-secondary)] line-clamp-2">{req.reason || "사유 미입력"}</p>
                    </div>

                    {canManage && req.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setActionDialog({ open: true, type: "reject", requestId: req.id })}
                          variant="outline"
                          className="h-12 px-6 rounded-xl border-rose-100 text-rose-600 font-bold hover:bg-rose-50 hover:border-rose-200"
                        >
                          반려하기
                        </Button>
                        <Button
                          onClick={() => setActionDialog({ open: true, type: "approve", requestId: req.id })}
                          className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-100"
                        >
                          최종 승인
                        </Button>
                      </div>
                    )}

                    {req.status === "approved" && (
                      <div className="px-6 py-3 rounded-xl bg-slate-50 text-[var(--foreground-subtle)] text-xs font-black flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        처리 완료
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approve Dialog - Toss Modern Style */}
      <AlertDialog
        open={actionDialog.open && actionDialog.type === "approve"}
        onOpenChange={open => !open && setActionDialog({ open: false, type: null, requestId: null })}
      >
        <AlertDialogContent className="rounded-[40px] border-none shadow-2xl p-0 overflow-hidden bg-white max-w-md">
          <div className="p-10 text-center space-y-6">
            <div className="w-20 h-20 rounded-[28px] bg-emerald-50 flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <AlertDialogTitle className="text-2xl font-black text-[var(--foreground)] tracking-tight">휴가 승인 확인</AlertDialogTitle>
              <AlertDialogDescription className="text-base font-bold text-[var(--foreground-muted)]">
                해당 직원의 휴가 신청을 최종 승인하시겠습니까?<br />승인 후에는 즉시 잔여 연차가 차감됩니다.
              </AlertDialogDescription>
            </div>
          </div>
          <div className="p-10 pt-0 flex gap-3">
            <AlertDialogCancel className="flex-1 h-14 rounded-2xl border-none bg-[var(--background-secondary)] text-[var(--foreground-muted)] font-black hover:bg-[var(--background-tertiary)]">취소</AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xl shadow-emerald-100"
              onClick={() => actionDialog.requestId && handleApprove(actionDialog.requestId)}
            >
              네, 승인합니다
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog - Toss Modern Style */}
      <AlertDialog
        open={actionDialog.open && actionDialog.type === "reject"}
        onOpenChange={open => {
          if (!open) {
            setActionDialog({ open: false, type: null, requestId: null });
            setRejectReason("");
          }
        }}
      >
        <AlertDialogContent className="rounded-[40px] border-none shadow-2xl p-0 overflow-hidden bg-white max-w-md">
          <div className="p-10 text-center space-y-6">
            <div className="w-20 h-20 rounded-[28px] bg-rose-50 flex items-center justify-center mx-auto">
              <X className="w-10 h-10 text-rose-500" />
            </div>
            <div className="space-y-2">
              <AlertDialogTitle className="text-2xl font-black text-[var(--foreground)] tracking-tight">휴가 반려 안내</AlertDialogTitle>
              <AlertDialogDescription className="text-base font-bold text-[var(--foreground-muted)]">
                해당 직원의 휴가 신청을 반려하시겠습니까?<br />직원에게 전달될 반려 사유를 입력해주세요.
              </AlertDialogDescription>
            </div>
            <Textarea
              placeholder="반려 사유를 상세히 입력하세요 (예: 해당 주간 센터 행사 일정 등)"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="min-h-[120px] bg-[var(--background-secondary)] border-none rounded-3xl p-6 font-bold focus:ring-2 focus:ring-rose-100 transition-all"
            />
          </div>
          <div className="p-10 pt-0 flex gap-3">
            <AlertDialogCancel className="flex-1 h-14 rounded-2xl border-none bg-[var(--background-secondary)] text-[var(--foreground-muted)] font-black hover:bg-[var(--background-tertiary)]">취소</AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-xl shadow-rose-100"
              onClick={() => actionDialog.requestId && handleReject(actionDialog.requestId)}
            >
              반려 처리
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Request Modal */}
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
