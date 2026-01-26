"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { BarChart3, PieChart, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";

interface LeaveStats {
  year: number;
  overview: {
    totalStaff: number;
    totalAllowance: number;
    usedDays: number;
    pendingDays: number;
    remainingDays: number;
    utilizationRate: number;
  };
  pendingCount: number;
  monthly: Array<{ month: number; days: number }>;
  byType: Array<{ code: string; name: string; days: number; count: number }>;
  byStatus: {
    approved: number;
    pending: number;
    rejected: number;
    cancelled: number;
  };
}

export default function LeaveStatistics() {
  const { branchFilter } = useAdminFilter();
  const [stats, setStats] = useState<LeaveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);

  useEffect(() => {
    fetchStats();
  }, [branchFilter.selectedGymId, year]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year: year.toString() });
      if (branchFilter.selectedGymId) {
        params.append("gym_id", branchFilter.selectedGymId);
      }

      const response = await fetch(`/api/admin/leave/stats?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "통계를 불러올 수 없습니다.");
      }

      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching leave stats:", error);
      toast.error("통계를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

  const maxMonthlyDays = stats?.monthly ? Math.max(...stats.monthly.map(m => m.days), 1) : 1;

  return (
    <div className="space-y-6">
      {/* 연도 선택 */}
      <div className="flex justify-end">
        <Select value={year.toString()} onValueChange={v => setYear(parseInt(v))}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => (
              <SelectItem key={y} value={y.toString()}>{y}년</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : stats ? (
        <>
          {/* 개요 카드 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#3182F6] font-medium">총 직원 수</p>
                    <p className="text-2xl font-black text-blue-700">{stats.overview.totalStaff}명</p>
                  </div>
                  <div className="w-10 h-10 bg-[#3182F6] rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#03C75A] font-medium">연차 사용률</p>
                    <p className="text-2xl font-black text-green-700">{stats.overview.utilizationRate}%</p>
                  </div>
                  <div className="w-10 h-10 bg-[#03C75A] rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">총 사용 연차</p>
                    <p className="text-2xl font-black text-orange-700">{stats.overview.usedDays}일</p>
                  </div>
                  <div className="w-10 h-10 bg-[#FF9500] rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#8B5CF6] font-medium">승인 대기</p>
                    <p className="text-2xl font-black text-purple-700">{stats.pendingCount}건</p>
                  </div>
                  <div className="w-10 h-10 bg-[#8B5CF6] rounded-xl flex items-center justify-center">
                    <PieChart className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 월별 사용 현황 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">월별 연차 사용 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-48">
                {stats.monthly.map(({ month, days }) => (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-[#3182F6] rounded-t transition-all hover:bg-[#3182F6]"
                      style={{
                        height: `${(days / maxMonthlyDays) * 100}%`,
                        minHeight: days > 0 ? "8px" : "0",
                      }}
                      title={`${days}일`}
                    />
                    <span className="text-xs text-[#8B95A1]">{monthNames[month - 1]}</span>
                    <span className="text-xs font-medium">{days}일</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 휴가 유형별 통계 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">휴가 유형별 사용 현황</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.byType.length === 0 ? (
                  <p className="text-[#8B95A1] text-center py-4">데이터가 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {stats.byType.map(type => {
                      const maxDays = Math.max(...stats.byType.map(t => t.days), 1);
                      const percentage = (type.days / maxDays) * 100;

                      return (
                        <div key={type.code}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">{type.name}</span>
                            <span className="text-sm text-[#8B95A1]">
                              {type.days}일 ({type.count}건)
                            </span>
                          </div>
                          <div className="h-2 bg-[#F4F5F7] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#3182F6] rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">신청 상태별 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-green-700">승인됨</span>
                    <span className="text-lg font-bold text-green-700">{stats.byStatus.approved}일</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="font-medium text-yellow-700">대기중</span>
                    <span className="text-lg font-bold text-yellow-700">{stats.byStatus.pending}일</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#FFEBEB] rounded-lg">
                    <span className="font-medium text-red-700">반려됨</span>
                    <span className="text-lg font-bold text-red-700">{stats.byStatus.rejected}일</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#F4F5F7] rounded-lg">
                    <span className="font-medium text-gray-700">취소됨</span>
                    <span className="text-lg font-bold text-gray-700">{stats.byStatus.cancelled}일</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-[#8B95A1]">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>통계 데이터가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
