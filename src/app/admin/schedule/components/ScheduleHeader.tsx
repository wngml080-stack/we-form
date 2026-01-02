"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 animate-in fade-in duration-500">
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {userRole === "staff" ? "내 수업 스케줄" : "통합 수업 스케줄"}
        </h1>
        <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          {userRole === "staff"
            ? `${userName || ""} 코치님의 수업 일정을 관리하세요`
            : `${gymName || "지점"} 전체 코치진 스케줄 현황`
          }
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
        {/* 강사 필터 (관리자 전용) - 더 세련된 디자인 */}
        {userRole !== "staff" && (
          <div className="relative group">
            <Select value={selectedStaffId} onValueChange={onStaffChange}>
              <SelectTrigger className="h-11 min-w-[180px] bg-white border-gray-200 rounded-2xl shadow-sm hover:border-[#2F80ED] hover:shadow-md transition-all font-bold text-slate-700">
                <SelectValue placeholder="담당 코치 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-2xl border-gray-100 shadow-xl overflow-hidden">
                <SelectItem value="all" className="font-bold text-blue-600">전체 코치 보기</SelectItem>
                <div className="h-px bg-gray-50 my-1" />
                {staffs.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="font-medium">{s.name} 코치</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedStaffId !== "all" && selectedStaff && (
              <div className="absolute -top-10 left-0 right-0 opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                <div className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  근무시간: {formatTime(selectedStaff.work_start_time)} ~ {formatTime(selectedStaff.work_end_time)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 엑셀 다운로드 버튼 - 세련된 디자인 */}
        <Button
          onClick={onExportExcel}
          variant="outline"
          className="h-11 bg-white border-gray-200 text-slate-600 font-bold px-5 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2"
        >
          <span className="text-emerald-600 text-lg">📊</span>
          스케줄 엑셀 내보내기
        </Button>
      </div>
    </div>
  );
}
