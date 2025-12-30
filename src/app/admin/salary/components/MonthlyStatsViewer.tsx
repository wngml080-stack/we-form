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
import { AlertTriangle, CheckCircle } from "lucide-react";
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
    <div className="space-y-6">
      {/* 보고서 승인 상태 배너 */}
      {reportApprovalStatus.totalCount > 0 && (
        reportApprovalStatus.allApproved ? (
          <Alert className="bg-emerald-50 border-emerald-200">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <AlertTitle className="text-emerald-800">모든 보고서 승인됨</AlertTitle>
            <AlertDescription className="text-emerald-700">
              {selectedMonth} 월의 모든 직원 보고서가 승인되었습니다. 확정된 스케줄로 통계가 집계됩니다.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">일부 보고서 미승인</AlertTitle>
            <AlertDescription className="text-amber-700">
              승인됨: {reportApprovalStatus.approvedCount} / {reportApprovalStatus.totalCount}명
              {" "}- 미승인 직원은 <strong>임시 집계</strong>로 표시됩니다.
            </AlertDescription>
          </Alert>
        )
      )}

      {/* 헤더 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">📊 월별 PT 실적 집계</h3>
          <p className="text-sm text-gray-600 mt-1">
            직원별 PT 횟수를 근무내/근무외/주말/공휴일로 구분하여 집계합니다.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="월 선택" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((month) => (
                <SelectItem key={month} value={month}>
                  {month.replace('-', '년 ')}월
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleExcelDownload}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            📊 엑셀 다운로드
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">데이터를 불러오는 중...</p>
        </div>
      ) : staffStats.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">해당 월의 실적 데이터가 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {staffStats.map((stat) => (
            <Card key={stat.staff_id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{stat.staff_name}</CardTitle>
                      {stat.reportStatus === 'approved' ? (
                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0">확정</Badge>
                      ) : stat.reportStatus === 'submitted' ? (
                        <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0">대기</Badge>
                      ) : stat.reportStatus === 'rejected' ? (
                        <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0">반려</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0">임시</Badge>
                      )}
                    </div>
                    {stat.job_position && (
                      <Badge variant="outline" className="mt-1">
                        {stat.job_position}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-[#2F80ED]">
                      {stat.pt_total_count}
                    </div>
                    <div className="text-xs text-gray-500">총 PT 횟수</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">근무내</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {stat.pt_inside_count}
                    </div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">근무외</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {stat.pt_outside_count}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">주말</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {stat.pt_weekend_count}
                    </div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">공휴일</div>
                    <div className="text-2xl font-bold text-red-600">
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
