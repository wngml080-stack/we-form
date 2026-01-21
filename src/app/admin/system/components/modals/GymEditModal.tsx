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

import { cn } from "@/lib/utils";
import { Building, Ruler, Calendar, Check, Save, Pencil } from "lucide-react";

export function GymEditModal({ isOpen, onOpenChange, form, setForm, toggleEditCategory, onSubmit }: GymEditModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-[#f8fafc] p-0 border-none rounded-2xl xs:rounded-3xl sm:rounded-[40px] shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Pencil className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">지점 정보 수정</h2>
              <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Edit Branch Profile</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">지점명 *</Label>
              <Input 
                value={form.name} 
                onChange={(e) => setForm({...form, name: e.target.value})} 
                placeholder="예: 강남점"
                className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">카테고리 (다중 선택 가능)</Label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = form.categories.includes(cat.name);
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => toggleEditCategory(cat.name)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 p-3 rounded-2xl text-[10px] font-black transition-all border-none select-none shadow-sm",
                        isSelected
                          ? cn("text-white shadow-md scale-105", cat.bg)
                          : "bg-white text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      {cat.name}
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">규모 (평)</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={form.size} 
                    onChange={(e) => setForm({...form, size: e.target.value})} 
                    placeholder="예: 100"
                    className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-blue-100 transition-all pl-10"
                  />
                  <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">오픈일</Label>
                <div className="relative">
                  <Input 
                    type="date" 
                    value={form.open_date} 
                    onChange={(e) => setForm({...form, open_date: e.target.value})}
                    className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-blue-100 transition-all pl-10"
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">메모</Label>
                <Input 
                  value={form.memo} 
                  onChange={(e) => setForm({...form, memo: e.target.value})} 
                  placeholder="지점 관련 특이사항"
                  className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">운영 상태</Label>
                <Select value={form.status} onValueChange={(v: any) => setForm({...form, status: v})}>
                  <SelectTrigger className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-blue-100 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                    <SelectItem value="active" className="rounded-xl font-bold py-3 text-blue-600">운영중</SelectItem>
                    <SelectItem value="closed" className="rounded-xl font-bold py-3 text-rose-600">폐업</SelectItem>
                    <SelectItem value="suspended" className="rounded-xl font-bold py-3 text-slate-400">이용중단</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 h-12 rounded-2xl font-black text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">
              취소
            </Button>
            <Button 
              onClick={onSubmit} 
              className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> 저장하기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
