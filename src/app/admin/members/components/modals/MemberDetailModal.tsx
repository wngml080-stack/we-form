"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, CreditCard } from "lucide-react";

interface PaymentHistory {
  id: string;
  created_at: string;
  amount: number;
  method: string;
  memo?: string;
  member_memberships?: {
    name: string;
  };
}

interface ActiveMembership {
  name: string;
  membership_type: string;
  start_date: string;
  end_date: string;
  total_sessions: number;
  used_sessions: number;
  status: string;
}

interface Member {
  id: string;
  name: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  activeMembership?: ActiveMembership;
}

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  paymentHistory: PaymentHistory[];
  onEditMember: (member: Member) => void;
  onEditMembership: (member: Member) => void;
  onAddMembership: (member: Member) => void;
}

export function MemberDetailModal({
  isOpen,
  onClose,
  member,
  paymentHistory,
  onEditMember,
  onEditMembership,
  onAddMembership,
}: MemberDetailModalProps) {
  if (!member) return null;

  return (
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
            <h3 className="font-semibold text-lg mb-3 text-gray-900">기본 정보</h3>
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

          {/* 현재 회원권 정보 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 text-blue-900">현재 회원권</h3>
            {member.activeMembership ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-blue-700">회원권명:</span>{" "}
                  <span className="font-medium text-blue-900">
                    {member.activeMembership.name}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">유형:</span>{" "}
                  <span className="font-medium text-blue-900">
                    {member.activeMembership.membership_type}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">시작일:</span>{" "}
                  <span className="font-medium text-blue-900">
                    {member.activeMembership.start_date}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">종료일:</span>{" "}
                  <span className="font-medium text-blue-900">
                    {member.activeMembership.end_date}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">총 횟수:</span>{" "}
                  <span className="font-medium text-blue-900">
                    {member.activeMembership.total_sessions}회
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">사용 횟수:</span>{" "}
                  <span className="font-medium text-blue-900">
                    {member.activeMembership.used_sessions}회
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">잔여 횟수:</span>{" "}
                  <span className="font-medium text-red-600">
                    {member.activeMembership.total_sessions -
                      member.activeMembership.used_sessions}
                    회
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">상태:</span>{" "}
                  <Badge className="border-0 bg-emerald-100 text-emerald-700">
                    {member.activeMembership.status}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-blue-700">현재 활성 회원권이 없습니다.</p>
            )}
          </div>

          {/* 결제 이력 */}
          <div>
            <h3 className="font-semibold text-lg mb-3 text-gray-900">결제 이력</h3>
            {paymentHistory.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left">날짜</th>
                      <th className="px-4 py-3 text-left">회원권</th>
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
                          {payment.member_memberships?.name || "-"}
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
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          <Button
            onClick={() => {
              onClose();
              onEditMember(member);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            <Pencil className="mr-2 h-4 w-4" />
            회원정보 수정
          </Button>
          {member.activeMembership && (
            <Button
              onClick={() => {
                onClose();
                onEditMembership(member);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            >
              <Pencil className="mr-2 h-4 w-4" />
              회원권 수정
            </Button>
          )}
          <Button
            onClick={() => {
              onClose();
              onAddMembership(member);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            회원권 등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
