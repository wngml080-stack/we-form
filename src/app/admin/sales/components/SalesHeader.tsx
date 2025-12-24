"use client";

import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";

interface SalesHeaderProps {
  gymName: string;
  onAddNewRow: () => void;
  onOpenSettings: () => void;
}

export function SalesHeader({ gymName, onAddNewRow, onOpenSettings }: SalesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">매출 현황</h1>
        <p className="text-gray-500 mt-1 sm:mt-2 font-medium text-sm sm:text-base">
          {gymName}의 매출을 관리합니다
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onAddNewRow}
          className="bg-[#2F80ED] hover:bg-[#2570d6] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          새 결제 추가
        </Button>
        <Button
          variant="outline"
          onClick={onOpenSettings}
          className="px-3"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
