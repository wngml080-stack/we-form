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
import { X, CheckCircle2, AlertCircle, Clock, Calendar as CalendarIcon, User, Pencil, Trash2, Activity, Info, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <DialogContent className="max-w-md bg-[#f8fafc] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px]">
        <DialogHeader className="px-8 py-6 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
          <DialogTitle className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">상태 퀵 변경</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Quick Action Panel</p>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">스케줄 상태를 변경합니다</DialogDescription>
          <button
            onClick={onClose}
            className="absolute top-6 right-8 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all group z-10"
          >
            <X className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="p-8 space-y-8 bg-[#f8fafc]">
          {/* 스케줄 간략 정보 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-black text-slate-900 leading-tight">
                  {selectedSchedule.member_name || selectedSchedule.title || '일정'}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    {new Date(selectedSchedule.start_time).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}
                  </span>
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(selectedSchedule.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                </div>
              </div>
            </div>

            {scheduleType !== 'personal' && selectedSchedule.type !== '개인' && (
              <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Current Status:</span>
                <span className={cn(
                  "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                  selectedSchedule.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                  selectedSchedule.status === 'no_show_deducted' ? 'bg-rose-50 text-rose-600' :
                  selectedSchedule.status === 'no_show' ? 'bg-slate-100 text-slate-500' :
                  selectedSchedule.status === 'service' ? 'bg-blue-50 text-blue-600' :
                  selectedSchedule.status === 'cancelled' ? 'bg-slate-100 text-slate-300' :
                  'bg-amber-50 text-amber-600'
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
          <div className="space-y-4">
            {(() => {
              if (scheduleType === 'pt') {
                return (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Change PT Status</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'reserved', label: '예약완료', color: 'bg-indigo-600' },
                        { id: 'completed', label: '수업완료', color: 'bg-emerald-500' },
                        { id: 'no_show_deducted', label: '노쇼(차감)', color: 'bg-rose-500' },
                        { id: 'no_show', label: '노쇼', color: 'bg-slate-500' },
                        { id: 'service', label: '서비스', color: 'bg-blue-500' },
                        { id: 'cancelled', label: '취소', color: 'bg-slate-300' },
                      ].map((btn) => (
                        <Button
                          key={btn.id}
                          onClick={() => onStatusChange(btn.id)}
                          disabled={selectedSchedule.status === btn.id}
                          className={cn(
                            "h-14 rounded-2xl font-black transition-all",
                            selectedSchedule.status === btn.id
                              ? `${btn.color} text-white shadow-lg`
                              : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50 hover:border-slate-200"
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
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Change OT Status</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'completed', label: '수업완료', color: 'bg-emerald-500' },
                        { id: 'no_show', label: '노쇼', color: 'bg-slate-500' },
                        { id: 'cancelled', label: '취소', color: 'bg-slate-300' },
                        { id: 'converted', label: 'PT전환', color: 'bg-blue-600' },
                      ].map((btn) => (
                        <Button
                          key={btn.id}
                          onClick={() => onStatusChange(btn.id)}
                          disabled={selectedSchedule.status === btn.id}
                          className={cn(
                            "h-14 rounded-2xl font-black transition-all",
                            selectedSchedule.status === btn.id
                              ? `${btn.color} text-white shadow-lg`
                              : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                          )}
                        >
                          {btn.label}
                        </Button>
                      ))}
                    </div>
                    <button
                      onClick={handleInbodyToggle}
                      className={cn(
                        "w-full h-14 flex items-center justify-center gap-3 rounded-2xl border-2 transition-all font-black",
                        selectedSchedule.inbody_checked
                          ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-100'
                          : 'bg-white border-slate-100 text-slate-400 hover:border-purple-200 hover:text-purple-600'
                      )}
                    >
                      <CheckCircle2 className={cn("w-5 h-5", selectedSchedule.inbody_checked ? "text-white" : "text-slate-200")} />
                      인바디 측정 완료
                    </button>
                  </div>
                );
              }

              if (scheduleType === 'consulting' || scheduleType === '상담') {
                return (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Consulting Category</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'sales', label: '세일즈', color: 'bg-orange-500' },
                        { id: 'info', label: '안내상담', color: 'bg-blue-600' },
                        { id: 'status', label: '현황상담', color: 'bg-purple-600' },
                        { id: 'other', label: '기타', color: 'bg-slate-500' },
                      ].map((btn) => (
                        <Button
                          key={btn.id}
                          onClick={() => onSubTypeChange(btn.id)}
                          className={cn(
                            "h-14 rounded-2xl font-black transition-all",
                            selectedSchedule.sub_type === btn.id
                              ? `${btn.color} text-white shadow-lg`
                              : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50 hover:border-slate-200"
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
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Personal Category</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'meal', label: '식사', color: 'bg-amber-500' },
                        { id: 'conference', label: '회의', color: 'bg-indigo-600' },
                        { id: 'meeting', label: '미팅', color: 'bg-blue-600' },
                        { id: 'rest', label: '휴식', color: 'bg-purple-600' },
                        { id: 'workout', label: '운동', color: 'bg-rose-500' },
                        { id: 'other', label: '기타', color: 'bg-slate-500' },
                      ].map((btn) => (
                        <Button
                          key={btn.id}
                          onClick={() => onSubTypeChange(btn.id)}
                          className={cn(
                            "h-12 rounded-xl text-xs font-black transition-all",
                            selectedSchedule.sub_type === btn.id
                              ? `${btn.color} text-white shadow-lg`
                              : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50 hover:border-slate-200"
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
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Change Status</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => onStatusChange('completed')}
                      disabled={selectedSchedule.status === 'completed'}
                      className={cn(
                        "h-14 rounded-2xl font-black transition-all",
                        selectedSchedule.status === 'completed' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-100'
                      )}
                    >
                      완료
                    </Button>
                    <Button
                      onClick={() => onStatusChange('cancelled')}
                      disabled={selectedSchedule.status === 'cancelled'}
                      className={cn(
                        "h-14 rounded-2xl font-black transition-all",
                        selectedSchedule.status === 'cancelled' ? 'bg-slate-300 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-100'
                      )}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 하단 제어 영역 */}
          <div className="flex flex-col gap-3 pt-6 border-t border-slate-50">
            <Button
              variant="ghost"
              className="h-12 w-full rounded-2xl font-black text-blue-600 hover:bg-blue-50 transition-all gap-2"
              onClick={onOpenEditModal}
            >
              <Pencil className="w-4 h-4" />
              상세 수정 (시간/회원 변경)
            </Button>
            <Button
              variant="ghost"
              className="h-12 w-full rounded-2xl font-black text-rose-500 hover:bg-rose-50 transition-all gap-2"
              onClick={() => {
                if (confirm('이 스케줄을 삭제하시겠습니까?')) {
                  onDelete();
                  onClose();
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
              스케줄 삭제
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
