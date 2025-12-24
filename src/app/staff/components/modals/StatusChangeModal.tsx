"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SelectedEvent } from "../../hooks/useStaffPageData";

interface StatusChangeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEvent: SelectedEvent | null;
  isMonthApproved: boolean;
  onStatusChange: (status: string) => void;
  onSubTypeChange: (subType: string) => void;
  onOpenEditModal: () => void;
  onDelete: () => void;
}

export function StatusChangeModal({
  isOpen, onOpenChange, selectedEvent, isMonthApproved,
  onStatusChange, onSubTypeChange, onOpenEditModal, onDelete
}: StatusChangeModalProps) {
  if (!selectedEvent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl p-0 overflow-hidden gap-0">
        <div className="bg-[#2F80ED] p-6 text-white">
          <h3 className="text-xl font-bold">
            {selectedEvent.type?.toLowerCase() === 'personal'
              ? selectedEvent.title || '개인일정'
              : `${selectedEvent.memberName}님 수업`}
          </h3>
          <p className="opacity-80 text-sm font-medium mt-1">
            {selectedEvent.timeLabel} ({selectedEvent.duration}분) · {selectedEvent.type?.toLowerCase() === 'personal' ? '개인일정' : selectedEvent.type}
          </p>
        </div>

        <div className="p-6">
          <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
            {selectedEvent.type?.toLowerCase() === 'personal' || selectedEvent.type?.toLowerCase() === 'consulting'
              ? '분류 선택' : '상태 변경'}
          </h4>

          {/* PT 예약 */}
          {selectedEvent.type === 'PT' && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <StatusButton status="reserved" label="예약완료" icon="📅" currentStatus={selectedEvent.status} onClick={() => onStatusChange("reserved")} color="indigo" />
              <StatusButton status="completed" label="수업완료" icon="🟢" currentStatus={selectedEvent.status} onClick={() => onStatusChange("completed")} color="green" />
              <StatusButton status="no_show_deducted" label="노쇼(차감)" icon="🔴" currentStatus={selectedEvent.status} onClick={() => onStatusChange("no_show_deducted")} color="red" />
              <StatusButton status="no_show" label="노쇼" icon="⚪" currentStatus={selectedEvent.status} onClick={() => onStatusChange("no_show")} color="gray" />
              <StatusButton status="service" label="서비스" icon="🔵" currentStatus={selectedEvent.status} onClick={() => onStatusChange("service")} color="blue" />
              <StatusButton status="cancelled" label="취소" icon="❌" currentStatus={selectedEvent.status} onClick={() => onStatusChange("cancelled")} color="gray" />
            </div>
          )}

          {/* OT 예약 */}
          {selectedEvent.type === 'OT' && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <StatusButton status="completed" label="수업완료" icon="🟢" currentStatus={selectedEvent.status} onClick={() => onStatusChange("completed")} color="green" />
              <StatusButton status="no_show" label="노쇼" icon="⚪" currentStatus={selectedEvent.status} onClick={() => onStatusChange("no_show")} color="gray" />
              <StatusButton status="cancelled" label="취소" icon="❌" currentStatus={selectedEvent.status} onClick={() => onStatusChange("cancelled")} color="gray" />
              <StatusButton status="converted" label="PT전환" icon="🔄" currentStatus={selectedEvent.status} onClick={() => onStatusChange("converted")} color="purple" />
            </div>
          )}

          {/* 상담 */}
          {selectedEvent.type?.toLowerCase() === 'consulting' && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <SubTypeButton subType="sales" label="세일즈" icon="💰" currentSubType={selectedEvent.sub_type} onClick={() => onSubTypeChange("sales")} color="blue" />
              <SubTypeButton subType="info" label="안내상담" icon="ℹ️" currentSubType={selectedEvent.sub_type} onClick={() => onSubTypeChange("info")} color="teal" />
              <SubTypeButton subType="status" label="현황상담" icon="📊" currentSubType={selectedEvent.sub_type} onClick={() => onSubTypeChange("status")} color="amber" />
              <SubTypeButton subType="other" label="기타" icon="📝" currentSubType={selectedEvent.sub_type} onClick={() => onSubTypeChange("other")} color="gray" />
            </div>
          )}

          {/* 개인일정 */}
          {selectedEvent.type?.toLowerCase() === 'personal' && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <SubTypeButton subType="meal" label="식사" icon="🍽️" currentSubType={selectedEvent.sub_type} onClick={() => onSubTypeChange("meal")} color="yellow" />
              <SubTypeButton subType="conference" label="회의" icon="🏢" currentSubType={selectedEvent.sub_type} onClick={() => onSubTypeChange("conference")} color="indigo" />
              <SubTypeButton subType="meeting" label="미팅" icon="👥" currentSubType={selectedEvent.sub_type} onClick={() => onSubTypeChange("meeting")} color="blue" />
              <SubTypeButton subType="rest" label="휴식" icon="☕" currentSubType={selectedEvent.sub_type} onClick={() => onSubTypeChange("rest")} color="green" />
              <SubTypeButton subType="workout" label="운동" icon="💪" currentSubType={selectedEvent.sub_type} onClick={() => onSubTypeChange("workout")} color="purple" />
              <SubTypeButton subType="other" label="기타" icon="📝" currentSubType={selectedEvent.sub_type} onClick={() => onSubTypeChange("other")} color="gray" />
            </div>
          )}

          {!isMonthApproved && (
            <div className="flex gap-3 pt-6 border-t border-gray-100">
              <Button
                onClick={onOpenEditModal}
                variant="outline"
                className="flex-1 h-12 rounded-xl font-bold border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                수정하기
              </Button>
              <Button
                onClick={onDelete}
                variant="ghost"
                className="h-12 px-4 rounded-xl font-bold text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                삭제
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper components
function StatusButton({ status, label, icon, currentStatus, onClick, color }: {
  status: string; label: string; icon: string; currentStatus?: string;
  onClick: () => void; color: string;
}) {
  const isSelected = currentStatus === status;
  const colorClasses: Record<string, { selected: string; normal: string }> = {
    indigo: { selected: "bg-indigo-50 border-indigo-200 text-indigo-600 ring-2 ring-indigo-400", normal: "bg-white border-gray-100 text-gray-600 hover:bg-gray-50" },
    green: { selected: "bg-green-50 border-green-200 text-green-600 ring-2 ring-green-400", normal: "bg-white border-gray-100 text-gray-600 hover:bg-gray-50" },
    red: { selected: "bg-red-50 border-red-200 text-red-600 ring-2 ring-red-400", normal: "bg-white border-gray-100 text-gray-600 hover:bg-gray-50" },
    gray: { selected: "bg-gray-100 border-gray-300 text-gray-700 ring-2 ring-gray-400", normal: "bg-white border-gray-100 text-gray-600 hover:bg-gray-50" },
    blue: { selected: "bg-blue-50 border-blue-200 text-blue-600 ring-2 ring-blue-400", normal: "bg-white border-gray-100 text-gray-600 hover:bg-gray-50" },
    purple: { selected: "bg-purple-50 border-purple-200 text-purple-600 ring-2 ring-purple-400", normal: "bg-white border-gray-100 text-gray-600 hover:bg-gray-50" },
  };

  return (
    <button onClick={onClick} className={cn(
      "flex flex-col items-center justify-center p-4 rounded-2xl border-b-4 transition-all",
      isSelected ? colorClasses[color]?.selected : colorClasses[color]?.normal
    )}>
      <span className="text-2xl mb-1">{icon}</span>
      <span className="font-bold text-sm">{label}</span>
    </button>
  );
}

function SubTypeButton({ subType, label, icon, currentSubType, onClick, color }: {
  subType: string; label: string; icon: string; currentSubType?: string;
  onClick: () => void; color: string;
}) {
  const isSelected = currentSubType === subType;
  const colorClasses: Record<string, { selected: string; normal: string }> = {
    blue: { selected: "bg-blue-50 border-blue-200 text-blue-600 ring-2 ring-blue-400", normal: "bg-white border-gray-100 text-gray-600 hover:bg-gray-50" },
    teal: { selected: "bg-teal-50 border-teal-200 text-teal-600 ring-2 ring-teal-400", normal: "bg-white border-gray-100 text-gray-600 hover:bg-gray-50" },
    amber: { selected: "bg-amber-50 border-amber-200 text-amber-600 ring-2 ring-amber-400", normal: "bg-white border-gray-100 text-gray-600 hover:bg-gray-50" },
    gray: { selected: "bg-gray-100 border-gray-300 text-gray-600 ring-2 ring-gray-400", normal: "bg-white border-gray-100 text-gray-600 hover:bg-gray-50" },
    yellow: { selected: "bg-yellow-50 border-yellow-200 text-yellow-600 ring-2 ring-yellow-400", normal: "bg-white border-gray-100 text-gray-600 hover:bg-gray-50" },
    indigo: { selected: "bg-indigo-50 border-indigo-200 text-indigo-600 ring-2 ring-indigo-400", normal: "bg-white border-gray-100 text-gray-600 hover:bg-gray-50" },
    green: { selected: "bg-green-50 border-green-200 text-green-600 ring-2 ring-green-400", normal: "bg-white border-gray-100 text-gray-600 hover:bg-gray-50" },
    purple: { selected: "bg-purple-50 border-purple-200 text-purple-600 ring-2 ring-purple-400", normal: "bg-white border-gray-100 text-gray-600 hover:bg-gray-50" },
  };

  return (
    <button onClick={onClick} className={cn(
      "flex flex-col items-center justify-center p-4 rounded-2xl border-b-4 transition-all",
      isSelected ? colorClasses[color]?.selected : colorClasses[color]?.normal
    )}>
      <span className="text-2xl mb-1">{icon}</span>
      <span className="font-bold text-sm">{label}</span>
    </button>
  );
}
