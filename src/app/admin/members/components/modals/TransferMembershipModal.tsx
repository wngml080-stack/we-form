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
import { ArrowRight, AlertTriangle, User, UserPlus, X, Search, Calendar as CalendarIcon, Info, CheckCircle2, CreditCard, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
      <DialogContent className="max-w-4xl bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px]">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ArrowRight className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">회원권 양도 처리</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                <p className="text-sm text-slate-400 font-bold">회원 간의 이용 권한을 안전하게 이관합니다</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">회원권을 다른 회원에게 양도합니다</DialogDescription>
          <button
            onClick={handleClose}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-[#f8fafc]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 섹션 1: 양도자 설정 */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">1</div>
                <h3 className="text-lg font-black text-slate-900">양도자(보내는 분)</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Search Member</Label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      value={fromMemberSearch}
                      onChange={(e) => setFromMemberSearch(e.target.value)}
                      placeholder="이름 또는 전화번호..."
                      className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                  <Select value={fromMemberId} onValueChange={handleFromMemberSelect}>
                    <SelectTrigger className="h-12 bg-white border-slate-100 rounded-xl font-bold">
                      <SelectValue placeholder="양도자 선택" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2 max-h-[200px]">
                      {filteredFromMembers.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 font-bold">결과 없음</div>
                      ) : (
                        filteredFromMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id} className="rounded-xl font-bold py-2">
                            {member.name} ({member.phone})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {fromMemberId && (
                  <div className="space-y-2 animate-in slide-in-from-top-2">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Select Membership *</Label>
                    {fromMemberMemberships.length === 0 ? (
                      <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-500" />
                        <p className="text-xs font-black text-rose-600">활성 상태의 회원권이 없습니다</p>
                      </div>
                    ) : (
                      <Select value={fromMembershipId} onValueChange={handleFromMembershipSelect}>
                        <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100 transition-all">
                          <SelectValue placeholder="양도할 회원권 선택" />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                          {fromMemberMemberships.map((membership) => {
                            const remaining = membership.total_sessions - membership.used_sessions;
                            return (
                              <SelectItem key={membership.id} value={membership.id} className="rounded-xl font-bold py-2">
                                {membership.name} (잔여 {remaining}회)
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {selectedMembership && (
                  <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-100 space-y-4 animate-in zoom-in-95">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Info className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-black">{selectedMembership.name}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/10 p-3 rounded-2xl">
                        <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Status</p>
                        <p className="text-lg font-black">{remainingSessions}회 <span className="text-xs opacity-60">/ {selectedMembership.total_sessions}회</span></p>
                      </div>
                      <div className="bg-white/10 p-3 rounded-2xl">
                        <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Expiry</p>
                        <p className="text-lg font-black">{selectedMembership.end_date || "-"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 섹션 2: 양수인 설정 */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">2</div>
                <h3 className="text-lg font-black text-slate-900">양수인(받는 분)</h3>
              </div>

              <div className="space-y-6">
                <div className="flex p-1 bg-slate-50 rounded-2xl gap-1">
                  <button
                    onClick={() => setRecipientType("existing")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-black transition-all",
                      recipientType === "existing" ? "bg-white text-indigo-600 shadow-sm shadow-indigo-100" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <User className="w-4 h-4" /> 기존 회원
                  </button>
                  <button
                    onClick={() => setRecipientType("new")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-black transition-all",
                      recipientType === "new" ? "bg-white text-indigo-600 shadow-sm shadow-indigo-100" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <UserPlus className="w-4 h-4" /> 신규 등록
                  </button>
                </div>

                {recipientType === "existing" ? (
                  <div className="space-y-4 animate-in slide-in-from-right-2">
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500" />
                      <Input
                        value={toMemberSearch}
                        onChange={(e) => setToMemberSearch(e.target.value)}
                        placeholder="이름 또는 전화번호..."
                        className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <Select value={toMemberId} onValueChange={setToMemberId}>
                      <SelectTrigger className="h-12 bg-white border-slate-100 rounded-xl font-bold">
                        <SelectValue placeholder="양수인 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2 max-h-[200px]">
                        {filteredToMembers.length === 0 ? (
                          <div className="p-4 text-center text-slate-400 font-bold">결과 없음</div>
                        ) : (
                          filteredToMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id} className="rounded-xl font-bold py-2">
                              {member.name} ({member.phone})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    {hasConflictingMembership && (
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                        <p className="text-xs font-bold text-amber-700 leading-relaxed">
                          양수인이 동일 유형의 회원권을 보유하고 있습니다. 기존 회원권에 횟수가 병합됩니다.
                        </p>
                      </div>
                    )}

                    {transferHistory.length > 0 && (
                      <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-3">
                        <Info className="w-5 h-5 text-indigo-500 shrink-0" />
                        <p className="text-xs font-bold text-indigo-700 leading-relaxed">
                          이 회원은 과거에 {transferHistory.length}번의 양도 이력이 있습니다.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-left-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Name</Label>
                      <Input
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="성함 입력"
                        className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Phone</Label>
                      <Input
                        value={newMemberPhone}
                        onChange={(e) => setNewMemberPhone(e.target.value)}
                        placeholder="010-0000-0000"
                        className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 섹션 3: 양도 상세 정보 */}
          {selectedMembership && (recipientType === "new" || toMemberId) && (
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">3</div>
                <h3 className="text-lg font-black text-slate-900">양도 상세 조건 및 미리보기</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Transfer Sessions *</Label>
                    <div className="relative group">
                      <Input
                        type="number"
                        min="1"
                        max={remainingSessions}
                        value={transferSessions}
                        onChange={(e) => setTransferSessions(e.target.value)}
                        className="h-14 bg-slate-50 border-none rounded-2xl font-black text-xl pr-12 focus:ring-2 focus:ring-emerald-100"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black">회</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Max: {remainingSessions} sessions</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Start Date *</Label>
                    <div className="relative group">
                      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                      <Input
                        type="date"
                        value={transferDate}
                        onChange={(e) => setTransferDate(e.target.value)}
                        className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-emerald-100 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Reason</Label>
                    <Input
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      placeholder="가족 양도, 이사 등..."
                      className="h-14 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Transfer Fee</Label>
                      <Input
                        type="number"
                        min="0"
                        value={transferFee}
                        onChange={(e) => setTransferFee(e.target.value)}
                        placeholder="0"
                        className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                    {parseFloat(transferFee) > 0 && (
                      <div className="space-y-2 animate-in zoom-in-95">
                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Method</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-emerald-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                            <SelectItem value="cash" className="rounded-xl font-bold py-2"><div className="flex items-center gap-2"><Banknote className="w-4 h-4" /> 현금</div></SelectItem>
                            <SelectItem value="card" className="rounded-xl font-bold py-2"><div className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> 카드</div></SelectItem>
                            <SelectItem value="transfer" className="rounded-xl font-bold py-2"><div className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /> 이체</div></SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                {/* 결과 미리보기 카드 */}
                <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected Result</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between group">
                      <span className="text-xs font-bold text-slate-400">보내는 분</span>
                      <div className="text-right">
                        <p className="text-sm font-black">{selectedFromMember?.name}</p>
                        <p className="text-[10px] font-bold text-rose-400">잔여: {remainingSessions - (parseInt(transferSessions) || 0)}회</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <div className="h-px flex-1 bg-white/10" />
                      <ArrowRight className="w-4 h-4 mx-3 text-slate-600" />
                      <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <div className="flex items-center justify-between group">
                      <span className="text-xs font-bold text-slate-400">받는 분</span>
                      <div className="text-right">
                        <p className="text-sm font-black">{recipientType === "new" ? (newMemberName || "미입력") : (selectedToMember?.name || "미선택")}</p>
                        <p className="text-[10px] font-bold text-emerald-400">신규: {transferSessions || 0}회 추가</p>
                      </div>
                    </div>

                    {parseFloat(transferFee) > 0 && (
                      <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fee</span>
                        <span className="text-sm font-black text-amber-400">₩{parseFloat(transferFee).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-10 py-8 bg-white border-t flex items-center justify-end gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="h-14 px-8 rounded-2xl font-black text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !selectedMembership || (!toMemberId && recipientType === "existing") || (recipientType === "new" && (!newMemberName || !newMemberPhone))}
            className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black gap-3 shadow-xl shadow-indigo-100 hover:-translate-y-1 transition-all"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">처리 중...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                양도 승인 및 완료
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
