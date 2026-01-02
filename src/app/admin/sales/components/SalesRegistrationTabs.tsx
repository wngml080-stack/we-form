"use client";

import { Button } from "@/components/ui/button";
import { UserPlus, CreditCard, Package } from "lucide-react";

interface SalesRegistrationTabsProps {
  onNewMemberClick: () => void;
  onExistingSalesClick: () => void;
  onAddonSalesClick: () => void;
}

export function SalesRegistrationTabs({
  onNewMemberClick,
  onExistingSalesClick,
  onAddonSalesClick,
}: SalesRegistrationTabsProps) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="font-semibold text-lg mb-4 text-gray-900">매출 등록</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 신규회원 매출 */}
        <Button
          onClick={onNewMemberClick}
          className="h-auto py-6 flex flex-col items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <UserPlus className="w-8 h-8" />
          <div className="text-center">
            <div className="font-semibold text-base">신규회원 매출</div>
            <div className="text-xs text-blue-100 mt-1">새 회원 등록 + 회원권 결제</div>
          </div>
        </Button>

        {/* 기존회원 매출 */}
        <Button
          onClick={onExistingSalesClick}
          className="h-auto py-6 flex flex-col items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <CreditCard className="w-8 h-8" />
          <div className="text-center">
            <div className="font-semibold text-base">기존회원 매출</div>
            <div className="text-xs text-indigo-100 mt-1">재등록 / 연장 / 추가 결제</div>
          </div>
        </Button>

        {/* 부가상품 매출 */}
        <Button
          onClick={onAddonSalesClick}
          className="h-auto py-6 flex flex-col items-center gap-3 bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Package className="w-8 h-8" />
          <div className="text-center">
            <div className="font-semibold text-base">부가상품 매출</div>
            <div className="text-xs text-purple-100 mt-1">락커 / 운동복 / 기타</div>
          </div>
        </Button>
      </div>
    </div>
  );
}
