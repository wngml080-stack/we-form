"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { StaffEditForm } from "../../hooks/useSystemData";

interface StaffEditModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: StaffEditForm;
  setForm: (form: StaffEditForm) => void;
  onSubmit: () => void;
}

import { cn } from "@/lib/utils";
import { User, Phone, Briefcase, Shield, Activity, Save, Pencil } from "lucide-react";

export function StaffEditModal({ isOpen, onOpenChange, form, setForm, onSubmit }: StaffEditModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg bg-[#f8fafc] p-0 border-none rounded-2xl xs:rounded-3xl sm:rounded-[40px] shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Pencil className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">직원 정보 수정</h2>
              <p className="text-emerald-200/60 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Edit System Staff Profile</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">이름 *</Label>
                <div className="relative">
                  <Input 
                    value={form.name} 
                    onChange={(e) => setForm({...form, name: e.target.value})} 
                    placeholder="성함 입력"
                    className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-emerald-100 transition-all pl-10"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">연락처</Label>
                <div className="relative">
                  <Input 
                    value={form.phone} 
                    onChange={(e) => setForm({...form, phone: e.target.value})} 
                    placeholder="010-0000-0000"
                    className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-emerald-100 transition-all pl-10"
                  />
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">직책</Label>
              <div className="relative">
                <Input 
                  value={form.job_title} 
                  onChange={(e) => setForm({...form, job_title: e.target.value})} 
                  placeholder="예: 트레이너, 매니저"
                  className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-emerald-100 transition-all pl-10"
                />
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">시스템 권한</Label>
                <div className="relative">
                  <Select value={form.role} onValueChange={(v: any) => setForm({...form, role: v})}>
                    <SelectTrigger className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-emerald-100 transition-all pl-10">
                      <SelectValue/>
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                      <SelectItem value="system_admin" className="rounded-xl font-bold py-3 text-rose-600 font-black">시스템 관리자</SelectItem>
                      <SelectItem value="company_admin" className="rounded-xl font-bold py-3 text-emerald-600">본사 관리자</SelectItem>
                      <SelectItem value="admin" className="rounded-xl font-bold py-3 text-blue-600">지점 관리자</SelectItem>
                      <SelectItem value="staff" className="rounded-xl font-bold py-3 text-slate-600">일반 직원</SelectItem>
                    </SelectContent>
                  </Select>
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">재직 상태</Label>
                <div className="relative">
                  <Select value={form.employment_status} onValueChange={(v: any) => setForm({...form, employment_status: v})}>
                    <SelectTrigger className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-emerald-100 transition-all pl-10">
                      <SelectValue/>
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                      <SelectItem value="재직" className="rounded-xl font-bold py-3 text-blue-600 font-black">재직 중</SelectItem>
                      <SelectItem value="퇴사" className="rounded-xl font-bold py-3 text-rose-600">퇴사 처리</SelectItem>
                      <SelectItem value="가입대기" className="rounded-xl font-bold py-3 text-amber-600">가입 승인 대기</SelectItem>
                    </SelectContent>
                  </Select>
                  <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 h-12 rounded-2xl font-black text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">
              취소
            </Button>
            <Button 
              onClick={onSubmit} 
              className="flex-[2] h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> 저장하기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
