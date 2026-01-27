"use client";

import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MEETING_STATUS_LABELS,
  MEETING_TYPE_LABELS,
  type MeetingStatus,
  type MeetingType,
} from "@/types/meeting";

interface MeetingsHeaderProps {
  onCreateClick: () => void;
  statusFilter: MeetingStatus | "all";
  onStatusFilterChange: (value: MeetingStatus | "all") => void;
  typeFilter: MeetingType | "all";
  onTypeFilterChange: (value: MeetingType | "all") => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function MeetingsHeader({
  onCreateClick,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  searchQuery,
  onSearchChange,
}: MeetingsHeaderProps) {
  return (
    <div className="space-y-8">
      {/* 타이틀 & 생성 버튼 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-[var(--primary-hex)] rounded-full"></div>
            <p className="text-xs xs:text-sm text-[var(--foreground-subtle)] font-bold uppercase tracking-[0.2em]">Communication</p>
          </div>
          <h1 className="text-3xl xs:text-4xl lg:text-5xl font-extrabold text-[var(--foreground)] tracking-tight leading-tight">
            회의록 관리
          </h1>
          <p className="text-sm xs:text-base text-[var(--foreground-muted)] font-medium">
            효율적인 소통을 위해 회의 일정을 관리하고 기록을 체계적으로 보관하세요.
          </p>
        </div>
        <Button 
          onClick={onCreateClick} 
          className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-black text-white font-black shadow-xl shadow-slate-200 transition-all active:scale-95 gap-3 shrink-0"
        >
          <Plus className="w-5 h-5 text-blue-400" />
          새 회의 만들기
        </Button>
      </div>

      {/* 필터 & 검색 */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
        {/* 검색 */}
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[var(--primary-hex)] transition-colors" />
          <Input
            placeholder="회의 제목으로 검색하세요"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-14 pl-14 pr-6 rounded-[20px] bg-slate-50 border-none font-bold text-base focus-visible:ring-2 focus-visible:ring-blue-100 transition-all"
          />
        </div>

        <div className="flex gap-3">
          {/* 상태 필터 */}
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="h-14 w-[140px] rounded-[20px] bg-slate-50 border-none font-bold text-sm">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <SelectValue placeholder="상태" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
              <SelectItem value="all" className="rounded-xl font-bold py-3">전체 상태</SelectItem>
              {Object.entries(MEETING_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value} className="rounded-xl font-bold py-3">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 유형 필터 */}
          <Select value={typeFilter} onValueChange={onTypeFilterChange}>
            <SelectTrigger className="h-14 w-[140px] rounded-[20px] bg-slate-50 border-none font-bold text-sm">
              <SelectValue placeholder="유형" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
              <SelectItem value="all" className="rounded-xl font-bold py-3">전체 유형</SelectItem>
              {Object.entries(MEETING_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value} className="rounded-xl font-bold py-3">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
