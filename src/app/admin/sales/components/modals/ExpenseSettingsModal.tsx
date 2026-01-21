"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Plus, X, Settings, FolderOpen } from "lucide-react";

interface CustomCategory {
  id: string;
  name: string;
  display_order: number;
}

interface ExpenseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allCategories: string[];
  customCategories: CustomCategory[];
  onAddCategory: (name: string) => void;
  onDeleteCategory: (id: string) => void;
}

export function ExpenseSettingsModal({
  isOpen,
  onClose,
  allCategories,
  customCategories,
  onAddCategory,
  onDeleteCategory
}: ExpenseSettingsModalProps) {
  const [newCategory, setNewCategory] = useState("");

  // 기본 카테고리
  const defaultCategories = ["인건비", "임대료", "관리비", "재료비", "마케팅비", "장비/시설", "기타"];

  const isCustomCategory = (name: string) => !defaultCategories.includes(name);

  const getCustomCategoryId = (name: string) => {
    return customCategories.find(c => c.name === name)?.id;
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim());
      setNewCategory("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg bg-[#f8fafc] p-0 border-none rounded-2xl xs:rounded-3xl sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* 헤더 */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white !text-white" style={{ color: 'white' }}>지출 카테고리 설정</h2>
              <p className="text-rose-200/60 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Expense Categories</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="bg-white p-6 rounded-2xl xs:rounded-3xl sm:rounded-[32px] border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">카테고리 목록</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {allCategories.map(category => {
                const isCustom = isCustomCategory(category);
                const categoryId = getCustomCategoryId(category);
                return (
                  <span
                    key={category}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all",
                      isCustom
                        ? "bg-rose-50 text-rose-600 border border-rose-100"
                        : "bg-slate-50 text-slate-500 border border-slate-100 opacity-60"
                    )}
                  >
                    {category}
                    {isCustom && categoryId && (
                      <button
                        onClick={() => onDeleteCategory(categoryId)}
                        className="hover:bg-rose-100 p-0.5 rounded-md text-rose-400 hover:text-rose-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-100">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="새 지출 카테고리 입력 (예: 소모품비)"
                className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-rose-100 transition-all px-4"
                onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
              />
              <Button
                onClick={handleAddCategory}
                className="h-12 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black shadow-lg shadow-rose-100 transition-all shrink-0"
              >
                <Plus className="w-4 h-4 mr-1.5" /> 추가
              </Button>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-500">
            <p className="font-medium mb-1">안내</p>
            <ul className="space-y-1 text-slate-400">
              <li>- 기본 카테고리(회색)는 삭제할 수 없습니다.</li>
              <li>- 직접 추가한 카테고리(분홍색)만 삭제할 수 있습니다.</li>
              <li>- 삭제된 카테고리는 기존 지출 기록에 영향을 주지 않습니다.</li>
            </ul>
          </div>
        </div>

        <div className="p-8 bg-white border-t border-slate-50 flex justify-end">
          <Button onClick={onClose} className="h-12 px-8 bg-slate-900 hover:bg-black text-white rounded-2xl font-black shadow-lg shadow-slate-200 transition-all">
            설정 완료
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
