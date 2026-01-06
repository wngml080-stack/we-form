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
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-700 bg-white/50 backdrop-blur-sm p-6 lg:p-8 rounded-[32px] border border-white shadow-sm mb-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {userRole === "staff" ? "내 수업 스케줄" : "통합 수업 스케줄"}
          </h1>
        </div>
        <p className="text-slate-500 text-sm font-bold flex items-center gap-2 ml-1">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          {userRole === "staff"
            ? `${userName || ""} 코치님의 실시간 수업 일정을 확인하세요`
            : `${gymName || "지점"} 전체 코치진의 실시간 스케줄 현황`
          }
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
        {/* 강사 필터 (관리자 전용) */}
        {userRole !== "staff" && (
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-0 group-hover:opacity-10 transition duration-500"></div>
            <Select value={selectedStaffId} onValueChange={onStaffChange}>
              <SelectTrigger className="relative h-12 min-w-[200px] bg-white border-slate-200 rounded-2xl shadow-sm hover:border-blue-300 transition-all font-black text-slate-700">
                <SelectValue placeholder="담당 코치 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-xl rounded-2xl border-slate-100 shadow-2xl p-1 overflow-hidden">
                <SelectItem value="all" className="font-black text-blue-600 rounded-xl focus:bg-blue-50">전체 코치 보기</SelectItem>
                <div className="h-px bg-slate-50 my-1" />
                {staffs.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="font-bold rounded-xl focus:bg-slate-50">{s.name} 코치</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedStaffId !== "all" && selectedStaff && (
              <div className="absolute -bottom-8 left-0 right-0 opacity-0 group-hover:opacity-100 transition-all pointer-events-none translate-y-2 group-hover:translate-y-0">
                <div className="bg-slate-900 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg whitespace-nowrap flex items-center justify-center gap-2 mx-auto w-fit tracking-widest uppercase">
                  <Clock className="w-3 h-3 text-blue-400" />
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
          className="h-12 bg-white border-slate-200 text-slate-700 font-black px-6 rounded-2xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm flex items-center gap-2 group"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
            <Download className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white" />
          </div>
          스케줄 엑셀 내보내기
        </Button>
      </div>
    </div>
  );
}
