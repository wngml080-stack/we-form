"use client";

import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";
import { calculateMonthlyStats, getScheduleTypeLabel } from "@/lib/schedule-utils";

interface StaffStats {
  staff_id: string;
  staff_name: string;
  job_position?: string;
  pt_total_count: number;
  pt_inside_count: number;
  pt_outside_count: number;
  pt_weekend_count: number;
  pt_holiday_count: number;
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

      // 해당 월의 모든 완료된 스케줄 조회
      const { data: schedules, error } = await supabase
        .from("schedules")
        .select(`
          id,
          staff_id,
          schedule_type,
          counted_for_salary,
          status,
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

        if (!staffMap.has(staffId)) {
          staffMap.set(staffId, {
            staff_id: staffId,
            staff_name: staffName,
            job_position: jobPosition,
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
          ...monthlyStats
        };
      });

      // 총 횟수 기준 내림차순 정렬
      stats.sort((a, b) => b.pt_total_count - a.pt_total_count);

      setStaffStats(stats);
    } catch (error) {
      console.error("월별 실적 조회 실패:", error);
      alert("월별 실적을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcelDownload = () => {
    if (staffStats.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

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
    date.setMonth(date.getMonth() - i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  return (
    <div className="space-y-6">
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
                    <CardTitle className="text-xl">{stat.staff_name}</CardTitle>
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
