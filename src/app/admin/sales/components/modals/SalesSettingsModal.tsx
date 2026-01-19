"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
interface CustomOption {
  id: string;
  name: string;
  display_order: number;
}

interface SalesSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // 기본 옵션들
  allSaleTypes: string[];
  allMembershipCategories: string[];
  allMembershipNames: string[];
  allPaymentMethods: string[];
  // 커스텀 옵션들 (삭제용)
  customSaleTypes: CustomOption[];
  customMembershipCategories: CustomOption[];
  customMembershipNames: CustomOption[];
  customPaymentMethods: CustomOption[];
  // 추가/삭제 함수
  onAddOption: (type: "sale_type" | "membership_category" | "membership_name" | "payment_method", name: string) => void;
  onDeleteOption: (type: "sale_type" | "membership_category" | "membership_name" | "payment_method", id: string) => void;
}

import { cn } from "@/lib/utils";
import { Plus, X, Settings, CreditCard, Ticket, Tags, ListTree } from "lucide-react";

export function SalesSettingsModal({
  isOpen,
  onClose,
  allSaleTypes,
  allMembershipCategories,
  allMembershipNames,
  allPaymentMethods,
  customSaleTypes,
  customMembershipCategories,
  customMembershipNames,
  customPaymentMethods,
  onAddOption,
  onDeleteOption
}: SalesSettingsModalProps) {
  const [newSaleType, setNewSaleType] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newName, setNewName] = useState("");
  const [newMethod, setNewMethod] = useState("");

  const methodLabels: Record<string, string> = {
    card: "카드",
    cash: "현금",
    transfer: "계좌이체"
  };

  // 기본 옵션인지 확인
  const defaultSaleTypes = ["신규", "재등록", "연장", "양도", "환불"];
  const defaultCategories = ["PT", "헬스", "필라테스", "요가", "수영", "골프", "GX"];
  const defaultNames = ["1개월", "3개월", "6개월", "12개월", "1회", "10회", "20회", "30회", "50회"];
  const defaultMethods = ["card", "cash", "transfer"];

  const handleAddSaleType = () => {
    if (newSaleType.trim()) {
      onAddOption("sale_type", newSaleType.trim());
      setNewSaleType("");
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      onAddOption("membership_category", newCategory.trim());
      setNewCategory("");
    }
  };

  const handleAddName = () => {
    if (newName.trim()) {
      onAddOption("membership_name", newName.trim());
      setNewName("");
    }
  };

  const handleAddMethod = () => {
    if (newMethod.trim()) {
      onAddOption("payment_method", newMethod.trim());
      setNewMethod("");
    }
  };

  const isCustomSaleType = (name: string) => !defaultSaleTypes.includes(name);
  const isCustomCategory = (name: string) => !defaultCategories.includes(name);
  const isCustomName = (name: string) => !defaultNames.includes(name);
  const isCustomMethod = (name: string) => !defaultMethods.includes(name);

  const getCustomOptionId = (type: string, name: string) => {
    switch (type) {
      case "sale_type":
        return customSaleTypes.find(o => o.name === name)?.id;
      case "membership_category":
        return customMembershipCategories.find(o => o.name === name)?.id;
      case "membership_name":
        return customMembershipNames.find(o => o.name === name)?.id;
      case "payment_method":
        return customPaymentMethods.find(o => o.name === name)?.id;
      default:
        return undefined;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#f8fafc] p-0 border-none rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* 헤더 */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white !text-white" style={{ color: 'white' }}>매출 항목 설정</h2>
              <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Sales Categories & Options</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          <Tabs defaultValue="sale_type" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1.5 rounded-[20px] h-auto mb-8">
              <TabsTrigger value="sale_type" className="rounded-xl py-2.5 text-xs font-black data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                <Tags className="w-3.5 h-3.5 mr-1.5" /> 유형
              </TabsTrigger>
              <TabsTrigger value="category" className="rounded-xl py-2.5 text-xs font-black data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                <ListTree className="w-3.5 h-3.5 mr-1.5" /> 회원권
              </TabsTrigger>
              <TabsTrigger value="name" className="rounded-xl py-2.5 text-xs font-black data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                <Ticket className="w-3.5 h-3.5 mr-1.5" /> 상품명
              </TabsTrigger>
              <TabsTrigger value="method" className="rounded-xl py-2.5 text-xs font-black data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                <CreditCard className="w-3.5 h-3.5 mr-1.5" /> 결제방법
              </TabsTrigger>
            </TabsList>

            {/* 유형 탭 */}
            <TabsContent value="sale_type" className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-wrap gap-2">
                  {allSaleTypes.map(type => {
                    const isCustom = isCustomSaleType(type);
                    const optionId = getCustomOptionId("sale_type", type);
                    return (
                      <span
                        key={type}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all",
                          isCustom 
                            ? "bg-blue-50 text-blue-600 border border-blue-100" 
                            : "bg-slate-50 text-slate-500 border border-slate-100 opacity-60"
                        )}
                      >
                        {type}
                        {isCustom && optionId && (
                          <button
                            onClick={() => onDeleteOption("sale_type", optionId)}
                            className="hover:bg-blue-100 p-0.5 rounded-md text-blue-400 hover:text-blue-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-2">
                  <Input
                    value={newSaleType}
                    onChange={(e) => setNewSaleType(e.target.value)}
                    placeholder="새로운 매출 유형 입력 (예: 체험수업)"
                    className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100 transition-all px-4"
                    onKeyPress={(e) => e.key === "Enter" && handleAddSaleType()}
                  />
                  <Button onClick={handleAddSaleType} className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg shadow-blue-100 transition-all shrink-0">
                    <Plus className="w-4 h-4 mr-1.5" /> 추가
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* 회원권 탭 */}
            <TabsContent value="category" className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-wrap gap-2">
                  {allMembershipCategories.map(cat => {
                    const isCustom = isCustomCategory(cat);
                    const optionId = getCustomOptionId("membership_category", cat);
                    return (
                      <span
                        key={cat}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all",
                          isCustom 
                            ? "bg-indigo-50 text-indigo-600 border border-indigo-100" 
                            : "bg-slate-50 text-slate-500 border border-slate-100 opacity-60"
                        )}
                      >
                        {cat}
                        {isCustom && optionId && (
                          <button
                            onClick={() => onDeleteOption("membership_category", optionId)}
                            className="hover:bg-indigo-100 p-0.5 rounded-md text-indigo-400 hover:text-indigo-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="새 회원권 종류 입력 (예: 태권도)"
                    className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-100 transition-all px-4"
                    onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                  />
                  <Button onClick={handleAddCategory} className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 transition-all shrink-0">
                    <Plus className="w-4 h-4 mr-1.5" /> 추가
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* 회원권명 탭 */}
            <TabsContent value="name" className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-wrap gap-2">
                  {allMembershipNames.map(name => {
                    const isCustom = isCustomName(name);
                    const optionId = getCustomOptionId("membership_name", name);
                    return (
                      <span
                        key={name}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all",
                          isCustom 
                            ? "bg-purple-50 text-purple-600 border border-purple-100" 
                            : "bg-slate-50 text-slate-500 border border-slate-100 opacity-60"
                        )}
                      >
                        {name}
                        {isCustom && optionId && (
                          <button
                            onClick={() => onDeleteOption("membership_name", optionId)}
                            className="hover:bg-purple-100 p-0.5 rounded-md text-purple-400 hover:text-purple-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="상품 기간/횟수 단위 입력 (예: 24개월)"
                    className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-purple-100 transition-all px-4"
                    onKeyPress={(e) => e.key === "Enter" && handleAddName()}
                  />
                  <Button onClick={handleAddName} className="h-12 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black shadow-lg shadow-purple-100 transition-all shrink-0">
                    <Plus className="w-4 h-4 mr-1.5" /> 추가
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* 결제방법 탭 */}
            <TabsContent value="method" className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-wrap gap-2">
                  {allPaymentMethods.map(method => {
                    const isCustom = isCustomMethod(method);
                    const optionId = getCustomOptionId("payment_method", method);
                    return (
                      <span
                        key={method}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all",
                          isCustom 
                            ? "bg-orange-50 text-orange-600 border border-orange-100" 
                            : "bg-slate-50 text-slate-500 border border-slate-100 opacity-60"
                        )}
                      >
                        {methodLabels[method] || method}
                        {isCustom && optionId && (
                          <button
                            onClick={() => onDeleteOption("payment_method", optionId)}
                            className="hover:bg-orange-100 p-0.5 rounded-md text-orange-400 hover:text-orange-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-2">
                  <Input
                    value={newMethod}
                    onChange={(e) => setNewMethod(e.target.value)}
                    placeholder="새로운 결제 수단 입력 (예: 네이버페이)"
                    className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-orange-100 transition-all px-4"
                    onKeyPress={(e) => e.key === "Enter" && handleAddMethod()}
                  />
                  <Button onClick={handleAddMethod} className="h-12 px-6 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black shadow-lg shadow-orange-100 transition-all shrink-0">
                    <Plus className="w-4 h-4 mr-1.5" /> 추가
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
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
