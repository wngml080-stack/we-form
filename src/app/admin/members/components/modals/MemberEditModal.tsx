"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { formatPhoneNumberOnChange } from "@/lib/utils/phone-format";

interface MemberEditFormData {
  name: string;
  phone: string;
  birth_date: string;
  gender: string;
  exercise_goal: string;
  weight: string;
  body_fat_mass: string;
  skeletal_muscle_mass: string;
  trainer_id: string;
  memo: string;
}

interface StaffMember {
  id: string;
  name: string;
}

interface MemberEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  formData: MemberEditFormData;
  setFormData: (data: MemberEditFormData) => void;
  staffList: StaffMember[];
  isLoading: boolean;
  onSubmit: () => void;
}

export function MemberEditModal({
  isOpen,
  onClose,
  memberName,
  formData,
  setFormData,
  staffList,
  isLoading,
  onSubmit,
}: MemberEditModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>회원정보 수정 - {memberName}</DialogTitle>
          <DialogDescription className="sr-only">회원정보를 수정합니다</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>이름 <span className="text-red-500">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>연락처</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: formatPhoneNumberOnChange(e.target.value)})}
                placeholder="010-0000-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>생년월일</Label>
              <Input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>성별</Label>
              <Select value={formData.gender} onValueChange={(v) => setFormData({...formData, gender: v})}>
                <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">남성</SelectItem>
                  <SelectItem value="female">여성</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 담당 트레이너 */}
          <div className="space-y-2">
            <Label>담당 트레이너</Label>
            <Select value={formData.trainer_id || "none"} onValueChange={(v) => setFormData({...formData, trainer_id: v === "none" ? "" : v})}>
              <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">미지정</SelectItem>
                {staffList.map(staff => (
                  <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 운동 목표 */}
          <div className="space-y-2">
            <Label>운동 목표</Label>
            <Input
              value={formData.exercise_goal}
              onChange={(e) => setFormData({...formData, exercise_goal: e.target.value})}
              placeholder="예: 체중 감량, 근력 강화"
            />
          </div>

          {/* 인바디 정보 */}
          <div className="border-t pt-4">
            <Label className="text-sm font-semibold text-gray-700 mb-3 block">인바디 정보</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">체중 (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">체지방량 (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.body_fat_mass}
                  onChange={(e) => setFormData({...formData, body_fat_mass: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">골격근량 (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.skeletal_muscle_mass}
                  onChange={(e) => setFormData({...formData, skeletal_muscle_mass: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-2">
            <Label>메모</Label>
            <Textarea
              value={formData.memo}
              onChange={(e) => setFormData({...formData, memo: e.target.value})}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={onSubmit} className="bg-[#2F80ED] hover:bg-[#2570d6] text-white font-semibold" disabled={isLoading}>
            {isLoading ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
