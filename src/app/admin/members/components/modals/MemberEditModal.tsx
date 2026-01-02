"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPhoneNumberOnChange } from "@/lib/utils/phone-format";
import { User, X, Calendar as CalendarIcon, Info, Save, Phone, Target, Activity, Ruler, Weight, UserCircle, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface MemberEditFormData {
  name: string;
  phone: string;
  birth_date: string;
  gender: string;
  exercise_goal: string;
  weight: string;
  body_fat_mass: string;
  skeletal_muscle_mass: string;
  trainer_id: string;
  memo: string;
}

interface StaffMember {
  id: string;
  name: string;
}

interface MemberEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  formData: MemberEditFormData;
  setFormData: (data: MemberEditFormData) => void;
  staffList: StaffMember[];
  isLoading: boolean;
  onSubmit: () => void;
}

export function MemberEditModal({
  isOpen,
  onClose,
  memberName,
  formData,
  setFormData,
  staffList,
  isLoading,
  onSubmit,
}: MemberEditModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px]">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <UserCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">회원 기본정보 수정</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <p className="text-sm text-slate-400 font-bold">{memberName}님의 인적사항 및 프로필 관리</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">회원의 기본 인적사항과 인바디, 담당자 정보를 수정합니다</DialogDescription>
          <button
            onClick={onClose}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-[#f8fafc]">
          {/* 1. 인적 사항 섹션 */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">기본 인적 사항</h3>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: formatPhoneNumberOnChange(e.target.value)})}
                      placeholder="010-0000-0000"
                      className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Birth Date</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <Input
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                      className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</Label>
                  <Select value={formData.gender} onValueChange={(v) => setFormData({...formData, gender: v})}>
                    <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100">
                      <SelectValue placeholder="성별 선택" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-xl">
                      <SelectItem value="male">남성 (Male)</SelectItem>
                      <SelectItem value="female">여성 (Female)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </section>

          {/* 2. 관리 및 목표 섹션 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <section className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">담당 트레이너</h3>
              </div>
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                <Select value={formData.trainer_id || "none"} onValueChange={(v) => setFormData({...formData, trainer_id: v === "none" ? "" : v})}>
                  <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-indigo-100">
                    <SelectValue placeholder="담당 트레이너 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-2xl p-2 shadow-2xl">
                    <SelectItem value="none" className="rounded-xl focus:bg-slate-50">미지정 (None)</SelectItem>
                    {staffList.map(staff => (
                      <SelectItem key={staff.id} value={staff.id} className="rounded-xl focus:bg-indigo-50">
                        <span className="font-bold">{staff.name} 트레이너</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">운동 목표</h3>
              </div>
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                <Input
                  value={formData.exercise_goal}
                  onChange={(e) => setFormData({...formData, exercise_goal: e.target.value})}
                  placeholder="예: 체중 감량 5kg, 근력 강화 등..."
                  className="h-14 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </section>
          </div>

          {/* 3. 인바디 정보 섹션 */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">신체 측정 정보 (InBody)</h3>
            </div>
            <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-xl shadow-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Weight className="w-4 h-4 text-rose-400" />
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Weight</Label>
                  </div>
                  <div className="relative group">
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                      className="h-16 bg-white/5 border-none rounded-[24px] font-black text-3xl text-white pr-14 focus:ring-2 focus:ring-rose-500/30 transition-all"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-500">kg</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-rose-400" />
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Body Fat</Label>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.body_fat_mass}
                      onChange={(e) => setFormData({...formData, body_fat_mass: e.target.value})}
                      className="h-16 bg-white/5 border-none rounded-[24px] font-black text-3xl text-white pr-14 focus:ring-2 focus:ring-rose-500/30 transition-all"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-500">kg</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-rose-400" />
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Muscle Mass</Label>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.skeletal_muscle_mass}
                      onChange={(e) => setFormData({...formData, skeletal_muscle_mass: e.target.value})}
                      className="h-16 bg-white/5 border-none rounded-[24px] font-black text-3xl text-white pr-14 focus:ring-2 focus:ring-rose-500/30 transition-all"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-500">kg</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. 메모 섹션 */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">트레이너 특이사항 / 메모</h3>
            </div>
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
              <Textarea
                value={formData.memo}
                onChange={(e) => setFormData({...formData, memo: e.target.value})}
                placeholder="회원에 대한 추가적인 특이사항이나 전달 내용을 자유롭게 작성하세요..."
                className="min-h-[120px] bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-slate-100 resize-none p-6"
              />
            </div>
          </section>
        </div>

        <DialogFooter className="px-10 py-8 bg-white border-t flex items-center justify-end gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-14 px-8 rounded-2xl font-black text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"
          >
            취소
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isLoading}
            className="h-14 px-10 rounded-2xl bg-[#2F80ED] hover:bg-[#2570d6] font-black gap-3 shadow-xl shadow-blue-100 hover:-translate-y-1 transition-all text-white"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">수정 사항 반영 중...</span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                회원 정보 수정 완료
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
