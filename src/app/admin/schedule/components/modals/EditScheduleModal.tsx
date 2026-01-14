"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Trash2, X, Pencil, Calendar as CalendarIcon, Clock, User, Activity, AlertTriangle, Info, CheckCircle2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";

interface EditFormData {
  member_id: string;
  status: string;
  type: string;
  date: string;
  time: string;
  duration: string;
  personalTitle: string;
  sub_type: string;
  inbody_checked: boolean;
}

interface Member {
  id: string;
  name: string;
  trainer_id?: string;
  phone?: string;
}

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSchedule: any | null;
  editForm: EditFormData;
  setEditForm: (form: EditFormData) => void;
  filteredMembers: Member[];
  memberMemberships: Record<string, any[]>;
  schedules: any[];
  selectedStaffId: string;
  getSessionNumber: (memberId: string, type: 'pt' | 'ot', scheduleId?: string) => number;
  isLoading: boolean;
  onUpdate: () => void;
  onDelete: () => void;
  isLocked?: boolean;
}

export function EditScheduleModal({
  isOpen,
  onClose,
  selectedSchedule,
  editForm,
  setEditForm,
  filteredMembers,
  memberMemberships,
  schedules,
  selectedStaffId,
  getSessionNumber,
  isLoading,
  onUpdate,
  onDelete,
  isLocked = false,
}: EditScheduleModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const isPersonalSchedule = selectedSchedule?.type?.toLowerCase() === 'personal' || selectedSchedule?.type === '개인';

  // 검색어에 따른 회원 필터링
  const searchedMembers = useMemo(() => {
    if (!searchTerm.trim()) return filteredMembers;
    const lowerSearch = searchTerm.toLowerCase();
    return filteredMembers.filter(m => 
      m.name.toLowerCase().includes(lowerSearch) || 
      (m.phone && m.phone.includes(lowerSearch))
    );
  }, [filteredMembers, searchTerm]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setSearchTerm("");
        onClose();
      }
    }}>
      <DialogContent className="w-[calc(100%-1rem)] xs:w-[calc(100%-1.5rem)] sm:w-full max-w-2xl bg-[#f8fafc] max-h-[85vh] xs:max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-2xl xs:rounded-3xl sm:rounded-[40px] [&>button]:hidden">
        <DialogHeader className="px-4 xs:px-6 sm:px-10 py-4 xs:py-6 sm:py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 xs:w-48 sm:w-64 h-32 xs:h-48 sm:h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 xs:-mr-24 sm:-mr-32 -mt-16 xs:-mt-24 sm:-mt-32"></div>
          <DialogTitle className="flex items-center gap-3 xs:gap-4 sm:gap-5 relative z-10">
            <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 rounded-xl xs:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Pencil className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h2 className="text-base xs:text-lg sm:text-2xl font-black text-white tracking-tight">
                {isPersonalSchedule ? '개인 일정 수정' : '스케줄 정보 수정'}
              </h2>
              <div className="hidden xs:flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <p className="text-xs xs:text-sm text-white/80 font-bold">선택하신 코치님의 회원만 필터링됩니다</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">스케줄 정보를 수정합니다</DialogDescription>
          <button
            onClick={onClose}
            className="absolute top-4 xs:top-6 sm:top-8 right-4 xs:right-6 sm:right-10 w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl xs:rounded-2xl transition-all group z-10"
          >
            <X className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-3 xs:p-4 sm:p-6 lg:p-10 space-y-4 xs:space-y-6 sm:space-y-8 bg-[#f8fafc] custom-scrollbar">
          {isLocked && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-xs font-bold text-amber-700 leading-relaxed">
                해당 월의 스케줄이 관리자에게 제출되었습니다.<br />
                승인 전까지는 내용을 수정하거나 삭제할 수 없습니다.
              </p>
            </div>
          )}
          
          {/* 기본 정보 섹션 */}
          <div className="bg-white rounded-xl xs:rounded-2xl sm:rounded-[32px] p-3 xs:p-4 sm:p-6 lg:p-8 border border-slate-100 shadow-sm space-y-4 xs:space-y-6 sm:space-y-8">
            <div className="flex items-center gap-2 xs:gap-3 mb-2">
              <div className="w-6 h-6 xs:w-8 xs:h-8 rounded-lg xs:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] xs:text-xs font-black">1</div>
              <h3 className="text-sm xs:text-base sm:text-lg font-black text-slate-900">핵심 일정 정보</h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {(isPersonalSchedule || editForm.type === 'Personal') ? (
                <div className="space-y-2">
                  <Label htmlFor="edit_personal_title" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Title *</Label>
                  <Input
                    id="edit_personal_title"
                    value={editForm.personalTitle}
                    onChange={(e) => setEditForm({ ...editForm, personalTitle: e.target.value })}
                    placeholder="일정 제목을 입력하세요"
                    className="h-14 bg-slate-50 border-none rounded-2xl font-bold text-lg focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Member * (검색 가능)</Label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search className="w-5 h-5" />
                      </div>
                      <Select
                        value={editForm.member_id}
                        onValueChange={(value) => {
                          setEditForm({ ...editForm, member_id: value });
                          setSearchTerm("");
                        }}
                      >
                        <SelectTrigger className="h-14 pl-14 pr-6 bg-slate-50 border-none rounded-2xl font-bold text-lg focus:ring-2 focus:ring-blue-100 transition-all">
                          <SelectValue placeholder="회원을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2 max-h-[300px]">
                          <div className="p-2 sticky top-0 bg-white z-10">
                            <Input
                              placeholder="회원 이름 또는 전화번호 검색..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="h-10 rounded-xl border-slate-100 focus-visible:ring-blue-500 mb-2"
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                          {searchedMembers.length === 0 ? (
                            <div className="py-10 text-center text-slate-400 font-bold">
                              {selectedStaffId !== "all" ? "담당 회원 중 검색 결과가 없습니다" : "검색 결과가 없습니다"}
                            </div>
                          ) : (
                            searchedMembers.map((member) => (
                              <SelectItem key={member.id} value={member.id} className="rounded-xl font-bold py-3">
                                <div className="flex flex-col">
                                  <span>{member.name}</span>
                                  {member.phone && <span className="text-[10px] text-slate-400 font-normal">{member.phone}</span>}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {editForm.member_id && editForm.type === "PT" && (() => {
                    const memberships = memberMemberships[editForm.member_id] || [];
                    const ptMembership = memberships.find((m: any) =>
                      m.name?.includes('PT') || m.name?.includes('피티')
                    );

                    if (ptMembership) {
                      const today = new Date();
                      const startDate = ptMembership.start_date ? new Date(ptMembership.start_date) : null;
                      const endDate = ptMembership.end_date ? new Date(ptMembership.end_date) : null;
                      const remainingDays = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
                      const currentSessionNumber = getSessionNumber(editForm.member_id, 'pt', selectedSchedule?.id);

                      const scheduleStatus = selectedSchedule?.status;
                      const isSpecialStatus = ['cancelled', 'no_show', 'service'].includes(scheduleStatus);
                      const statusLabel = scheduleStatus === 'cancelled' ? '취소' :
                                          scheduleStatus === 'no_show' ? '노쇼' :
                                          scheduleStatus === 'service' ? '서비스' : null;
                      
                      const memberPtSchedules = schedules.filter((s: any) =>
                        s.member_id === editForm.member_id && s.type?.toLowerCase() === 'pt'
                      );
                      const ptStats = {
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
                              <p className="text-xl font-black">
                                {isSpecialStatus ? statusLabel : `${currentSessionNumber}회차`}
                              </p>
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
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">2</div>
              <h3 className="text-lg font-black text-slate-900">시간 및 상태 설정</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Date</Label>
                <div className="relative group">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500" />
                  <Input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Time</Label>
                <div className="relative group">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500" />
                  <Input
                    type="time"
                    value={editForm.time}
                    onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                    className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Duration</Label>
                <Select
                  value={editForm.duration}
                  onValueChange={(value) => setEditForm({ ...editForm, duration: value })}
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

              {!isPersonalSchedule && (
                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Type</Label>
                  <Select
                    value={editForm.type}
                    onValueChange={(value) => setEditForm({ ...editForm, type: value })}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-50">
              {(isPersonalSchedule || editForm.type === 'Personal') && (
                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Category</Label>
                  <Select
                    value={editForm.sub_type}
                    onValueChange={(value) => setEditForm({ ...editForm, sub_type: value })}
                  >
                    <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100">
                      <SelectValue placeholder="분류 선택" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                      <SelectItem value="meal" className="rounded-xl font-bold py-2">식사</SelectItem>
                      <SelectItem value="conference" className="rounded-xl font-bold py-2">회의</SelectItem>
                      <SelectItem value="meeting" className="rounded-xl font-bold py-2">미팅</SelectItem>
                      <SelectItem value="rest" className="rounded-xl font-bold py-2">휴식</SelectItem>
                      <SelectItem value="workout" className="rounded-xl font-bold py-2">운동</SelectItem>
                      <SelectItem value="other" className="rounded-xl font-bold py-2">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(editForm.type === 'PT' || editForm.type === 'OT') && (
                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Status</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                  >
                    <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                      {editForm.type === 'PT' ? (
                        <>
                          <SelectItem value="reserved" className="rounded-xl font-bold py-2">예약완료</SelectItem>
                          <SelectItem value="completed" className="rounded-xl font-bold py-2 text-emerald-600">수업완료</SelectItem>
                          <SelectItem value="no_show_deducted" className="rounded-xl font-bold py-2 text-rose-600">노쇼 (차감)</SelectItem>
                          <SelectItem value="no_show" className="rounded-xl font-bold py-2 text-slate-400">노쇼</SelectItem>
                          <SelectItem value="service" className="rounded-xl font-bold py-2 text-indigo-600">서비스</SelectItem>
                          <SelectItem value="cancelled" className="rounded-xl font-bold py-2 text-slate-300">취소</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="completed" className="rounded-xl font-bold py-2 text-emerald-600">수업완료</SelectItem>
                          <SelectItem value="no_show" className="rounded-xl font-bold py-2 text-slate-400">노쇼</SelectItem>
                          <SelectItem value="cancelled" className="rounded-xl font-bold py-2 text-slate-300">취소</SelectItem>
                          <SelectItem value="converted" className="rounded-xl font-bold py-2 text-blue-600">PT전환</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {editForm.type === 'OT' && (
                <div className="flex items-center space-x-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <input
                    type="checkbox"
                    id="inbody_checked"
                    checked={editForm.inbody_checked}
                    onChange={(e) => setEditForm({ ...editForm, inbody_checked: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="inbody_checked" className="font-bold text-slate-700 cursor-pointer">인바디 측정 포함</Label>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-3 xs:px-4 sm:px-6 lg:px-10 py-3 xs:py-4 sm:py-6 lg:py-8 bg-white border-t flex flex-col xs:flex-row items-center justify-between flex-shrink-0 gap-2 xs:gap-3">
          <Button
            variant="ghost"
            onClick={onDelete}
            disabled={isLoading || isLocked}
            className="h-10 xs:h-12 sm:h-14 px-3 xs:px-4 sm:px-6 rounded-xl xs:rounded-2xl font-black text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all gap-1 xs:gap-2 text-xs xs:text-sm w-full xs:w-auto order-2 xs:order-1 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 xs:w-5 xs:h-5" />
            삭제하기
          </Button>

          <div className="flex gap-2 xs:gap-3 w-full xs:w-auto order-1 xs:order-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-10 xs:h-12 sm:h-14 px-4 xs:px-6 sm:px-8 rounded-xl xs:rounded-2xl font-black text-slate-600 border-slate-200 hover:bg-slate-50 transition-all text-xs xs:text-sm flex-1 xs:flex-none"
            >
              취소
            </Button>
            <Button
              onClick={onUpdate}
              disabled={isLoading || isLocked}
              className="h-10 xs:h-12 sm:h-14 px-4 xs:px-6 sm:px-10 rounded-xl xs:rounded-2xl bg-blue-600 hover:bg-blue-700 font-black gap-1 xs:gap-2 sm:gap-3 shadow-xl shadow-blue-100 hover:-translate-y-1 transition-all text-xs xs:text-sm flex-1 xs:flex-none disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-1 xs:gap-2">수정 중...</span>
              ) : isLocked ? (
                <span className="flex items-center gap-1 xs:gap-2">제출됨 (수정불가)</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 xs:w-5 xs:h-5" />
                  <span className="hidden xs:inline">수정 내용 </span>저장
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
