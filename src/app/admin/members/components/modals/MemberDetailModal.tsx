"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { parseAddonInfo, ADDON_TYPE_COLORS } from "@/lib/utils/addon-utils";

interface PaymentHistory {
  id: string;
  created_at: string;
  amount: number;
  method: string;
  memo?: string;
  membership_type?: string;
  registration_type?: string;
  start_date?: string;
  end_date?: string;
}

interface Membership {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  total_sessions: number;
  used_sessions: number;
  status: string;
  created_at: string;
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
  // 트레이너 관련 props
  memberTrainers?: MemberTrainer[];
  staffList?: StaffMember[];
  isAdmin?: boolean;
  onAssignTrainer?: () => void;
  onTransferTrainer?: (trainer: MemberTrainer | null, category: string, isPt: boolean) => void;
  onDeleteTrainer?: (trainerId: string) => void;
}

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, FileText, CreditCard, History, Package, User, Calendar, MapPin, Search, UserPlus, ArrowRight, Trash2, Users } from "lucide-react";

export function MemberDetailModal({
  isOpen,
  onClose,
  member,
  paymentHistory,
  allMemberships,
  activityLogs,
  // 읽기 전용 모드 - 아래 props는 향후 기능 활성화를 위해 유지
  onEditMember: _onEditMember,
  onEditMembership: _onEditMembership,
  onDeleteMembership: _onDeleteMembership,
  onEditAddon: _onEditAddon,
  onTransferMembership: _onTransferMembership,
  // 트레이너 관련 props
  memberTrainers = [],
  staffList = [],
  isAdmin = false,
  onAssignTrainer,
  onTransferTrainer,
  onDeleteTrainer,
}: MemberDetailModalProps) {
  // 향후 사용을 위해 변수 유지
  void _onEditMember;
  void _onEditMembership;
  void _onDeleteMembership;
  void _onEditAddon;
  void _onTransferMembership;
  void staffList;

  const [showExpiredMemberships, setShowExpiredMemberships] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState<"payments" | "logs">("payments");

  if (!member) return null;

  // 활성 회원권과 만료된 회원권 분리
  const activeMemberships = allMemberships.filter(m => m.status === "active");
  const expiredMemberships = allMemberships.filter(m => m.status !== "active");

  // 부가상품 추출 (결제 이력에서 registration_type이 "부가상품"인 것)
  const addonProducts = paymentHistory.filter(p => p.registration_type === "부가상품");

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-emerald-50 text-emerald-600 border-emerald-100",
      finished: "bg-slate-50 text-slate-400 border-slate-100",
      frozen: "bg-amber-50 text-amber-600 border-amber-100",
    };
    const labels: Record<string, string> = {
      active: "이용중",
      finished: "만료됨",
      frozen: "정지됨",
    };
    return { style: styles[status] || "bg-slate-50", label: labels[status] || status };
  };

  const getActionTypeLabel = (actionType: string) => {
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

  // 회원권 카드 렌더링 함수
  const renderMembershipCard = (membership: Membership, isExpired: boolean = false) => {
    const statusBadge = getStatusBadge(membership.status);
    const remaining = membership.total_sessions - membership.used_sessions;

    return (
      <div
        key={membership.id}
        className={cn(
          "p-6 rounded-[24px] border transition-all shadow-sm hover:shadow-md",
          isExpired 
            ? "bg-slate-50/50 border-slate-100 opacity-70" 
            : "bg-white border-blue-50 shadow-blue-50/20"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
              isExpired ? "bg-slate-100 text-slate-400" : "bg-blue-50 text-blue-600"
            )}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className={cn("text-base font-black tracking-tight", isExpired ? "text-slate-500" : "text-slate-900")}>
                {membership.name}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge className={cn("border px-2 py-0 text-[10px] font-black", statusBadge.style)} variant="outline">{statusBadge.label}</Badge>
                <span className="text-[10px] font-bold text-slate-400">
                  ID: {membership.id.slice(0, 8)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-50">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">이용 기간</span>
            <span className={cn("text-xs font-bold", isExpired ? "text-slate-500" : "text-slate-900")}>
              {membership.start_date} ~ {membership.end_date}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">사용 횟수</span>
            <span className={cn("text-xs font-bold", isExpired ? "text-slate-500" : "text-slate-900")}>
              {membership.used_sessions} / {membership.total_sessions}회
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">잔여 횟수</span>
            <span className={cn(
              "text-sm font-black", 
              remaining > 0 ? (isExpired ? "text-slate-500" : "text-blue-600") : "text-slate-300"
            )}>
              {remaining}회
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl bg-[#f8fafc] p-0 border-none rounded-[40px] shadow-2xl overflow-hidden">
          {/* 헤더 */}
          <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">{member.name} <span className="text-blue-200/40 text-sm font-normal ml-2">회원님</span></h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1.5 text-blue-200/60 text-xs font-bold">
                      <Calendar className="w-3 h-3" /> {member.birth_date || "생일 미등록"}
                    </span>
                    <span className="w-1 h-1 bg-blue-200/20 rounded-full"></span>
                    <span className="text-blue-200/60 text-xs font-bold">
                      {member.gender === "male" ? "남성" : member.gender === "female" ? "여성" : "성별 미등록"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-blue-200/40 text-[10px] font-black uppercase tracking-[0.2em]">Contact Information</p>
                <p className="text-lg font-black text-white mt-1">{member.phone || "010-0000-0000"}</p>
              </div>
            </div>
          </div>

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
                {/* PT 담당 트레이너 (members.trainer_id) */}
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

            {/* 상단 퀵 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 활성 회원권 섹션 */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 px-1">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  이용 중인 회원권
                  <Badge className="bg-blue-50 text-blue-600 border-none text-[10px] font-black h-5">{activeMemberships.length}</Badge>
                </h3>
                {activeMemberships.length > 0 ? (
                  <div className="space-y-4">
                    {activeMemberships.map(m => renderMembershipCard(m, false))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[32px] border border-slate-100 border-dashed">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-xs font-bold text-slate-400">현재 활성 회원권이 없습니다.</p>
                  </div>
                )}
              </div>

              {/* 부가상품 섹션 */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 px-1">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                  이용 중인 부가상품
                  <Badge className="bg-purple-50 text-purple-600 border-none text-[10px] font-black h-5">{addonProducts.length}</Badge>
                </h3>
                {addonProducts.length > 0 ? (
                  <div className="space-y-4">
                    {addonProducts.map((addon) => {
                      const addonInfo = parseAddonInfo(addon.memo);
                      const colors = ADDON_TYPE_COLORS[addonInfo.type] || ADDON_TYPE_COLORS["기타"];

                      return (
                        <div
                          key={addon.id}
                          className="p-6 rounded-[24px] bg-white border border-purple-50 shadow-sm shadow-purple-50/20 hover:shadow-md transition-all"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shadow-sm">
                                <Package className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="text-base font-black tracking-tight text-slate-900">
                                  {addonInfo.displayName}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge className="bg-purple-50 text-purple-600 border-purple-100 px-2 py-0 text-[10px] font-black" variant="outline">
                                    {addonInfo.type}
                                  </Badge>
                                  {addonInfo.lockerNumber && (
                                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                                      Locker #{addonInfo.lockerNumber}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">결제금액</p>
                              <p className="text-sm font-black text-purple-600">{addon.amount.toLocaleString()}원</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                            <div className="space-y-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">이용 기간</span>
                              <span className="text-xs font-bold text-slate-700">
                                {addon.start_date || "-"} ~ {addon.end_date || "-"}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">등록일</span>
                              <span className="text-xs font-bold text-slate-700">
                                {new Date(addon.created_at).toLocaleDateString("ko-KR")}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[32px] border border-slate-100 border-dashed">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
                      <Package className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-xs font-bold text-slate-400">현재 이용 중인 부가상품이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>

            {/* 만료된 회원권 (접이식) */}
            {expiredMemberships.length > 0 && (
              <div className="bg-slate-100/50 rounded-[32px] overflow-hidden transition-all">
                <button
                  onClick={() => setShowExpiredMemberships(!showExpiredMemberships)}
                  className="w-full flex items-center justify-between p-6 hover:bg-slate-200/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <History className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="text-sm font-black text-slate-600">만료된 회원권 내역</span>
                    <Badge className="bg-slate-200 text-slate-500 border-none text-[10px] font-black h-5">{expiredMemberships.length}</Badge>
                  </div>
                  {showExpiredMemberships ? (
                    <ChevronUp className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                  )}
                </button>
                {showExpiredMemberships && (
                  <div className="p-6 pt-0 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    {expiredMemberships.map(m => renderMembershipCard(m, true))}
                  </div>
                )}
              </div>
            )}

            {/* 하단 히스토리 탭 */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex border-b border-slate-50 bg-slate-50/50">
                <button
                  onClick={() => setActiveHistoryTab("payments")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-5 text-sm font-black transition-all border-b-2",
                    activeHistoryTab === "payments"
                      ? "text-blue-600 border-blue-600 bg-white"
                      : "text-slate-400 border-transparent hover:text-slate-600"
                  )}
                >
                  <CreditCard className="w-4 h-4" />
                  결제 히스토리
                  <span className="text-[10px] opacity-40 ml-1">({paymentHistory.length})</span>
                </button>
                <button
                  onClick={() => setActiveHistoryTab("logs")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-5 text-sm font-black transition-all border-b-2",
                    activeHistoryTab === "logs"
                      ? "text-blue-600 border-blue-600 bg-white"
                      : "text-slate-400 border-transparent hover:text-slate-600"
                  )}
                >
                  <History className="w-4 h-4" />
                  변경 로그
                  <span className="text-[10px] opacity-40 ml-1">({activityLogs.length})</span>
                </button>
              </div>

              <div className="p-0">
                {activeHistoryTab === "payments" ? (
                  paymentHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">일시</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">유형</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">결제금액</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">수단</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">비고</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {paymentHistory.map((payment) => (
                            <tr key={payment.id} className="hover:bg-slate-50/50 transition-all group">
                              <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                {new Date(payment.created_at).toLocaleDateString("ko-KR")}
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-xs font-black text-slate-700">
                                  {payment.membership_type || payment.registration_type || "-"}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-black text-blue-600">
                                  {payment.amount.toLocaleString()}원
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="outline" className="border-slate-100 text-slate-500 text-[10px] font-black px-2 py-0">
                                  {payment.method === "card" ? "카드" : payment.method === "cash" ? "현금" : payment.method === "transfer" ? "이체" : payment.method}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-xs font-medium text-slate-400 italic">
                                {payment.memo || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Search className="w-10 h-10 text-slate-200 mb-3" />
                      <p className="text-sm font-bold text-slate-400">결제 내역이 존재하지 않습니다.</p>
                    </div>
                  )
                ) : (
                  activityLogs.length > 0 ? (
                    <TooltipProvider delayDuration={100}>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/50">
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">시간</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">작업 유형</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">변경 내용</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">담당자</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {activityLogs.map((log) => {
                              const shortDesc = log.description.length > 30
                                ? log.description.substring(0, 30) + "..."
                                : log.description;
                              const needsTooltip = log.description.length > 30;

                              return (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-all">
                                  <td className="px-6 py-4 text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                    {new Date(log.created_at).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })}{" "}
                                    {new Date(log.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                                  </td>
                                  <td className="px-6 py-4">
                                    <Badge className="bg-slate-100 text-slate-600 border-none text-[10px] font-black px-2 py-0 whitespace-nowrap">
                                      {getActionTypeLabel(log.action_type)}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4">
                                    {needsTooltip ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="text-xs font-bold text-slate-700 cursor-help underline decoration-slate-200 decoration-dotted underline-offset-4">{shortDesc}</span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-xs bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border-none z-[100]">
                                          <p className="whitespace-pre-wrap text-[11px] leading-relaxed font-medium">{log.description}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    ) : (
                                      <span className="text-xs font-bold text-slate-700">{log.description}</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center">
                                        <User className="w-2.5 h-2.5 text-slate-400" />
                                      </div>
                                      <span className="text-[10px] font-black text-slate-500">{log.created_by_name || "시스템"}</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </TooltipProvider>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20">
                      <History className="w-10 h-10 text-slate-200 mb-3" />
                      <p className="text-sm font-bold text-slate-400">활동 로그가 존재하지 않습니다.</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="p-8 bg-white border-t border-slate-50 flex justify-end">
            <Button onClick={onClose} className="h-12 px-8 bg-slate-900 hover:bg-black text-white rounded-2xl font-black shadow-lg shadow-slate-200 transition-all flex items-center gap-2">
              정보 확인 완료
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
