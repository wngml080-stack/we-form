"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-6 animate-in fade-in duration-500 delay-150">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* 기간 빠른 선택 - 탭 스타일 */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl w-fit border border-slate-100">
          {[
            { value: "today", label: "오늘" },
            { value: "thisWeek", label: "이번 주" },
            { value: "thisMonth", label: "이번 달" },
            { value: "lastMonth", label: "지난 달" },
          ].map(option => (
            <button
              key={option.value}
              onClick={() => onQuickSelect(option.value)}
              className={cn(
                "px-5 py-2.5 text-xs font-black rounded-xl transition-all",
                quickSelect === option.value 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* 기간 상세 선택 */}
        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="h-9 w-32 bg-white border-transparent rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all text-[11px] font-black text-slate-700"
          />
          <span className="text-slate-300 font-black px-1">~</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="h-9 w-32 bg-white border-transparent rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all text-[11px] font-black text-slate-700"
          />
        </div>
      </div>

      <div className="h-px bg-slate-50 w-full" />

      {/* 상세 필터 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">상품분류</p>
          <Select value={membershipTypeFilter} onValueChange={onMembershipTypeChange}>
            <SelectTrigger className="h-11 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 transition-all font-black text-slate-700 text-xs">
              <SelectValue placeholder="전체 분류" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-2xl border-slate-100 shadow-xl">
              <SelectItem value="all" className="font-black text-xs">전체 분류</SelectItem>
              {allMembershipTypes.map(type => (
                <SelectItem key={type} value={type} className="font-bold text-xs">{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">매출유형</p>
          <Select value={registrationTypeFilter} onValueChange={onRegistrationTypeChange}>
            <SelectTrigger className="h-11 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 transition-all font-black text-slate-700 text-xs">
              <SelectValue placeholder="전체 유형" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-2xl border-slate-100 shadow-xl">
              <SelectItem value="all" className="font-black text-xs">전체 유형</SelectItem>
              <SelectItem value="신규" className="font-bold text-xs text-blue-600">신규</SelectItem>
              <SelectItem value="재등록" className="font-bold text-xs text-emerald-600">재등록</SelectItem>
              <SelectItem value="부가상품" className="font-bold text-xs text-amber-600">부가상품</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">결제수단</p>
          <Select value={methodFilter} onValueChange={onMethodChange}>
            <SelectTrigger className="h-11 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 transition-all font-black text-slate-700 text-xs">
              <SelectValue placeholder="전체 수단" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-2xl border-slate-100 shadow-xl">
              <SelectItem value="all" className="font-black text-xs">전체 수단</SelectItem>
              {allPaymentMethods.map(method => (
                <SelectItem key={method} value={method} className="font-bold text-xs">
                  {methodLabels[method] || method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
