"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { X, UserPlus, Dumbbell } from "lucide-react";

// 자주 사용되는 종목 제안
const SUGGESTED_CATEGORIES = [
  "헬스",
  "필라테스",
  "골프",
  "수영",
  "요가",
  "복싱",
  "크로스핏",
];

interface StaffMember {
  id: string;
  name: string;
}

interface TrainerAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  staffList: StaffMember[];
  isLoading: boolean;
  onSubmit: (data: {
    category: string;
    trainer_id: string;
  }) => void;
  existingCategories?: string[]; // 이미 배정된 종목들
}

export function TrainerAssignModal({
  isOpen,
  onClose,
  memberName,
  staffList,
  isLoading,
  onSubmit,
  existingCategories = [],
}: TrainerAssignModalProps) {
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [trainerId, setTrainerId] = useState("");

  const handleSubmit = () => {
    const finalCategory = category === "custom" ? customCategory.trim() : category;
    if (!finalCategory || !trainerId) {
      return;
    }

    onSubmit({
      category: finalCategory,
      trainer_id: trainerId,
    });
  };

  const handleClose = () => {
    setCategory("");
    setCustomCategory("");
    setTrainerId("");
    onClose();
  };

  const isValid = trainerId && (category === "custom" ? customCategory.trim() : category);

  // 이미 배정된 종목 제외
  const availableCategories = SUGGESTED_CATEGORIES.filter(
    c => !existingCategories.includes(c)
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px]">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">트레이너 배정</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <p className="text-sm text-slate-400 font-bold">{memberName}님의 종목별 담당자 추가</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            종목별 트레이너 배정
          </DialogDescription>
          <button
            onClick={handleClose}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-[#f8fafc]">
          {/* 종목 선택 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Dumbbell className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">종목 선택 *</h3>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
              {/* 종목 버튼들 */}
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategory(cat);
                      setCustomCategory("");
                    }}
                    className={`px-5 py-3 rounded-xl font-bold transition-all ${
                      category === cat
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                <button
                  onClick={() => setCategory("custom")}
                  className={`px-5 py-3 rounded-xl font-bold transition-all ${
                    category === "custom"
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  + 직접 입력
                </button>
              </div>

              {/* 직접 입력 필드 */}
              {category === "custom" && (
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    종목명 직접 입력 *
                  </Label>
                  <Input
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="예: 테니스, 스쿼시, 배드민턴 등..."
                    className="h-14 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              )}
            </div>
          </section>

          {/* 트레이너 선택 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">담당 트레이너 *</h3>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
              <Select value={trainerId} onValueChange={setTrainerId}>
                <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-indigo-100">
                  <SelectValue placeholder="트레이너를 선택하세요" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-2xl p-2 shadow-2xl">
                  {staffList.map(staff => (
                    <SelectItem key={staff.id} value={staff.id} className="rounded-xl focus:bg-indigo-50">
                      <span className="font-bold">{staff.name} 트레이너</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>
        </div>

        <DialogFooter className="px-10 py-8 bg-white border-t flex items-center justify-end gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            className="h-14 px-8 rounded-2xl font-black text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !isValid}
            className="h-14 px-10 rounded-2xl bg-emerald-500 hover:bg-emerald-600 font-black gap-3 shadow-xl shadow-emerald-100 hover:-translate-y-1 transition-all text-white disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">배정 중...</span>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                트레이너 배정
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
