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
import { Plus, X, Calendar as CalendarIcon, Clock, User, CheckCircle2, AlertTriangle, Activity, Info } from "lucide-react";
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

interface PTStats {
  reserved: number;
  completed: number;
  noShowDeducted: number;
  noShow: number;
  service: number;
  cancelled: number;
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
      <DialogContent className="max-w-2xl bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px]">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Plus className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">새 스케줄 등록</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <p className="text-sm text-slate-400 font-bold">센터의 일정을 효율적으로 관리하세요</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">새로운 스케줄을 생성합니다</DialogDescription>
          <button
            onClick={handleClose}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-[#f8fafc]">
          {/* 시간 정보 섹션 */}
          {selectedTimeSlot && (
            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Time</p>
                  <p className="text-lg font-black text-slate-900">{selectedTimeSlot.date} {selectedTimeSlot.time}</p>
                </div>
              </div>
              <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Available Slot</span>
              </div>
            </div>
          )}

          {/* 일정 유형 선택 섹션 */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">1</div>
              <h3 className="text-lg font-black text-slate-900">일정 분류 및 대상</h3>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                    createForm.isPersonal ? "bg-amber-500 text-white shadow-lg shadow-amber-100" : "bg-white text-slate-300"
                  )}>
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">개인 일정으로 등록</p>
                    <p className="text-xs text-slate-400 font-bold">수업 외 개인 업무 및 휴식 시간을 설정합니다</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateForm({
                    ...createForm,
                    isPersonal: !createForm.isPersonal,
                    member_id: "",
                    personalTitle: ""
                  })}
                  className={cn(
                    "w-14 h-8 rounded-full transition-all relative",
                    createForm.isPersonal ? "bg-amber-500" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all",
                    createForm.isPersonal ? "right-1" : "left-1"
                  )} />
                </button>
              </div>

              {createForm.isPersonal ? (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Title *</Label>
                  <Input
                    value={createForm.personalTitle}
                    onChange={(e) => setCreateForm({ ...createForm, personalTitle: e.target.value })}
                    placeholder="예: 회의, 휴식, 개인 업무 등"
                    className="h-14 bg-slate-50 border-none rounded-2xl font-bold text-lg focus:ring-2 focus:ring-amber-100 transition-all placeholder:text-slate-300"
                  />
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Member *</Label>
                    <Select
                      value={createForm.member_id}
                      onValueChange={(value) => {
                        setCreateForm({ ...createForm, member_id: value });
                        const memberships = memberMemberships[value] || [];
                        const ptMembership = memberships.find((m: any) =>
                          m.name?.includes('PT') || m.name?.includes('피티')
                        );
                        setSelectedMemberMembership(ptMembership || null);
                      }}
                    >
                      <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-bold text-lg focus:ring-2 focus:ring-blue-100 transition-all">
                        <SelectValue placeholder="회원을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                        {filteredMembers.length === 0 ? (
                          <SelectItem value="none" disabled className="rounded-xl font-bold py-3">
                            {selectedStaffId !== "all" ? "담당 회원이 없습니다" : "등록된 회원이 없습니다"}
                          </SelectItem>
                        ) : (
                          filteredMembers.map((member) => {
                            const memberships = memberMemberships[member.id] || [];
                            const hasPT = memberships.some((m: any) =>
                              m.name?.includes('PT') || m.name?.includes('피티')
                            );
                            return (
                              <SelectItem key={member.id} value={member.id} className="rounded-xl font-bold py-3">
                                {member.name} {hasPT && <span className="text-blue-500 ml-2">●</span>}
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {createForm.member_id && (() => {
                    const memberships = memberMemberships[createForm.member_id] || [];
                    const ptMembership = memberships.find((m: any) =>
                      m.name?.includes('PT') || m.name?.includes('피티')
                    );

                    if (ptMembership) {
                      const today = new Date();
                      const startDate = ptMembership.start_date ? new Date(ptMembership.start_date) : null;
                      const endDate = ptMembership.end_date ? new Date(ptMembership.end_date) : null;
                      const remainingDays = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
                      const nextSessionNumber = getSessionNumber(createForm.member_id, 'pt');

                      const memberPtSchedules = schedules.filter((s: any) =>
                        s.member_id === createForm.member_id && s.type?.toLowerCase() === 'pt'
                      );
                      const ptStats: PTStats = {
                        reserved: memberPtSchedules.filter((s: any) => s.status === 'reserved').length,
                        completed: memberPtSchedules.filter((s: any) => s.status === 'completed').length,
                        noShowDeducted: memberPtSchedules.filter((s: any) => s.status === 'no_show_deducted').length,
                        noShow: memberPtSchedules.filter((s: any) => s.status === 'no_show').length,
                        service: memberPtSchedules.filter((s: any) => s.status === 'service').length,
                        cancelled: memberPtSchedules.filter((s: any) => s.status === 'cancelled').length,
                      };

                      return (
                        <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-100 space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Activity className="w-5 h-5 text-white" />
                              </div>
                              <h4 className="font-black text-lg">PT 회원권 정보</h4>
                            </div>
                            <Badge className="bg-white/20 text-white border-none px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Active</Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white/10 rounded-2xl p-4 text-center">
                              <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Total</p>
                              <p className="text-xl font-black">{ptMembership.total_sessions}회</p>
                            </div>
                            <div className="bg-white/20 rounded-2xl p-4 text-center border border-white/20">
                              <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Session</p>
                              <p className="text-xl font-black">{nextSessionNumber}회차</p>
                            </div>
                            <div className={cn(
                              "rounded-2xl p-4 text-center",
                              remainingDays !== null && remainingDays <= 7 ? "bg-rose-500/30" : "bg-white/10"
                            )}>
                              <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Left</p>
                              <p className="text-xl font-black">{remainingDays ?? '-'}일</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 bg-white/10 p-4 rounded-2xl border border-white/10">
                            <Info className="w-4 h-4 text-blue-200 shrink-0 mt-0.5" />
                            <div className="text-[11px] font-bold text-blue-100 leading-relaxed">
                              예약 {ptStats.reserved} | 완료 {ptStats.completed} | 노쇼 {ptStats.noShowDeducted + ptStats.noShow} | 서비스 {ptStats.service} | 취소 {ptStats.cancelled}<br />
                              유효기간: {ptMembership.start_date || '-'} ~ {ptMembership.end_date || '-'}
                            </div>
                          </div>
                        </div>
                      );
                    } else if (createForm.type === "PT") {
                      return (
                        <div className="bg-rose-50 rounded-3xl p-6 border border-rose-100 flex items-start gap-4 animate-in shake-in-3">
                          <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
                          <div>
                            <p className="text-sm font-black text-rose-900">PT 회원권 미발견</p>
                            <p className="text-xs text-rose-600 font-bold mt-1">이 회원은 현재 유효한 PT 회원권이 없습니다. 회원권 등록 후 진행해주세요.</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* 일정 옵션 섹션 */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">2</div>
              <h3 className="text-lg font-black text-slate-900">상세 옵션 설정</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {!createForm.isPersonal && (
                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Type</Label>
                  <Select
                    value={createForm.type}
                    onValueChange={(value) => setCreateForm({ ...createForm, type: value })}
                  >
                    <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100 transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                      <SelectItem value="PT" className="rounded-xl font-bold py-3">PT (개인수업)</SelectItem>
                      <SelectItem value="OT" className="rounded-xl font-bold py-3">OT (오리엔테이션)</SelectItem>
                      <SelectItem value="Consulting" className="rounded-xl font-bold py-3">Consulting (상담)</SelectItem>
                      <SelectItem value="GX" className="rounded-xl font-bold py-3">GX (그룹수업)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Duration</Label>
                <Select
                  value={createForm.duration}
                  onValueChange={(value) => setCreateForm({ ...createForm, duration: value })}
                >
                  <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                    <SelectItem value="30" className="rounded-xl font-bold py-3">30분 (Short)</SelectItem>
                    <SelectItem value="60" className="rounded-xl font-bold py-3">60분 (Standard)</SelectItem>
                    <SelectItem value="90" className="rounded-xl font-bold py-3">90분 (Long)</SelectItem>
                    <SelectItem value="120" className="rounded-xl font-bold py-3">120분 (Expert)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-10 py-8 bg-white border-t flex items-center justify-end gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            className="h-14 px-8 rounded-2xl font-black text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"
          >
            취소
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isLoading}
            className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black gap-3 shadow-xl shadow-blue-100 hover:-translate-y-1 transition-all"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">생성 중...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                스케줄 등록하기
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
