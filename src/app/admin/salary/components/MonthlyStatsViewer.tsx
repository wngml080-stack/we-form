"use client";

import { toast } from "@/lib/toast";
import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, BarChart3, Download } from "lucide-react";
import { calculateMonthlyStats } from "@/lib/schedule-utils";

interface StaffStats {
  staff_id: string;
  staff_name: string;
  job_position?: string;
  pt_total_count: number;
  pt_inside_count: number;
  pt_outside_count: number;
  pt_weekend_count: number;
  pt_holiday_count: number;
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

      // 1. 보고서 승인 상태 조회
      const { data: reports } = await supabase
        .from("monthly_schedule_reports")
        .select("staff_id, status")
        .eq("gym_id", gymId)
        .eq("year_month", selectedMonth);

      const reportStatusMap: Record<string, 'approved' | 'submitted' | 'rejected' | 'none'> = {};
      reports?.forEach(r => {
        reportStatusMap[r.staff_id] = r.status as 'approved' | 'submitted' | 'rejected';
      });

      // 2. 해당 월의 모든 스케줄 조회
      const { data: schedules, error } = await supabase
        .from("schedules")
        .select(`
          id,
          staff_id,
          schedule_type,
          counted_for_salary,
          status,
          is_locked,
          staffs (
            id,
            name,
            job_position_code
          )
        `)
        .eq("gym_id", gymId)
        .gte("start_time", startDate.toISOString())
        .lte("start_time", endDate.toISOString());

      if (error) throw error;

      // 직원별로 그룹화
      const staffMap = new Map<string, any>();

      schedules?.forEach((schedule) => {
        // @ts-ignore
        const staffId = schedule.staffs?.id;
        // @ts-ignore
        const staffName = schedule.staffs?.name || '알 수 없음';
        // @ts-ignore
        const jobPosition = schedule.staffs?.job_position_code;

        if (!staffId) return;

        // 승인된 직원은 is_locked=true인 스케줄만, 미승인은 모두
        const staffReportStatus = reportStatusMap[staffId] || 'none';
        const isApproved = staffReportStatus === 'approved';
        // @ts-ignore
        if (isApproved && !schedule.is_locked) return;

        if (!staffMap.has(staffId)) {
          staffMap.set(staffId, {
            staff_id: staffId,
            staff_name: staffName,
            job_position: jobPosition,
            reportStatus: staffReportStatus,
            schedules: []
          });
        }

        staffMap.get(staffId).schedules.push(schedule);
      });

      // 각 직원별 통계 계산
      const stats: StaffStats[] = Array.from(staffMap.values()).map((staff) => {
        const monthlyStats = calculateMonthlyStats(staff.schedules);
        return {
          staff_id: staff.staff_id,
          staff_name: staff.staff_name,
          job_position: staff.job_position,
          reportStatus: staff.reportStatus,
          ...monthlyStats
        };
      });

      // 총 횟수 기준 내림차순 정렬
      stats.sort((a, b) => b.pt_total_count - a.pt_total_count);

      // 승인 상태 집계
      const approvedCount = stats.filter(s => s.reportStatus === 'approved').length;
      setReportApprovalStatus({
        allApproved: approvedCount === stats.length && stats.length > 0,
        approvedCount,
        totalCount: stats.length
      });

