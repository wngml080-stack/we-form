"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AnnouncementForm } from "../../hooks/useSystemData";
import { Bell, Clock, Save, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnnouncementCreateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: AnnouncementForm;
  setForm: (form: AnnouncementForm) => void;
  onSubmit: () => void;
}

export function AnnouncementCreateModal({ isOpen, onOpenChange, form, setForm, onSubmit }: AnnouncementCreateModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#f8fafc] p-0 border-none rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle asChild>
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Bell className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight" style={{ color: 'white' }}>시스템 공지사항 추가</h2>
                <p className="text-orange-200/60 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">New System Announcement (v1.1)</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">시스템 공지사항을 작성합니다</DialogDescription>
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-white custom-scrollbar">
          <div className="space-y-6">
            <div className="space-y-2.5">
              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">공지 제목</Label>
              <Input 
                value={form.title} 
                onChange={(e) => setForm({...form, title: e.target.value})} 
                placeholder="공지사항의 제목을 입력하세요"
                className="h-14 px-6 rounded-2xl bg-slate-50 border-none focus-visible:ring-orange-500 font-bold text-lg"
              />
            </div>
            
            <div className="space-y-2.5">
              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">공지 내용</Label>
              <Textarea 
                value={form.content} 
                onChange={(e) => setForm({...form, content: e.target.value})} 
                placeholder="전달하실 상세 내용을 입력하세요"
                className="min-h-[200px] p-6 rounded-[24px] bg-slate-50 border-none focus-visible:ring-orange-500 font-medium leading-relaxed resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-6 pt-2">
              <div className="space-y-2.5">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">우선순위</Label>
                <Select value={form.priority} onValueChange={(v: any) => setForm({...form, priority: v})}>
                  <SelectTrigger className="h-14 px-6 rounded-2xl bg-slate-50 border-none focus:ring-orange-500 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                    <SelectItem value="normal" className="rounded-xl py-3 font-bold">일반 공지</SelectItem>
                    <SelectItem value="urgent" className="rounded-xl py-3 font-bold text-rose-500">긴급 공지</SelectItem>
                    <SelectItem value="info" className="rounded-xl py-3 font-bold text-blue-500">정보 안내</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2.5">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">공지 유형</Label>
                <Select value={form.announcement_type} onValueChange={(v: any) => setForm({...form, announcement_type: v})}>
                  <SelectTrigger className="h-14 px-6 rounded-2xl bg-slate-50 border-none focus:ring-orange-500 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                    <SelectItem value="general" className="rounded-xl py-3 font-bold">일반 (General)</SelectItem>
                    <SelectItem value="update" className="rounded-xl py-3 font-bold">업데이트 (Update)</SelectItem>
                    <SelectItem value="maintenance" className="rounded-xl py-3 font-bold">점검 (Maintenance)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ready to Publish System Announcement</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="h-14 px-8 rounded-2xl font-black text-slate-400 hover:text-slate-900 transition-all"
            >
              취소
            </Button>
            <Button 
              onClick={onSubmit}
              className="h-14 px-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black shadow-xl shadow-orange-100 transition-all active:scale-95 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              공지사항 게시
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
