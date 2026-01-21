"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CreateCompanyForm } from "../../hooks/useSystemData";
import { Building, User, Phone, ShieldCheck, X, CheckCircle2 } from "lucide-react";

interface CompanyCreateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: CreateCompanyForm;
  setForm: (form: CreateCompanyForm) => void;
  onSubmit: () => void;
}

export function CompanyCreateModal({ isOpen, onOpenChange, form, setForm, onSubmit }: CompanyCreateModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl bg-[#f8fafc] p-0 border-none rounded-2xl xs:rounded-3xl sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle asChild>
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Building className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white !text-white tracking-tight" style={{ color: 'white' }}>고객사 추가</h2>
                <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">New Client Registration (v1.1)</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">새로운 고객사를 등록합니다</DialogDescription>
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-white custom-scrollbar">
          {/* 고객사 기본 정보 */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-black text-slate-900">고객사 기본 정보</h3>
            </div>
            
            <div className="space-y-2.5">
              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">회사명</Label>
              <Input 
                value={form.name} 
                onChange={(e) => setForm({...form, name: e.target.value})} 
                placeholder="공식 법인명 또는 상호를 입력하세요"
                className="h-14 px-6 rounded-2xl bg-slate-50 border-none focus-visible:ring-blue-500 font-bold text-lg"
              />
            </div>
          </div>

          {/* 담당자 정보 */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-black text-slate-900">대표자 및 연락처</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 ml-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">대표자명</Label>
                </div>
                <Input 
                  value={form.representative_name} 
                  onChange={(e) => setForm({...form, representative_name: e.target.value})} 
                  placeholder="실명 입력"
                  className="h-14 px-6 rounded-2xl bg-slate-50 border-none focus-visible:ring-blue-500 font-bold"
                />
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 ml-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">연락처</Label>
                </div>
                <Input 
                  value={form.contact_phone} 
                  onChange={(e) => setForm({...form, contact_phone: e.target.value})} 
                  placeholder="010-0000-0000"
                  className="h-14 px-6 rounded-2xl bg-slate-50 border-none focus-visible:ring-blue-500 font-bold"
                />
              </div>
            </div>
          </div>

          {/* 운영 상태 설정 */}
          <div className="space-y-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-black text-slate-900">운영 상태 설정</h3>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2 ml-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">서비스 활성화 상태</Label>
              </div>
              <Select value={form.status} onValueChange={(v) => setForm({...form, status: v})}>
                <SelectTrigger className="h-14 px-6 rounded-2xl bg-slate-50 border-none focus:ring-blue-500 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                  <SelectItem value="pending" className="rounded-xl py-3 font-bold text-amber-600">승인 대기 (Pending)</SelectItem>
                  <SelectItem value="active" className="rounded-xl py-3 font-bold text-emerald-600">운영 중 (Active)</SelectItem>
                  <SelectItem value="suspended" className="rounded-xl py-3 font-bold text-rose-600">이용 정지 (Suspended)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ready to Register New Company</p>
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
              className="h-14 px-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              고객사 등록 확정
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
