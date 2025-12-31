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

import { Package } from "lucide-react";

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
      <DialogContent className="bg-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>부가상품 매출등록</DialogTitle>
          <DialogDescription className="text-gray-500">
            기존 회원에게 부가상품을 판매합니다
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* 회원 선택 */}
          <div className="space-y-2">
            <Label>
              회원 선택 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="회원 이름 또는 전화번호 검색..."
              className="mb-2"
            />
            <Select
              value={formData.member_id}
              onValueChange={handleMemberSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="회원을 선택하세요" />
              </SelectTrigger>
              <SelectContent className="bg-white max-h-[200px]">
                {filteredMembers.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center">
                    {memberSearch ? "검색 결과가 없습니다." : "등록된 회원이 없습니다."}
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.phone})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 기존 활성 부가상품 표시 */}
          {activeAddons.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-medium text-sm">
                <Package className="w-4 h-4" />
                현재 이용중인 부가상품
              </div>
              <div className="flex flex-wrap gap-2">
                {activeAddons.map((addon, idx) => {
                  const colors = ADDON_TYPE_COLORS[addon.type] || ADDON_TYPE_COLORS["기타"];
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.bg} border`}
                    >
                      <Badge className={`border-0 text-xs ${colors.badge}`}>
                        {addon.type}
                      </Badge>
                      <span className={`text-xs font-medium ${colors.text}`}>
                        {addon.lockerNumber ? `${addon.lockerNumber}번` : addon.displayName}
                      </span>
                      <span className="text-xs text-gray-500">
                        ~{addon.endDate}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-amber-700">
                동일 유형의 부가상품은 기존 만료일 이후부터 등록 가능합니다.
              </p>
            </div>
          )}

          {/* 부가상품 유형 */}
          <div className="space-y-2">
            <Label>
              부가상품 유형 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.addon_type}
              onValueChange={(v) => {
                let newStartDate = formData.start_date;
                // 락커 유형인 경우 기존 락커 종료일 확인
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
              <SelectTrigger>
                <SelectValue placeholder="유형 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="개인락커">개인락커</SelectItem>
                <SelectItem value="물품락커">물품락커</SelectItem>
                <SelectItem value="운동복">운동복</SelectItem>
                <SelectItem value="양말">양말</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 락커 번호 */}
          {(formData.addon_type === "개인락커" ||
            formData.addon_type === "물품락커") && (
            <div className="space-y-2">
              <Label>락커 번호</Label>
              <Input
                value={formData.locker_number}
                onChange={(e) =>
                  setFormData({ ...formData, locker_number: e.target.value })
                }
                placeholder="예: 15"
              />
            </div>
          )}

          {/* 기타 선택 시 직접 입력 */}
          {formData.addon_type === "기타" && (
            <div className="space-y-2">
              <Label>
                상품명 직접 입력 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.custom_addon_name}
                onChange={(e) =>
                  setFormData({ ...formData, custom_addon_name: e.target.value })
                }
                placeholder="상품명을 입력하세요"
              />
            </div>
          )}

          {/* 금액 */}
          <div className="space-y-2">
            <Label>
              금액 <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              placeholder="50000"
            />
          </div>

          {/* 결제방법 */}
          <div className="space-y-2">
            <Label>결제방법</Label>
            <Select
              value={formData.method}
              onValueChange={(v) => setFormData({ ...formData, method: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="card">카드</SelectItem>
                <SelectItem value="cash">현금</SelectItem>
                <SelectItem value="transfer">계좌이체</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 기간 */}
          <div className="space-y-2">
            <Label>기간</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => {
                  const value = e.target.value;
                  const newEndDate = calculateEndDate(
                    formData.start_date,
                    value,
                    formData.duration_type
                  );
                  setFormData({
                    ...formData,
                    duration: value,
                    end_date: newEndDate,
                  });
                }}
                placeholder="숫자 입력"
                className="flex-1"
              />
              <Select
                value={formData.duration_type}
                onValueChange={(v: "months" | "days") => {
                  const newEndDate = calculateEndDate(
                    formData.start_date,
                    formData.duration,
                    v
                  );
                  setFormData({
                    ...formData,
                    duration_type: v,
                    end_date: newEndDate,
                  });
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="months">개월</SelectItem>
                  <SelectItem value="days">일</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 결제일 */}
          <div className="space-y-2">
            <Label>결제일</Label>
            <Input
              type="date"
              value={formData.payment_date}
              onChange={(e) =>
                setFormData({ ...formData, payment_date: e.target.value })
              }
            />
          </div>

          {/* 시작일 / 종료일 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>시작일</Label>
              <Input
                type="date"
                value={formData.start_date}
                min={getMinStartDate(formData.addon_type)}
                onChange={(e) => {
                  const newStartDate = e.target.value;
                  // 락커 유형인 경우 시작일 검증
                  const minStartDate = getMinStartDate(formData.addon_type);
                  if (minStartDate && newStartDate < minStartDate) {
                    toast.error(`기존 ${formData.addon_type}가 있어 ${minStartDate} 이후로만 설정 가능합니다.`);
                    return;
                  }
                  const newEndDate = calculateEndDate(
                    newStartDate,
                    formData.duration,
                    formData.duration_type
                  );
                  setFormData({
                    ...formData,
                    start_date: newStartDate,
                    end_date: newEndDate,
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>종료일</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
              />
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-2">
            <Label>메모</Label>
            <Input
              value={formData.memo}
              onChange={(e) =>
                setFormData({ ...formData, memo: e.target.value })
              }
              placeholder="추가 메모"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? "등록 중..." : "등록하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
