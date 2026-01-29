"use client";

import { toast } from "@/lib/toast";
import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle, BarChart3, Download, ExternalLink } from "lucide-react";
import Link from "next/link";

interface StaffStats {
  staff_id: string;
  staff_name: string;
  job_position?: string;
  pt_total_count: number;
  pt_inside_count: number;
  pt_outside_count: number;
  pt_weekend_count: number;
  pt_holiday_count: number;
  // OT 통계
  ot_count: number;
  ot_inbody_count: number;
  // 개인일정 통계
  personal_inside_count: number;
  personal_outside_count: number;
  // 미처리 통계
  reserved_pt_count: number;
  reserved_ot_count: number;
  // 서비스/취소/노쇼 통계
  cancelled_pt_count: number;
  reportStatus: 'approved' | 'submitted' | 'rejected' | 'none';
}

export default function MonthlyStatsViewer() {
  const { branchFilter, isInitialized: filterInitialized } = useAdminFilter();
  const gymId = branchFilter.selectedGymId;
  const gymName = branchFilter.gyms.find(g => g.id === gymId)?.name || "센터";

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [staffStats, setStaffStats] = useState<StaffStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reportApprovalStatus, setReportApprovalStatus] = useState<{
    allApproved: boolean;
    approvedCount: number;
    totalCount: number;
  }>({ allApproved: false, approvedCount: 0, totalCount: 0 });

  const supabase = createSupabaseClient();

  useEffect(() => {
    if (filterInitialized && gymId && selectedMonth) {
      fetchMonthlyStats();
    }
  }, [filterInitialized, gymId, selectedMonth]);

  const fetchMonthlyStats = async () => {
    if (!gymId) return;

    setIsLoading(true);
    try {
      // 선택된 월의 시작일과 종료일
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // 1. 해당 지점의 모든 직원 조회
      const { data: allStaffs, error: staffError } = await supabase
        .from("staffs")
        .select("id, name, job_title")
        .eq("gym_id", gymId);

      if (staffError) throw new Error(staffError.message || "직원 조회 실패");

      // 2. 보고서 승인 상태 조회
      const { data: reports } = await supabase
        .from("monthly_schedule_reports")
        .select("staff_id, status")
        .eq("gym_id", gymId)
        .eq("year_month", selectedMonth);

      const reportStatusMap: Record<string, 'approved' | 'submitted' | 'rejected' | 'none'> = {};
      reports?.forEach(r => {
        reportStatusMap[r.staff_id] = r.status as 'approved' | 'submitted' | 'rejected';
      });

      // 3. 해당 월의 모든 스케줄 조회
      const { data: schedules, error: schedulesError } = await supabase
        .from("schedules")
        .select("id, staff_id, type, schedule_type, status, inbody_checked")
        .eq("gym_id", gymId)
        .gte("start_time", startDate.toISOString())
        .lte("start_time", endDate.toISOString());

      if (schedulesError) throw new Error(schedulesError.message || "스케줄 조회 실패");

      // 4. 각 직원별 통계 계산 (reports 페이지와 동일한 로직)
      const stats: StaffStats[] = (allStaffs || []).map((staff) => {
        const staffSchedules = schedules?.filter(s => s.staff_id === staff.id) || [];
        const staffReportStatus = reportStatusMap[staff.id] || 'none';

        // completed, no_show_deducted 상태만 카운트 (reports 페이지와 동일)
        const countedSchedules = staffSchedules.filter(
          s => s.status === "completed" || s.status === "no_show_deducted"
        );

        // 미처리 (예약 상태)
        const reservedSchedules = staffSchedules.filter(s => s.status === "reserved");

        // 서비스/취소/노쇼
        const cancelledSchedules = staffSchedules.filter(
          s => s.status === "service" || s.status === "cancelled" || s.status === "no_show"
        );

        // PT 통계
        const pt_inside_count = countedSchedules.filter(
          s => s.type === "PT" && (!s.schedule_type || s.schedule_type === "inside")
        ).length;
        const pt_outside_count = countedSchedules.filter(
          s => s.type === "PT" && s.schedule_type === "outside"
        ).length;
        const pt_weekend_count = countedSchedules.filter(
          s => s.type === "PT" && (s.schedule_type === "weekend" || s.schedule_type === "holiday")
        ).length;
        const pt_total_count = pt_inside_count + pt_outside_count + pt_weekend_count;

        // OT 통계
        const ot_count = countedSchedules.filter(s => s.type === "OT" && !s.inbody_checked).length;
        const ot_inbody_count = countedSchedules.filter(s => s.type === "OT" && s.inbody_checked).length;

        // 개인일정 통계
        const personal_inside_count = countedSchedules.filter(
          s => s.type === "Personal" && s.schedule_type === "inside"
        ).length;
        const personal_outside_count = countedSchedules.filter(
          s => s.type === "Personal" && s.schedule_type === "outside"
        ).length;

        // 미처리 통계
        const reserved_pt_count = reservedSchedules.filter(s => s.type === "PT").length;
        const reserved_ot_count = reservedSchedules.filter(s => s.type === "OT").length;

        // 서비스/취소/노쇼 통계
        const cancelled_pt_count = cancelledSchedules.filter(s => s.type === "PT").length;

        return {
          staff_id: staff.id,
          staff_name: staff.name,
          job_position: staff.job_title,
          reportStatus: staffReportStatus,
          pt_total_count,
          pt_inside_count,
          pt_outside_count,
          pt_weekend_count,
          pt_holiday_count: 0, // weekend에 포함
          ot_count,
          ot_inbody_count,
          personal_inside_count,
          personal_outside_count,
          reserved_pt_count,
          reserved_ot_count,
          cancelled_pt_count,
        };
      });

      // 총 횟수 기준 내림차순 정렬
      stats.sort((a, b) => b.pt_total_count - a.pt_total_count);

      // 승인 상태 집계 (제출된 보고서만 카운트)
      const submittedStaffs = stats.filter(s => s.reportStatus !== 'none');
      const approvedCount = submittedStaffs.filter(s => s.reportStatus === 'approved').length;
      setReportApprovalStatus({
        allApproved: approvedCount === submittedStaffs.length && submittedStaffs.length > 0,
        approvedCount,
        totalCount: submittedStaffs.length // 제출한 직원만 카운트
      });

      setStaffStats(stats);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "월별 실적을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcelDownload = async () => {
    if (staffStats.length === 0) {
      toast.warning("다운로드할 데이터가 없습니다.");
      return;
    }

    // 동적 import - 사용자가 내보내기 클릭 시에만 로드
    const XLSX = await import("xlsx");

    const excelData = staffStats.map((stat) => ({
      "직원명": stat.staff_name,
      "직무": stat.job_position || '-',
      "승인상태": stat.reportStatus === 'approved' ? '승인' : '대기',
      "PT 총 횟수": stat.pt_total_count,
      "PT 근무내": stat.pt_inside_count,
      "PT 근무외": stat.pt_outside_count,
      "PT 주말공휴일": stat.pt_weekend_count,
      "PT 서비스/취소/노쇼": stat.cancelled_pt_count,
      "PT 미처리": stat.reserved_pt_count,
      "개인일정 총": stat.personal_inside_count + stat.personal_outside_count,
      "개인일정 근무내": stat.personal_inside_count,
      "개인일정 근무외": stat.personal_outside_count,
      "OT": stat.ot_count,
      "OT+인바디": stat.ot_inbody_count,
      "OT 미처리": stat.reserved_ot_count,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "월별실적");

    const fileName = `${gymName}_${selectedMonth}_월별실적.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // 월 선택 옵션 생성 (최근 12개월)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setDate(1); // 1일로 설정하여 월 변경 시 롤오버 방지
    date.setMonth(date.getMonth() - i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  return (
    <div className="space-y-4 xs:space-y-6 lg:space-y-8">
      {/* 보고서 승인 상태 배너 - 더 세련되게 */}
      {reportApprovalStatus.totalCount > 0 && (
        <div className="animate-in slide-in-from-top-4 duration-500">
          {reportApprovalStatus.allApproved ? (
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 xs:gap-4 bg-emerald-50 border border-emerald-100 p-3 xs:p-4 sm:p-5 rounded-xl xs:rounded-2xl sm:rounded-[24px] shadow-sm shadow-emerald-100/50">
              <div className="w-10 h-10 xs:w-12 xs:h-12 bg-emerald-500 rounded-xl xs:rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                <CheckCircle className="h-5 w-5 xs:h-6 xs:w-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-emerald-900 text-sm xs:text-base sm:text-lg tracking-tight">모든 보고서 승인 완료</h4>
                <p className="text-emerald-700 font-bold text-xs xs:text-sm">
                  {selectedMonth}월의 모든 직원 보고서가 승인되었습니다.
                </p>
              </div>
              <Link href="/admin/reports" className="w-full xs:w-auto">
                <Button variant="outline" className="h-8 xs:h-10 px-3 xs:px-5 border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg xs:rounded-xl font-black text-[10px] xs:text-xs flex items-center gap-1 xs:gap-2 transition-all hover:-translate-y-0.5 w-full xs:w-auto">
                  <ExternalLink className="w-3 h-3 xs:w-4 xs:h-4" />
                  보고서 관리
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 xs:gap-4 bg-amber-50 border border-amber-100 p-3 xs:p-4 sm:p-5 rounded-xl xs:rounded-2xl sm:rounded-[24px] shadow-sm shadow-amber-100/50">
              <div className="w-10 h-10 xs:w-12 xs:h-12 bg-amber-500 rounded-xl xs:rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-200">
                <AlertTriangle className="h-5 w-5 xs:h-6 xs:w-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-amber-900 text-sm xs:text-base sm:text-lg tracking-tight">제출된 보고서 승인 대기 중</h4>
                <p className="text-amber-700 font-bold text-xs xs:text-sm">
                  제출 {reportApprovalStatus.totalCount}건 중 <span className="text-amber-900 font-black">{reportApprovalStatus.approvedCount}</span>건 승인
                  <span className="hidden xs:inline mx-2 opacity-30">|</span>
                  <span className="block xs:inline">미승인 보고서는 <span className="text-amber-900 font-black underline decoration-2 underline-offset-4">임시 집계</span> 상태</span>
                </p>
              </div>
              <Link href="/admin/reports" className="w-full xs:w-auto">
                <Button className="h-8 xs:h-10 px-3 xs:px-5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg xs:rounded-xl font-black text-[10px] xs:text-xs shadow-lg shadow-amber-200 flex items-center gap-1 xs:gap-2 transition-all hover:-translate-y-0.5 w-full xs:w-auto">
                  <ExternalLink className="w-3 h-3 xs:w-4 xs:h-4" />
                  승인하러 가기
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 액션 헤더 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 xs:gap-4 md:gap-6 bg-white p-3 xs:p-4 sm:p-6 rounded-xl xs:rounded-2xl sm:rounded-[32px] border border-gray-100 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-base xs:text-lg sm:text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-2 xs:gap-3">
            <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-lg xs:rounded-xl flex items-center justify-center">
              <BarChart3 className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            월별 PT 실적 집계
          </h3>
          <p className="text-[10px] xs:text-xs sm:text-sm text-slate-400 font-bold ml-9 xs:ml-11 sm:ml-13 hidden xs:block">
            직원별 PT 횟수를 근무 시간대에 맞춰 자동으로 분류합니다.
          </p>
        </div>

        <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 w-full md:w-auto">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full md:w-[180px] h-10 xs:h-12 bg-slate-50 border-none rounded-xl xs:rounded-2xl font-black text-slate-900 text-sm xs:text-base focus:ring-2 focus:ring-blue-100 transition-all">
              <SelectValue placeholder="월 선택" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-xl xs:rounded-2xl border-none shadow-2xl p-1 xs:p-2">
              {monthOptions.map((month) => (
                <SelectItem key={month} value={month} className="rounded-lg xs:rounded-xl font-bold py-2 xs:py-3 text-sm xs:text-base">
                  {month.replace('-', '년 ')}월
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleExcelDownload}
            className="h-10 xs:h-12 px-4 xs:px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl xs:rounded-2xl font-black shadow-lg shadow-emerald-100 flex items-center justify-center gap-1 xs:gap-2 transition-all hover:-translate-y-1 text-xs xs:text-sm"
          >
            <Download className="w-3 h-3 xs:w-4 xs:h-4" /> 엑셀 다운로드
          </Button>
        </div>
      </div>

      {/* 실적 리스트 */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 xs:py-32 sm:py-40 animate-pulse">
          <div className="w-12 h-12 xs:w-16 xs:h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3 xs:mb-4">
            <BarChart3 className="w-6 h-6 xs:w-8 xs:h-8 text-blue-300" />
          </div>
          <p className="text-slate-400 font-black tracking-widest uppercase text-[10px] xs:text-xs">Loading data...</p>
        </div>
      ) : staffStats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 xs:py-32 sm:py-40 bg-slate-50 rounded-2xl xs:rounded-3xl sm:rounded-[40px] border border-dashed border-slate-200">
          <div className="w-14 h-14 xs:w-20 xs:h-20 bg-white rounded-full flex items-center justify-center mb-4 xs:mb-6 shadow-sm">
            <BarChart3 className="w-7 h-7 xs:w-10 xs:h-10 text-slate-200" />
          </div>
          <h4 className="text-sm xs:text-base sm:text-lg font-black text-slate-900 mb-1 xs:mb-2">실적 데이터가 없습니다</h4>
          <p className="text-xs xs:text-sm text-slate-400 font-bold text-center px-4">선택하신 월의 수업 기록이 아직 생성되지 않았습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl xs:rounded-2xl sm:rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          {/* 테이블 헤더 - 데스크탑에서만 표시 */}
          <div className="hidden md:block bg-slate-50 px-4 xs:px-6 sm:px-8 py-3 xs:py-4 border-b border-slate-100">
            <div className="grid grid-cols-12 gap-2 xs:gap-4 text-[9px] xs:text-[11px] font-black text-slate-400 uppercase tracking-wider">
              <div className="col-span-2">직원</div>
              <div className="col-span-5 text-center">PT 수업</div>
              <div className="col-span-2 text-center">OT</div>
              <div className="col-span-1 text-center">개인</div>
              <div className="col-span-2 text-center">미처리</div>
            </div>
          </div>

          {/* 직원 리스트 */}
          <div className="divide-y divide-slate-100/50">
            {staffStats.map((stat) => (
              <div
                key={stat.staff_id}
                className="px-3 xs:px-4 sm:px-8 py-3 xs:py-4 hover:bg-blue-50/30 transition-all duration-200 group"
              >
                {/* 모바일 카드 레이아웃 */}
                <div className="md:hidden space-y-2 xs:space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 xs:w-8 xs:h-8 bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg flex items-center justify-center text-[10px] xs:text-xs font-black text-slate-400">
                        {stat.staff_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-800 text-xs xs:text-sm">{stat.staff_name}</span>
                          {stat.reportStatus === 'approved' && (
                            <CheckCircle className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-emerald-500" />
                          )}
                        </div>
                        {stat.job_position && (
                          <div className="text-[9px] xs:text-[10px] text-slate-400">{stat.job_position}</div>
                        )}
                      </div>
                    </div>
                    <div className="w-9 h-9 xs:w-11 xs:h-11 bg-blue-50 rounded-lg xs:rounded-xl flex items-center justify-center">
                      <span className="text-base xs:text-xl font-black text-blue-600">{stat.pt_total_count}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[9px] xs:text-[10px] px-1.5 xs:px-2 py-0.5 bg-blue-100/60 text-blue-700 rounded font-bold">IN {stat.pt_inside_count}</span>
                    <span className="text-[9px] xs:text-[10px] px-1.5 xs:px-2 py-0.5 bg-orange-100/60 text-orange-700 rounded font-bold">OUT {stat.pt_outside_count}</span>
                    <span className="text-[9px] xs:text-[10px] px-1.5 xs:px-2 py-0.5 bg-purple-100/60 text-purple-700 rounded font-bold">주말 {stat.pt_weekend_count}</span>
                    <span className="text-[9px] xs:text-[10px] px-1.5 xs:px-2 py-0.5 bg-emerald-100/60 text-emerald-700 rounded font-bold">OT {stat.ot_count + stat.ot_inbody_count}</span>
                    {(stat.reserved_pt_count > 0 || stat.reserved_ot_count > 0) && (
                      <span className="text-[9px] xs:text-[10px] px-1.5 xs:px-2 py-0.5 bg-red-50 text-red-500 rounded font-bold">미처리 {stat.reserved_pt_count + stat.reserved_ot_count}</span>
                    )}
                  </div>
                </div>

                {/* 데스크탑 그리드 레이아웃 */}
                <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                  {/* 직원 정보 */}
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg flex items-center justify-center text-xs font-black text-slate-400 group-hover:from-blue-500 group-hover:to-blue-600 group-hover:text-white transition-all duration-300">
                      {stat.staff_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-800 text-sm truncate">{stat.staff_name}</span>
                        {stat.reportStatus === 'approved' && (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      {stat.job_position && (
                        <div className="text-[10px] text-slate-400 truncate">{stat.job_position}</div>
                      )}
                    </div>
                  </div>

                  {/* PT 통계 */}
                  <div className="col-span-5">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
                        <span className="text-xl font-black text-blue-600">{stat.pt_total_count}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] px-2 py-0.5 bg-blue-100/60 text-blue-700 rounded-md font-bold">IN {stat.pt_inside_count}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-orange-100/60 text-orange-700 rounded-md font-bold">OUT {stat.pt_outside_count}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-purple-100/60 text-purple-700 rounded-md font-bold">주말 {stat.pt_weekend_count}</span>
                        {stat.cancelled_pt_count > 0 && (
                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md font-bold">서비스&노쇼&취소 {stat.cancelled_pt_count}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* OT 통계 */}
                  <div className="col-span-2">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-lg font-black text-emerald-600">{stat.ot_count + stat.ot_inbody_count}</span>
                      {stat.ot_inbody_count > 0 && (
                        <span className="text-[9px] text-emerald-500 font-bold">(+{stat.ot_inbody_count})</span>
                      )}
                    </div>
                  </div>

                  {/* 개인일정 통계 */}
                  <div className="col-span-1 text-center">
                    <span className="text-lg font-black text-slate-600">
                      {stat.personal_inside_count + stat.personal_outside_count}
                    </span>
                  </div>

                  {/* 미처리 */}
                  <div className="col-span-2">
                    <div className="flex items-center justify-center gap-1">
                      {(stat.reserved_pt_count > 0 || stat.reserved_ot_count > 0) ? (
                        <>
                          {stat.reserved_pt_count > 0 && (
                            <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-500 rounded font-bold">
                              PT {stat.reserved_pt_count}
                            </span>
                          )}
                          {stat.reserved_ot_count > 0 && (
                            <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-500 rounded font-bold">
                              OT {stat.reserved_ot_count}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
