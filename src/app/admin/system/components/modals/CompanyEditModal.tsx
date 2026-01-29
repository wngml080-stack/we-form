"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CompanyEditForm } from "../../hooks/useSystemData";

interface CompanyEditModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: CompanyEditForm;
  setForm: (form: CompanyEditForm) => void;
  onSubmit: () => void;
}

import { Pencil, Save } from "lucide-react";

export function CompanyEditModal({ isOpen, onOpenChange, form, setForm, onSubmit }: CompanyEditModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg bg-[#f8fafc] p-0 border-none rounded-2xl xs:rounded-3xl sm:rounded-[40px] shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Pencil className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">회사 정보 수정</h2>
              <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Edit Company Profile</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">회사명 *</Label>
              <Input 
                value={form.name} 
                onChange={(e) => setForm({...form, name: e.target.value})} 
                placeholder="회사명을 입력하세요"
                className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">대표자명 *</Label>
                <Input 
                  value={form.representative_name} 
                  onChange={(e) => setForm({...form, representative_name: e.target.value})} 
                  placeholder="성함 입력"
                  className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">연락처</Label>
                <Input 
                  value={form.contact_phone} 
                  onChange={(e) => setForm({...form, contact_phone: e.target.value})} 
                  placeholder="010-0000-0000"
                  className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">상태</Label>
              <Select value={form.status} onValueChange={(v) => setForm({...form, status: v})}>
                <SelectTrigger className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-blue-100 transition-all">
                  <SelectValue/>
                </SelectTrigger>
                <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                  <SelectItem value="active" className="rounded-xl font-bold py-3 text-blue-600">운영중</SelectItem>
                  <SelectItem value="pending" className="rounded-xl font-bold py-3 text-amber-600">승인대기</SelectItem>
                  <SelectItem value="suspended" className="rounded-xl font-bold py-3 text-rose-600">이용정지</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 h-12 rounded-2xl font-black text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">
              취소
            </Button>
            <Button onClick={onSubmit} className="flex-[2] h-12 bg-[#2F80ED] hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> 저장하기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
