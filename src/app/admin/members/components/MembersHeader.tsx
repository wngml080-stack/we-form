"use client";

import { Button } from "@/components/ui/button";
import { UserPlus, CreditCard, Upload } from "lucide-react";

interface MembersHeaderProps {
  gymName: string;
  onSimpleMemberCreate: () => void;
  onExcelImport: () => void;
  onNewMemberCreate: () => void;
  onExistingSales: () => void;
  onAddonSales: () => void;
}

export function MembersHeader({
  gymName,
  onSimpleMemberCreate,
  onExcelImport,
  onNewMemberCreate,
  onExistingSales,
  onAddonSales,
}: MembersHeaderProps) {
  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">회원 관리</h1>
        <p className="text-gray-500 mt-1 sm:mt-2 font-medium text-sm sm:text-base">
          {gymName}의 회원을 관리합니다
        </p>
      </div>

      <div className="grid grid-cols-2 sm:flex gap-2 w-full xl:w-auto">
        <Button
          onClick={onSimpleMemberCreate}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 sm:px-4 py-2 shadow-sm text-xs sm:text-sm"
        >
          <UserPlus className="mr-1 sm:mr-2 h-4 w-4" /> 수기회원등록
        </Button>
        <Button
          onClick={onExcelImport}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 sm:px-4 py-2 shadow-sm text-xs sm:text-sm"
        >
          <Upload className="mr-1 sm:mr-2 h-4 w-4" /> Excel 대량등록
        </Button>
        <Button
          onClick={onNewMemberCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 sm:px-4 py-2 shadow-sm text-xs sm:text-sm"
        >
          <UserPlus className="mr-1 sm:mr-2 h-4 w-4" /> 신규 회원&매출
        </Button>
        <Button
          onClick={onExistingSales}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 sm:px-4 py-2 shadow-sm text-xs sm:text-sm"
        >
          <CreditCard className="mr-1 sm:mr-2 h-4 w-4" /> 기존 회원&매출
        </Button>
        <Button
          onClick={onAddonSales}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 sm:px-4 py-2 shadow-sm text-xs sm:text-sm"
        >
          <CreditCard className="mr-1 sm:mr-2 h-4 w-4" /> 부가상품 매출
        </Button>
      </div>
    </div>
  );
}
