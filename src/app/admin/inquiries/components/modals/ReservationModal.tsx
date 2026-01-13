"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Calendar, Clock, Phone, User, RefreshCw, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {reservation ? "예약 수정" : "예약 등록"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 고객 정보 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>이름 *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="홍길동"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>전화번호 *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="010-0000-0000"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: formatPhoneInput(e.target.value) })}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* 예약 유형 */}
          <div className="space-y-2">
            <Label>예약 유형</Label>
            <Select
              value={formData.reservation_type}
              onValueChange={(value) => setFormData({ ...formData, reservation_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="유형 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultation">상담</SelectItem>
                <SelectItem value="trial">체험</SelectItem>
                <SelectItem value="ot">OT</SelectItem>
                <SelectItem value="pt_consultation">PT 상담</SelectItem>
                <SelectItem value="tour">견학</SelectItem>
                <SelectItem value="other">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 날짜/시간 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>날짜 *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>시간 *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* 담당자 */}
          <div className="space-y-2">
            <Label>담당자</Label>
            <Select
              value={formData.staff_id}
              onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="담당자 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">미지정</SelectItem>
                {staffList.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 상태 (수정 시에만) */}
          {reservation && (
            <div className="space-y-2">
              <Label>상태</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">대기</SelectItem>
                  <SelectItem value="confirmed">확정</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                  <SelectItem value="no_show">노쇼</SelectItem>
                  <SelectItem value="cancelled">취소</SelectItem>
                  <SelectItem value="rescheduled">변경됨</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 메모 */}
          <div className="space-y-2">
            <Label>메모</Label>
            <Textarea
              placeholder="예약 관련 메모..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {reservation && (
            <div className="flex items-center gap-2 mr-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCalendarSync}
                disabled={isSyncing}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
                {reservation.google_calendar_event_id ? "캘린더 업데이트" : "캘린더 등록"}
              </Button>
              {reservation.google_calendar_event_id && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  동기화됨
                </Badge>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "저장 중..." : reservation ? "수정" : "등록"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
