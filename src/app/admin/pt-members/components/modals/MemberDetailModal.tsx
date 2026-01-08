"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, FileText, CreditCard, History, Package, User, Calendar, MapPin, Search, UserPlus, ArrowRight, Trash2, Users, X, Loader2 } from "lucide-react";

interface Membership {
  id: string;
  name: string;
  membership_type?: string;
  total_sessions: number;
  used_sessions: number;
  start_date: string;
  end_date: string;
  status: string;
}

interface PaymentHistory {
  id: string;
  sale_type: string;
  membership_name?: string;
  amount: number;
  payment_method?: string;
  created_at: string;
  start_date?: string;
  end_date?: string;
}

interface ActivityLog {
  id: string;
  action_type: string;
  description: string;
  changes?: Record<string, unknown>;
  created_at: string;
  created_by_name?: string;
}

interface MemberTrainer {
  id: string;
  category: string;
  trainer_id: string;
  assigned_at: string;
  is_primary: boolean;
  status: string;
  trainer?: {
    id: string;
    name: string;
    role?: string;
  };
}

interface StaffMember {
  id: string;
  name: string;
}

interface Member {
  id: string;
  name: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  activeMembership?: Membership;
  trainer_id?: string;
  trainer?: {
    id: string;
    name: string;
  };
}

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  paymentHistory: PaymentHistory[];
  allMemberships: Membership[];
  activityLogs: ActivityLog[];
  onEditMember: (member: Member) => void;
  onEditMembership: (member: Member, membership: Membership) => void;
  onDeleteMembership: (membershipId: string) => Promise<void>;
  onEditAddon?: (member: Member, addon: PaymentHistory) => void;
  onTransferMembership?: (member: Member, membership: Membership) => void;
  memberTrainers?: MemberTrainer[];
  staffList?: StaffMember[];
  isAdmin?: boolean;
  onAssignTrainer?: () => void;
  onTransferTrainer?: (trainer: MemberTrainer | null, category: string, isPt: boolean) => void;
  onDeleteTrainer?: (trainerId: string) => void;
}

