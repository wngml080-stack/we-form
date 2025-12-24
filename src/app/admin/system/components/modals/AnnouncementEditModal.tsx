"use client";

import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { EditAnnouncementForm } from "../../hooks/useSystemData";

interface AnnouncementEditModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: EditAnnouncementForm;
  setForm: (form: EditAnnouncementForm) => void;
  onSubmit: () => void;
}

export function AnnouncementEditModal({ isOpen, onOpenChange, form, setForm, onSubmit }: AnnouncementEditModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#2F80ED]" />
            시스템 공지사항 수정
          </DialogTitle>
          <DialogDescription className="sr-only">시스템 공지사항을 수정합니다</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>제목 *</Label>
            <Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="공지사항 제목을 입력하세요"/>
          </div>
          <div className="space-y-2">
            <Label>내용 *</Label>
            <Textarea value={form.content} onChange={(e) => setForm({...form, content: e.target.value})} placeholder="공지사항 내용을 입력하세요" rows={4}/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>우선순위</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({...form, priority: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="urgent">긴급</SelectItem>
                  <SelectItem value="normal">일반</SelectItem>
                  <SelectItem value="info">안내</SelectItem>
                  <SelectItem value="update">업데이트</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>유형</Label>
              <Select value={form.announcement_type} onValueChange={(v) => setForm({...form, announcement_type: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="general">일반</SelectItem>
                  <SelectItem value="update">업데이트</SelectItem>
                  <SelectItem value="maintenance">점검</SelectItem>
                  <SelectItem value="feature">신기능</SelectItem>
                  <SelectItem value="notice">공지</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>시작일</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({...form, start_date: e.target.value})}/>
            </div>
            <div className="space-y-2">
              <Label>종료일 (선택)</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({...form, end_date: e.target.value})}/>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit_is_active"
              checked={form.is_active}
              onChange={(e) => setForm({...form, is_active: e.target.checked})}
              className="w-4 h-4 rounded border-gray-300"
            />
            <Label htmlFor="edit_is_active" className="cursor-pointer">활성화</Label>
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