      setStaffStats(stats);
    } catch (error) {
      console.error("월별 실적 조회 실패:", error);
      toast.error("월별 실적을 불러오는 중 오류가 발생했습니다.");
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
      "PT 총 횟수": stat.pt_total_count,
      "근무내 횟수": stat.pt_inside_count,
      "근무외 횟수": stat.pt_outside_count,
      "주말 횟수": stat.pt_weekend_count,
      "공휴일 횟수": stat.pt_holiday_count,
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
    <div className="space-y-8">
      {/* 보고서 승인 상태 배너 - 더 세련되게 */}
      {reportApprovalStatus.totalCount > 0 && (
        <div className="animate-in slide-in-from-top-4 duration-500">
          {reportApprovalStatus.allApproved ? (
            <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 p-5 rounded-[24px] shadow-sm shadow-emerald-100/50">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-black text-emerald-900 text-lg tracking-tight">모든 보고서 승인 완료</h4>
                <p className="text-emerald-700 font-bold text-sm">
                  {selectedMonth}월의 모든 직원 보고서가 승인되었습니다. 확정된 데이터로 급여가 집계됩니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 bg-amber-50 border border-amber-100 p-5 rounded-[24px] shadow-sm shadow-amber-100/50">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-200">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-amber-900 text-lg tracking-tight">일부 보고서 승인 대기 중</h4>
                <p className="text-amber-700 font-bold text-sm">
                  승인됨: <span className="text-amber-900 font-black">{reportApprovalStatus.approvedCount}</span> / {reportApprovalStatus.totalCount}명
                  <span className="mx-2 opacity-30">|</span>
                  미승인 직원은 <span className="text-amber-900 font-black underline decoration-2 underline-offset-4">임시 집계</span> 상태입니다.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 액션 헤더 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            월별 PT 실적 집계
          </h3>
          <p className="text-sm text-slate-400 font-bold ml-13">
            직원별 PT 횟수를 근무 시간대에 맞춰 자동으로 분류하여 집계합니다.
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full md:w-[180px] h-12 bg-slate-50 border-none rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-blue-100 transition-all">
              <SelectValue placeholder="월 선택" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
              {monthOptions.map((month) => (
                <SelectItem key={month} value={month} className="rounded-xl font-bold py-3">
                  {month.replace('-', '년 ')}월
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleExcelDownload}
            className="h-12 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 flex items-center gap-2 transition-all hover:-translate-y-1"
          >
            <Download className="w-4 h-4" /> 엑셀 다운로드
          </Button>
        </div>
      </div>

      {/* 실적 리스트 */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 animate-pulse">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="w-8 h-8 text-blue-300" />
          </div>
          <p className="text-slate-400 font-black tracking-widest uppercase text-xs">Loading data...</p>
        </div>
      ) : staffStats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
            <BarChart3 className="w-10 h-10 text-slate-200" />
          </div>
          <h4 className="text-lg font-black text-slate-900 mb-2">실적 데이터가 없습니다</h4>
          <p className="text-slate-400 font-bold">선택하신 월의 수업 기록이 아직 생성되지 않았습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {staffStats.map((stat) => (
            <Card key={stat.staff_id} className="group hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 border-none rounded-[40px] overflow-hidden bg-white shadow-lg shadow-slate-100/50 flex flex-col h-full">
              <CardHeader className="p-8 pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-slate-100 rounded-[22px] flex items-center justify-center text-xl font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                        {stat.staff_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-2xl font-black text-slate-900 tracking-tighter">{stat.staff_name}</CardTitle>
                          {stat.reportStatus === 'approved' ? (
                            <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] px-2 py-0.5 rounded-lg shadow-sm shadow-emerald-100">CONFIRMED</Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[10px] px-2 py-0.5 rounded-lg">PENDING</Badge>
                          )}
                        </div>
                        {stat.job_position && (
                          <div className="text-blue-600 font-black text-xs uppercase tracking-widest mt-1 opacity-60">
                            {stat.job_position}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right bg-slate-50 p-4 rounded-[28px] border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all duration-500">
                    <div className="text-4xl font-black text-slate-900 tracking-tighter group-hover:text-blue-600 transition-colors">
                      {stat.pt_total_count}<span className="text-base ml-1 opacity-30 font-bold uppercase tracking-widest">PT</span>
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Total Stats</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-blue-50/50 p-5 rounded-[28px] border border-blue-50/50 group-hover:bg-white group-hover:border-blue-100 group-hover:shadow-lg group-hover:shadow-blue-100/30 transition-all duration-500 text-center">
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">PT IN</div>
                    <div className="text-2xl font-black text-blue-600 tracking-tighter">
                      {stat.pt_inside_count}
                    </div>
                  </div>
                  <div className="bg-orange-50/50 p-5 rounded-[28px] border border-orange-50/50 group-hover:bg-white group-hover:border-orange-100 group-hover:shadow-lg group-hover:shadow-orange-100/30 transition-all duration-500 text-center">
                    <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">PT OUT</div>
                    <div className="text-2xl font-black text-orange-600 tracking-tighter">
                      {stat.pt_outside_count}
                    </div>
                  </div>
                  <div className="bg-purple-50/50 p-5 rounded-[28px] border border-purple-50/50 group-hover:bg-white group-hover:border-purple-100 group-hover:shadow-lg group-hover:shadow-purple-100/30 transition-all duration-500 text-center">
                    <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Weekend</div>
                    <div className="text-2xl font-black text-purple-600 tracking-tighter">
                      {stat.pt_weekend_count}
                    </div>
                  </div>
                  <div className="bg-red-50/50 p-5 rounded-[28px] border border-red-50/50 group-hover:bg-white group-hover:border-red-100 group-hover:shadow-lg group-hover:shadow-red-100/30 transition-all duration-500 text-center">
                    <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Holiday</div>
                    <div className="text-2xl font-black text-red-600 tracking-tighter">
                      {stat.pt_holiday_count}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
