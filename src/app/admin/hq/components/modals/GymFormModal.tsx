"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CATEGORY_OPTIONS, GymFormData } from "../../hooks/useHqData";

interface GymFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode: boolean;
  formData: GymFormData;
  setFormData: (data: GymFormData) => void;
  allStaffs: any[];
  toggleCategory: (cat: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function GymFormModal({
  isOpen,
  onOpenChange,
  isEditMode,
  formData,
  setFormData,
  allStaffs,
  toggleCategory,
  onSubmit,
  isLoading
}: GymFormModalProps) {
  const title = isEditMode ? "지점 수정" : "지점 생성";
  const buttonText = isEditMode ? "저장하기" : "생성하기";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">지점 정보를 입력합니다</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>지점명 <span className="text-red-500">*</span></Label>
              <Input
                value={formData.gymName}
                onChange={(e) => setFormData({ ...formData, gymName: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>운영 종목 (다중 선택) <span className="text-red-500">*</span></Label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = formData.category.includes(cat);
                  return (
                    <Badge
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`cursor-pointer text-sm py-1 px-3 select-none border ${
                        isSelected
                          ? "bg-[#2F80ED] text-white hover:bg-[#1c6cd7] border-[#2F80ED]"
                          : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {cat} {isSelected && "✓"}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>평수</Label>
              <Input
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="예: 100"
              />
            </div>
            <div className="space-y-2">
              <Label>오픈일</Label>
              <Input
                type="date"
                value={formData.open_date}
                onChange={(e) => setFormData({ ...formData, open_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>지점장 선택 <span className="text-red-500">*</span></Label>
            <Select value={formData.managerId} onValueChange={(v) => setFormData({ ...formData, managerId: v })}>
              <SelectTrigger>
                <SelectValue placeholder={isEditMode ? "변경 시 선택" : "선택"} />
              </SelectTrigger>
              <SelectContent className="bg-white max-h-[200px]">
                {isEditMode && <SelectItem value="none">-- 변경 안함 --</SelectItem>}
                {allStaffs.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} <span className="text-xs text-gray-400">({s.gyms?.name || '소속없음'})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isEditMode && (
            <div className="space-y-2">
              <Label>상태 <span className="text-red-500">*</span></Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="active">운영중</SelectItem>
                  <SelectItem value="pending">대기</SelectItem>
                  <SelectItem value="closed">폐업</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>메모</Label>
            <Textarea
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              placeholder="특이사항 입력"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={onSubmit}
            className="bg-[#2F80ED] hover:bg-[#1c6cd7]"
            disabled={isLoading}
          >
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
