"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GymForm, CATEGORY_OPTIONS } from "../../hooks/useSystemData";
import { Building2, Calendar, Ruler, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GymCreateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: GymForm;
  setForm: (form: GymForm) => void;
  toggleCategory: (category: string) => void;
  onSubmit: () => void;
}

export function GymCreateModal({ isOpen, onOpenChange, form, setForm, toggleCategory, onSubmit }: GymCreateModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#f8fafc] p-0 border-none rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle asChild>
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white !text-white tracking-tight" style={{ color: 'white' }}>새 지점 추가</h2>
                <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Register New Branch (v1.1)</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">새로운 지점을 등록합니다</DialogDescription>
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-white custom-scrollbar">
          {/* 지점 기본 정보 */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-black text-slate-900">지점 기본 정보</h3>
            </div>
            
            <div className="space-y-2.5">
              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">지점명</Label>
              <Input 
                value={form.name} 
                onChange={(e) => setForm({...form, name: e.target.value})} 
                placeholder="예: We:form 강남점, 필라테스 서초점"
                className="h-14 px-6 rounded-2xl bg-slate-50 border-none focus-visible:ring-blue-500 font-bold text-lg"
              />
            </div>
          </div>

          {/* 서비스 카테고리 */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-black text-slate-900">제공 서비스 카테고리</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CATEGORY_OPTIONS.map((cat) => {
                const isSelected = form.categories.includes(cat.name);
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => toggleCategory(cat.name)}
                    className={cn(
                      "group p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                      isSelected 
                        ? "bg-blue-50 border-blue-600 shadow-lg shadow-blue-100/50" 
                        : "bg-white border-slate-50 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    <span className={cn(
                      "text-xl transition-transform duration-300 group-hover:scale-125",
                      isSelected ? "scale-110" : "grayscale opacity-50"
                    )}>
                      {cat.icon}
                    </span>
                    <span className={cn(
                      "text-[11px] font-black tracking-tighter",
                      isSelected ? "text-blue-600" : "text-slate-400"
                    )}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 추가 세부 정보 */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-black text-slate-900">세부 운영 정보</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 ml-1">
                  <Ruler className="w-3.5 h-3.5 text-slate-400" />
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">지점 규모 (평)</Label>
                </div>
                <Input 
                  type="number" 
                  value={form.size} 
                  onChange={(e) => setForm({...form, size: e.target.value})} 
                  placeholder="단위 제외 숫자만 입력"
                  className="h-14 px-6 rounded-2xl bg-slate-50 border-none focus-visible:ring-blue-500 font-bold"
                />
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 ml-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">공식 오픈일</Label>
                </div>
                <Input 
                  type="date" 
                  value={form.open_date} 
                  onChange={(e) => setForm({...form, open_date: e.target.value})} 
                  className="h-14 px-6 rounded-2xl bg-slate-50 border-none focus-visible:ring-blue-500 font-bold appearance-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ready to Initialize New Branch</p>
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
              지점 생성 확정
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
