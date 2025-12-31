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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[#2F80ED]">상태 변경</DialogTitle>
          <DialogDescription className="sr-only">스케줄 상태를 변경합니다</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 스케줄 정보 */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-semibold text-gray-900">
              {selectedSchedule.member_name || selectedSchedule.title || '일정'}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {new Date(selectedSchedule.start_time).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}
              {' '}
              {new Date(selectedSchedule.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
              {' - '}
              {new Date(selectedSchedule.end_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </div>
            {/* 개인일정이 아닌 경우에만 상태 배지 표시 */}
            {scheduleType !== 'personal' && selectedSchedule.type !== '개인' && (
              <div className="mt-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  selectedSchedule.status === 'completed' ? 'bg-green-100 text-green-700' :
                  selectedSchedule.status === 'no_show_deducted' ? 'bg-red-100 text-red-700' :
                  selectedSchedule.status === 'no_show' ? 'bg-gray-100 text-gray-700' :
                  selectedSchedule.status === 'service' ? 'bg-blue-100 text-blue-700' :
                  selectedSchedule.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
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

          {/* 타입별 상태 변경 버튼 */}
          {(() => {
            // PT 상태 버튼
            if (scheduleType === 'pt') {
              return (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 font-medium">PT 상태 변경</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={selectedSchedule.status === 'reserved' ? 'default' : 'outline'}
                      className={selectedSchedule.status === 'reserved' ? 'bg-indigo-500 hover:bg-indigo-600' : 'hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300'}
                      onClick={() => onStatusChange('reserved')}
                      disabled={selectedSchedule.status === 'reserved'}
                    >
                      예약완료
                    </Button>
                    <Button
                      variant={selectedSchedule.status === 'completed' ? 'default' : 'outline'}
                      className={selectedSchedule.status === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' : 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'}
                      onClick={() => onStatusChange('completed')}
                      disabled={selectedSchedule.status === 'completed'}
                    >
                      수업완료
                    </Button>
                    <Button
                      variant={selectedSchedule.status === 'no_show_deducted' ? 'default' : 'outline'}
                      className={selectedSchedule.status === 'no_show_deducted' ? 'bg-red-500 hover:bg-red-600' : 'hover:bg-red-50 hover:text-red-700 hover:border-red-300'}
                      onClick={() => onStatusChange('no_show_deducted')}
                      disabled={selectedSchedule.status === 'no_show_deducted'}
                    >
                      노쇼(차감)
                    </Button>
                    <Button
                      variant={selectedSchedule.status === 'no_show' ? 'default' : 'outline'}
                      className={selectedSchedule.status === 'no_show' ? 'bg-gray-500 hover:bg-gray-600' : 'hover:bg-gray-100'}
                      onClick={() => onStatusChange('no_show')}
                      disabled={selectedSchedule.status === 'no_show'}
                    >
                      노쇼
                    </Button>
                    <Button
                      variant={selectedSchedule.status === 'service' ? 'default' : 'outline'}
                      className={selectedSchedule.status === 'service' ? 'bg-blue-500 hover:bg-blue-600' : 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'}
                      onClick={() => onStatusChange('service')}
                      disabled={selectedSchedule.status === 'service'}
                    >
                      서비스
                    </Button>
                    <Button
                      variant={selectedSchedule.status === 'cancelled' ? 'default' : 'outline'}
                      className={selectedSchedule.status === 'cancelled' ? 'bg-gray-400 hover:bg-gray-500' : 'hover:bg-gray-100'}
                      onClick={() => onStatusChange('cancelled')}
                      disabled={selectedSchedule.status === 'cancelled'}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              );
            }

            // OT 상태 버튼
            if (scheduleType === 'ot') {
              return (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 font-medium">OT 상태 변경</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={selectedSchedule.status === 'completed' ? 'default' : 'outline'}
                      className={selectedSchedule.status === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' : 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'}
                      onClick={() => onStatusChange('completed')}
                      disabled={selectedSchedule.status === 'completed'}
                    >
                      수업완료
                    </Button>
                    <Button
                      variant={selectedSchedule.status === 'no_show' ? 'default' : 'outline'}
                      className={selectedSchedule.status === 'no_show' ? 'bg-gray-500 hover:bg-gray-600' : 'hover:bg-gray-100'}
                      onClick={() => onStatusChange('no_show')}
                      disabled={selectedSchedule.status === 'no_show'}
                    >
                      노쇼
                    </Button>
                    <Button
                      variant={selectedSchedule.status === 'cancelled' ? 'default' : 'outline'}
                      className={selectedSchedule.status === 'cancelled' ? 'bg-gray-400 hover:bg-gray-500' : 'hover:bg-gray-100'}
                      onClick={() => onStatusChange('cancelled')}
                      disabled={selectedSchedule.status === 'cancelled'}
                    >
                      취소
                    </Button>
                    <Button
                      variant={selectedSchedule.status === 'converted' ? 'default' : 'outline'}
                      className={selectedSchedule.status === 'converted' ? 'bg-blue-500 hover:bg-blue-600' : 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'}
                      onClick={() => onStatusChange('converted')}
                      disabled={selectedSchedule.status === 'converted'}
                    >
                      PT전환
                    </Button>
                  </div>
                  {/* 인바디 체크 토글 */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={handleInbodyToggle}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                        selectedSchedule.inbody_checked
                          ? 'bg-purple-100 border-purple-300 text-purple-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-purple-50'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selectedSchedule.inbody_checked ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
                      }`}>
                        {selectedSchedule.inbody_checked && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className="text-sm font-medium">인바디 측정 완료</span>
                    </button>
                  </div>
                </div>
              );
            }

            // 상담 상태 버튼
            if (scheduleType === 'consulting' || scheduleType === '상담') {
              return (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 font-medium">상담 분류</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={selectedSchedule.sub_type === 'sales' ? 'default' : 'outline'}
                      className={selectedSchedule.sub_type === 'sales' ? 'bg-orange-500 hover:bg-orange-600' : 'hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300'}
                      onClick={() => onSubTypeChange('sales')}
                    >
                      세일즈
                    </Button>
                    <Button
                      variant={selectedSchedule.sub_type === 'info' ? 'default' : 'outline'}
                      className={selectedSchedule.sub_type === 'info' ? 'bg-blue-500 hover:bg-blue-600' : 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'}
                      onClick={() => onSubTypeChange('info')}
                    >
                      안내상담
                    </Button>
                    <Button
                      variant={selectedSchedule.sub_type === 'status' ? 'default' : 'outline'}
                      className={selectedSchedule.sub_type === 'status' ? 'bg-purple-500 hover:bg-purple-600' : 'hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300'}
                      onClick={() => onSubTypeChange('status')}
                    >
                      현황상담
                    </Button>
                    <Button
                      variant={selectedSchedule.sub_type === 'other' ? 'default' : 'outline'}
                      className={selectedSchedule.sub_type === 'other' ? 'bg-gray-500 hover:bg-gray-600' : 'hover:bg-gray-100'}
                      onClick={() => onSubTypeChange('other')}
                    >
                      기타
                    </Button>
                  </div>
                </div>
              );
            }

            // 개인일정 분류 버튼
            if (scheduleType === '개인' || scheduleType === 'personal') {
              return (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 font-medium">개인일정 분류</div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={selectedSchedule.sub_type === 'meal' ? 'default' : 'outline'}
                      className={selectedSchedule.sub_type === 'meal' ? 'bg-yellow-500 hover:bg-yellow-600' : 'hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-300'}
                      onClick={() => onSubTypeChange('meal')}
                    >
                      식사
                    </Button>
                    <Button
                      variant={selectedSchedule.sub_type === 'conference' ? 'default' : 'outline'}
                      className={selectedSchedule.sub_type === 'conference' ? 'bg-indigo-500 hover:bg-indigo-600' : 'hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300'}
                      onClick={() => onSubTypeChange('conference')}
                    >
                      회의
                    </Button>
                    <Button
                      variant={selectedSchedule.sub_type === 'meeting' ? 'default' : 'outline'}
                      className={selectedSchedule.sub_type === 'meeting' ? 'bg-blue-500 hover:bg-blue-600' : 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'}
                      onClick={() => onSubTypeChange('meeting')}
                    >
                      미팅
                    </Button>
                    <Button
                      variant={selectedSchedule.sub_type === 'rest' ? 'default' : 'outline'}
                      className={selectedSchedule.sub_type === 'rest' ? 'bg-purple-500 hover:bg-purple-600' : 'hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300'}
                      onClick={() => onSubTypeChange('rest')}
                    >
                      휴식
                    </Button>
                    <Button
                      variant={selectedSchedule.sub_type === 'workout' ? 'default' : 'outline'}
                      className={selectedSchedule.sub_type === 'workout' ? 'bg-orange-500 hover:bg-orange-600' : 'hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300'}
                      onClick={() => onSubTypeChange('workout')}
                    >
                      운동
                    </Button>
                    <Button
                      variant={selectedSchedule.sub_type === 'other' ? 'default' : 'outline'}
                      className={selectedSchedule.sub_type === 'other' ? 'bg-gray-500 hover:bg-gray-600' : 'hover:bg-gray-100'}
                      onClick={() => onSubTypeChange('other')}
                    >
                      기타
                    </Button>
                  </div>
                </div>
              );
            }

            // 기타 타입 (기본 상태 버튼)
            return (
              <div className="space-y-2">
                <div className="text-xs text-gray-500 font-medium">상태 변경</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedSchedule.status === 'completed' ? 'default' : 'outline'}
                    className={selectedSchedule.status === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' : 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'}
                    onClick={() => onStatusChange('completed')}
                    disabled={selectedSchedule.status === 'completed'}
                  >
                    완료
                  </Button>
                  <Button
                    variant={selectedSchedule.status === 'cancelled' ? 'default' : 'outline'}
                    className={selectedSchedule.status === 'cancelled' ? 'bg-gray-400 hover:bg-gray-500' : 'hover:bg-gray-100'}
                    onClick={() => onStatusChange('cancelled')}
                    disabled={selectedSchedule.status === 'cancelled'}
                  >
                    취소
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* 하단 버튼 영역 */}
          <div className="pt-2 border-t space-y-2">
            <Button
              variant="ghost"
              className="w-full text-gray-600 hover:text-[#2F80ED]"
              onClick={onOpenEditModal}
            >
              상세 수정 (시간/회원 변경)
            </Button>
            <Button
              variant="ghost"
              className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                if (confirm('이 스케줄을 삭제하시겠습니까?')) {
                  onDelete();
                  onClose();
                }
              }}
            >
              스케줄 삭제
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
