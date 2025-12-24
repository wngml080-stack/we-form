"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectedEvent } from "../../hooks/useStaffPageData";

interface EditClassModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEvent: SelectedEvent | null;
  editDate: string;
  setEditDate: (date: string) => void;
  editStartTime: string;
  setEditStartTime: (time: string) => void;
  editDuration: string;
  setEditDuration: (duration: string) => void;
  editClassType: string;
  setEditClassType: (type: string) => void;
  editMemberName: string;
  editPersonalTitle: string;
  setEditPersonalTitle: (title: string) => void;
  editSubType: string;
  setEditSubType: (subType: string) => void;
  onSubmit: () => void;
}

export function EditClassModal({
  isOpen, onOpenChange, selectedEvent,
  editDate, setEditDate, editStartTime, setEditStartTime,
  editDuration, setEditDuration, editClassType, setEditClassType,
  editMemberName, editPersonalTitle, setEditPersonalTitle,
  editSubType, setEditSubType, onSubmit
}: EditClassModalProps) {
  const isPersonal = selectedEvent?.type?.toLowerCase() === 'personal';
  const isConsulting = selectedEvent?.type?.toLowerCase() === 'consulting';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isPersonal ? '개인일정 수정' : '수업 수정'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isPersonal ? '개인일정 정보를 수정합니다' : '수업 정보를 수정합니다'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* 개인일정: 제목 입력 */}
          {isPersonal ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500">일정 제목</Label>
              <Input
                type="text"
                value={editPersonalTitle}
                onChange={(e) => setEditPersonalTitle(e.target.value)}
                placeholder="일정 제목을 입력하세요"
                className="h-11 bg-gray-50 border-gray-200 font-bold"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500">회원 이름</Label>
              <div className="h-11 flex items-center px-3 bg-gray-100 rounded-lg text-gray-500 font-bold border border-gray-200">
                {editMemberName}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-500">날짜 변경</Label>
            <Input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="h-11 bg-gray-50 border-gray-200 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500">시작 시간</Label>
              <Input
                type="time"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
                className="h-11 bg-gray-50 border-gray-200 font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500">진행 시간</Label>
              <Select value={editDuration} onValueChange={setEditDuration}>
                <SelectTrigger className="h-11 bg-gray-50 border-gray-200 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30분 (OT)</SelectItem>
                  <SelectItem value="50">50분 (기본)</SelectItem>
                  <SelectItem value="60">60분</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 개인일정: sub_type 선택 */}
          {isPersonal && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500">일정 분류</Label>
              <Select value={editSubType} onValueChange={setEditSubType}>
                <SelectTrigger className="h-11 bg-gray-50 border-gray-200 font-bold">
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
          {isConsulting && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500">상담 분류</Label>
              <Select value={editSubType} onValueChange={setEditSubType}>
                <SelectTrigger className="h-11 bg-gray-50 border-gray-200 font-bold">
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

          {/* PT/OT: 수업 종류 선택 */}
          {!isPersonal && !isConsulting && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500">수업 종류</Label>
              <Select value={editClassType} onValueChange={setEditClassType}>
                <SelectTrigger className="h-11 bg-gray-50 border-gray-200 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PT">PT</SelectItem>
                  <SelectItem value="OT">OT</SelectItem>
                  <SelectItem value="Consulting">상담</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={onSubmit}
            className="bg-[#2F80ED] hover:bg-[#1c6cd7] text-white w-full h-12 rounded-xl text-lg font-bold"
          >
            수정 완료
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
