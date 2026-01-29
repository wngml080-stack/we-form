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
  userRole, userName: _userName, gymName,
  staffs, selectedStaffId,
  onStaffChange, onExportExcel
}: ScheduleHeaderProps) {
  const formatTime = (time: string | null | undefined) => time ? time.substring(0, 5) : '--:--';
  const selectedStaff = staffs.find(s => s.id === selectedStaffId);

  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 xs:gap-6 animate-in fade-in slide-in-from-top-4 duration-1000 bg-white/40 backdrop-blur-xl p-4 xs:p-6 sm:p-8 lg:p-10 rounded-2xl xs:rounded-3xl sm:rounded-[40px] border border-white/60 shadow-xl shadow-slate-200/50 mb-4 xs:mb-6 lg:mb-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110"></div>

      <div className="space-y-2 xs:space-y-3 relative z-10">
        <div className="flex items-center gap-3 xs:gap-4">
          <div className="w-10 xs:w-12 sm:w-14 h-10 xs:h-12 sm:h-14 rounded-xl xs:rounded-2xl bg-slate-900 flex items-center justify-center shadow-2xl shadow-slate-200 active:scale-95 transition-all">
            <Calendar className="w-5 xs:w-6 sm:w-7 h-5 xs:h-6 sm:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tightest">
              스케줄관리
            </h1>
            <p className="text-slate-500 text-[10px] xs:text-xs font-black uppercase tracking-[0.15em] xs:tracking-[0.2em] mt-0.5 xs:mt-1 ml-0.5 xs:ml-1 truncate max-w-[180px] xs:max-w-none">
              {gymName || "WE:FORM"} CENTER
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 xs:gap-3 sm:gap-4 w-full lg:w-auto relative z-10">
        {/* 강사 필터 (관리자 전용) */}
        {userRole !== "staff" && (
          <div className="relative group/select flex-1 xs:flex-none">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl xs:rounded-[22px] blur opacity-0 group-hover/select:opacity-10 transition duration-500"></div>
            <Select value={selectedStaffId} onValueChange={onStaffChange}>
              <SelectTrigger className="relative h-11 xs:h-12 sm:h-14 w-full xs:min-w-[180px] sm:min-w-[220px] bg-white border-slate-200 rounded-xl xs:rounded-2xl sm:rounded-[20px] shadow-sm hover:border-blue-400 transition-all font-black text-slate-800 text-sm xs:text-base">
                <SelectValue placeholder="담당 코치 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-xl rounded-xl xs:rounded-2xl sm:rounded-[24px] border-slate-100 shadow-2xl p-1.5 xs:p-2 overflow-hidden border-none min-w-[180px] xs:min-w-[220px]">
                <SelectItem value="all" className="font-black text-blue-600 rounded-lg xs:rounded-xl py-2.5 xs:py-3 focus:bg-blue-50 cursor-pointer text-sm">전체 코치 보기</SelectItem>
                <div className="h-px bg-slate-100 my-1.5 xs:my-2 mx-2" />
                {staffs.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="font-bold rounded-lg xs:rounded-xl py-2.5 xs:py-3 focus:bg-slate-50 cursor-pointer text-sm">{s.name} 코치</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedStaffId !== "all" && selectedStaff && (
              <div className="hidden sm:block absolute -bottom-10 left-0 right-0 opacity-0 group-hover/select:opacity-100 transition-all pointer-events-none translate-y-2 group-hover/select:translate-y-0">
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
          className="h-11 xs:h-12 sm:h-14 bg-slate-900 border-slate-900 text-white font-black px-4 xs:px-6 sm:px-8 rounded-xl xs:rounded-2xl sm:rounded-[20px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 xs:gap-3 group active:scale-95 text-sm"
        >
          <Download className="w-4 xs:w-5 h-4 xs:h-5 text-blue-400 group-hover:scale-110 transition-transform" />
          <span className="hidden xs:inline">엑셀 다운로드</span>
          <span className="xs:hidden">다운로드</span>
        </Button>
      </div>
    </div>
  );
}
