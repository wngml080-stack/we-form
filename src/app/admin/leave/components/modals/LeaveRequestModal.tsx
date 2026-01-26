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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LeaveType } from "@/types/database";
import { Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

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

  // 반차 유형 선택 시 자동으로 is_half_day 설정
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

  // 예상 일수 계산
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#3182F6]" />
            휴가 신청
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* 휴가 유형 선택 */}
            <div>
              <Label>휴가 유형 *</Label>
              <Select
                value={formData.leave_type_id}
                onValueChange={value => setFormData({ ...formData, leave_type_id: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="휴가 유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        {type.name}
                        <span className="text-[#8B95A1] text-xs">({type.deduction_days}일)</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 날짜 선택 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>시작일 *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  className="mt-1"
                />
              </div>
              {!formData.is_half_day && (
                <div>
                  <Label>종료일 *</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                    min={formData.start_date || new Date().toISOString().split("T")[0]}
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            {/* 반차 시간 선택 (반차 유형이 아닌 경우에만 표시) */}
            {formData.is_half_day && !isHalfDayType && (
              <div>
                <Label>반차 시간</Label>
                <RadioGroup
                  value={formData.half_day_type}
                  onValueChange={value => setFormData({ ...formData, half_day_type: value as "morning" | "afternoon" })}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="morning" id="morning" />
                    <Label htmlFor="morning" className="font-normal cursor-pointer">
                      오전 반차
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="afternoon" id="afternoon" />
                    <Label htmlFor="afternoon" className="font-normal cursor-pointer">
                      오후 반차
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* 예상 사용 연차 */}
            {(formData.start_date && (formData.is_half_day || formData.end_date)) && (
              <div className="p-3 bg-[#E8F3FF] rounded-lg flex items-center justify-between">
                <span className="text-sm text-blue-800">예상 사용 연차</span>
                <span className="font-bold text-blue-700">{calculateDays()}일</span>
              </div>
            )}

            {/* 사유 */}
            <div>
              <Label>사유</Label>
              <Textarea
                value={formData.reason}
                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                placeholder="휴가 사유를 입력하세요 (선택)"
                className="mt-1"
                rows={3}
              />
            </div>

            {/* 비상 연락처 */}
            <div>
              <Label>비상 연락처</Label>
              <Input
                value={formData.contact_phone}
                onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="010-0000-0000 (선택)"
                className="mt-1"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loading}>
            {submitting ? "신청 중..." : "신청하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
