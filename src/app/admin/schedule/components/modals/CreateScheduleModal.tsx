"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Calendar as CalendarIcon, Clock, User, Plus, X, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeSlot {
  date: string;
  time: string;
  staffId?: string;
}

interface CreateFormData {
  member_id: string;
  type: string;
  duration: string;
  isPersonal: boolean;
  personalTitle: string;
}

interface Member {
  id: string;
  name: string;
  trainer_id?: string;
}

interface CreateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTimeSlot: TimeSlot | null;
  createForm: CreateFormData;
  setCreateForm: (form: CreateFormData) => void;
  filteredMembers: Member[];
  memberMemberships: Record<string, any[]>;
  selectedMemberMembership: any | null;
  setSelectedMemberMembership: (membership: any | null) => void;
  selectedStaffId: string;
  schedules: any[];
  getSessionNumber: (memberId: string, type: 'pt' | 'ot', scheduleId?: string) => number;
  isLoading: boolean;
  onSubmit: () => void;
}

export function CreateScheduleModal({
  isOpen,
  onClose,
  selectedTimeSlot,
  createForm,
  setCreateForm,
  filteredMembers,
  memberMemberships,
  setSelectedMemberMembership,
  selectedStaffId,
  schedules,
  getSessionNumber,
  isLoading,
  onSubmit,
}: CreateScheduleModalProps) {
  const handleClose = () => {
    setCreateForm({ member_id: "", type: "PT", duration: "60", isPersonal: false, personalTitle: "" });
    setSelectedMemberMembership(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent className="max-w-2xl bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px] [&>button]:hidden">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle asChild>
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Plus className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight" style={{ color: 'white' }}>새 스케줄 등록</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                  <p className="text-sm text-white/80 font-bold">센터의 일정을 효율적으로 관리하세요 (v1.1)</p>
                </div>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">새로운 스케줄을 생성합니다</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          {/* 일시 정보 카드 */}
          {selectedTimeSlot && (
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Schedule</p>
                  <p className="text-lg font-black text-slate-900 tracking-tight">
                    {selectedTimeSlot.date} <span className="text-blue-600 mx-2">·</span> {selectedTimeSlot.time}
                  </p>
                </div>
              </div>
              <Badge className="bg-blue-50 text-blue-600 border-none px-3 py-1 font-black">신규 등록</Badge>
            </div>
          )}

          {/* 일정 유형 선택 */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-black text-slate-900">일정 유형 설정</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setCreateForm({ ...createForm, isPersonal: false, member_id: "", personalTitle: "" })}
                className={cn(
                  "p-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-3",
                  !createForm.isPersonal 
                    ? "bg-white border-blue-600 shadow-xl shadow-blue-100" 
                    : "bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-200"
                )}
              >
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", !createForm.isPersonal ? "bg-blue-600 text-white" : "bg-white text-slate-300 shadow-sm")}>
                  <User className="w-6 h-6" />
                </div>
                <span className="font-black">회원 수업</span>
              </button>
              
              <button
                onClick={() => setCreateForm({ ...createForm, isPersonal: true, member_id: "", personalTitle: "" })}
                className={cn(
                  "p-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-3",
                  createForm.isPersonal 
                    ? "bg-white border-purple-600 shadow-xl shadow-purple-100" 
                    : "bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-200"
                )}
              >
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", createForm.isPersonal ? "bg-purple-600 text-white" : "bg-white text-slate-300 shadow-sm")}>
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="font-black">개인 일정</span>
              </button>
            </div>
          </div>

          {/* 상세 정보 입력 */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-black text-slate-900">상세 내용 입력</h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {createForm.isPersonal ? (
                <div className="space-y-3">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">일정 제목</Label>
                  <Input
                    value={createForm.personalTitle}
                    onChange={(e) => setCreateForm({ ...createForm, personalTitle: e.target.value })}
                    placeholder="예: 회의, 외부 교육, 개인 운동 등"
                    className="h-14 px-6 rounded-2xl bg-white border-slate-100 focus-visible:ring-blue-500 font-bold"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">대상 회원 선택</Label>
                  <Select
                    value={createForm.member_id}
                    onValueChange={(val) => {
                      setCreateForm({ ...createForm, member_id: val });
                      const memberships = memberMemberships[val] || [];
                      const pt = memberships.find(m => m.name?.includes('PT') || m.name?.includes('피티'));
                      setSelectedMemberMembership(pt || null);
                    }}
                  >
                    <SelectTrigger className="h-14 px-6 rounded-2xl bg-white border-slate-100 focus:ring-blue-500 font-bold">
                      <SelectValue placeholder="회원을 검색하거나 선택하세요" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                      {filteredMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id} className="rounded-xl py-3 font-bold">{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                {!createForm.isPersonal && (
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">수업 유형</Label>
                    <Select
                      value={createForm.type}
                      onValueChange={(v) => setCreateForm({ ...createForm, type: v })}
                    >
                      <SelectTrigger className="h-14 px-6 rounded-2xl bg-white border-slate-100 focus:ring-blue-500 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                        <SelectItem value="PT" className="rounded-xl py-3 font-bold">PT (Personal Training)</SelectItem>
                        <SelectItem value="OT" className="rounded-xl py-3 font-bold">OT (Orientation)</SelectItem>
                        <SelectItem value="Consulting" className="rounded-xl py-3 font-bold">상담 (Consulting)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className={cn("space-y-3", createForm.isPersonal && "col-span-2")}>
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">소요 시간</Label>
                  <Select
                    value={createForm.duration}
                    onValueChange={(v) => setCreateForm({ ...createForm, duration: v })}
                  >
                    <SelectTrigger className="h-14 px-6 rounded-2xl bg-white border-slate-100 focus:ring-blue-500 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                      <SelectItem value="30" className="rounded-xl py-3 font-bold">30분 수업/일정</SelectItem>
                      <SelectItem value="60" className="rounded-xl py-3 font-bold">60분 수업/일정</SelectItem>
                      <SelectItem value="90" className="rounded-xl py-3 font-bold">90분 수업/일정</SelectItem>
                      <SelectItem value="120" className="rounded-xl py-3 font-bold">120분 수업/일정</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-white border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ready to Register New Entry</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={handleClose}
              className="h-14 px-8 rounded-2xl font-black text-slate-400 hover:text-slate-900 transition-all"
            >
              취소하기
            </Button>
            <Button 
              onClick={onSubmit} 
              disabled={isLoading}
              className="h-14 px-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Clock className="w-5 h-5 animate-spin" />
                  등록 중...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  스케줄 확정
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
