"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SelectedEvent } from "../../hooks/useStaffPageData";
import { Activity, X, CheckCircle2, AlertCircle, Clock, Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusChangeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEvent: SelectedEvent | null;
  // Option 1: Callback-based props (from page.tsx)
  isMonthApproved?: boolean;
  onStatusChange?: (newStatus: string) => Promise<void>;
  onSubTypeChange?: (newSubType: string) => Promise<void>;
  onOpenEditModal?: () => void;
  onDelete?: () => Promise<void>;
  // Option 2: State-based props (legacy)
  editStatus?: string;
  setEditStatus?: (status: string) => void;
  onSubmit?: () => void;
}

export function StatusChangeModal({
  isOpen, onOpenChange, selectedEvent,
  isMonthApproved: _isMonthApproved = false,
  onStatusChange,
  onSubTypeChange: _onSubTypeChange,
  onOpenEditModal: _onOpenEditModal,
  onDelete: _onDelete,
  editStatus: propEditStatus,
  setEditStatus: propSetEditStatus,
  onSubmit
}: StatusChangeModalProps) {
  // Use local state if callback-based props are provided
  const editStatus = propEditStatus ?? selectedEvent?.status ?? 'scheduled';
  const setEditStatus = propSetEditStatus ?? (() => {});

  const handleStatusSelect = async (status: string) => {
    if (onStatusChange) {
      await onStatusChange(status);
    } else {
      setEditStatus(status);
    }
  };
  const isPersonal = selectedEvent?.type?.toLowerCase() === 'personal';
  const _isConsulting = selectedEvent?.type?.toLowerCase() === 'consulting';

  const statusOptions = [
    { value: 'scheduled', label: '예정됨', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', desc: '앞으로 진행될 일정입니다.' },
    { value: 'completed', label: '완료됨', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', desc: '일정이 성공적으로 완료되었습니다.' },
    { value: 'canceled', label: '취소됨', icon: X, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', desc: '부득이한 사정으로 취소된 일정입니다.' },
    { value: 'no-show', label: '노쇼', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', desc: '사전 연락 없이 불참한 일정입니다.' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-2xl xs:rounded-3xl sm:rounded-[40px]">
        <DialogHeader className="px-8 py-6 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <DialogTitle className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">상태 변경</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Change Status</p>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">일정의 상태를 변경합니다</DialogDescription>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-6 right-8 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all group z-10"
          >
            <X className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f8fafc]">
          {/* 일정 간략 정보 */}
          <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-6 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-xl">
              {isPersonal ? '📅' : '👤'}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Current Schedule</p>
              <h4 className="text-base font-black text-slate-900 truncate max-w-[200px]">
                {selectedEvent?.title}
              </h4>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-black text-slate-700">새로운 상태 선택</h3>
            </div>

            <RadioGroup
              value={editStatus}
              onValueChange={handleStatusSelect}
              className="grid gap-3"
            >
              {statusOptions.map((option) => (
                <Label
                  key={option.value}
                  htmlFor={option.value}
                  className={cn(
                    "relative flex items-center p-4 rounded-3xl border-2 transition-all cursor-pointer group overflow-hidden",
                    editStatus === option.value
                      ? cn(option.bg, option.border, "shadow-sm")
                      : "bg-white border-transparent hover:border-slate-100 shadow-sm"
                  )}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mr-4 transition-all",
                    editStatus === option.value ? "bg-white shadow-sm" : "bg-slate-50"
                  )}>
                    <option.icon className={cn("w-5 h-5 transition-colors", 
                      editStatus === option.value ? option.color : "text-slate-400"
                    )} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn(
                        "text-sm font-black transition-colors",
                        editStatus === option.value ? "text-slate-900" : "text-slate-600"
                      )}>
                        {option.label}
                      </span>
                      {editStatus === option.value && (
                        <CheckCircle2 className={cn("w-4 h-4", option.color)} />
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-slate-400">
                      {option.desc}
                    </p>
                  </div>

                  {editStatus === option.value && (
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1", 
                      option.value === 'scheduled' ? 'bg-blue-500' :
                      option.value === 'completed' ? 'bg-emerald-500' :
                      option.value === 'canceled' ? 'bg-rose-500' : 'bg-amber-500'
                    )}></div>
                  )}
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-amber-600 leading-relaxed">
              상태를 '완료됨'으로 변경하면 해당 회원의 잔여 횟수가 1회 차감됩니다. 신중하게 선택해주세요.
            </p>
          </div>
        </div>

        <DialogFooter className="px-8 py-6 bg-white border-t flex items-center justify-end flex-shrink-0">
          <Button
            onClick={onSubmit}
            className="h-14 px-12 rounded-2xl bg-slate-900 hover:bg-black font-black text-white shadow-xl shadow-slate-100 hover:-translate-y-1 transition-all"
          >
            변경사항 적용하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
