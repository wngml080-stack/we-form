"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { EventForm } from "../../hooks/useHqData";

interface EventModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent: any | null;
  eventForm: EventForm;
  setEventForm: (form: EventForm) => void;
  gyms: any[];
  onSubmit: () => void;
  isLoading: boolean;
}

export function EventModal({
  isOpen,
  onOpenChange,
  editingEvent,
  eventForm,
  setEventForm,
  gyms,
  onSubmit,
  isLoading
}: EventModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            {editingEvent ? '회사 일정 & 행사 수정' : '새 회사 일정 & 행사 등록'}
          </DialogTitle>
          <DialogDescription className="sr-only">회사 일정 & 행사 정보를 입력합니다</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* 행사명 */}
          <div>
            <Label htmlFor="event-title" className="text-sm font-semibold text-gray-700">
              행사명 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="event-title"
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              placeholder="행사 이름을 입력하세요"
              className="mt-1"
            />
          </div>

          {/* 설명 */}
          <div>
            <Label htmlFor="event-description" className="text-sm font-semibold text-gray-700">
              설명
            </Label>
            <Textarea
              id="event-description"
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              placeholder="행사 설명을 입력하세요 (선택사항)"
              className="mt-1 min-h-[100px]"
            />
          </div>

          {/* 행사 유형과 대상 지점 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event-type" className="text-sm font-semibold text-gray-700">
                행사 유형 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={eventForm.event_type}
                onValueChange={(value) => setEventForm({ ...eventForm, event_type: value })}
              >
                <SelectTrigger className="mt-1 bg-white">
                  <SelectValue placeholder="행사 유형 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="general">일반</SelectItem>
                  <SelectItem value="training">교육</SelectItem>
                  <SelectItem value="meeting">회의</SelectItem>
                  <SelectItem value="holiday">휴무</SelectItem>
                  <SelectItem value="celebration">행사</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="event-gym" className="text-sm font-semibold text-gray-700">
                대상 지점
              </Label>
              <Select
                value={eventForm.gym_id}
                onValueChange={(value) => setEventForm({ ...eventForm, gym_id: value })}
              >
                <SelectTrigger className="mt-1 bg-white">
                  <SelectValue placeholder="전사 행사 (모든 지점)" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">전사 행사 (모든 지점)</SelectItem>
                  {gyms.map((gym) => (
                    <SelectItem key={gym.id} value={gym.id}>
                      {gym.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 행사 날짜 */}
          <div>
            <Label htmlFor="event-date" className="text-sm font-semibold text-gray-700">
              행사 날짜 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="event-date"
              type="date"
              value={eventForm.event_date}
              onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* 시간 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event-start-time" className="text-sm font-semibold text-gray-700">
                시작 시간
              </Label>
              <Input
                id="event-start-time"
                type="time"
                value={eventForm.start_time}
                onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="event-end-time" className="text-sm font-semibold text-gray-700">
                종료 시간
              </Label>
              <Input
                id="event-end-time"
                type="time"
                value={eventForm.end_time}
                onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          {/* 장소 */}
          <div>
            <Label htmlFor="event-location" className="text-sm font-semibold text-gray-700">
              장소
            </Label>
            <Input
              id="event-location"
              value={eventForm.location}
              onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
              placeholder="행사 장소를 입력하세요 (선택사항)"
              className="mt-1"
            />
          </div>

          {/* 참석 대상 */}
          <div>
            <Label htmlFor="event-target" className="text-sm font-semibold text-gray-700">
              참석 대상
            </Label>
            <Select
              value={eventForm.target_audience}
              onValueChange={(value) => setEventForm({ ...eventForm, target_audience: value })}
            >
              <SelectTrigger className="mt-1 bg-white">
                <SelectValue placeholder="참석 대상 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="management">관리자</SelectItem>
                <SelectItem value="trainers">트레이너</SelectItem>
                <SelectItem value="specific">특정 인원</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 색상 */}
          <div>
            <Label htmlFor="event-color" className="text-sm font-semibold text-gray-700">
              캘린더 색상
            </Label>
            <Select
              value={eventForm.color}
              onValueChange={(value) => setEventForm({ ...eventForm, color: value })}
            >
              <SelectTrigger className="mt-1 bg-white">
                <SelectValue placeholder="색상 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="blue">파란색</SelectItem>
                <SelectItem value="red">빨간색</SelectItem>
                <SelectItem value="green">초록색</SelectItem>
                <SelectItem value="yellow">노란색</SelectItem>
                <SelectItem value="purple">보라색</SelectItem>
                <SelectItem value="orange">주황색</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 활성 상태 */}
          <div className="flex items-center gap-2 pt-2">
            <input
              id="event-active"
              type="checkbox"
              checked={eventForm.is_active}
              onChange={(e) => setEventForm({ ...eventForm, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="event-active" className="text-sm text-gray-700 cursor-pointer">
              즉시 활성화 (체크 해제 시 비활성 상태로 저장)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? '저장 중...' : (editingEvent ? '수정' : '등록')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
