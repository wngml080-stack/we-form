"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Package } from "lucide-react";
import { toast } from "@/lib/toast";
import { AddonItem, getNextDay } from "./useExistingSalesForm";

interface MemberPayment {
  id: string;
  membership_type?: string;
  registration_type?: string;
  memo?: string;
  start_date?: string;
  end_date?: string;
}

// 활성 부가상품 정보 타입
interface ActiveAddon {
  type: string;
  displayName: string;
  lockerNumber: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface AddonProductsSectionProps {
  addons: AddonItem[];
  memberPayments?: MemberPayment[];
  onAddAddon: () => void;
  onRemoveAddon: (index: number) => void;
  onUpdateAddon: (index: number, field: keyof AddonItem, value: string) => void;
}

// 락커 유형별 기존 종료일 가져오기
const getLatestLockerEndDate = (payments: MemberPayment[] | undefined, lockerType: string): string | null => {
  if (!payments || payments.length === 0) return null;

  const lockerPayments = payments.filter(p => {
    if (p.membership_type !== "부가상품") return false;
    // memo에서 락커 유형 확인 (예: "개인락커 15번 (3개월)")
    return p.memo?.includes(lockerType) && p.end_date;
  });

  if (lockerPayments.length === 0) return null;

  const today = new Date().toISOString().split("T")[0];
  // 오늘 이후 종료되는 락커만 필터링
  const activeLockers = lockerPayments.filter(p => p.end_date && p.end_date >= today);

  if (activeLockers.length === 0) return null;

  // 가장 늦은 종료일 찾기
  return activeLockers.reduce((latest, current) => {
    if (!latest.end_date) return current;
    if (!current.end_date) return latest;
    return new Date(current.end_date) > new Date(latest.end_date) ? current : latest;
  }).end_date || null;
};

// 부가상품 정보 파싱 함수
const parseAddonInfo = (memo: string | undefined): { type: string; displayName: string; lockerNumber: string | null } => {
  if (!memo) return { type: "기타", displayName: "부가상품", lockerNumber: null };

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
    const otherMatch = memo.match(/^([^(]+?)(?:\s*\(|\s*\d{4}-|$)/);
    if (otherMatch) {
      displayName = otherMatch[1].trim();
    }
  }

  return { type, displayName, lockerNumber };
};

export function AddonProductsSection({
  addons, memberPayments, onAddAddon, onRemoveAddon, onUpdateAddon
}: AddonProductsSectionProps) {
  // 기존 활성 부가상품 목록 계산
  const activeAddons = useMemo(() => {
    if (!memberPayments || memberPayments.length === 0) return [];

    const today = new Date().toISOString().split("T")[0];

    // membership_type 또는 registration_type이 "부가상품"인 것 필터링
    const filtered = memberPayments.filter(p => {
      const isAddon = p.membership_type === "부가상품" || p.registration_type === "부가상품";
      const hasValidEndDate = p.end_date && p.end_date >= today;
      return isAddon && hasValidEndDate;
    });

    return filtered
      .map(p => {
        const info = parseAddonInfo(p.memo);
        return {
          ...info,
          startDate: p.start_date || "",
          endDate: p.end_date || "",
          isActive: true,
        } as ActiveAddon;
      })
      .sort((a, b) => a.type.localeCompare(b.type));
  }, [memberPayments]);

  // 락커 유형 선택 시 기존 락커 종료일 확인 및 시작일 자동 설정
  const handleAddonTypeChange = (index: number, newType: string) => {
    // 먼저 유형 업데이트
    onUpdateAddon(index, "addon_type", newType);

    // 락커 유형인 경우 기존 락커 종료일 확인
    if (newType === "개인락커" || newType === "물품락커") {
      const latestEndDate = getLatestLockerEndDate(memberPayments, newType);
      if (latestEndDate) {
        const minStartDate = getNextDay(latestEndDate);
        // 시작일을 기존 락커 종료일 다음 날로 설정
        onUpdateAddon(index, "start_date", minStartDate);
        toast.info(`기존 ${newType}가 ${latestEndDate}까지 있어 ${minStartDate}부터 시작합니다.`);
      }
    }
  };

  // 시작일 변경 시 기존 락커 종료일 검증
  const handleStartDateChange = (index: number, newStartDate: string, addonType: string) => {
    if (addonType === "개인락커" || addonType === "물품락커") {
      const latestEndDate = getLatestLockerEndDate(memberPayments, addonType);
      if (latestEndDate) {
        const minStartDate = getNextDay(latestEndDate);
        if (newStartDate < minStartDate) {
          toast.error(`기존 ${addonType}가 ${latestEndDate}까지 있어 ${minStartDate} 이후로만 설정 가능합니다.`);
          return;
        }
      }
    }
    onUpdateAddon(index, "start_date", newStartDate);
  };

  // 락커 유형별 최소 시작일 계산
  const getMinStartDate = (addonType: string): string | undefined => {
    if (addonType === "개인락커" || addonType === "물품락커") {
      const latestEndDate = getLatestLockerEndDate(memberPayments, addonType);
      if (latestEndDate) {
        return getNextDay(latestEndDate);
      }
    }
    return undefined;
  };

  // 유형별 색상 정의
  const typeColors: Record<string, { bg: string; text: string; badge: string }> = {
    "개인락커": { bg: "bg-blue-50", text: "text-blue-800", badge: "bg-blue-200 text-blue-800" },
    "물품락커": { bg: "bg-cyan-50", text: "text-cyan-800", badge: "bg-cyan-200 text-cyan-800" },
    "운동복": { bg: "bg-green-50", text: "text-green-800", badge: "bg-green-200 text-green-800" },
    "양말": { bg: "bg-orange-50", text: "text-orange-800", badge: "bg-orange-200 text-orange-800" },
    "기타": { bg: "bg-purple-50", text: "text-purple-800", badge: "bg-purple-200 text-purple-800" },
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="font-semibold text-sm text-gray-700">부가상품 추가 (선택)</h3>
        <Button type="button" variant="outline" size="sm" onClick={onAddAddon} className="text-xs">
          <Plus className="w-3 h-3 mr-1" />
          부가상품 추가
        </Button>
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
              const colors = typeColors[addon.type] || typeColors["기타"];
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

      {addons.map((addon, index) => {
        const minStartDate = getMinStartDate(addon.addon_type);

        return (
          <div key={index} className="border rounded-lg p-4 bg-gray-50 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">부가상품 #{index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveAddon(index)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Row 1: 상품 유형 / 락커번호 또는 상품명 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">상품 유형 *</Label>
                <Select
                  value={addon.addon_type}
                  onValueChange={(v) => handleAddonTypeChange(index, v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="선택" />
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

              {addon.addon_type === "기타" && (
                <div className="space-y-1">
                  <Label className="text-xs">상품명 *</Label>
                  <Input
                    value={addon.custom_addon_name}
                    onChange={(e) => onUpdateAddon(index, "custom_addon_name", e.target.value)}
                    placeholder="상품명"
                    className="h-9"
                  />
                </div>
              )}

              {(addon.addon_type === "개인락커" || addon.addon_type === "물품락커") && (
                <div className="space-y-1">
                  <Label className="text-xs">락커 번호</Label>
                  <Input
                    value={addon.locker_number}
                    onChange={(e) => onUpdateAddon(index, "locker_number", e.target.value)}
                    placeholder="예: 15"
                    className="h-9"
                  />
                </div>
              )}
            </div>

            {/* Row 2: 금액 / 기간 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">금액 *</Label>
                <Input
                  type="number"
                  value={addon.amount}
                  onChange={(e) => onUpdateAddon(index, "amount", e.target.value)}
                  placeholder="50000"
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">기간</Label>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    value={addon.duration}
                    onChange={(e) => onUpdateAddon(index, "duration", e.target.value)}
                    placeholder="숫자"
                    className="h-9 flex-1"
                  />
                  <Select
                    value={addon.duration_type}
                    onValueChange={(v) => onUpdateAddon(index, "duration_type", v)}
                  >
                    <SelectTrigger className="h-9 w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="months">개월</SelectItem>
                      <SelectItem value="days">일</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Row 3: 결제방법 / 시작일 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">결제방법</Label>
                <Select
                  value={addon.method}
                  onValueChange={(v) => onUpdateAddon(index, "method", v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="card">카드</SelectItem>
                    <SelectItem value="cash">현금</SelectItem>
                    <SelectItem value="transfer">계좌이체</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">시작일</Label>
                <Input
                  type="date"
                  value={addon.start_date}
                  min={minStartDate}
                  onChange={(e) => handleStartDateChange(index, e.target.value, addon.addon_type)}
                  className="h-9"
                />
                {minStartDate && (
                  <p className="text-xs text-gray-500">
                    기존 {addon.addon_type} 종료 후 {minStartDate}부터 가능
                  </p>
                )}
              </div>
            </div>

            {/* Row 4: 종료일 (자동계산) */}
            {addon.end_date && (
              <div className="grid grid-cols-2 gap-3">
                <div></div>
                <div className="space-y-1">
                  <Label className="text-xs">종료일 (자동계산)</Label>
                  <Input
                    type="date"
                    value={addon.end_date}
                    readOnly
                    className="h-9 bg-gray-100"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {addons.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">
          락커, 운동복 등 부가상품을 함께 등록할 수 있습니다.
        </p>
      )}
    </div>
  );
}
