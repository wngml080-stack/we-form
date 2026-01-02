"use client";

import { useState, useMemo } from "react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { showSuccess, showError } from "@/lib/utils/error-handler";
import {
  MemberPayment,
  ParsedAddonInfo,
  ADDON_TYPE_COLORS,
  getNextDay,
  getLatestLockerEndDate,
  parseAddonInfo,
} from "@/lib/utils/addon-utils";

import { Package, X, Search, User, CreditCard, Calendar as CalendarIcon, Info, Save, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ActiveAddon for this modal (simpler than the utility's version)
interface ActiveAddon extends ParsedAddonInfo {
  endDate: string;
}

interface AddonSalesFormData {
  member_id: string;
  addon_type: string;
  custom_addon_name: string;
  locker_number: string;
  amount: string;
  duration_type: "months" | "days";
  duration: string;
  payment_date: string;
  start_date: string;
  end_date: string;
  method: string;
  memo: string;
}

const INITIAL_FORM_DATA: AddonSalesFormData = {
  member_id: "",
  addon_type: "",
  custom_addon_name: "",
  locker_number: "",
  amount: "",
  duration_type: "months",
  duration: "",
  payment_date: new Date().toISOString().split("T")[0],
  start_date: new Date().toISOString().split("T")[0],
  end_date: "",
  method: "card",
  memo: "",
};

interface Member {
  id: string;
  name: string;
  phone: string;
}

interface AddonSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  gymId: string;
  companyId: string;
  onSuccess: () => void;
}

export function AddonSalesModal({
  isOpen,
  onClose,
  members,
  gymId,
  companyId,
  onSuccess,
}: AddonSalesModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AddonSalesFormData>(INITIAL_FORM_DATA);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberPayments, setMemberPayments] = useState<MemberPayment[]>([]);

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setMemberSearch("");
    setMemberPayments([]);
  };

  // 회원 선택 시 결제 정보 조회
  const handleMemberSelect = async (memberId: string) => {
    setFormData({ ...formData, member_id: memberId });

    try {
      const response = await fetch(`/api/admin/members/${memberId}/detail?gym_id=${gymId}`);
      if (response.ok) {
        const data = await response.json();
        setMemberPayments(data.payments || []);
      }
    } catch (error) {
      console.error("회원 결제 정보 조회 에러:", error);
    }
  };

  // 기존 활성 부가상품 목록 계산
  const activeAddons = useMemo(() => {
    if (!memberPayments || memberPayments.length === 0) return [];
    const today = new Date().toISOString().split("T")[0];
    const filtered = memberPayments.filter(p => {
      const isAddon = p.membership_type === "부가상품" || p.registration_type === "부가상품";
      const hasValidEndDate = p.end_date && p.end_date >= today;
      return isAddon && hasValidEndDate;
    });
    return filtered.map(p => {
      const info = parseAddonInfo(p.memo);
      return { ...info, endDate: p.end_date || "" } as ActiveAddon;
    }).sort((a, b) => a.type.localeCompare(b.type));
  }, [memberPayments]);

  // 락커 유형별 최소 시작일 계산
  const getMinStartDate = (addonType: string): string | undefined => {
    if (addonType === "개인락커" || addonType === "물품락커") {
      const latestEndDate = getLatestLockerEndDate(memberPayments, addonType);
      if (latestEndDate) return getNextDay(latestEndDate);
    }
    return undefined;
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  const calculateEndDate = (
    startDate: string,
    duration: string,
    durationType: "months" | "days"
  ): string => {
    if (!duration || !startDate) return "";
    const num = parseInt(duration);
    const start = new Date(startDate);
    const end = new Date(start);
    if (durationType === "months") {
      end.setMonth(end.getMonth() + num);
      end.setDate(end.getDate() - 1);
    } else {
      end.setDate(end.getDate() + num - 1);
    }
    return end.toISOString().split("T")[0];
  };

  const handleSubmit = async () => {
    if (!formData.member_id || !formData.addon_type) {
      toast.warning("회원과 부가상품 유형을 선택해주세요.");
      return;
    }

    if (!formData.amount) {
      toast.warning("금액을 입력해주세요.");
      return;
    }

    if (!gymId || !companyId) {
      toast.error("지점 정보를 찾을 수 없습니다.");
      return;
    }

    setIsLoading(true);
    try {
      const member = members.find((m) => m.id === formData.member_id);
      if (!member) throw new Error("회원을 찾을 수 없습니다.");

      // 상품명 구성
      let addonName =
        formData.addon_type === "기타"
          ? formData.custom_addon_name
          : formData.addon_type;

      // 락커인 경우 번호 추가
      if (
        (formData.addon_type === "개인락커" ||
          formData.addon_type === "물품락커") &&
        formData.locker_number
      ) {
        addonName += ` ${formData.locker_number}번`;
      }

      // 기간 정보 추가
      let periodInfo = "";
      if (formData.duration) {
        const durationLabel =
          formData.duration_type === "months" ? "개월" : "일";
        periodInfo = ` (${formData.duration}${durationLabel})`;
      }
      if (formData.start_date && formData.end_date) {
        periodInfo += ` ${formData.start_date} ~ ${formData.end_date}`;
      }

      const amount = parseFloat(formData.amount);
      const memoText = `${addonName}${periodInfo}${formData.memo ? ` - ${formData.memo}` : ""}`;

      // API를 통해 부가상품 매출 등록 (RLS 우회)
      const response = await fetch("/api/admin/addon-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          gym_id: gymId,
          member_id: member.id,
          amount: amount,
          method: formData.method,
          memo: memoText,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "부가상품 매출 등록에 실패했습니다.");
      }

      showSuccess("부가상품 매출이 등록되었습니다!");
      resetForm();
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error("부가상품 매출 등록 오류:", error);
      showError(error.message || "부가상품 매출 등록에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMembers = (members || []).filter((member) => {
    if (!memberSearch.trim()) return true;
    const searchLower = memberSearch.toLowerCase();
    return (
      member.name?.toLowerCase().includes(searchLower) ||
      member.phone?.includes(memberSearch)
    );
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px]">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">부가상품 매출 등록</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                <p className="text-sm text-slate-400 font-bold">회원의 부가 서비스를 신속하게 등록하세요</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">기존 회원에게 부가상품을 판매합니다</DialogDescription>
          <button
            onClick={handleClose}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-[#f8fafc]">
          {/* 회원 선택 섹션 */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">1</div>
              <h3 className="text-lg font-black text-slate-900">회원 검색 및 선택</h3>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="회원 이름 또는 전화번호 검색..."
                  className="h-14 pl-12 bg-slate-50 border-none rounded-2xl font-bold text-lg focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                />
              </div>
              <Select
                value={formData.member_id}
                onValueChange={handleMemberSelect}
              >
                <SelectTrigger className="h-12 bg-white border-slate-100 rounded-xl font-bold">
                  <SelectValue placeholder="검색 결과에서 회원을 선택하세요" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2 max-h-[300px]">
                  {filteredMembers.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <User className="w-6 h-6 text-slate-200" />
                      </div>
                      <p className="text-sm font-black text-slate-400">검색 결과가 없습니다</p>
                    </div>
                  ) : (
                    filteredMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id} className="rounded-xl font-bold py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900">{member.name}</span>
                          <span className="text-slate-400 font-medium text-xs">{member.phone}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* 기존 활성 부가상품 표시 */}
            {activeAddons.length > 0 && (
              <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100/50 space-y-4 animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-sm font-black text-amber-900">현재 이용 중인 부가상품</span>
                  </div>
                  <Badge className="bg-amber-200 text-amber-700 border-none font-black text-[10px] tracking-widest">{activeAddons.length} ACTIVE</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeAddons.map((addon, idx) => {
                    const colors = ADDON_TYPE_COLORS[addon.type] || ADDON_TYPE_COLORS["기타"];
                    return (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-amber-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full", colors.badge.split(' ')[0])}></div>
                          <div>
                            <p className="text-xs font-black text-slate-900">{addon.lockerNumber ? `${addon.type} ${addon.lockerNumber}번` : addon.displayName}</p>
                            <p className="text-[10px] font-bold text-slate-400">~ {addon.endDate}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-200" />
                      </div>
                    );
                  })}
                </div>
                <p className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600">
                  <Info className="w-3 h-3" /> 동일 유형은 기존 만료일 이후부터 등록 가능합니다
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 상품 정보 섹션 */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-black">2</div>
                <h3 className="text-lg font-black text-slate-900">상품 상세 정보</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Addon Type *</Label>
                  <Select
                    value={formData.addon_type}
                    onValueChange={(v) => {
                      let newStartDate = formData.start_date;
                      if (v === "개인락커" || v === "물품락커") {
                        const latestEndDate = getLatestLockerEndDate(memberPayments, v);
                        if (latestEndDate) {
                          const minStartDate = getNextDay(latestEndDate);
                          newStartDate = minStartDate;
                          toast.info(`기존 ${v}가 ${latestEndDate}까지 있어 ${minStartDate}부터 시작합니다.`);
                        }
                      }
                      const newEndDate = calculateEndDate(newStartDate, formData.duration, formData.duration_type);
                      setFormData({
                        ...formData,
                        addon_type: v,
                        custom_addon_name: "",
                        locker_number: "",
                        start_date: newStartDate,
                        end_date: newEndDate,
                      });
                    }}
                  >
                    <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-purple-100">
                      <SelectValue placeholder="유형 선택" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                      <SelectItem value="개인락커" className="rounded-xl font-bold py-2">개인락커</SelectItem>
                      <SelectItem value="물품락커" className="rounded-xl font-bold py-2">물품락커</SelectItem>
                      <SelectItem value="운동복" className="rounded-xl font-bold py-2">운동복</SelectItem>
                      <SelectItem value="양말" className="rounded-xl font-bold py-2">양말</SelectItem>
                      <SelectItem value="기타" className="rounded-xl font-bold py-2">기타 (직접입력)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(formData.addon_type === "개인락커" || formData.addon_type === "물품락커") && (
                  <div className="space-y-2 animate-in slide-in-from-top-2">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Locker Number</Label>
                    <Input
                      value={formData.locker_number}
                      onChange={(e) => setFormData({ ...formData, locker_number: e.target.value })}
                      placeholder="예: 15"
                      className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-purple-100"
                    />
                  </div>
                )}

                {formData.addon_type === "기타" && (
                  <div className="space-y-2 animate-in slide-in-from-top-2">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Custom Name *</Label>
                    <Input
                      value={formData.custom_addon_name}
                      onChange={(e) => setFormData({ ...formData, custom_addon_name: e.target.value })}
                      placeholder="상품명을 입력하세요"
                      className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-purple-100"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Amount *</Label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black">₩</span>
                    <Input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0"
                      className="h-14 pl-10 bg-slate-50 border-none rounded-2xl font-black text-xl focus:ring-2 focus:ring-purple-100 placeholder:text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Payment Method</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(v) => setFormData({ ...formData, method: v })}
                  >
                    <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-purple-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                      <SelectItem value="card" className="rounded-xl font-bold py-2 text-blue-600 bg-blue-50 mb-1">카드 (Card)</SelectItem>
                      <SelectItem value="cash" className="rounded-xl font-bold py-2 text-emerald-600 bg-emerald-50 mb-1">현금 (Cash)</SelectItem>
                      <SelectItem value="transfer" className="rounded-xl font-bold py-2 text-indigo-600 bg-indigo-50">계좌이체 (Transfer)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 기간 정보 섹션 */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">3</div>
                <h3 className="text-lg font-black text-slate-900">기간 및 일정 설정</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Duration</Label>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => {
                        const value = e.target.value;
                        const newEndDate = calculateEndDate(formData.start_date, value, formData.duration_type);
                        setFormData({ ...formData, duration: value, end_date: newEndDate });
                      }}
                      placeholder="숫자"
                      className="h-12 flex-1 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-emerald-100"
                    />
                    <Select
                      value={formData.duration_type}
                      onValueChange={(v: "months" | "days") => {
                        const newEndDate = calculateEndDate(formData.start_date, formData.duration, v);
                        setFormData({ ...formData, duration_type: v, end_date: newEndDate });
                      }}
                    >
                      <SelectTrigger className="h-12 w-28 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-emerald-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                        <SelectItem value="months" className="rounded-xl font-bold py-2">개월</SelectItem>
                        <SelectItem value="days" className="rounded-xl font-bold py-2">일</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</Label>
                    <div className="relative group">
                      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                      <Input
                        type="date"
                        value={formData.start_date}
                        min={getMinStartDate(formData.addon_type)}
                        onChange={(e) => {
                          const newStartDate = e.target.value;
                          const minStartDate = getMinStartDate(formData.addon_type);
                          if (minStartDate && newStartDate < minStartDate) {
                            toast.error(`기존 ${formData.addon_type}가 있어 ${minStartDate} 이후로만 설정 가능합니다.`);
                            return;
                          }
                          const newEndDate = calculateEndDate(newStartDate, formData.duration, formData.duration_type);
                          setFormData({ ...formData, start_date: newStartDate, end_date: newEndDate });
                        }}
                        className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-emerald-100 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">End Date</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <Input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-emerald-100 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Payment Date</Label>
                  <Input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Memo</Label>
                  <Input
                    value={formData.memo}
                    onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                    placeholder="추가적인 메모 사항이 있으면 입력하세요"
                    className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
            </div>
          </div>
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
            disabled={isLoading}
            className="h-14 px-10 rounded-2xl bg-purple-600 hover:bg-purple-700 font-black gap-3 shadow-xl shadow-purple-100 hover:-translate-y-1 transition-all"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">등록 중...</span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                매출 등록하기
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
