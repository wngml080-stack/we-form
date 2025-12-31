"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface SalesFiltersProps {
  startDate: string;
  endDate: string;
  membershipTypeFilter: string;
  registrationTypeFilter: string;
  methodFilter: string;
  quickSelect: string;
  allMembershipTypes: string[];
  allPaymentMethods: string[];
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onMembershipTypeChange: (type: string) => void;
  onRegistrationTypeChange: (type: string) => void;
  onMethodChange: (method: string) => void;
  onQuickSelect: (value: string) => void;
}

export function SalesFilters({
  startDate, endDate,
  membershipTypeFilter, registrationTypeFilter, methodFilter, quickSelect,
  allMembershipTypes, allPaymentMethods,
  onStartDateChange, onEndDateChange,
  onMembershipTypeChange, onRegistrationTypeChange, onMethodChange, onQuickSelect
}: SalesFiltersProps) {
  const methodLabels: Record<string, string> = {
    card: "카드",
    cash: "현금",
    transfer: "계좌이체"
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border space-y-4">
      {/* 빠른 선택 */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "today", label: "오늘" },
          { value: "thisWeek", label: "이번 주" },
          { value: "thisMonth", label: "이번 달" },
          { value: "lastMonth", label: "지난 달" },
        ].map(option => (
          <Button
            key={option.value}
            variant={quickSelect === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onQuickSelect(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* 상세 필터 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="h-9"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="h-9"
        />
        <Select value={membershipTypeFilter} onValueChange={onMembershipTypeChange}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="회원권 유형" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">전체 유형</SelectItem>
            {allMembershipTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={registrationTypeFilter} onValueChange={onRegistrationTypeChange}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="등록 유형" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="신규">신규</SelectItem>
            <SelectItem value="재등록">재등록</SelectItem>
            <SelectItem value="부가상품">부가상품</SelectItem>
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={onMethodChange}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="결제 방법" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">전체 결제</SelectItem>
            {allPaymentMethods.map(method => (
              <SelectItem key={method} value={method}>
                {methodLabels[method] || method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
