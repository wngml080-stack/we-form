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
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          {userRole === "staff" ? "내 스케줄" : "통합 스케줄"}
        </h1>
        <p className="text-gray-500 mt-2 font-medium">
          {userRole === "staff"
            ? `${userName || ""}님의 스케줄을 관리하세요`
            : gymName
              ? `${gymName} 스케줄을 관리하세요`
              : "스케줄을 관리하세요"
          }
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
        {/* 강사 필터 (관리자만) */}
        {userRole !== "staff" && (
          <div className="flex flex-col gap-2">
            <Select value={selectedStaffId} onValueChange={onStaffChange}>
              <SelectTrigger className="h-10 bg-white border-gray-200 rounded-lg hover:border-[#2F80ED] transition-colors">
                <SelectValue placeholder="강사 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">전체 강사 보기</SelectItem>
                {staffs.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStaffId !== "all" && selectedStaff && (
              <div className="text-xs text-gray-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                <span className="font-semibold text-[#2F80ED]">근무시간:</span>{" "}
                {formatTime(selectedStaff.work_start_time)} ~ {formatTime(selectedStaff.work_end_time)}
              </div>
            )}
          </div>
        )}

        {/* 엑셀 다운로드 */}
        <Button
          onClick={onExportExcel}
          className="h-10 bg-[#2F80ED] hover:bg-[#2570d6] text-white font-medium rounded-lg shadow-sm transition-all"
        >
          <span className="mr-2">📊</span> 엑셀 다운로드
        </Button>
      </div>
    </div>
  );
}
