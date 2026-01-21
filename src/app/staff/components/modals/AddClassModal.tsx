"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarPlus, X, Calendar as CalendarIcon, Clock, User, Info, Save, Activity, Target, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddClassModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // Member selection
  selectedMember?: any | null;
  memberSearchQuery?: string;
  setMemberSearchQuery?: (query: string) => void;
  showMemberDropdown?: boolean;
  setShowMemberDropdown?: (show: boolean) => void;
  filteredMembers?: any[];
  onSelectMember?: (member: any) => void;
  onOpenAddMember?: () => void;
  // Date and time
  selectedDate?: string;
  setSelectedDate?: (date: string) => void;
  newClassDate?: string;
  setNewClassDate?: (date: string) => void;
  startTime?: string;
  setStartTime?: (time: string) => void;
  newClassStartTime?: string;
  setNewClassStartTime?: (time: string) => void;
  duration?: string;
  setDuration?: (duration: string) => void;
  newClassDuration?: string;
  setNewClassDuration?: (duration: string) => void;
  // Type settings
  newClassType: string;
  setNewClassType: (type: string) => void;
  newClassSubType?: string;
  setNewClassSubType?: (subType: string) => void;
  newClassPersonalTitle?: string;
  setNewClassPersonalTitle?: (title: string) => void;
  onSubmit: () => void;
}

export function AddClassModal({
  isOpen, onOpenChange, selectedMember,
  memberSearchQuery, setMemberSearchQuery,
  showMemberDropdown, setShowMemberDropdown,
  filteredMembers, onSelectMember, onOpenAddMember,
  selectedDate, setSelectedDate,
  newClassDate, setNewClassDate,
  startTime, setStartTime,
  newClassStartTime, setNewClassStartTime,
  duration, setDuration,
  newClassDuration, setNewClassDuration,
  newClassType, setNewClassType,
  newClassSubType = '', setNewClassSubType,
  newClassPersonalTitle = '', setNewClassPersonalTitle,
  onSubmit
}: AddClassModalProps) {
  // Use either naming convention
  const classDate = newClassDate ?? selectedDate ?? '';
  const setClassDate = setNewClassDate ?? setSelectedDate ?? (() => {});
  const classStartTime = newClassStartTime ?? startTime ?? '';
  const setClassStartTime = setNewClassStartTime ?? setStartTime ?? (() => {});
  const classDuration = newClassDuration ?? duration ?? '50';
  const setClassDuration = setNewClassDuration ?? setDuration ?? (() => {});
  const isPersonal = newClassType === 'personal';
  const isConsulting = newClassType === 'consulting';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-2xl xs:rounded-3xl sm:rounded-[40px]">
        <DialogHeader className="px-8 py-6 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
          <DialogTitle className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <CalendarPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">새 일정 등록</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Create New Schedule</p>
            </div>
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-6 right-8 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all group z-10"
          >
            <X className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#f8fafc]">
          {/* 타입 선택 탭 */}
          <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-2 border border-slate-100 shadow-sm flex">
            {['PT', 'personal', 'consulting'].map((type) => (
              <button
                key={type}
                onClick={() => setNewClassType(type)}
                className={cn(
                  "flex-1 h-12 rounded-[24px] text-xs font-black transition-all",
                  newClassType === type 
                    ? "bg-slate-900 text-white shadow-lg" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                )}
              >
                {type === 'PT' ? '수업 (PT/OT)' : type === 'personal' ? '개인 일정' : '상담'}
              </button>
            ))}
          </div>

          {/* 주요 식별 정보 카드 */}
          <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-6 border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl">
              {isPersonal ? '📅' : '👤'}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                {isPersonal ? 'Event Title' : 'Target Member'}
              </p>
              {isPersonal ? (
                <Input
                  value={newClassPersonalTitle}
                  onChange={(e) => setNewClassPersonalTitle?.(e.target.value)}
                  placeholder="일정 제목을 입력하세요"
                  className="h-10 bg-slate-50 border-none rounded-xl font-black text-slate-900 focus:ring-2 focus:ring-blue-100"
                />
              ) : (
                <h4 className="text-xl font-black text-slate-900">
                  {selectedMember ? `${selectedMember.name}님` : '회원을 선택해주세요'}
                </h4>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 일시 설정 섹션 */}
            <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">1</div>
                <h3 className="text-base font-black text-slate-900">시간 및 날짜</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</Label>
                  <div className="relative group">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      type="date"
                      value={classDate}
                      onChange={(e) => setClassDate(e.target.value)}
                      className="h-11 pl-10 bg-slate-50 border-none rounded-xl font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start</Label>
                    <div className="relative group">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        type="time"
                        value={classStartTime}
                        onChange={(e) => setClassStartTime(e.target.value)}
                        className="h-11 pl-10 bg-slate-50 border-none rounded-xl font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration</Label>
                    <Select value={classDuration} onValueChange={setClassDuration}>
                      <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-xl">
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="50">50 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* 분류 설정 섹션 */}
            <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">2</div>
                <h3 className="text-base font-black text-slate-900">상세 분류</h3>
              </div>

              <div className="space-y-4">
                {isPersonal ? (
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</Label>
                    <Select value={newClassSubType} onValueChange={setNewClassSubType}>
                      <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl font-bold">
                        <SelectValue placeholder="분류 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-xl">
                        <SelectItem value="meal">🍽️ 식사</SelectItem>
                        <SelectItem value="conference">🏢 회의</SelectItem>
                        <SelectItem value="meeting">👥 미팅</SelectItem>
                        <SelectItem value="rest">☕ 휴식</SelectItem>
                        <SelectItem value="workout">💪 운동</SelectItem>
                        <SelectItem value="other">📝 기타</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : isConsulting ? (
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</Label>
                    <Select value={newClassSubType} onValueChange={setNewClassSubType}>
                      <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl font-bold">
                        <SelectValue placeholder="분류 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-xl">
                        <SelectItem value="sales">💰 세일즈</SelectItem>
                        <SelectItem value="info">ℹ️ 안내상담</SelectItem>
                        <SelectItem value="status">📊 현황상담</SelectItem>
                        <SelectItem value="other">📝 기타</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Class Type</Label>
                    <Select value={newClassSubType} onValueChange={setNewClassSubType}>
                      <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl font-bold">
                        <SelectValue placeholder="수업 종류 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-xl">
                        <SelectItem value="PT">PT Session</SelectItem>
                        <SelectItem value="OT">OT Session</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-blue-600 leading-relaxed">
                    팁: 캘린더에서 빈 영역을 드래그하면 해당 시간으로 자동 설정됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-8 py-6 bg-white border-t flex items-center justify-end flex-shrink-0">
          <Button
            onClick={onSubmit}
            className="h-14 px-12 rounded-2xl bg-slate-900 hover:bg-black font-black text-white shadow-xl shadow-slate-100 hover:-translate-y-1 transition-all gap-2"
          >
            일정 등록 완료
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
