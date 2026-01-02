"use client";

import { Button } from "@/components/ui/button";
import { Plus, Settings, Download } from "lucide-react";

interface SalesHeaderProps {
  gymName: string;
  onAddNewRow: () => void;
  onOpenSettings: () => void;
  onExportExcel?: () => void;
}

export function SalesHeader({ gymName, onAddNewRow, onOpenSettings, onExportExcel }: SalesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">매출 관리</h1>
        <p className="text-slate-500 text-sm font-medium mt-1.5 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          {gymName} 실시간 매출 현황
        </p>
      </div>
      <div className="flex items-center gap-2.5 w-full sm:w-auto">
        <Button 
          onClick={onAddNewRow} 
          className="flex-1 sm:flex-none bg-[#2F80ED] hover:bg-[#1c60b8] text-white font-bold h-11 px-6 rounded-2xl shadow-lg shadow-blue-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-5 h-5 mr-2" />
          매출 기록 추가
        </Button>
        <Button 
          variant="outline" 
          onClick={onExportExcel} 
          className="bg-white border-gray-200 text-slate-600 font-bold h-11 px-5 rounded-2xl hover:bg-slate-50 transition-all"
        >
          <Download className="w-4.5 h-4.5 mr-2 text-emerald-600" />
          엑셀 다운
        </Button>
        <Button 
          variant="outline" 
          onClick={onOpenSettings}
          className="bg-white border-gray-200 text-slate-600 h-11 w-11 rounded-2xl hover:bg-slate-50 transition-all"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
