"use client";

import { Button } from "@/components/ui/button";
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
import { Plus } from "lucide-react";

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#2F80ED]" />
            스케줄 생성
          </DialogTitle>
          <DialogDescription className="sr-only">새로운 스케줄을 생성합니다</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 선택된 시간 표시 */}
          {selectedTimeSlot && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-gray-600">선택된 시간</div>
              <div className="font-bold text-gray-900">
                {selectedTimeSlot.date} {selectedTimeSlot.time}
              </div>
            </div>
          )}

          {/* 일정 유형 선택 */}
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="isPersonal"
              checked={createForm.isPersonal}
              onChange={(e) => setCreateForm({
                ...createForm,
                isPersonal: e.target.checked,
                member_id: "",
                personalTitle: ""
              })}
              className="w-4 h-4 rounded border-gray-300 text-[#2F80ED] focus:ring-[#2F80ED]"
            />
            <Label htmlFor="isPersonal" className="cursor-pointer font-medium">
              개인 일정 <span className="text-xs text-gray-500">(급여 계산 제외)</span>
            </Label>
          </div>

          {/* 조건부 렌더링: 개인 일정이면 제목 입력, 회원 일정이면 회원 선택 */}
          {createForm.isPersonal ? (
            <div className="space-y-2">
              <Label htmlFor="personalTitle">일정 제목 *</Label>
              <input
                type="text"
                id="personalTitle"
                value={createForm.personalTitle}
                onChange={(e) => setCreateForm({ ...createForm, personalTitle: e.target.value })}
                placeholder="예: 회의, 휴식, 개인 업무 등"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED]"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="member_id">회원 선택 *</Label>
              <Select
                value={createForm.member_id}
                onValueChange={(value) => {
                  setCreateForm({ ...createForm, member_id: value });
                  // 선택된 회원의 PT 회원권 정보 업데이트
                  const memberships = memberMemberships[value] || [];
                  const ptMembership = memberships.find((m: any) =>
                    m.name?.includes('PT') || m.name?.includes('피티')
                  );
                  setSelectedMemberMembership(ptMembership || null);
                }}
              >
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="회원을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {filteredMembers.length === 0 ? (
                    <SelectItem value="none" disabled>
                      {selectedStaffId !== "all" ? "담당 회원이 없습니다" : "등록된 회원이 없습니다"}
                    </SelectItem>
                  ) : (
                    filteredMembers.map((member) => {
                      const memberships = memberMemberships[member.id] || [];
                      const hasPT = memberships.some((m: any) =>
                        m.name?.includes('PT') || m.name?.includes('피티')
                      );
                      return (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} {hasPT && <span className="text-blue-500 ml-1">●</span>}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>

              {/* PT 회원권 정보 표시 */}
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
                  // 실제 스케줄 기반 회차 계산
                  const nextSessionNumber = getSessionNumber(createForm.member_id, 'pt');

                  // 날짜 포맷 함수
                  const formatDate = (date: Date | null) => {
                    if (!date) return null;
                    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
                  };

                  // PT 스케줄 상태별 통계 계산
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
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">PT 회원권 정보</div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 flex-wrap">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {ptMembership.total_sessions}회
                        </span>
                        <span className="text-gray-400">/</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                          {nextSessionNumber}회차
                        </span>
                        {remainingDays !== null && (
                          <>
                            <span className="text-gray-400">/</span>
                            <span className={`px-2 py-0.5 rounded ${
                              remainingDays <= 7 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              잔여 {remainingDays}일
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-2 space-y-0.5">
                        <div>
                          예약 {ptStats.reserved}건 | 완료 {ptStats.completed}건 | 노쇼(차감) {ptStats.noShowDeducted}건 | 노쇼 {ptStats.noShow}건 | 서비스 {ptStats.service}건 | 취소 {ptStats.cancelled}건
                        </div>
                        <div>
                          유효기간: {formatDate(startDate) || '시작일 미설정'} ~ {formatDate(endDate) || '종료일 미설정'}
                        </div>
                      </div>
                    </div>
                  );
                } else if (createForm.type === "PT") {
                  return (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-sm text-yellow-700 font-medium">
                        ⚠️ PT 회원권이 없습니다
                      </div>
                      <div className="text-xs text-yellow-600 mt-1">
                        PT 수업은 PT 회원권이 있는 회원만 등록할 수 있습니다.
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* 수업 타입 (개인 일정이 아닐 때만 표시) */}
          {!createForm.isPersonal && (
            <div className="space-y-2">
              <Label htmlFor="type">수업 타입 *</Label>
              <Select
                value={createForm.type}
                onValueChange={(value) => setCreateForm({ ...createForm, type: value })}
              >
                <SelectTrigger className="border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PT">PT</SelectItem>
                  <SelectItem value="OT">OT</SelectItem>
                  <SelectItem value="Consulting">Consulting</SelectItem>
                  <SelectItem value="GX">GX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 진행 시간 */}
          <div className="space-y-2">
            <Label htmlFor="duration">진행 시간 *</Label>
            <Select
              value={createForm.duration}
              onValueChange={(value) => setCreateForm({ ...createForm, duration: value })}
            >
              <SelectTrigger className="border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30분</SelectItem>
                <SelectItem value="60">60분</SelectItem>
                <SelectItem value="90">90분</SelectItem>
                <SelectItem value="120">120분</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onClose()}
            className="border-gray-300"
          >
            취소
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isLoading}
            className="bg-[#2F80ED] hover:bg-[#2F80ED]/90"
          >
            {isLoading ? "생성 중..." : "생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
