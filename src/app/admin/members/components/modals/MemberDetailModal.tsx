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
import { ChevronDown, ChevronUp, FileText, CreditCard, History, Package } from "lucide-react";
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
  // 읽기 전용 모드 - 아래 props는 향후 기능 활성화를 위해 유지
  onEditMember: _onEditMember,
  onEditMembership: _onEditMembership,
  onDeleteMembership: _onDeleteMembership,
  onEditAddon: _onEditAddon,
  onTransferMembership: _onTransferMembership,
}: MemberDetailModalProps) {
  // 향후 사용을 위해 변수 유지
  void _onEditMember;
  void _onEditMembership;
  void _onDeleteMembership;
  void _onEditAddon;
  void _onTransferMembership;

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
                    const colors = ADDON_TYPE_COLORS[addonInfo.type] || ADDON_TYPE_COLORS["기타"];

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
                          <span className="font-semibold text-purple-700">
                            {addon.amount.toLocaleString()}원
                          </span>
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

    </>
  );
}
