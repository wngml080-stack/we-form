"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddClassModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  memberSearchQuery: string;
  setMemberSearchQuery: (query: string) => void;
  showMemberDropdown: boolean;
  setShowMemberDropdown: (show: boolean) => void;
  filteredMembers: any[];
  onSelectMember: (member: any) => void;
  startTime: string;
  setStartTime: (time: string) => void;
  duration: string;
  setDuration: (duration: string) => void;
  newClassType: string;
  setNewClassType: (type: string) => void;
  onSubmit: () => void;
  onOpenAddMember: () => void;
}

export function AddClassModal({
  isOpen, onOpenChange, selectedDate, setSelectedDate,
  memberSearchQuery, setMemberSearchQuery, showMemberDropdown, setShowMemberDropdown,
  filteredMembers, onSelectMember, startTime, setStartTime, duration, setDuration,
  newClassType, setNewClassType, onSubmit, onOpenAddMember
}: AddClassModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl p-0 overflow-hidden gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold">수업 등록</DialogTitle>
          <DialogDescription className="sr-only">새로운 수업을 등록합니다</DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-2 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-500">날짜</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="font-bold text-gray-900 bg-gray-50 border-gray-200 h-11"
            />
          </div>
          <div className="space-y-1.5 relative">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-bold text-gray-500">회원 선택</Label>
              <button
                onClick={onOpenAddMember}
                className="text-xs text-[#2F80ED] font-bold hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> 새 회원
              </button>
            </div>
            <Input
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
              onFocus={() => setShowMemberDropdown(true)}
              placeholder="이름 검색"
              className="h-11 bg-gray-50 border-gray-200"
            />
            {showMemberDropdown && filteredMembers.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto p-1">
                {filteredMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => onSelectMember(member)}
                    className="w-full px-3 py-2.5 text-left hover:bg-gray-50 rounded-lg flex justify-between items-center group transition-colors"
                  >
                    <span className="font-bold text-gray-800">{member.name}</span>
                    <div className="text-xs text-gray-500 flex flex-col items-end">
                      <span>{member.phone || "-"}</span>
                      {member.activeMembership && (
                        <span className={member.remaining === 0 ? "text-red-500 font-bold" : "text-emerald-600 font-bold"}>
                          {member.remaining}회 남음
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500">시작 시간</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-11 bg-gray-50 border-gray-200 font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500">진행 시간</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="h-11 bg-gray-50 border-gray-200 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30분 (OT)</SelectItem>
                  <SelectItem value="50">50분 (기본)</SelectItem>
                  <SelectItem value="60">60분</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-500">수업 종류</Label>
            <div className="grid grid-cols-3 gap-2">
              {['PT', 'OT', 'Consulting'].map((type) => (
                <button
                  key={type}
                  onClick={() => setNewClassType(type)}
                  className={cn(
                    "py-2.5 rounded-xl text-sm font-bold border-2 transition-all",
                    newClassType === type
                      ? "border-[#2F80ED] bg-blue-50 text-[#2F80ED]"
                      : "border-gray-100 bg-white text-gray-400 hover:border-gray-300"
                  )}
                >
                  {type === 'Consulting' ? '상담' : type}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 pt-0">
          <Button
            onClick={onSubmit}
            className="bg-[#2F80ED] hover:bg-[#1c6cd7] text-white w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-blue-200"
          >
            등록하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
