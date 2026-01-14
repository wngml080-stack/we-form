"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Phone, User, RefreshCw, ExternalLink, X, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Reservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  reservation_type: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  staff_id?: string;
  status: string;
  notes?: string;
  staff_memo?: string;
  google_calendar_event_id?: string;
  google_calendar_synced_at?: string;
}

interface Inquiry {
  id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
}

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation?: Reservation | null;
  inquiry?: Inquiry | null;
  onCreate: (data: Partial<Reservation> & { inquiry_id?: string }) => Promise<boolean>;
  onUpdate: (id: string, data: Partial<Reservation>) => Promise<boolean>;
  gymId: string | null;
  companyId: string | null;
}

export function ReservationModal({
  isOpen,
  onClose,
  reservation,
  inquiry,
  onCreate,
  onUpdate,
  gymId,
  companyId,
}: ReservationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    reservation_type: "consultation",
    scheduled_date: "",
    scheduled_time: "10:00",
    duration_minutes: 60,
    staff_id: "",
    notes: "",
    staff_memo: "",
    status: "confirmed",
  });

  // 직원 목록 로드
  useEffect(() => {
    if (gymId) {
      fetch(`/api/admin/filter/staffs?gym_id=${gymId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.staffs) {
            setStaffList(data.staffs);
          }
        })
        .catch(console.error);
    }
  }, [gymId]);

  // 폼 초기화
  useEffect(() => {
    if (reservation) {
      // 기존 예약 수정
      setFormData({
        customer_name: reservation.customer_name,
        customer_phone: reservation.customer_phone,
        customer_email: reservation.customer_email || "",
        reservation_type: reservation.reservation_type,
        scheduled_date: reservation.scheduled_date,
        scheduled_time: reservation.scheduled_time.slice(0, 5),
        duration_minutes: reservation.duration_minutes,
        staff_id: reservation.staff_id || "",
        notes: reservation.notes || "",
        staff_memo: reservation.staff_memo || "",
        status: reservation.status,
      });
    } else if (inquiry) {
      // 문의에서 예약 생성
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData({
        customer_name: inquiry.customer_name || "",
        customer_phone: inquiry.customer_phone || "",
        customer_email: inquiry.customer_email || "",
        reservation_type: "consultation",
        scheduled_date: tomorrow.toISOString().split("T")[0],
        scheduled_time: "10:00",
        duration_minutes: 60,
        staff_id: "",
        notes: "",
        staff_memo: "",
        status: "confirmed",
      });
    } else {
      // 새 예약
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData({
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        reservation_type: "consultation",
        scheduled_date: tomorrow.toISOString().split("T")[0],
        scheduled_time: "10:00",
        duration_minutes: 60,
        staff_id: "",
        notes: "",
        staff_memo: "",
        status: "confirmed",
      });
    }
  }, [reservation, inquiry, isOpen]);

  const handleSubmit = async () => {
    if (!formData.customer_name || !formData.customer_phone || !formData.scheduled_date) {
      alert("이름, 전화번호, 날짜는 필수입니다.");
      return;
    }

    setIsSubmitting(true);

    let success = false;
    if (reservation) {
      success = await onUpdate(reservation.id, formData);
    } else {
      success = await onCreate({
        ...formData,
        inquiry_id: inquiry?.id,
      });
    }

    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const formatPhoneInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleCalendarSync = async () => {
    if (!reservation) return;

    setIsSyncing(true);
    try {
      const response = await fetch(`/api/admin/reservations/${reservation.id}/calendar-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Google Calendar에 동기화되었습니다.");
      } else {
        alert(data.error || "동기화 실패");
      }
    } catch (error) {
      alert("동기화 중 오류가 발생했습니다.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#f8fafc] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px] [&>button]:hidden">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="flex items-center justify-between relative z-10">
            <DialogTitle className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black !text-white tracking-tight">{reservation ? "예약 정보 수정" : "상담/체험 예약 등록"}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">{reservation ? "Edit Reservation" : "Register New Appointment"}</p>
              </div>
            </DialogTitle>
            <button
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group active:scale-90"
            >
              <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-[#f8fafc]">
          {/* 고객 정보 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 ml-1">
              <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-black text-slate-900">고객 정보</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">이름 *</Label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="홍길동"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="h-14 pl-14 rounded-2xl bg-slate-50 border-none focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">전화번호 *</Label>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="010-0000-0000"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: formatPhoneInput(e.target.value) })}
                    className="h-14 pl-14 rounded-2xl bg-slate-50 border-none focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 날짜/시간 선택 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 ml-1">
                <div className="w-1.5 h-5 bg-indigo-500 rounded-full"></div>
                <h3 className="text-lg font-black text-slate-900">예약 일시</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">날짜</Label>
                  <Input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="h-12 rounded-xl bg-white border-slate-100 shadow-sm font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">시간</Label>
                  <Input
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                    className="h-12 rounded-xl bg-white border-slate-100 shadow-sm font-bold text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 예약 유형 및 담당자 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 ml-1">
                <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
                <h3 className="text-lg font-black text-slate-900">상세 분류</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">예약 유형</Label>
                  <Select
                    value={formData.reservation_type}
                    onValueChange={(value) => setFormData({ ...formData, reservation_type: value })}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-white border-slate-100 shadow-sm font-bold text-sm">
                      <SelectValue placeholder="유형 선택" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                      <SelectItem value="consultation">상담</SelectItem>
                      <SelectItem value="trial">체험</SelectItem>
                      <SelectItem value="ot">OT</SelectItem>
                      <SelectItem value="pt_consultation">PT 상담</SelectItem>
                      <SelectItem value="tour">견학</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">담당 직원</Label>
                  <Select
                    value={formData.staff_id}
                    onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-white border-slate-100 shadow-sm font-bold text-sm">
                      <SelectValue placeholder="담당자 선택" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                      <SelectItem value="">미지정</SelectItem>
                      {staffList.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* 상태 설정 (수정 시) */}
          {reservation && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 ml-1">
                <div className="w-1.5 h-5 bg-orange-500 rounded-full"></div>
                <h3 className="text-lg font-black text-slate-900">예약 상태 설정</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "pending", label: "대기", color: "amber" },
                  { value: "confirmed", label: "확정", color: "blue" },
                  { value: "completed", label: "완료", color: "emerald" },
                  { value: "no_show", label: "노쇼", color: "rose" },
                  { value: "cancelled", label: "취소", color: "slate" },
                  { value: "rescheduled", label: "변경됨", color: "indigo" },
                ].map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setFormData({ ...formData, status: s.value })}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-xs font-black transition-all border-2",
                      formData.status === s.value
                        ? `bg-${s.color}-500 border-${s.color}-500 text-white shadow-lg shadow-${s.color}-200`
                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 메모 섹션 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 ml-1">
              <div className="w-1.5 h-5 bg-slate-400 rounded-full"></div>
              <h3 className="text-lg font-black text-slate-900">상담 및 예약 메모</h3>
            </div>
            <Textarea
              placeholder="상담 예정 내용이나 주의사항을 입력하세요..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="rounded-3xl bg-white border-slate-100 shadow-sm p-6 font-bold text-slate-600 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="p-8 bg-white border-t border-slate-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            {reservation && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCalendarSync}
                disabled={isSyncing}
                className="h-10 px-4 rounded-xl border-slate-200 font-bold text-xs gap-2"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
                Google 캘린더 동기화
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-14 px-8 rounded-[22px] font-black text-slate-400 hover:text-slate-900 transition-all"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-14 px-12 rounded-[22px] bg-slate-900 hover:bg-slate-800 text-white font-black shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-3"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              {reservation ? "예약 정보 수정 완료" : "예약 등록 완료"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