export function MemberDetailModal({
  isOpen,
  onClose,
  member,
  paymentHistory,
  allMemberships,
  activityLogs,
  onEditMember: _onEditMember,
  onEditMembership: _onEditMembership,
  onDeleteMembership: _onDeleteMembership,
  onEditAddon: _onEditAddon,
  onTransferMembership: _onTransferMembership,
  memberTrainers = [],
  staffList = [],
  isAdmin = false,
  onAssignTrainer,
  onTransferTrainer,
  onDeleteTrainer,
}: MemberDetailModalProps) {
  void _onEditMember;
  void _onEditMembership;
  void _onDeleteMembership;
  void _onEditAddon;
  void _onTransferMembership;
  void staffList;

  const [showExpiredMemberships, setShowExpiredMemberships] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState<"payments" | "logs">("payments");

  // 로딩 중 (member가 null이지만 모달은 열려있음)
  if (!member) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px]">
          <DialogHeader className="px-10 py-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 flex-shrink-0 relative overflow-hidden">
            <DialogTitle className="text-white text-xl font-bold">회원 정보 로딩 중...</DialogTitle>
            <DialogDescription className="sr-only">회원 정보를 불러오는 중입니다</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const activeMemberships = allMemberships.filter(m => m.status === "active");
  const expiredMemberships = allMemberships.filter(m => m.status !== "active");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return { label: "이용중", className: "bg-emerald-500 text-white" };
      case "expired":
        return { label: "만료", className: "bg-slate-400 text-white" };
      case "paused":
        return { label: "일시정지", className: "bg-amber-500 text-white" };
      default:
        return { label: status, className: "bg-slate-400 text-white" };
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(amount);
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      member_created: "회원 등록",
      member_updated: "정보 수정",
      membership_created: "권한 등록",
      membership_updated: "권한 수정",
      membership_deleted: "권한 삭제",
      membership_hold: "홀딩 처리",
      addon_updated: "부가상품 수정",
      payment_created: "결제 완료",
      status_changed: "상태 변경",
      trainer_assigned: "트레이너 배정",
      trainer_transferred: "트레이너 인계",
      trainer_removed: "트레이너 해제",
    };
    return labels[actionType] || actionType;
  };

  const renderMembershipCard = (membership: Membership, isExpired: boolean = false) => {
    const statusBadge = getStatusBadge(membership.status);
    const remaining = membership.total_sessions - membership.used_sessions;

    return (
      <div
        key={membership.id}
        className={cn(
          "p-5 rounded-2xl border transition-all",
          isExpired
            ? "bg-slate-50 border-slate-100 opacity-60"
            : "bg-white border-slate-100 shadow-sm hover:shadow-md"
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-bold text-slate-900">{membership.name}</h4>
            <p className="text-xs text-slate-400 mt-0.5">{membership.membership_type || "PT"}</p>
          </div>
          <Badge className={cn("text-[10px] font-black", statusBadge.className)}>
            {statusBadge.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-slate-400 mb-1">잔여 / 전체</p>
            <p className="font-bold text-slate-900">{remaining} / {membership.total_sessions}회</p>
          </div>
          <div>
            <p className="text-slate-400 mb-1">이용 기간</p>
            <p className="font-bold text-slate-900">{formatDate(membership.start_date)} ~ {formatDate(membership.end_date)}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px]">
          <DialogHeader className="px-10 py-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 flex-shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <DialogTitle className="flex items-center gap-5 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">{member.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <p className="text-sm text-blue-100 font-bold">회원 상세 정보</p>
                </div>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">회원 상세 정보</DialogDescription>
            <button
              onClick={onClose}
              className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl transition-all group z-10"
            >
              <X className="w-6 h-6 text-white/80 group-hover:text-white transition-colors" />
            </button>

            <div className="flex items-center justify-between mt-6 relative z-10">
              <div>
                <p className="text-blue-200/40 text-[10px] font-black uppercase tracking-[0.2em]">Member ID</p>
                <p className="text-sm font-bold text-white/80 mt-1">{member.id.slice(0, 8)}...</p>
              </div>
              <div className="text-right">
                <p className="text-blue-200/40 text-[10px] font-black uppercase tracking-[0.2em]">Contact Information</p>
                <p className="text-lg font-black text-white mt-1">{member.phone || "010-0000-0000"}</p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* 담당 트레이너 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                  담당 트레이너
                  <Badge className="bg-indigo-50 text-indigo-600 border-none text-[10px] font-black h-5">
                    {(member.trainer ? 1 : 0) + memberTrainers.length}
                  </Badge>
                </h3>
                {isAdmin && onAssignTrainer && (
                  <Button
                    size="sm"
                    onClick={onAssignTrainer}
                    className="h-8 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    종목 추가
                  </Button>
                )}
              </div>

              <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
                {/* PT 담당 트레이너 */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-600 text-white border-none text-[10px] font-black px-2">PT</Badge>
                        <span className="text-sm font-black text-slate-900">
                          {member.trainer?.name || "미지정"}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {member.trainer ? "PT 전담 트레이너" : "담당 트레이너가 배정되지 않았습니다"}
                      </p>
                    </div>
                  </div>
                  {isAdmin && onTransferTrainer && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onTransferTrainer(null, "PT", true)}
                      className="h-8 px-3 rounded-xl text-xs font-bold border-slate-200 hover:bg-white gap-1.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      {member.trainer ? "인계" : "배정"}
                    </Button>
                  )}
                </div>

                {/* 종목별 트레이너 목록 */}
                {memberTrainers.length > 0 ? (
                  <div className="space-y-3">
                    {memberTrainers.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <Users className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-slate-200 text-slate-600 border-none text-[10px] font-black px-2">
                                {t.category}
                              </Badge>
                              <span className="text-sm font-black text-slate-900">
                                {t.trainer?.name || "알 수 없음"}
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                              배정일: {new Date(t.assigned_at).toLocaleDateString("ko-KR")}
                            </p>
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-2">
                            {onTransferTrainer && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onTransferTrainer(t, t.category, false)}
                                className="h-8 px-3 rounded-xl text-xs font-bold border-slate-200 hover:bg-white gap-1.5"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                                인계
                              </Button>
                            )}
                            {onDeleteTrainer && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onDeleteTrainer(t.id)}
                                className="h-8 w-8 p-0 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs font-bold text-slate-400 py-4">
                    종목별 트레이너가 배정되지 않았습니다
                  </p>
                )}
              </div>
            </div>

            {/* 회원권 섹션 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 px-1">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  이용 중인 회원권
                  <Badge className="bg-blue-50 text-blue-600 border-none text-[10px] font-black h-5">{activeMemberships.length}</Badge>
                </h3>
                {activeMemberships.length > 0 ? (
                  <div className="space-y-3">
                    {activeMemberships.map(m => renderMembershipCard(m))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 font-bold">이용 중인 회원권이 없습니다</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => setShowExpiredMemberships(!showExpiredMemberships)}
                  className="w-full flex items-center justify-between px-1"
                >
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                    만료된 회원권
                    <Badge className="bg-slate-100 text-slate-500 border-none text-[10px] font-black h-5">{expiredMemberships.length}</Badge>
                  </h3>
                  {showExpiredMemberships ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {showExpiredMemberships && expiredMemberships.length > 0 && (
                  <div className="space-y-3">
                    {expiredMemberships.map(m => renderMembershipCard(m, true))}
                  </div>
                )}
              </div>
            </div>

            {/* 히스토리 탭 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <button
                  onClick={() => setActiveHistoryTab("payments")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                    activeHistoryTab === "payments"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  <CreditCard className="w-3.5 h-3.5 inline mr-1.5" />
                  결제 이력
                </button>
                <button
                  onClick={() => setActiveHistoryTab("logs")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                    activeHistoryTab === "logs"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  <History className="w-3.5 h-3.5 inline mr-1.5" />
                  활동 로그
                </button>
              </div>

              <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
                {activeHistoryTab === "payments" ? (
                  paymentHistory.length > 0 ? (
                    <div className="space-y-3">
                      {paymentHistory.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <div>
                            <p className="font-bold text-slate-900">{payment.membership_name || payment.sale_type}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{formatDate(payment.created_at)}</p>
                          </div>
                          <p className="font-black text-slate-900">{formatCurrency(payment.amount)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-slate-400 py-8">결제 이력이 없습니다</p>
                  )
                ) : (
                  activityLogs.length > 0 ? (
                    <div className="space-y-3">
                      {activityLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                            <FileText className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-slate-200 text-slate-600 text-[10px] font-bold">
                                {getActionLabel(log.action_type)}
                              </Badge>
                              {log.created_by_name && (
                                <span className="text-[10px] text-slate-400">{log.created_by_name}</span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 mt-1">{log.description}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{formatDate(log.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-slate-400 py-8">활동 로그가 없습니다</p>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="px-10 py-6 bg-white border-t flex items-center justify-end gap-3 flex-shrink-0">
            <Button onClick={onClose} className="h-12 px-8 bg-slate-900 hover:bg-black text-white rounded-2xl font-black shadow-lg shadow-slate-200 transition-all flex items-center gap-2">
              정보 확인 완료
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
