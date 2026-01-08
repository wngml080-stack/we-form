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
import { Calendar as CalendarIcon, Clock, User, Plus, X, Sparkles, CheckCircle2, AlertCircle, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

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
  // 선택된 회원의 PT 회원권 정보 계산
  const selectedMemberInfo = useMemo(() => {
    if (!createForm.member_id) return null;

    const memberships = memberMemberships[createForm.member_id] || [];
    const ptMembership = memberships.find((m: any) =>
      m.name?.toLowerCase().includes('pt') || m.name?.includes('피티')
    );
    const selectedMember = filteredMembers.find(m => m.id === createForm.member_id);
    const hasTrainer = !!selectedMember?.trainer_id;

    if (ptMembership) {
      const remainingSessions = (ptMembership.total_sessions || 0) - (ptMembership.used_sessions || 0);
      const serviceSessions = ptMembership.service_sessions || 0;
      const usedServiceSessions = ptMembership.used_service_sessions || 0;
      const remainingServiceSessions = serviceSessions - usedServiceSessions;
      return {
        hasPtMembership: true,
        hasTrainer,
        ptMembership: {
          name: ptMembership.name,
          totalSessions: ptMembership.total_sessions || 0,
          usedSessions: ptMembership.used_sessions || 0,
          remainingSessions,
          serviceSessions,
          usedServiceSessions,
          remainingServiceSessions,
          startDate: ptMembership.start_date,
          endDate: ptMembership.end_date,
        },
        canBookPT: remainingSessions > 0,
        canBookOT: hasTrainer, // 담당자가 있으면 OT 가능
      };
    }

    return {
      hasPtMembership: false,
      hasTrainer,
      ptMembership: null,
      canBookPT: false,
      canBookOT: hasTrainer, // PT 없어도 담당자 있으면 OT만 가능
    };
  }, [createForm.member_id, memberMemberships, filteredMembers]);

  // 회원 선택 시 자동으로 적절한 수업 유형 설정
  const handleMemberChange = (memberId: string) => {
    const memberships = memberMemberships[memberId] || [];
    const pt = memberships.find((m: any) => m.name?.toLowerCase().includes('pt') || m.name?.includes('피티'));
    setSelectedMemberMembership(pt || null);

    // PT 회원권이 없으면 기본값을 OT로 변경
    if (!pt) {
      setCreateForm({ ...createForm, member_id: memberId, type: "OT" });
    } else {
      const remainingSessions = (pt.total_sessions || 0) - (pt.used_sessions || 0);
      // PT 잔여횟수가 없으면 OT로 변경
      if (remainingSessions <= 0) {
        setCreateForm({ ...createForm, member_id: memberId, type: "OT" });
      } else {
        setCreateForm({ ...createForm, member_id: memberId });
      }
    }
  };

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
                <>
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">대상 회원 선택</Label>
                    <Select
                      value={createForm.member_id}
                      onValueChange={handleMemberChange}
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

                  {/* 선택된 회원의 PT 정보 표시 */}
                  {createForm.member_id && selectedMemberInfo && (
                    <div className={cn(
                      "p-5 rounded-2xl border-2",
                      selectedMemberInfo.hasPtMembership
                        ? selectedMemberInfo.canBookPT
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-amber-50 border-amber-200"
                        : "bg-slate-50 border-slate-200"
                    )}>
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                          selectedMemberInfo.hasPtMembership
                            ? selectedMemberInfo.canBookPT
                              ? "bg-emerald-500 text-white"
                              : "bg-amber-500 text-white"
                            : "bg-slate-400 text-white"
                        )}>
                          <Ticket className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {selectedMemberInfo.hasPtMembership && selectedMemberInfo.ptMembership ? (
                            <>
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-sm font-black text-slate-900">{selectedMemberInfo.ptMembership.name}</p>
                                {selectedMemberInfo.canBookPT ? (
                                  <Badge className="bg-emerald-500 text-white text-[10px] px-2 py-0.5">이용가능</Badge>
                                ) : (
                                  <Badge className="bg-amber-500 text-white text-[10px] px-2 py-0.5">횟수소진</Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-4 gap-3">
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">잔여횟수</p>
                                  <p className={cn(
                                    "text-lg font-black",
                                    selectedMemberInfo.ptMembership.remainingSessions > 0 ? "text-emerald-600" : "text-red-500"
                                  )}>
                                    {selectedMemberInfo.ptMembership.remainingSessions}회
                                    <span className="text-xs text-slate-400 ml-1">/ {selectedMemberInfo.ptMembership.totalSessions}회</span>
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-orange-500 uppercase">서비스</p>
                                  {selectedMemberInfo.ptMembership.serviceSessions > 0 ? (
                                    <p className={cn(
                                      "text-lg font-black",
                                      selectedMemberInfo.ptMembership.remainingServiceSessions > 0 ? "text-orange-600" : "text-slate-400"
                                    )}>
                                      {selectedMemberInfo.ptMembership.remainingServiceSessions}회
                                      <span className="text-xs text-slate-400 ml-1">/ {selectedMemberInfo.ptMembership.serviceSessions}회</span>
                                    </p>
                                  ) : (
                                    <p className="text-lg font-black text-slate-300">-</p>
                                  )}
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">시작일</p>
                                  <p className="text-sm font-bold text-slate-700">{selectedMemberInfo.ptMembership.startDate || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">유효기간</p>
                                  {selectedMemberInfo.ptMembership.endDate ? (() => {
                                    const endDate = new Date(selectedMemberInfo.ptMembership.endDate);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const remainingDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                    return (
                                      <p className={cn(
                                        "text-sm font-bold",
                                        remainingDays > 30 ? "text-slate-700" : remainingDays > 0 ? "text-amber-600" : "text-red-600"
                                      )}>
                                        ~{selectedMemberInfo.ptMembership.endDate}
                                        <span className={cn(
                                          "ml-1 text-xs",
                                          remainingDays > 30 ? "text-slate-400" : remainingDays > 0 ? "text-amber-500" : "text-red-500"
                                        )}>
                                          ({remainingDays > 0 ? `${remainingDays}일` : '만료'})
                                        </span>
                                      </p>
                                    );
                                  })() : <p className="text-sm font-bold text-slate-700">-</p>}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-3">
                              <AlertCircle className="w-5 h-5 text-slate-400" />
                              <div>
                                <p className="text-sm font-black text-slate-700">PT 회원권이 없습니다</p>
                                <p className="text-xs text-slate-500">
                                  {selectedMemberInfo.hasTrainer
                                    ? "담당자가 배정되어 있어 OT 또는 상담만 등록 가능합니다."
                                    : "담당자 배정 후 OT 또는 상담을 등록할 수 있습니다."}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
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
                        <SelectItem
                          value="PT"
                          className="rounded-xl py-3 font-bold"
                          disabled={!selectedMemberInfo?.canBookPT}
                        >
                          <div className="flex items-center gap-2">
                            <span>PT (Personal Training)</span>
                            {selectedMemberInfo && !selectedMemberInfo.canBookPT && (
                              <span className="text-[10px] text-red-500 font-bold">
                                {selectedMemberInfo.hasPtMembership ? "횟수소진" : "회원권없음"}
                              </span>
                            )}
                          </div>
                        </SelectItem>
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
