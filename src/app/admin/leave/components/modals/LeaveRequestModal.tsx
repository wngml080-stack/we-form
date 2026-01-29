"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LeaveType } from "@/types/database";
import { Calendar, X, Send, Phone, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LeaveRequestModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LeaveRequestModal({ open, onClose, onSuccess }: LeaveRequestModalProps) {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    leave_type_id: "",
    start_date: "",
    end_date: "",
    is_half_day: false,
    half_day_type: "morning" as "morning" | "afternoon",
    reason: "",
    contact_phone: "",
  });

  useEffect(() => {
    if (open) {
      fetchLeaveTypes();
    }
  }, [open]);

  const fetchLeaveTypes = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/leave/types");
      const data = await response.json();
      if (response.ok) {
        setLeaveTypes(data.leaveTypes?.filter((t: LeaveType) => t.is_active) || []);
      }
    } catch (error) {
      console.error("Error fetching leave types:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.leave_type_id) {
      toast.error("휴가 유형을 선택해주세요.");
      return;
    }
    if (!formData.start_date) {
      toast.error("시작일을 선택해주세요.");
      return;
    }
    if (!formData.is_half_day && !formData.end_date) {
      toast.error("종료일을 선택해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/leave/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          end_date: formData.is_half_day ? formData.start_date : formData.end_date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "휴가 신청 중 오류가 발생했습니다.");
      }

      toast.success("휴가가 신청되었습니다.");
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "휴가 신청 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedType = leaveTypes.find(t => t.id === formData.leave_type_id);
  const isHalfDayType = selectedType?.code === "half_am" || selectedType?.code === "half_pm";

  useEffect(() => {
    if (isHalfDayType) {
      setFormData(prev => ({
        ...prev,
        is_half_day: true,
        half_day_type: selectedType?.code === "half_am" ? "morning" : "afternoon",
      }));
    } else {
      setFormData(prev => ({ ...prev, is_half_day: false }));
    }
  }, [formData.leave_type_id, isHalfDayType, selectedType?.code]);

  const calculateDays = () => {
    if (formData.is_half_day) return 0.5;
    if (!formData.start_date || !formData.end_date) return 0;

    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return diffDays * (selectedType?.deduction_days || 1);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-white border-none shadow-2xl rounded-[40px]">
        {/* Header - Toss Modern Style */}
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="sr-only">휴가 신청</DialogTitle>
          <DialogDescription className="sr-only">새로운 휴가 신청서를 작성합니다.</DialogDescription>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">휴가 신청서 작성</h2>
                <p className="text-sm text-slate-400 font-bold mt-1">체계적인 연차 관리를 위해 정확히 입력해 주세요</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
            >
              <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-[#f8fafc] custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary-hex)] mb-4" />
              <p className="text-[var(--foreground-subtle)] font-bold">휴가 정보를 불러오는 중...</p>
            </div>
          ) : (
            <>
              {/* Step 1: Type & Date */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black">1</div>
                  <h3 className="text-lg font-black text-slate-900">기간 및 유형 선택</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Leave Type *</Label>
                    <Select
                      value={formData.leave_type_id}
                      onValueChange={value => setFormData({ ...formData, leave_type_id: value })}
                    >
                      <SelectTrigger className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-base focus:ring-2 focus:ring-blue-100 transition-all">
                        <SelectValue placeholder="유형 선택" />
                      </SelectTrigger>
                      <SelectContent className="rounded-[24px] border-none shadow-2xl p-2">
                        {leaveTypes.map(type => (
                          <SelectItem key={type.id} value={type.id} className="rounded-xl py-3 font-bold">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                              {type.name}
                              <span className="text-[var(--foreground-subtle)] text-xs font-medium">({type.deduction_days}일 차감)</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Calculation</Label>
                    <div className={cn(
                      "h-14 px-6 rounded-2xl flex items-center justify-between transition-all",
                      formData.start_date && (formData.is_half_day || formData.end_date)
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                        : "bg-slate-50 text-slate-300"
                    )}>
                      <span className="text-sm font-bold uppercase tracking-widest">Estimated</span>
                      <span className="text-xl font-black">{calculateDays()}일</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Start Date *</Label>
                    <div className="relative group">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        type="date"
                        value={formData.start_date}
                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                        min={new Date().toISOString().split("T")[0]}
                        className="h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border-none font-bold text-base focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>
                  </div>

                  {!formData.is_half_day ? (
                    <div className="space-y-3">
                      <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">End Date *</Label>
                      <div className="relative group">
                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                          type="date"
                          value={formData.end_date}
                          onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                          min={formData.start_date || new Date().toISOString().split("T")[0]}
                          className="h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border-none font-bold text-base focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                      </div>
                    </div>
                  ) : !isHalfDayType && (
                    <div className="space-y-3">
                      <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Half Day Type</Label>
                      <RadioGroup
                        value={formData.half_day_type}
                        onValueChange={value => setFormData({ ...formData, half_day_type: value as "morning" | "afternoon" })}
                        className="flex gap-3 h-14"
                      >
                        <div className="flex-1">
                          <RadioGroupItem value="morning" id="morning" className="sr-only" />
                          <Label 
                            htmlFor="morning" 
                            className={cn(
                              "h-full flex items-center justify-center rounded-2xl border-2 font-black text-sm cursor-pointer transition-all",
                              formData.half_day_type === "morning" ? "bg-white border-blue-600 text-blue-600 shadow-lg shadow-blue-50" : "bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-200"
                            )}
                          >
                            오전 반차
                          </Label>
                        </div>
                        <div className="flex-1">
                          <RadioGroupItem value="afternoon" id="afternoon" className="sr-only" />
                          <Label 
                            htmlFor="afternoon" 
                            className={cn(
                              "h-full flex items-center justify-center rounded-2xl border-2 font-black text-sm cursor-pointer transition-all",
                              formData.half_day_type === "afternoon" ? "bg-white border-blue-600 text-blue-600 shadow-lg shadow-blue-50" : "bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-200"
                            )}
                          >
                            오후 반차
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Reason & Contact */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-black">2</div>
                  <h3 className="text-lg font-black text-slate-900">상세 사유 및 비상 연락처</h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Reason (Optional)</Label>
                    <div className="relative group">
                      <FileText className="absolute left-5 top-6 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                      <Textarea
                        value={formData.reason}
                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                        placeholder="신청 사유를 입력하세요 (예: 가족 행사, 병원 방문 등)"
                        className="min-h-[140px] pl-14 pr-6 pt-5 rounded-3xl bg-slate-50 border-none font-bold text-base focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Emergency Contact (Optional)</Label>
                    <div className="relative group">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        value={formData.contact_phone}
                        onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                        placeholder="비상 시 연락 가능한 번호를 입력하세요"
                        className="h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border-none font-bold text-base focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Tip */}
              <div className="flex items-start gap-4 p-6 bg-blue-50 rounded-[28px] border border-blue-100">
                <AlertCircle className="w-6 h-6 text-blue-500 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-black text-blue-900">안내 사항</p>
                  <p className="text-xs text-blue-700 font-bold leading-relaxed">
                    휴가 신청은 관리자의 승인이 완료된 후 확정됩니다. 신청 완료 후에는 승인 전까지 수정이 불가능하니 내용을 다시 한번 확인해 주세요.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-8 border-t bg-white flex justify-end gap-3 flex-shrink-0">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            disabled={submitting}
            className="h-14 px-8 rounded-2xl font-black text-slate-400 hover:text-slate-900 transition-all"
          >
            취소하기
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || loading}
            className="h-14 px-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black gap-3 shadow-xl shadow-blue-100 hover:-translate-y-1 transition-all active:scale-[0.98]"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                처리 중...
              </div>
            ) : (
              <>
                <Send className="w-5 h-5" />
                신청서 제출하기
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
