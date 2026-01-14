"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Download } from "lucide-react";

interface Staff {
  id: string;
  name: string;
  work_start_time?: string | null;
  work_end_time?: string | null;
}

interface ScheduleHeaderProps {
  userRole: string;
  userName: string;
  gymName: string;
  staffs: Staff[];
  selectedStaffId: string;
  onStaffChange: (staffId: string) => void;
  onExportExcel: () => void;
}

export function ScheduleHeader({
  userRole, userName, gymName,
  staffs, selectedStaffId,
  onStaffChange, onExportExcel
}: ScheduleHeaderProps) {
  const formatTime = (time: string | null | undefined) => time ? time.substring(0, 5) : '--:--';
  const selectedStaff = staffs.find(s => s.id === selectedStaffId);

  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-1000 bg-white/40 backdrop-blur-xl p-8 lg:p-10 rounded-[40px] border border-white/60 shadow-xl shadow-slate-200/50 mb-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110"></div>
      
      <div className="space-y-3 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-2xl shadow-slate-200 active:scale-95 transition-all">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tightest">
              스케줄관리
            </h1>
            <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-1 ml-1">
              {gymName || "WE:FORM"} CENTER SCHEDULE
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto relative z-10">
        {/* 강사 필터 (관리자 전용) */}
        {userRole !== "staff" && (
          <div className="relative group/select">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[22px] blur opacity-0 group-hover/select:opacity-10 transition duration-500"></div>
            <Select value={selectedStaffId} onValueChange={onStaffChange}>
              <SelectTrigger className="relative h-14 min-w-[220px] bg-white border-slate-200 rounded-[20px] shadow-sm hover:border-blue-400 transition-all font-black text-slate-800 text-base">
                <SelectValue placeholder="담당 코치 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-xl rounded-[24px] border-slate-100 shadow-2xl p-2 overflow-hidden border-none min-w-[220px]">
                <SelectItem value="all" className="font-black text-blue-600 rounded-xl py-3 focus:bg-blue-50 cursor-pointer">전체 코치 보기</SelectItem>
                <div className="h-px bg-slate-100 my-2 mx-2" />
                {staffs.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="font-bold rounded-xl py-3 focus:bg-slate-50 cursor-pointer">{s.name} 코치</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedStaffId !== "all" && selectedStaff && (
              <div className="absolute -bottom-10 left-0 right-0 opacity-0 group-hover/select:opacity-100 transition-all pointer-events-none translate-y-2 group-hover/select:translate-y-0">
                <div className="bg-slate-900 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-2xl shadow-slate-900/20 whitespace-nowrap flex items-center justify-center gap-2 mx-auto w-fit tracking-widest uppercase border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  {formatTime(selectedStaff.work_start_time)} - {formatTime(selectedStaff.work_end_time)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 엑셀 다운로드 버튼 */}
        <Button
          onClick={onExportExcel}
          variant="outline"
          className="h-14 bg-slate-900 border-slate-900 text-white font-black px-8 rounded-[20px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-3 group active:scale-95"
        >
          <Download className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
          <span>엑셀 저장</span>
        </Button>
      </div>
    </div>
  );
}
