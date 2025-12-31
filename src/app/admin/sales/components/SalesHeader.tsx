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
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">매출 관리</h1>
        <p className="text-gray-500 text-sm mt-1">{gymName} 매출 현황</p>
      </div>
      <div className="flex gap-2">
        <Button onClick={onAddNewRow} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          매출 추가
        </Button>
        <Button variant="outline" onClick={onOpenSettings}>
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
