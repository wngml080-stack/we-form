// 스케줄 엑셀 내보내기 유틸리티

import * as XLSX from "xlsx";
import { toast } from "@/lib/toast";

export function exportSchedulesToExcel(schedules: any[]) {
  if (schedules.length === 0) {
    toast.warning("다운로드할 스케줄이 없습니다.");
    return;
  }

  const excelData = schedules.map((schedule) => ({
    "날짜": new Date(schedule.start_time).toLocaleDateString('ko-KR'),
    "시작시간": new Date(schedule.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
    "종료시간": new Date(schedule.end_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
    "회원명": schedule.member_name || '-',
    "수업유형": schedule.type || '-',
    "상태": schedule.status || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "스케줄");

  const today = new Date().toISOString().split('T')[0];
  const fileName = `스케줄_${today}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}

// 해당 날짜가 그 달의 몇 주차인지 계산
export function getWeekOfMonth(date: Date): number {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const offsetDate = date.getDate() + firstDayOfWeek - 1;
  return Math.ceil(offsetDate / 7);
}
