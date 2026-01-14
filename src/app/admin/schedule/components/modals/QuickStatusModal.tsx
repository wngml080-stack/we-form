"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { showSuccess } from "@/lib/utils/error-handler";
import { createSupabaseClient } from "@/lib/supabase/client";
import { X, CheckCircle2, Clock, Calendar as CalendarIcon, User, Pencil, Trash2, Activity, Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface QuickStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSchedule: any | null;
  setSelectedSchedule: (schedule: any | null) => void;
  selectedGymId: string | null;
  selectedStaffId: string;
  onStatusChange: (newStatus: string) => void;
  onSubTypeChange: (newSubType: string) => void;
  onOpenEditModal: () => void;
  onDelete: () => void;
  fetchSchedules: (gymId: string, staffId: string) => void;
  isLocked?: boolean;
}

export function QuickStatusModal({
  isOpen,
  onClose,
  selectedSchedule,
  setSelectedSchedule,
  selectedGymId,
  selectedStaffId,
  onStatusChange,
  onSubTypeChange,
  onOpenEditModal,
  onDelete,
  fetchSchedules,
  isLocked = false,
}: QuickStatusModalProps) {
  const supabase = createSupabaseClient();

  const handleInbodyToggle = async () => {
    if (!selectedSchedule) return;

    const newValue = !selectedSchedule.inbody_checked;
    const { error } = await supabase
      .from("schedules")
      .update({ inbody_checked: newValue })
      .eq("id", selectedSchedule.id);

    if (!error) {
      setSelectedSchedule({ ...selectedSchedule, inbody_checked: newValue });
      showSuccess(newValue ? "인바디 측정 완료!" : "인바디 체크 해제됨");
      if (selectedGymId) fetchSchedules(selectedGymId, selectedStaffId);
    }
  };

  if (!selectedSchedule) return null;

  const scheduleType = (selectedSchedule.type || '').toLowerCase();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-1.5rem)] xs:w-[calc(100%-2rem)] sm:max-w-md bg-[#f8fafc] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px] gap-0">
        <DialogHeader className="px-8 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">상태 퀵 변경</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Quick Action Panel</p>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">스케줄 상태를 변경합니다</DialogDescription>
          <button
            onClick={onClose}
            className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10 active:scale-90"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="p-8 space-y-10 bg-[#f8fafc] max-h-[70vh] overflow-y-auto custom-scrollbar">
          {isLocked && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-xs font-bold text-amber-700 leading-relaxed">
                해당 월의 스케줄이 관리자에게 제출되었습니다.<br />
                승인 전까지는 내용을 수정하거나 상태를 변경할 수 없습니다.
              </p>
            </div>
          )}

          {/* 스케줄 간략 정보 */}
          <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200/50 border border-white relative overflow-hidden group/info">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover/info:scale-110 transition-transform duration-700"></div>
            
            <div className="flex items-start gap-5 relative z-10">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <User className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h4 className="text-xl font-black text-slate-900 leading-none truncate tracking-tightest">
                  {selectedSchedule.member_name || selectedSchedule.title || '일정'}
                </h4>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span className="text-xs font-black uppercase tracking-widest">
                      {new Date(selectedSchedule.start_time).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-black">
                      {new Date(selectedSchedule.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {scheduleType !== 'personal' && selectedSchedule.type !== '개인' && (
              <div className="mt-6 flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 relative z-10">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Current Status</span>
                <span className={cn(
                  "px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-sm",
                  selectedSchedule.status === 'completed' ? 'bg-emerald-500 text-white shadow-emerald-100' :
                  selectedSchedule.status === 'no_show_deducted' ? 'bg-rose-50 text-white shadow-rose-100' :
                  selectedSchedule.status === 'no_show' ? 'bg-slate-500 text-white shadow-slate-100' :
                  selectedSchedule.status === 'service' ? 'bg-blue-500 text-white shadow-blue-100' :
                  selectedSchedule.status === 'cancelled' ? 'bg-slate-200 text-slate-500 shadow-none' :
                  'bg-indigo-600 text-white shadow-indigo-100'
                )}>
                  {selectedSchedule.status === 'completed' ? '출석완료' :
                   selectedSchedule.status === 'no_show_deducted' ? '노쇼(차감)' :
                   selectedSchedule.status === 'no_show' ? '노쇼' :
                   selectedSchedule.status === 'service' ? '서비스' :
                   selectedSchedule.status === 'cancelled' ? '취소됨' :
                   '예약됨'}
                </span>
              </div>
            )}
          </div>

          {/* 타입별 액션 버튼 */}
          <div className="space-y-6">
            {(() => {
              if (scheduleType === 'pt') {
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 ml-1">
                      <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Change PT Status</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: 'reserved', label: '예약완료', color: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' },
                        { id: 'completed', label: '수업완료', color: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100' },
                        { id: 'no_show_deducted', label: '노쇼 (차감)', color: 'bg-rose-500 hover:bg-rose-600 shadow-rose-100' },
                        { id: 'no_show', label: '노쇼', color: 'bg-slate-500 hover:bg-slate-600 shadow-slate-100' },
                        { id: 'service', label: '서비스', color: 'bg-blue-500 hover:bg-blue-600 shadow-blue-100' },
                        { id: 'cancelled', label: '취소', color: 'bg-slate-300 hover:bg-slate-400' },
                      ].map((btn) => (
                        <Button
                          key={btn.id}
                          onClick={() => onStatusChange(btn.id)}
                          disabled={isLocked || selectedSchedule.status === btn.id}
                          className={cn(
                            "h-16 rounded-[22px] font-black transition-all text-base border-2 active:scale-95 disabled:opacity-50",
                            selectedSchedule.status === btn.id
                              ? `${btn.color} text-white shadow-xl border-transparent opacity-100`
                              : "bg-white text-slate-500 border-white shadow-sm hover:border-blue-100 hover:bg-blue-50/30 hover:text-blue-600"
                          )}
                        >
                          {btn.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              }

              if (scheduleType === 'ot') {
                return (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 ml-1">
                      <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Change OT Status</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: 'completed', label: '수업완료', color: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100' },
                        { id: 'no_show', label: '노쇼', color: 'bg-slate-500 hover:bg-slate-600 shadow-slate-100' },
                        { id: 'cancelled', label: '취소', color: 'bg-slate-300 hover:bg-slate-400' },
                        { id: 'converted', label: 'PT전환', color: 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' },
                      ].map((btn) => (
                        <Button
                          key={btn.id}
                          onClick={() => onStatusChange(btn.id)}
                          disabled={isLocked || selectedSchedule.status === btn.id}
                          className={cn(
                            "h-16 rounded-[22px] font-black transition-all text-base border-2 active:scale-95 disabled:opacity-50",
                            selectedSchedule.status === btn.id
                              ? `${btn.color} text-white shadow-xl border-transparent opacity-100`
                              : "bg-white text-slate-500 border-white shadow-sm hover:border-teal-100 hover:bg-teal-50/30 hover:text-teal-600"
                          )}
                        >
                          {btn.label}
                        </Button>
                      ))}
                    </div>
                    
                    <button
                      onClick={handleInbodyToggle}
                      disabled={isLocked}
                      className={cn(
                        "w-full h-16 flex items-center justify-center gap-4 rounded-[22px] border-2 transition-all font-black text-base active:scale-95 group/inbody disabled:opacity-50",
                        selectedSchedule.inbody_checked
                          ? 'bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-200'
                          : 'bg-white border-white text-slate-400 shadow-sm hover:border-purple-200 hover:text-purple-600'
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                        selectedSchedule.inbody_checked ? "bg-purple-500 text-white" : "bg-slate-50 text-slate-300 group-hover/inbody:bg-purple-50 group-hover/inbody:text-purple-500"
                      )}>
                        <Activity className="w-5 h-5" />
                      </div>
                      인바디 측정 완료
                      {selectedSchedule.inbody_checked && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    </button>
                  </div>
                );
              }

              if (scheduleType === 'consulting' || scheduleType === '상담') {
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 ml-1">
                      <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Consulting Category</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: 'sales', label: '세일즈', color: 'bg-orange-500 hover:bg-orange-600 shadow-orange-100' },
                        { id: 'info', label: '안내상담', color: 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' },
                        { id: 'status', label: '현황상담', color: 'bg-purple-600 hover:bg-purple-700 shadow-purple-100' },
                        { id: 'other', label: '기타', color: 'bg-slate-500 hover:bg-slate-600 shadow-slate-100' },
                      ].map((btn) => (
                        <Button
                          key={btn.id}
                          onClick={() => onSubTypeChange(btn.id)}
                          disabled={isLocked || selectedSchedule.sub_type === btn.id}
                          className={cn(
                            "h-16 rounded-[22px] font-black transition-all text-base border-2 active:scale-95 disabled:opacity-50",
                            selectedSchedule.sub_type === btn.id
                              ? `${btn.color} text-white shadow-xl border-transparent`
                              : "bg-white text-slate-500 border-white shadow-sm hover:border-orange-100 hover:bg-orange-50/30 hover:text-orange-600"
                          )}
                        >
                          {btn.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              }

              if (scheduleType === '개인' || scheduleType === 'personal') {
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 ml-1">
                      <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Personal Category</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'meal', label: '식사', color: 'bg-amber-500 shadow-amber-100' },
                        { id: 'conference', label: '회의', color: 'bg-indigo-600 shadow-indigo-100' },
                        { id: 'meeting', label: '미팅', color: 'bg-blue-600 shadow-blue-100' },
                        { id: 'rest', label: '휴식', color: 'bg-purple-600 shadow-purple-100' },
                        { id: 'workout', label: '운동', color: 'bg-rose-500 shadow-rose-100' },
                        { id: 'other', label: '기타', color: 'bg-slate-500 shadow-slate-100' },
                      ].map((btn) => (
                        <Button
                          key={btn.id}
                          onClick={() => onSubTypeChange(btn.id)}
                          disabled={isLocked || selectedSchedule.sub_type === btn.id}
                          className={cn(
                            "h-14 rounded-[18px] text-xs font-black transition-all border-2 active:scale-95 disabled:opacity-50",
                            selectedSchedule.sub_type === btn.id
                              ? `${btn.color} text-white shadow-lg border-transparent`
                              : "bg-white text-slate-500 border-white shadow-sm hover:border-indigo-100 hover:bg-indigo-50/30 hover:text-indigo-600"
                          )}
                        >
                          {btn.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 ml-1">
                    <div className="w-1.5 h-4 bg-slate-400 rounded-full"></div>
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Change Status</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => onStatusChange('completed')}
                      disabled={isLocked || selectedSchedule.status === 'completed'}
                      className={cn(
                        "h-16 rounded-[22px] font-black transition-all text-base border-2 active:scale-95 disabled:opacity-50",
                        selectedSchedule.status === 'completed' 
                          ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-100 border-transparent' 
                          : 'bg-white text-slate-500 border-white shadow-sm hover:border-emerald-100 hover:bg-emerald-50/30 hover:text-emerald-600'
                      )}
                    >
                      완료
                    </Button>
                    <Button
                      onClick={() => onStatusChange('cancelled')}
                      disabled={isLocked || selectedSchedule.status === 'cancelled'}
                      className={cn(
                        "h-16 rounded-[22px] font-black transition-all text-base border-2 active:scale-95 disabled:opacity-50",
                        selectedSchedule.status === 'cancelled' 
                          ? 'bg-slate-300 text-white shadow-lg border-transparent' 
                          : 'bg-white text-slate-500 border-white shadow-sm hover:border-slate-200 hover:bg-slate-50'
                      )}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* 하단 제어 영역 */}
        <div className="p-8 bg-white border-t border-slate-50 flex flex-col gap-3 flex-shrink-0">
          <Button
            variant="ghost"
            className="h-14 w-full rounded-[22px] font-black text-blue-600 hover:bg-blue-50 transition-all gap-3 text-base active:scale-95 disabled:opacity-50"
            onClick={onOpenEditModal}
            disabled={isLocked}
          >
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-blue-600" />
            </div>
            상세 수정 <span className="text-xs font-bold opacity-60">(시간/회원 변경)</span>
          </Button>
          <Button
            variant="ghost"
            className="h-14 w-full rounded-[22px] font-black text-rose-500 hover:bg-rose-50 transition-all gap-3 text-base active:scale-95 disabled:opacity-50"
            onClick={() => {
              if (confirm('이 스케줄을 삭제하시겠습니까?')) {
                onDelete();
                onClose();
              }
            }}
            disabled={isLocked}
          >
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-rose-600" />
            </div>
            스케줄 삭제
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
