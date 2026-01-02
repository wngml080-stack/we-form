"use client";

import { Button } from "@/components/ui/button";
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
import { X, Calendar as CalendarIcon, Info, Save, Clock, ArrowRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface MembershipEditFormData {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  total_sessions: string;
  used_sessions: string;
}

interface MembershipEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  formData: MembershipEditFormData;
  setFormData: (data: MembershipEditFormData) => void;
  isLoading: boolean;
  onSubmit: () => void;
}

export function MembershipEditModal({
  isOpen,
  onClose,
  memberName,
  formData,
  setFormData,
  isLoading,
  onSubmit,
}: MembershipEditModalProps) {
  const remainingSessions = (parseInt(formData.total_sessions) || 0) - (parseInt(formData.used_sessions) || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px]">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">회원권 정보 수정</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
                <p className="text-sm text-slate-400 font-bold">{memberName}님의 회원권 세부 정보 변경</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">이용 기간 및 잔여 횟수를 수정합니다</DialogDescription>
          <button
            onClick={onClose}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-[#f8fafc]">
          {/* 상품 정보 요약 카드 */}
          <div className="bg-orange-600 rounded-[32px] p-8 text-white shadow-xl shadow-orange-100 flex items-center justify-between overflow-hidden relative">
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4">
              <Activity className="w-48 h-48" />
            </div>
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-xl font-black">{formData.name}</h4>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] font-black text-orange-200 uppercase tracking-widest mb-1">Total Limit</p>
                  <p className="text-lg font-black">{formData.total_sessions}회</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <p className="text-[10px] font-black text-orange-200 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-lg font-black">{remainingSessions}회 잔여</p>
                </div>
              </div>
            </div>
            <div className="text-right relative z-10">
              <span className="px-4 py-2 bg-white/20 rounded-2xl text-xs font-black uppercase tracking-widest">Selected Item</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 기간 설정 섹션 */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-xs font-black">1</div>
                <h3 className="text-lg font-black text-slate-900">이용 기간 수정</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</Label>
                  <div className="relative group">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</Label>
                  <div className="relative group">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-rose-100 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 횟수 설정 섹션 */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">2</div>
                <h3 className="text-lg font-black text-slate-900">수업 횟수 수정</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Sessions</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={formData.total_sessions}
                      onChange={(e) => setFormData({ ...formData, total_sessions: e.target.value })}
                      className="h-12 bg-slate-50 border-none rounded-2xl font-black text-xl pr-12 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">TOT</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Used Sessions</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={formData.used_sessions}
                      onChange={(e) => setFormData({ ...formData, used_sessions: e.target.value })}
                      className="h-12 bg-slate-50 border-none rounded-2xl font-black text-xl pr-12 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">USED</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Current Balance</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xl font-black",
                      remainingSessions > 0 ? "text-blue-600" : "text-rose-600"
                    )}>
                      {remainingSessions}
                    </span>
                    <span className="text-xs font-black text-slate-400 uppercase">Sessions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-10 py-8 bg-white border-t flex items-center justify-end gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-14 px-8 rounded-2xl font-black text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"
          >
            취소
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isLoading}
            className="h-14 px-10 rounded-2xl bg-orange-600 hover:bg-orange-700 font-black gap-3 shadow-xl shadow-orange-100 hover:-translate-y-1 transition-all text-white"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">저장 중...</span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                변경사항 저장
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
