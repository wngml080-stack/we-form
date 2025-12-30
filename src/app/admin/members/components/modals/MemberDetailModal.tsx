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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pencil, Trash2, ChevronDown, ChevronUp, FileText, CreditCard, History, Package, Pause, ArrowRightLeft } from "lucide-react";
import { HoldMembershipModal } from "./HoldMembershipModal";

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

interface Member {
  id: string;
  name: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  activeMembership?: Membership;
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
}

export function MemberDetailModal({
  isOpen,
  onClose,
  member,
  paymentHistory,
  allMemberships,
  activityLogs,
  onEditMember,
  onEditMembership,
  onDeleteMembership,
  onEditAddon,
  onTransferMembership,
}: MemberDetailModalProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingMembershipId, setDeletingMembershipId] = useState<string | null>(null);
  const [showExpiredMemberships, setShowExpiredMemberships] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState<"payments" | "logs">("payments");
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [holdingMembership, setHoldingMembership] = useState<Membership | null>(null);

  if (!member) return null;

  // 활성 회원권과 만료된 회원권 분리
  const activeMemberships = allMemberships.filter(m => m.status === "active");
  const expiredMemberships = allMemberships.filter(m => m.status !== "active");

  // 부가상품 추출 (결제 이력에서 registration_type이 "부가상품"인 것)
  const addonProducts = paymentHistory.filter(p => p.registration_type === "부가상품");

  // 부가상품 정보 파싱 함수
  const parseAddonInfo = (memo: string | undefined) => {
    if (!memo) return { type: "부가상품", displayName: "부가상품", lockerNumber: null };

    // 부가상품 유형 파싱
    let type = "기타";
    let lockerNumber: string | null = null;
    let displayName = memo;

    if (memo.includes("개인락커")) {
      type = "개인락커";
      const match = memo.match(/개인락커\s*(\d+)번?/);
      if (match) lockerNumber = match[1];
      displayName = lockerNumber ? `개인락커 ${lockerNumber}번` : "개인락커";
    } else if (memo.includes("물품락커")) {
      type = "물품락커";
      const match = memo.match(/물품락커\s*(\d+)번?/);
      if (match) lockerNumber = match[1];
      displayName = lockerNumber ? `물품락커 ${lockerNumber}번` : "물품락커";
    } else if (memo.includes("운동복")) {
      type = "운동복";
      displayName = "운동복";
    } else if (memo.includes("양말")) {
      type = "양말";
      displayName = "양말";
    } else {
      // 기타: 괄호나 날짜 전까지의 텍스트 추출
      const otherMatch = memo.match(/^([^(]+?)(?:\s*\(|\s*\d{4}-|$)/);
      if (otherMatch) {
        displayName = otherMatch[1].trim();
      }
    }

    return { type, displayName, lockerNumber };
  };

  const handleDeleteMembership = async () => {
    if (!deletingMembershipId) return;
    setIsDeleting(true);
    try {
      await onDeleteMembership(deletingMembershipId);
      setIsDeleteDialogOpen(false);
      setDeletingMembershipId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (membershipId: string) => {
    setDeletingMembershipId(membershipId);
    setIsDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-700",
      finished: "bg-gray-100 text-gray-500",
      frozen: "bg-amber-100 text-amber-700",
    };
    const labels: Record<string, string> = {
      active: "이용중",
      finished: "만료",
      frozen: "정지",
    };
    return { style: styles[status] || "bg-gray-100", label: labels[status] || status };
  };

  const getActionTypeLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      member_created: "회원 등록",
      member_updated: "회원 정보 수정",
      membership_created: "회원권 등록",
      membership_updated: "회원권 수정",
      membership_deleted: "회원권 삭제",
      membership_hold: "회원권 홀딩",
      addon_updated: "부가상품 수정",
      payment_created: "결제",
      status_changed: "상태 변경",
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
        className={`p-4 rounded-lg border ${isExpired ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-200"}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isExpired ? "text-gray-700" : "text-blue-900"}`}>
              {membership.name}
            </span>
            <Badge className={`border-0 ${statusBadge.style}`}>{statusBadge.label}</Badge>
          </div>
          {!isExpired && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setHoldingMembership(membership);
                  setIsHoldModalOpen(true);
                }}
                className="text-amber-600 border-amber-300 hover:bg-amber-50"
              >
                <Pause className="mr-1 h-3 w-3" />
                홀딩
              </Button>
              {onTransferMembership && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onTransferMembership(member, membership);
                  }}
                  className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                >
                  <ArrowRightLeft className="mr-1 h-3 w-3" />
                  양도
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEditMembership(member, membership);
                }}
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <Pencil className="mr-1 h-3 w-3" />
                수정
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openDeleteDialog(membership.id)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                삭제
              </Button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <span className={isExpired ? "text-gray-500" : "text-blue-700"}>기간:</span>{" "}
            <span className={`font-medium ${isExpired ? "text-gray-700" : "text-blue-900"}`}>
              {membership.start_date} ~ {membership.end_date}
            </span>
          </div>
          <div>
            <span className={isExpired ? "text-gray-500" : "text-blue-700"}>횟수:</span>{" "}
            <span className={`font-medium ${isExpired ? "text-gray-700" : "text-blue-900"}`}>
              {membership.used_sessions}/{membership.total_sessions}회
            </span>
          </div>
          <div>
            <span className={isExpired ? "text-gray-500" : "text-blue-700"}>잔여:</span>{" "}
            <span className={`font-medium ${remaining > 0 ? "text-red-600" : "text-gray-500"}`}>
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
        <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {member.name} 회원 상세 정보
            </DialogTitle>
            <DialogDescription className="sr-only">
              회원 상세 정보를 확인합니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 회원 기본 정보 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg text-gray-900">기본 정보</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onEditMember(member);
                  }}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  수정
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">이름:</span>{" "}
                  <span className="font-medium">{member.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">연락처:</span>{" "}
                  <span className="font-medium">{member.phone || "-"}</span>
                </div>
                <div>
                  <span className="text-gray-600">생년월일:</span>{" "}
                  <span className="font-medium">{member.birth_date || "-"}</span>
                </div>
                <div>
                  <span className="text-gray-600">성별:</span>{" "}
                  <span className="font-medium">
                    {member.gender === "male"
                      ? "남성"
                      : member.gender === "female"
                        ? "여성"
                        : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* 활성 회원권 섹션 */}
            <div>
              <h3 className="font-semibold text-lg mb-3 text-blue-900 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                활성 회원권 ({activeMemberships.length}개)
              </h3>
              {activeMemberships.length > 0 ? (
                <div className="space-y-3">
                  {activeMemberships.map(m => renderMembershipCard(m, false))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6 bg-gray-50 rounded-lg">
                  현재 활성 회원권이 없습니다.
                </p>
              )}
            </div>

            {/* 부가상품 섹션 */}
            {addonProducts.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3 text-purple-900 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  부가상품 ({addonProducts.length}개)
                </h3>
                <div className="space-y-2">
                  {addonProducts.map((addon) => {
                    const addonInfo = parseAddonInfo(addon.memo);
                    const typeColors: Record<string, { bg: string; text: string; badge: string }> = {
                      "개인락커": { bg: "bg-blue-50", text: "text-blue-900", badge: "bg-blue-200 text-blue-800" },
                      "물품락커": { bg: "bg-cyan-50", text: "text-cyan-900", badge: "bg-cyan-200 text-cyan-800" },
                      "운동복": { bg: "bg-green-50", text: "text-green-900", badge: "bg-green-200 text-green-800" },
                      "양말": { bg: "bg-orange-50", text: "text-orange-900", badge: "bg-orange-200 text-orange-800" },
                      "기타": { bg: "bg-purple-50", text: "text-purple-900", badge: "bg-purple-200 text-purple-800" },
                    };
                    const colors = typeColors[addonInfo.type] || typeColors["기타"];

                    return (
                      <div
                        key={addon.id}
                        className={`p-4 rounded-lg border ${colors.bg} border-purple-200`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Badge className={`border-0 ${colors.badge}`}>
                              {addonInfo.type}
                            </Badge>
                            <span className={`font-semibold ${colors.text}`}>
                              {addonInfo.displayName}
                            </span>
                            {addonInfo.lockerNumber && (
                              <Badge variant="outline" className="border-gray-300 text-gray-700">
                                #{addonInfo.lockerNumber}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-purple-700">
                              {addon.amount.toLocaleString()}원
                            </span>
                            {onEditAddon && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  onClose();
                                  onEditAddon(member, addon);
                                }}
                                className="text-purple-600 border-purple-300 hover:bg-purple-100"
                              >
                                <Pencil className="mr-1 h-3 w-3" />
                                수정
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-purple-700">기간:</span>{" "}
                            <span className={`font-medium ${colors.text}`}>
                              {addon.start_date || "-"} ~ {addon.end_date || "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-purple-700">등록일:</span>{" "}
                            <span className={`font-medium ${colors.text}`}>
                              {new Date(addon.created_at).toLocaleDateString("ko-KR")}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 만료된 회원권 섹션 */}
            {expiredMemberships.length > 0 && (
              <div>
                <button
                  onClick={() => setShowExpiredMemberships(!showExpiredMemberships)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold text-lg mb-3"
                >
                  {showExpiredMemberships ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                  만료된 회원권 ({expiredMemberships.length}개)
                </button>
                {showExpiredMemberships && (
                  <div className="space-y-3">
                    {expiredMemberships.map(m => renderMembershipCard(m, true))}
                  </div>
                )}
              </div>
            )}

            {/* 결제 이력 & 활동 로그 탭 */}
            <div>
              <div className="flex gap-2 mb-3 border-b">
                <button
                  onClick={() => setActiveHistoryTab("payments")}
                  className={`flex items-center gap-2 px-4 py-2 font-semibold text-lg border-b-2 transition-colors ${
                    activeHistoryTab === "payments"
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  결제 이력 ({paymentHistory.length})
                </button>
                <button
                  onClick={() => setActiveHistoryTab("logs")}
                  className={`flex items-center gap-2 px-4 py-2 font-semibold text-lg border-b-2 transition-colors ${
                    activeHistoryTab === "logs"
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  <History className="h-5 w-5" />
                  변경 이력 ({activityLogs.length})
                </button>
              </div>

              {/* 결제 이력 탭 */}
              {activeHistoryTab === "payments" && (
                paymentHistory.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left">날짜</th>
                          <th className="px-4 py-3 text-left">유형</th>
                          <th className="px-4 py-3 text-left">금액</th>
                          <th className="px-4 py-3 text-left">결제수단</th>
                          <th className="px-4 py-3 text-left">메모</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.map((payment) => (
                          <tr key={payment.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">
                              {new Date(payment.created_at).toLocaleDateString("ko-KR")}
                            </td>
                            <td className="px-4 py-3">
                              {payment.membership_type || payment.registration_type || "-"}
                            </td>
                            <td className="px-4 py-3 font-semibold text-blue-600">
                              {payment.amount.toLocaleString()}원
                            </td>
                            <td className="px-4 py-3">
                              {payment.method === "card"
                                ? "카드"
                                : payment.method === "cash"
                                  ? "현금"
                                  : payment.method === "transfer"
                                    ? "계좌이체"
                                    : payment.method}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {payment.memo || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                    결제 이력이 없습니다.
                  </p>
                )
              )}

              {/* 변경 이력 탭 */}
              {activeHistoryTab === "logs" && (
                activityLogs.length > 0 ? (
                  <TooltipProvider delayDuration={100}>
                    <div className="border rounded-lg overflow-hidden overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 border-b">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 min-w-[80px]">날짜</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 min-w-[90px]">유형</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">내용</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 min-w-[60px]">변경자</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activityLogs.map((log) => {
                            // 내용 축약: 25자 이상이면 자르기
                            const shortDesc = log.description.length > 25
                              ? log.description.substring(0, 25) + "..."
                              : log.description;
                            const needsTooltip = log.description.length > 25;

                            return (
                              <tr key={log.id} className="border-b hover:bg-gray-50">
                                <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                                  {new Date(log.created_at).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })}{" "}
                                  {new Date(log.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                                </td>
                                <td className="px-3 py-2">
                                  <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">
                                    {getActionTypeLabel(log.action_type)}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-700">
                                  {needsTooltip ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="cursor-help underline decoration-dotted underline-offset-2">{shortDesc}</span>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-sm bg-gray-900 text-white p-3 rounded-lg shadow-lg z-50">
                                        <p className="whitespace-pre-wrap text-sm">{log.description}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <span>{log.description}</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-500">
                                  {log.created_by_name || "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </TooltipProvider>
                ) : (
                  <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                    변경 이력이 없습니다.
                  </p>
                )
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 회원권 삭제 확인 다이얼로그 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>회원권을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 회원권을 삭제합니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMembership}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 회원권 홀딩 모달 */}
      <HoldMembershipModal
        isOpen={isHoldModalOpen}
        onClose={() => {
          setIsHoldModalOpen(false);
          setHoldingMembership(null);
        }}
        memberId={member.id}
        membership={holdingMembership}
        onSuccess={() => {
          // 홀딩 성공 후 모달 닫고 데이터 새로고침
          setIsHoldModalOpen(false);
          setHoldingMembership(null);
          onClose();
        }}
      />
    </>
  );
}
