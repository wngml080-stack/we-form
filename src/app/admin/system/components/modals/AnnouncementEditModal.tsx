"use client";

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

import { cn } from "@/lib/utils";
import { Megaphone, Save, Calendar, Pencil } from "lucide-react";

export function AnnouncementEditModal({ isOpen, onOpenChange, form, setForm, onSubmit }: AnnouncementEditModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-[#f8fafc] p-0 border-none rounded-[40px] shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Pencil className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">공지사항 수정</h2>
              <p className="text-orange-200/60 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Edit System Announcement</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">제목 *</Label>
              <Input 
                value={form.title} 
                onChange={(e) => setForm({...form, title: e.target.value})} 
                placeholder="공지사항 제목을 입력하세요"
                className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-orange-100 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">내용 *</Label>
              <Textarea 
                value={form.content} 
                onChange={(e) => setForm({...form, content: e.target.value})} 
                placeholder="공지사항 내용을 입력하세요"
                className="min-h-[150px] bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-orange-100 transition-all resize-none p-4"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">우선순위</Label>
                <Select value={form.priority} onValueChange={(v: any) => setForm({...form, priority: v})}>
                  <SelectTrigger className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-orange-100 transition-all">
                    <SelectValue/>
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                    <SelectItem value="normal" className="rounded-xl font-bold py-3 text-slate-600">일반</SelectItem>
                    <SelectItem value="urgent" className="rounded-xl font-bold py-3 text-rose-600 font-black">긴급</SelectItem>
                    <SelectItem value="info" className="rounded-xl font-bold py-3 text-blue-600">안내</SelectItem>
                    <SelectItem value="update" className="rounded-xl font-bold py-3 text-emerald-600">업데이트</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">유형</Label>
                <Select value={form.announcement_type} onValueChange={(v: any) => setForm({...form, announcement_type: v})}>
                  <SelectTrigger className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-orange-100 transition-all">
                    <SelectValue/>
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                    <SelectItem value="general" className="rounded-xl font-bold py-3">일반</SelectItem>
                    <SelectItem value="update" className="rounded-xl font-bold py-3">업데이트</SelectItem>
                    <SelectItem value="maintenance" className="rounded-xl font-bold py-3 text-rose-600">점검</SelectItem>
                    <SelectItem value="feature" className="rounded-xl font-bold py-3 text-blue-600">신기능</SelectItem>
                    <SelectItem value="notice" className="rounded-xl font-bold py-3 text-orange-600 font-black">공지</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">시작일</Label>
                <div className="relative">
                  <Input 
                    type="date" 
                    value={form.start_date} 
                    onChange={(e) => setForm({...form, start_date: e.target.value})}
                    className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-orange-100 transition-all pl-10"
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">종료일 (선택)</Label>
                <div className="relative">
                  <Input 
                    type="date" 
                    value={form.end_date} 
                    onChange={(e) => setForm({...form, end_date: e.target.value})}
                    className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-orange-100 transition-all pl-10"
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-orange-50">
              <input
                type="checkbox"
                id="edit_is_active"
                checked={form.is_active}
                onChange={(e) => setForm({...form, is_active: e.target.checked})}
                className="w-5 h-5 rounded-lg border-slate-200 text-orange-500 focus:ring-orange-100 transition-all cursor-pointer"
              />
              <Label htmlFor="edit_is_active" className="text-sm font-black text-slate-700 cursor-pointer">공지사항 활성화 (사용자에게 노출)</Label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 h-12 rounded-2xl font-black text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">
              취소
            </Button>
            <Button onClick={onSubmit} className="flex-[2] h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black shadow-lg shadow-orange-100 transition-all flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> 저장하기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
