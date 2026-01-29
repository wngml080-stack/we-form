"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { Clock, Search, User, UserCheck } from "lucide-react";
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
    <div className="space-y-10">
      {/* Search Bar - Modern Toss Style */}
      <div className="relative group max-w-md">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] group-focus-within:text-[var(--primary-hex)] transition-colors">
          <Search className="w-5 h-5" />
        </div>
        <Input
          placeholder="직원 이름으로 검색하세요"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="h-14 pl-14 pr-6 rounded-[20px] bg-white border-none shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--primary-hex)]/20 font-bold text-base transition-all"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-white rounded-[32px] animate-pulse border border-gray-50 shadow-sm"></div>
          ))}
        </div>
      ) : filteredSummaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200">
          <div className="w-20 h-20 rounded-[28px] bg-gray-50 flex items-center justify-center mb-6">
            <UserCheck className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-[var(--foreground-subtle)] font-bold text-lg">해당하는 직원 데이터가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSummaries.map(summary => {
            const usageRate = Math.round((summary.used_days / (summary.total_days || 1)) * 100);
            
            return (
              <Card key={summary.staff_id} className="group overflow-hidden rounded-[32px] border-none shadow-sm hover:shadow-toss transition-all duration-500 bg-white">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-[20px] bg-[var(--background-secondary)] flex items-center justify-center group-hover:bg-[var(--primary-light-hex)] transition-colors">
                        <User className="w-7 h-7 text-[var(--foreground-subtle)] group-hover:text-[var(--primary-hex)] transition-colors" />
                      </div>
                      <div>
                        <h4 className="text-xl font-extrabold text-[var(--foreground)] tracking-tight">{summary.staff_name}</h4>
                        <p className="text-xs font-bold text-[var(--foreground-subtle)] uppercase tracking-widest mt-0.5">Performance 2024</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-[var(--primary-hex)] bg-[var(--primary-light-hex)] px-2.5 py-1 rounded-full uppercase tracking-tighter">
                        Usage {usageRate}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="h-2.5 bg-[var(--background-secondary)] rounded-full overflow-hidden p-0.5">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(usageRate, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[var(--background-secondary)]/50 p-4 rounded-[20px] space-y-1">
                      <p className="text-[10px] font-black text-[var(--foreground-subtle)] uppercase">Total</p>
                      <p className="text-lg font-black text-[var(--foreground)]">{summary.total_days}<span className="text-xs font-bold ml-0.5">일</span></p>
                    </div>
                    <div className="bg-blue-50/50 p-4 rounded-[20px] space-y-1">
                      <p className="text-[10px] font-black text-blue-400 uppercase">Used</p>
                      <p className="text-lg font-black text-[var(--primary-hex)]">{summary.used_days}<span className="text-xs font-bold ml-0.5">일</span></p>
                    </div>
                    <div className="bg-emerald-50/50 p-4 rounded-[20px] space-y-1">
                      <p className="text-[10px] font-black text-emerald-400 uppercase">Left</p>
                      <p className="text-lg font-black text-emerald-600">{summary.remaining_days}<span className="text-xs font-bold ml-0.5">일</span></p>
                    </div>
                  </div>

                  {summary.pending_days > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 bg-orange-50/50 rounded-[20px] border border-orange-100/50">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-extrabold text-orange-700">승인 대기 중</span>
                      </div>
                      <span className="text-sm font-black text-orange-700">{summary.pending_days}일</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
