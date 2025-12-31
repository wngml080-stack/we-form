"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { ArrowRight, AlertTriangle, User, UserPlus } from "lucide-react";

interface Membership {
  id: string;
  name: string;
  membership_type?: string;
  start_date: string;
  end_date: string;
  total_sessions: number;
  used_sessions: number;
  status: string;
}

interface Member {
  id: string;
  name: string;
  phone: string;
  status?: string;
  activeMembership?: Membership;
  member_memberships?: Membership[];
}

interface TransferMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  gymId: string;
  companyId: string;
  preselectedMember?: Member | null;
  preselectedMembership?: Membership | null;
  onSuccess: () => void;
}

type RecipientType = "existing" | "new";

export function TransferMembershipModal({
  isOpen,
  onClose,
  members,
  gymId,
  companyId,
  preselectedMember,
  preselectedMembership,
  onSuccess,
}: TransferMembershipModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  // 양도자 상태
  const [fromMemberSearch, setFromMemberSearch] = useState("");
  const [fromMemberId, setFromMemberId] = useState("");
  const [fromMembershipId, setFromMembershipId] = useState("");

  // 양수인 상태
  const [recipientType, setRecipientType] = useState<RecipientType>("existing");
  const [toMemberSearch, setToMemberSearch] = useState("");
  const [toMemberId, setToMemberId] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");

  // 양도 정보
  const [transferSessions, setTransferSessions] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split("T")[0]);
  const [transferReason, setTransferReason] = useState("");
  const [transferFee, setTransferFee] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // 양도 이력 경고
  const [transferHistory, setTransferHistory] = useState<any[]>([]);

  // preselected 값 설정
  useEffect(() => {
    if (isOpen && preselectedMember) {
      setFromMemberId(preselectedMember.id);
      if (preselectedMembership) {
        setFromMembershipId(preselectedMembership.id);
        // 기본 양도 횟수를 잔여 횟수로 설정
        const remaining = preselectedMembership.total_sessions - preselectedMembership.used_sessions;
        setTransferSessions(remaining.toString());
      }
    }
  }, [isOpen, preselectedMember, preselectedMembership]);

  // 양도자 회원 필터링
  const filteredFromMembers = useMemo(() => {
    if (!members?.length) return [];
    return members.filter((member) => {
      if (!fromMemberSearch.trim()) return true;
      const searchLower = fromMemberSearch.toLowerCase();
      return (
        member.name?.toLowerCase().includes(searchLower) ||
        member.phone?.includes(fromMemberSearch)
      );
    });
  }, [members, fromMemberSearch]);

  // 양수인 회원 필터링 (양도자 제외)
  const filteredToMembers = useMemo(() => {
    if (!members?.length) return [];
    return members.filter((member) => {
      if (member.id === fromMemberId) return false; // 양도자 제외
      if (!toMemberSearch.trim()) return true;
      const searchLower = toMemberSearch.toLowerCase();
      return (
        member.name?.toLowerCase().includes(searchLower) ||
        member.phone?.includes(toMemberSearch)
      );
    });
  }, [members, toMemberSearch, fromMemberId]);

  // 선택된 양도자
  const selectedFromMember = useMemo(() => {
    return members?.find((m) => m.id === fromMemberId) || null;
  }, [members, fromMemberId]);

  // 선택된 양도자의 활성 회원권 목록
  const fromMemberMemberships = useMemo(() => {
    if (!selectedFromMember?.member_memberships) return [];
    return selectedFromMember.member_memberships.filter((m) => m.status === "active");
  }, [selectedFromMember]);

  // 선택된 회원권
  const selectedMembership = useMemo(() => {
    return fromMemberMemberships.find((m) => m.id === fromMembershipId) || null;
  }, [fromMemberMemberships, fromMembershipId]);

  // 잔여 횟수
  const remainingSessions = useMemo(() => {
    if (!selectedMembership) return 0;
    return selectedMembership.total_sessions - selectedMembership.used_sessions;
  }, [selectedMembership]);

  // 선택된 양수인
  const selectedToMember = useMemo(() => {
    return members?.find((m) => m.id === toMemberId) || null;
  }, [members, toMemberId]);

  // 양수인의 같은 유형 회원권 확인
  const hasConflictingMembership = useMemo(() => {
    if (!selectedToMember || !selectedMembership) return false;
    const membershipType = selectedMembership.membership_type || "PT";
    return selectedToMember.member_memberships?.some(
      (m) => m.membership_type === membershipType && m.status === "active"
    );
  }, [selectedToMember, selectedMembership]);

  // 양수인의 양도 이력 확인
  useEffect(() => {
    if (toMemberId && isOpen) {
      fetchTransferHistory(toMemberId);
    } else {
      setTransferHistory([]);
    }
  }, [toMemberId, isOpen]);

  const fetchTransferHistory = async (memberId: string) => {
    try {
      const response = await fetch(`/api/admin/members/${memberId}/membership/transfer?direction=to`);
      if (response.ok) {
        const data = await response.json();
        setTransferHistory(data.transfers || []);
      }
    } catch (error) {
      console.error("양도 이력 조회 실패:", error);
    }
  };

  // 양도 후 예상 종료일 계산
  const calculateNewEndDate = () => {
    if (!transferDate || !transferSessions) return "-";
    const sessions = parseInt(transferSessions);
    if (isNaN(sessions) || sessions < 1) return "-";
    const start = new Date(transferDate);
    start.setDate(start.getDate() + sessions * 7 - 1); // 기본 7일/회
    return start.toISOString().split("T")[0];
  };

  const handleSubmit = async () => {
    // 유효성 검사
    if (!fromMemberId) {
      toast.warning("양도자를 선택해주세요.");
      return;
    }
    if (!fromMembershipId) {
      toast.warning("양도할 회원권을 선택해주세요.");
      return;
    }
    if (recipientType === "existing" && !toMemberId) {
      toast.warning("양수인을 선택해주세요.");
      return;
    }
    if (recipientType === "new" && (!newMemberName.trim() || !newMemberPhone.trim())) {
      toast.warning("신규 회원 정보를 입력해주세요.");
      return;
    }
    const sessions = parseInt(transferSessions);
    if (!sessions || sessions < 1) {
      toast.warning("양도 횟수를 1회 이상 입력해주세요.");
      return;
    }
    if (sessions > remainingSessions) {
      toast.warning(`양도 횟수가 잔여 횟수(${remainingSessions}회)를 초과합니다.`);
      return;
    }
    if (!transferDate) {
      toast.warning("양도 시작일을 선택해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const requestBody: any = {
        from_membership_id: fromMembershipId,
        transfer_sessions: sessions,
        transfer_date: transferDate,
        transfer_reason: transferReason || undefined,
      };

      // 양도 수수료
      const fee = parseFloat(transferFee);
      if (fee > 0) {
        requestBody.transfer_fee = fee;
        requestBody.payment_method = paymentMethod;
      }

      // 양수인 정보
      if (recipientType === "existing") {
        requestBody.to_member_id = toMemberId;
      } else {
        requestBody.new_member = {
          name: newMemberName.trim(),
          phone: newMemberPhone.trim(),
        };
      }

      const response = await fetch(`/api/admin/members/${fromMemberId}/membership/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "양도 처리에 실패했습니다.");
      }

      const toName = result.data.to_member.name;
      const actionText = result.data.transfer.action === "merged" ? "(기존 회원권에 병합)" : "";
      toast.success(`${sessions}회를 ${toName}님에게 양도했습니다. ${actionText}`);
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "양도 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFromMemberSearch("");
    setFromMemberId("");
    setFromMembershipId("");
    setRecipientType("existing");
    setToMemberSearch("");
    setToMemberId("");
    setNewMemberName("");
    setNewMemberPhone("");
    setTransferSessions("");
    setTransferDate(new Date().toISOString().split("T")[0]);
    setTransferReason("");
    setTransferFee("");
    setPaymentMethod("cash");
    setTransferHistory([]);
    onClose();
  };

  const handleFromMemberSelect = (memberId: string) => {
    setFromMemberId(memberId);
    setFromMembershipId(""); // 회원권 선택 초기화
    setTransferSessions("");
  };

  const handleFromMembershipSelect = (membershipId: string) => {
    setFromMembershipId(membershipId);
    const membership = fromMemberMemberships.find((m) => m.id === membershipId);
    if (membership) {
      const remaining = membership.total_sessions - membership.used_sessions;
      setTransferSessions(remaining.toString());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-indigo-600" />
            회원권 양도
          </DialogTitle>
          <DialogDescription>
            회원권을 다른 회원에게 양도합니다. 부분 양도도 가능합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 섹션 1: 양도자 선택 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">1. 양도자 선택</h3>

            {/* 회원 검색 */}
            <div className="space-y-2">
              <Label>양도자 회원 *</Label>
              <Input
                value={fromMemberSearch}
                onChange={(e) => setFromMemberSearch(e.target.value)}
                placeholder="회원 이름 또는 전화번호 검색..."
                className="mb-2"
              />
              <Select value={fromMemberId} onValueChange={handleFromMemberSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="양도자 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-[200px]">
                  {filteredFromMembers.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500 text-center">
                      {fromMemberSearch ? "검색 결과가 없습니다." : "회원이 없습니다."}
                    </div>
                  ) : (
                    filteredFromMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.phone})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* 회원권 선택 */}
            {fromMemberId && (
              <div className="space-y-2">
                <Label>양도할 회원권 *</Label>
                {fromMemberMemberships.length === 0 ? (
                  <p className="text-sm text-red-500">활성 상태의 회원권이 없습니다.</p>
                ) : (
                  <Select value={fromMembershipId} onValueChange={handleFromMembershipSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="회원권 선택" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {fromMemberMemberships.map((membership) => {
                        const remaining = membership.total_sessions - membership.used_sessions;
                        return (
                          <SelectItem key={membership.id} value={membership.id}>
                            {membership.name} (잔여 {remaining}회)
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* 선택된 회원권 정보 */}
            {selectedMembership && (
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <p className="font-semibold text-blue-900">{selectedMembership.name}</p>
                <div className="text-blue-700 mt-1 space-y-0.5">
                  <p>총 횟수: {selectedMembership.total_sessions}회 / 사용: {selectedMembership.used_sessions}회</p>
                  <p className="font-medium">잔여: {remainingSessions}회</p>
                  <p>종료일: {selectedMembership.end_date || "-"}</p>
                </div>
              </div>
            )}
          </div>

          {/* 섹션 2: 양수인 선택 */}
          {selectedMembership && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">2. 양수인 선택</h3>

              {/* 양수인 유형 선택 */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recipientType"
                    checked={recipientType === "existing"}
                    onChange={() => setRecipientType("existing")}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">기존 회원</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recipientType"
                    checked={recipientType === "new"}
                    onChange={() => setRecipientType("new")}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <UserPlus className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">신규 회원 등록</span>
                </label>
              </div>

              {/* 기존 회원 선택 */}
              {recipientType === "existing" && (
                <div className="space-y-2">
                  <Label>양수인 회원 *</Label>
                  <Input
                    value={toMemberSearch}
                    onChange={(e) => setToMemberSearch(e.target.value)}
                    placeholder="회원 이름 또는 전화번호 검색..."
                    className="mb-2"
                  />
                  <Select value={toMemberId} onValueChange={setToMemberId}>
                    <SelectTrigger>
                      <SelectValue placeholder="양수인 선택" />
                    </SelectTrigger>
                    <SelectContent className="bg-white max-h-[200px]">
                      {filteredToMembers.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 text-center">
                          {toMemberSearch ? "검색 결과가 없습니다." : "선택 가능한 회원이 없습니다."}
                        </div>
                      ) : (
                        filteredToMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} ({member.phone})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  {/* 같은 유형 회원권 보유 경고 */}
                  {hasConflictingMembership && (
                    <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-amber-700">
                        양수인이 같은 유형의 활성 회원권을 보유하고 있습니다. 기존 회원권에 횟수가 추가됩니다.
                      </p>
                    </div>
                  )}

                  {/* 양도 이력 경고 */}
                  {transferHistory.length > 0 && (
                    <div className="flex items-start gap-2 p-2 bg-orange-50 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-orange-700">
                        이 회원은 이전에 {transferHistory.length}건의 양도를 받은 이력이 있습니다.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 신규 회원 등록 */}
              {recipientType === "new" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newMemberName">이름 *</Label>
                    <Input
                      id="newMemberName"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="회원 이름"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newMemberPhone">전화번호 *</Label>
                    <Input
                      id="newMemberPhone"
                      value={newMemberPhone}
                      onChange={(e) => setNewMemberPhone(e.target.value)}
                      placeholder="010-0000-0000"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 섹션 3: 양도 정보 */}
          {selectedMembership && (recipientType === "new" || toMemberId) && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">3. 양도 정보</h3>

              <div className="grid grid-cols-2 gap-4">
                {/* 양도 횟수 */}
                <div className="space-y-2">
                  <Label htmlFor="transferSessions">양도 횟수 *</Label>
                  <Input
                    id="transferSessions"
                    type="number"
                    min="1"
                    max={remainingSessions}
                    value={transferSessions}
                    onChange={(e) => setTransferSessions(e.target.value)}
                    placeholder={`최대 ${remainingSessions}회`}
                  />
                  <p className="text-xs text-gray-500">
                    잔여 횟수: {remainingSessions}회
                  </p>
                </div>

                {/* 양도 시작일 */}
                <div className="space-y-2">
                  <Label htmlFor="transferDate">양도 시작일 *</Label>
                  <Input
                    id="transferDate"
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                  />
                </div>
              </div>

              {/* 양도 사유 */}
              <div className="space-y-2">
                <Label htmlFor="transferReason">양도 사유 (선택)</Label>
                <Input
                  id="transferReason"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="예: 가족 양도, 이사 등"
                />
              </div>

              {/* 양도 수수료 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transferFee">양도 수수료 (선택)</Label>
                  <Input
                    id="transferFee"
                    type="number"
                    min="0"
                    value={transferFee}
                    onChange={(e) => setTransferFee(e.target.value)}
                    placeholder="0"
                  />
                </div>
                {parseFloat(transferFee) > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">결제 방법</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger id="paymentMethod">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="cash">현금</SelectItem>
                        <SelectItem value="card">카드</SelectItem>
                        <SelectItem value="transfer">계좌이체</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 섹션 4: 미리보기 */}
          {selectedMembership && (recipientType === "new" ? (newMemberName && newMemberPhone) : toMemberId) && parseInt(transferSessions) > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">4. 양도 결과 미리보기</h3>

              <div className="bg-indigo-50 p-4 rounded-lg space-y-3">
                {/* 양도자 변경 */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-indigo-900">{selectedFromMember?.name}</span>
                  <span className="text-indigo-700">
                    &quot;{selectedMembership.name}&quot; 잔여 {remainingSessions}회 → {remainingSessions - parseInt(transferSessions)}회
                  </span>
                  {parseInt(transferSessions) === remainingSessions && (
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">종료</span>
                  )}
                </div>

                {/* 양수인 변경 */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-indigo-900">
                    {recipientType === "new" ? newMemberName : selectedToMember?.name}
                  </span>
                  <span className="text-indigo-700">
                    &quot;{selectedMembership.name}&quot; {parseInt(transferSessions)}회
                    {hasConflictingMembership ? " 추가" : " 생성"}
                  </span>
                  <span className="text-xs text-indigo-600">
                    (예상 종료일: {calculateNewEndDate()})
                  </span>
                </div>

                {/* 수수료 */}
                {parseFloat(transferFee) > 0 && (
                  <div className="text-sm text-indigo-700 pt-2 border-t border-indigo-200">
                    양도 수수료: {parseInt(transferFee).toLocaleString()}원 ({paymentMethod === "cash" ? "현금" : paymentMethod === "card" ? "카드" : "계좌이체"})
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !selectedMembership}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isLoading ? "처리 중..." : "양도하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
