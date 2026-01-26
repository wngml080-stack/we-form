"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

interface LeaveSummary {
  staff_id: string;
  staff_name: string;
  gym_name: string | null;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
  pending_days: number;
}

export default function LeaveOverview() {
  const { branchFilter } = useAdminFilter();
  const [summaries, setSummaries] = useState<LeaveSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const year = new Date().getFullYear();

  useEffect(() => {
    fetchSummaries();
  }, [branchFilter.selectedGymId, year]);

  const fetchSummaries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year: year.toString() });
      if (branchFilter.selectedGymId) {
        params.append("gym_id", branchFilter.selectedGymId);
      }

      const response = await fetch(`/api/admin/leave/summary?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "연차 현황을 불러올 수 없습니다.");
      }

      setSummaries(data.summaries || []);
    } catch (error) {
      console.error("Error fetching leave summaries:", error);
      toast.error("연차 현황을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const filteredSummaries = summaries.filter(s =>
    s.staff_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Input
        placeholder="직원 이름 검색..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="max-w-xs"
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filteredSummaries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-[#8B95A1]">연차 데이터가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSummaries.map(summary => (
            <Card key={summary.staff_id}>
              <CardHeader>
                <CardTitle className="text-base">{summary.staff_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[#4E5968]">총 연차</span>
                  <span className="font-bold">{summary.total_days}일</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#4E5968]">사용</span>
                  <span className="font-bold text-[#3182F6]">{summary.used_days}일</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#4E5968]">잔여</span>
                  <span className="font-bold text-[#03C75A]">{summary.remaining_days}일</span>
                </div>
                {summary.pending_days > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[#4E5968] flex items-center gap-1">
                      <Clock className="w-3 h-3" />대기
                    </span>
                    <span className="font-bold text-orange-600">{summary.pending_days}일</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
