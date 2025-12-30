"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SalesFiltersProps {
  startDate: string;
  endDate: string;
  membershipTypeFilter: string;
  registrationTypeFilter: string;
  methodFilter: string;
  quickSelect: string;
  allMembershipTypes: any[];
  allPaymentMethods: any[];
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onMembershipTypeChange: (type: string) => void;
  onRegistrationTypeChange: (type: string) => void;
  onMethodChange: (method: string) => void;
  onQuickSelect: (type: string) => void;
}

export function SalesFilters({
  startDate, endDate,
  membershipTypeFilter, registrationTypeFilter, methodFilter, quickSelect,
  allMembershipTypes, allPaymentMethods,
  onStartDateChange, onEndDateChange,
  onMembershipTypeChange, onRegistrationTypeChange, onMethodChange,
  onQuickSelect
}: SalesFiltersProps) {
  return (
    <div className="bg-white border rounded-xl p-4 sm:p-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">시작일</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">종료일</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">회원권 유형</Label>
          <Select value={membershipTypeFilter} onValueChange={onMembershipTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">전체</SelectItem>
              {allMembershipTypes.map((type: any) => (
                <SelectItem key={type.name} value={type.name}>{type.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">등록 타입</Label>
          <Select value={registrationTypeFilter} onValueChange={onRegistrationTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="신규">신규</SelectItem>
              <SelectItem value="리뉴">리뉴</SelectItem>
              <SelectItem value="기간변경">기간변경</SelectItem>
              <SelectItem value="회원 이외">회원 이외</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">결제 방법</Label>
          <Select value={methodFilter} onValueChange={onMethodChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">전체</SelectItem>
              {allPaymentMethods.map((method: any, index: number) => (
                <SelectItem key={method.code || index} value={method.code}>{method.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">빠른 선택</Label>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "today", label: "오늘" },
              { key: "yesterday", label: "어제" },
              { key: "week", label: "7일" },
              { key: "month", label: "이번달" },
              { key: "3months", label: "3개월" },
            ].map(({ key, label }) => (
              <Button
                key={key}
                type="button"
                variant={quickSelect === key ? "default" : "outline"}
                size="sm"
                onClick={() => onQuickSelect(key)}
                className={`text-xs ${quickSelect === key ? "bg-[#2F80ED] text-white" : ""}`}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
