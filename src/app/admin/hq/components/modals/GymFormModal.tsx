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

import { cn } from "@/lib/utils";
import { Building, Ruler, Calendar, Check, Save, Plus } from "lucide-react";

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
  const title = isEditMode ? "지점 정보 수정" : "새 지점 생성";
  const buttonText = isEditMode ? "저장하기" : "지점 생성하기";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-[#f8fafc] p-0 border-none rounded-[40px] shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              {isEditMode ? <Building className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white !text-white">{title}</h2>
              <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">
                {isEditMode ? "Update Branch Information" : "Register New Fitness Center"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">지점명 *</Label>
              <Input
                value={formData.gymName}
                onChange={(e) => setFormData({ ...formData, gymName: e.target.value })}
                placeholder="지점 이름을 입력하세요"
                className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">운영 종목 (다중 선택) *</Label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = formData.category.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all border-none select-none shadow-sm",
                        isSelected
                          ? "bg-blue-600 text-white shadow-blue-100 scale-105"
                          : "bg-white text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      {cat} {isSelected && <Check className="w-3.5 h-3.5" />}
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
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
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
                    value={formData.open_date}
                    onChange={(e) => setFormData({ ...formData, open_date: e.target.value })}
                    className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-blue-100 transition-all pl-10"
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">지점장 선택 *</Label>
              <Select value={formData.managerId} onValueChange={(v) => setFormData({ ...formData, managerId: v })}>
                <SelectTrigger className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-blue-100 transition-all">
                  <SelectValue placeholder={isEditMode ? "변경 시 선택" : "지점장을 선택하세요"} />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2 max-h-[250px]">
                  {isEditMode && <SelectItem value="none" className="rounded-xl font-bold py-3 text-slate-400 italic">-- 변경 안함 --</SelectItem>}
                  {allStaffs.map(s => (
                    <SelectItem key={s.id} value={s.id} className="rounded-xl font-bold py-3">
                      <div className="flex items-center gap-2">
                        {s.name}
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-black">
                          {s.gyms?.name || '소속없음'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isEditMode && (
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">운영 상태 *</Label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-blue-100 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                    <SelectItem value="active" className="rounded-xl font-bold py-3 text-blue-600">운영중</SelectItem>
                    <SelectItem value="pending" className="rounded-xl font-bold py-3 text-amber-600">대기</SelectItem>
                    <SelectItem value="closed" className="rounded-xl font-bold py-3 text-rose-600">폐업</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">메모</Label>
              <Textarea
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                placeholder="지점 관련 특이사항을 입력하세요"
                className="min-h-[100px] bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-blue-100 transition-all resize-none p-4"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 h-12 rounded-2xl font-black text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">
              취소
            </Button>
            <Button 
              onClick={onSubmit} 
              disabled={isLoading}
              className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
            >
              {isEditMode ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {buttonText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
