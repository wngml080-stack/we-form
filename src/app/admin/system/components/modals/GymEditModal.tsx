"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { EditGymForm, CATEGORY_OPTIONS } from "../../hooks/useSystemData";

interface GymEditModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: EditGymForm;
  setForm: (form: EditGymForm) => void;
  toggleEditCategory: (category: string) => void;
  onSubmit: () => void;
}

export function GymEditModal({ isOpen, onOpenChange, form, setForm, toggleEditCategory, onSubmit }: GymEditModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>지점 정보 수정</DialogTitle>
          <DialogDescription className="sr-only">지점 정보를 수정합니다</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>지점명 *</Label>
            <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="예: 강남점"/>
          </div>
          <div className="space-y-2">
            <Label>카테고리 (중복 선택 가능)</Label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORY_OPTIONS.map((cat) => {
                const isSelected = form.categories.includes(cat.name);
                return (
                  <Button
                    key={cat.name}
                    type="button"
                    size="sm"
                    variant="outline"
                    className={isSelected
                      ? `${cat.bg} ${cat.hoverBg} text-white border-transparent`
                      : `${cat.border} ${cat.text} hover:${cat.bg} hover:text-white bg-white`
                    }
                    onClick={() => toggleEditCategory(cat.name)}
                  >
                    {cat.name}
                  </Button>
                );
              })}
            </div>
            {form.categories.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">선택됨: {form.categories.join(", ")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>평수</Label>
            <Input type="number" value={form.size} onChange={(e) => setForm({...form, size: e.target.value})} placeholder="예: 100"/>
          </div>
          <div className="space-y-2">
            <Label>오픈일</Label>
            <Input type="date" value={form.open_date} onChange={(e) => setForm({...form, open_date: e.target.value})}/>
          </div>
          <div className="space-y-2">
            <Label>메모</Label>
            <Input value={form.memo} onChange={(e) => setForm({...form, memo: e.target.value})} placeholder="참고사항"/>
          </div>
          <div className="space-y-2">
            <Label>상태</Label>
            <Select value={form.status} onValueChange={(v) => setForm({...form, status: v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="active">운영중</SelectItem>
                <SelectItem value="closed">폐업</SelectItem>
                <SelectItem value="suspended">이용중단</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={onSubmit} className="bg-[#2F80ED]">저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
