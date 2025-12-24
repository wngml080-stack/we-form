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
import { Trash2 } from "lucide-react";

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
}: EditScheduleModalProps) {
  const isPersonalSchedule = selectedSchedule?.type?.toLowerCase() === 'personal' || selectedSchedule?.type === '개인';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#2F80ED]">
            {isPersonalSchedule ? '개인일정 수정' : '스케줄 수정'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isPersonalSchedule ? '개인일정 정보를 수정합니다' : '스케줄 정보를 수정합니다'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 개인일정: 제목 입력 */}
          {(isPersonalSchedule || editForm.type === 'Personal') && (
            <div className="space-y-2">
              <Label htmlFor="edit_personal_title">일정 제목 *</Label>
              <input
                type="text"
                id="edit_personal_title"
                value={editForm.personalTitle}
                onChange={(e) => setEditForm({ ...editForm, personalTitle: e.target.value })}
                placeholder="일정 제목을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED]"
              />
            </div>
          )}

          {/* 회원 선택 (개인일정이 아닌 경우에만) */}
          {selectedSchedule?.member_id && !isPersonalSchedule && (
            <div className="space-y-2">
              <Label htmlFor="edit_member_id">회원 선택 *</Label>
              <Select
                value={editForm.member_id}
                onValueChange={(value) => setEditForm({ ...editForm, member_id: value })}
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
                    filteredMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {/* PT 회원권 정보 표시 (수정 모달) */}
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
                  // 실제 스케줄 기반 회차 계산 (수정 중인 스케줄 ID 전달)
                  const currentSessionNumber = getSessionNumber(editForm.member_id, 'pt', selectedSchedule?.id);

                  // 날짜 포맷 함수
                  const formatDate = (date: Date | null) => {
                    if (!date) return null;
                    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
                  };

                  // 상태 표시 (취소/노쇼/서비스) - 노쇼(차감)은 회차로 표기
                  const scheduleStatus = selectedSchedule?.status;
                  const isSpecialStatus = ['cancelled', 'no_show', 'service'].includes(scheduleStatus);
                  const statusLabel = scheduleStatus === 'cancelled' ? '취소' :
                                      scheduleStatus === 'no_show' ? '노쇼' :
                                      scheduleStatus === 'service' ? '서비스' : null;
                  const statusColor = scheduleStatus === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                                      scheduleStatus === 'no_show' ? 'bg-orange-100 text-orange-700' :
                                      scheduleStatus === 'service' ? 'bg-purple-100 text-purple-700' : '';

                  // PT 스케줄 상태별 통계 계산
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
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">PT 회원권 정보</div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 flex-wrap">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {ptMembership.total_sessions}회
                        </span>
                        <span className="text-gray-400">/</span>
                        {isSpecialStatus ? (
                          <span className={`px-2 py-0.5 rounded ${statusColor}`}>
                            {statusLabel}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                            {currentSessionNumber}회차
                          </span>
                        )}
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
                }
                return null;
              })()}
            </div>
          )}

          {/* 날짜 선택 */}
          <div className="space-y-2">
            <Label htmlFor="edit_date">날짜 *</Label>
            <input
              type="date"
              id="edit_date"
              value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED]"
            />
          </div>

          {/* 시간 선택 */}
          <div className="space-y-2">
            <Label htmlFor="edit_time">시작 시간 *</Label>
            <input
              type="time"
              id="edit_time"
              value={editForm.time}
              onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED]"
            />
          </div>

          {/* 진행 시간 */}
          <div className="space-y-2">
            <Label htmlFor="edit_duration">진행 시간 *</Label>
            <Select
              value={editForm.duration}
              onValueChange={(value) => setEditForm({ ...editForm, duration: value })}
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

          {/* 수업 타입 (개인일정이 아닌 경우에만) */}
          {!isPersonalSchedule && (
            <div className="space-y-2">
              <Label htmlFor="edit_type">수업 타입 *</Label>
              <Select
                value={editForm.type}
                onValueChange={(value) => setEditForm({ ...editForm, type: value })}
              >
                <SelectTrigger className="border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PT">PT</SelectItem>
                  <SelectItem value="OT">OT</SelectItem>
                  <SelectItem value="Consulting">상담</SelectItem>
                  <SelectItem value="GX">GX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 개인일정: sub_type 선택 */}
          {(isPersonalSchedule || editForm.type === 'Personal') && (
            <div className="space-y-2">
              <Label htmlFor="edit_sub_type">일정 분류 *</Label>
              <Select
                value={editForm.sub_type}
                onValueChange={(value) => setEditForm({ ...editForm, sub_type: value })}
              >
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="분류를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meal">식사</SelectItem>
                  <SelectItem value="conference">회의</SelectItem>
                  <SelectItem value="meeting">미팅</SelectItem>
                  <SelectItem value="rest">휴식</SelectItem>
                  <SelectItem value="workout">운동</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 상담: sub_type 선택 */}
          {(selectedSchedule?.type?.toLowerCase() === 'consulting' || editForm.type === 'Consulting') && (
            <div className="space-y-2">
              <Label htmlFor="edit_sub_type">상담 분류</Label>
              <Select
                value={editForm.sub_type}
                onValueChange={(value) => setEditForm({ ...editForm, sub_type: value })}
              >
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="분류를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">세일즈</SelectItem>
                  <SelectItem value="info">안내상담</SelectItem>
                  <SelectItem value="status">현황상담</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 출석 상태 - PT */}
          {(selectedSchedule?.type === 'PT' || editForm.type === 'PT') && (
            <div className="space-y-2">
              <Label htmlFor="edit_status">출석 상태 *</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger className="border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reserved">예약완료</SelectItem>
                  <SelectItem value="completed">수업완료</SelectItem>
                  <SelectItem value="no_show_deducted">노쇼 (차감)</SelectItem>
                  <SelectItem value="no_show">노쇼</SelectItem>
                  <SelectItem value="service">서비스</SelectItem>
                  <SelectItem value="cancelled">취소</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 출석 상태 - OT */}
          {(selectedSchedule?.type === 'OT' || editForm.type === 'OT') && (
            <div className="space-y-2">
              <Label htmlFor="edit_status">출석 상태 *</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger className="border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">수업완료</SelectItem>
                  <SelectItem value="no_show">노쇼</SelectItem>
                  <SelectItem value="cancelled">취소</SelectItem>
                  <SelectItem value="converted">PT전환</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 인바디 체크 - OT */}
          {(selectedSchedule?.type === 'OT' || editForm.type === 'OT') && (
            <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <input
                type="checkbox"
                id="inbody_checked"
                checked={editForm.inbody_checked}
                onChange={(e) => setEditForm({ ...editForm, inbody_checked: e.target.checked })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <Label htmlFor="inbody_checked" className="text-sm font-medium text-purple-700 cursor-pointer">
                인바디 측정 완료
              </Label>
            </div>
          )}

          {/* 출석 상태 - 상담/기타 (개인일정 제외) */}
          {!isPersonalSchedule &&
           selectedSchedule?.type !== 'PT' &&
           selectedSchedule?.type !== 'OT' &&
           editForm.type !== 'PT' &&
           editForm.type !== 'OT' && (
            <div className="space-y-2">
              <Label htmlFor="edit_status">출석 상태 *</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger className="border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reserved">예약완료</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                  <SelectItem value="no_show">노쇼</SelectItem>
                  <SelectItem value="cancelled">취소</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={isLoading}
            className="mr-auto"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            삭제
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-300"
            >
              취소
            </Button>
            <Button
              onClick={onUpdate}
              disabled={isLoading}
              className="bg-[#2F80ED] hover:bg-[#2F80ED]/90"
            >
              {isLoading ? "수정 중..." : "수정"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
