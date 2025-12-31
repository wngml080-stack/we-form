"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Save } from "lucide-react";

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
      <DialogContent className="sm:max-w-[600px] bg-white max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>매출 설정</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="sale_type" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sale_type" className="text-xs">유형</TabsTrigger>
            <TabsTrigger value="category" className="text-xs">회원권</TabsTrigger>
            <TabsTrigger value="name" className="text-xs">회원권명</TabsTrigger>
            <TabsTrigger value="method" className="text-xs">결제방법</TabsTrigger>
          </TabsList>

          {/* 유형 탭 */}
          <TabsContent value="sale_type" className="space-y-4">
            <p className="text-sm text-gray-500">신규, 재등록, 연장, 양도, 환불 등의 매출 유형을 관리합니다.</p>
            <div className="flex flex-wrap gap-2">
              {allSaleTypes.map(type => {
                const isCustom = isCustomSaleType(type);
                const optionId = getCustomOptionId("sale_type", type);
                return (
                  <span
                    key={type}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${
                      isCustom ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {type}
                    {isCustom && optionId && (
                      <button
                        onClick={() => onDeleteOption("sale_type", optionId)}
                        className="hover:text-blue-900 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSaleType}
                onChange={(e) => setNewSaleType(e.target.value)}
                placeholder="새 유형 추가"
                className="flex-1"
                onKeyPress={(e) => e.key === "Enter" && handleAddSaleType()}
              />
              <Button variant="outline" size="sm" onClick={handleAddSaleType}>
                <Plus className="w-4 h-4 mr-1" /> 추가
              </Button>
            </div>
          </TabsContent>

          {/* 회원권 탭 */}
          <TabsContent value="category" className="space-y-4">
            <p className="text-sm text-gray-500">PT, 헬스, 필라테스 등의 회원권 종류를 관리합니다.</p>
            <div className="flex flex-wrap gap-2">
              {allMembershipCategories.map(cat => {
                const isCustom = isCustomCategory(cat);
                const optionId = getCustomOptionId("membership_category", cat);
                return (
                  <span
                    key={cat}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${
                      isCustom ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {cat}
                    {isCustom && optionId && (
                      <button
                        onClick={() => onDeleteOption("membership_category", optionId)}
                        className="hover:text-indigo-900 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="새 회원권 추가"
                className="flex-1"
                onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
              />
              <Button variant="outline" size="sm" onClick={handleAddCategory}>
                <Plus className="w-4 h-4 mr-1" /> 추가
              </Button>
            </div>
          </TabsContent>

          {/* 회원권명 탭 */}
          <TabsContent value="name" className="space-y-4">
            <p className="text-sm text-gray-500">1개월, 3개월, 10회 등의 회원권명을 관리합니다.</p>
            <div className="flex flex-wrap gap-2">
              {allMembershipNames.map(name => {
                const isCustom = isCustomName(name);
                const optionId = getCustomOptionId("membership_name", name);
                return (
                  <span
                    key={name}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${
                      isCustom ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {name}
                    {isCustom && optionId && (
                      <button
                        onClick={() => onDeleteOption("membership_name", optionId)}
                        className="hover:text-purple-900 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="새 회원권명 추가"
                className="flex-1"
                onKeyPress={(e) => e.key === "Enter" && handleAddName()}
              />
              <Button variant="outline" size="sm" onClick={handleAddName}>
                <Plus className="w-4 h-4 mr-1" /> 추가
              </Button>
            </div>
          </TabsContent>

          {/* 결제방법 탭 */}
          <TabsContent value="method" className="space-y-4">
            <p className="text-sm text-gray-500">카드, 현금, 계좌이체 외의 결제 방법을 추가할 수 있습니다.</p>
            <div className="flex flex-wrap gap-2">
              {allPaymentMethods.map(method => {
                const isCustom = isCustomMethod(method);
                const optionId = getCustomOptionId("payment_method", method);
                return (
                  <span
                    key={method}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${
                      isCustom ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {methodLabels[method] || method}
                    {isCustom && optionId && (
                      <button
                        onClick={() => onDeleteOption("payment_method", optionId)}
                        className="hover:text-orange-900 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input
                value={newMethod}
                onChange={(e) => setNewMethod(e.target.value)}
                placeholder="새 결제 방법 추가"
                className="flex-1"
                onKeyPress={(e) => e.key === "Enter" && handleAddMethod()}
              />
              <Button variant="outline" size="sm" onClick={handleAddMethod}>
                <Plus className="w-4 h-4 mr-1" /> 추가
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
