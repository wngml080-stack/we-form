"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { useAuth } from "@/contexts/AuthContext";
import { showError } from "@/lib/utils/error-handler";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Calendar, User, Building, FileText } from "lucide-react";

interface MonthlyReport {
  id: string;
  staff_id: string;
  gym_id: string;
  company_id: string;
  year_month: string;
  stats: any;
  status: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  staff_memo?: string;
  admin_memo?: string;
  staffs: {
    name: string;
    email: string;
  };
  gyms: {
    name: string;
  };
}

export default function AdminReportsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { branchFilter, isInitialized: filterInitialized } = useAdminFilter();
  const selectedGymId = branchFilter.selectedGymId;
  const gymName = branchFilter.gyms.find(g => g.id === selectedGymId)?.name || "";
  const userRole = user?.role || "";

  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [adminMemo, setAdminMemo] = useState("");

  const supabase = createSupabaseClient();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (!["admin", "company_admin", "system_admin"].includes(userRole)) {
      showError("접근 권한이 없습니다.", "권한 확인");
      router.push("/admin");
      return;
    }

    if (filterInitialized && selectedGymId) {
      fetchReports(selectedGymId);
    }
  }, [authLoading, user, filterInitialized, selectedGymId, userRole]);

  const fetchReports = async (gymId: string) => {
    setIsLoading(true);

    try {
      // 1. 보고서 조회 - 선택한 지점의 보고서만 조회
      const { data: reportsData, error: reportsError } = await supabase
        .from("monthly_schedule_reports")
        .select("*")
        .eq("gym_id", gymId)
        .order("submitted_at", { ascending: false });

      if (reportsError) {
        console.error("Error fetching reports:", reportsError);
        if (reportsError.code !== 'PGRST116') {
          showError(`보고서 조회 실패: ${reportsError.message}`, "데이터 조회");
        }
        return;
      }

      if (!reportsData || reportsData.length === 0) {
        setReports([]);
        return;
      }

      // 2. 관련된 staff, gym 정보 별도 조회
      const staffIds = [...new Set(reportsData.map(r => r.staff_id).filter(Boolean))];
      const gymIds = [...new Set(reportsData.map(r => r.gym_id).filter(Boolean))];

      const [staffsResult, gymsResult] = await Promise.all([
        supabase.from("staffs").select("id, name, email").in("id", staffIds),
        supabase.from("gyms").select("id, name").in("id", gymIds)
      ]);

      // 3. 매핑
      const staffMap = new Map(staffsResult.data?.map(s => [s.id, s]) || []);
      const gymMap = new Map(gymsResult.data?.map(g => [g.id, g]) || []);

      const reportsWithRelations = reportsData.map(report => ({
        ...report,
        staffs: staffMap.get(report.staff_id) || { name: "-", email: "-" },
        gyms: gymMap.get(report.gym_id) || { name: "-" },
      }));

      setReports(reportsWithRelations as MonthlyReport[]);
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openReview = (report: MonthlyReport) => {
    setSelectedReport(report);
    setAdminMemo(report.admin_memo || "");
    setIsReviewOpen(true);
  };

  const handleReview = async (action: "approved" | "rejected") => {
    if (!selectedReport || !user) return;

    const confirmMsg = action === "approved"
      ? "승인하시겠습니까? 승인 후에는 해당 월의 스케줄을 수정할 수 없습니다."
      : "반려하시겠습니까?";

    if (!confirm(confirmMsg)) return;

    const { error } = await supabase
      .from("monthly_schedule_reports")
      .update({
        status: action,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        admin_memo: adminMemo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedReport.id);

    if (error) {
      alert("처리 중 오류가 발생했습니다: " + error.message);
    } else {
      alert(action === "approved" ? "승인되었습니다." : "반려되었습니다.");
      setIsReviewOpen(false);

      // Refetch reports
      if (selectedGymId) {
        fetchReports(selectedGymId);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-orange-500 text-white hover:bg-orange-600 font-semibold">제출됨</Badge>;
      case "approved":
        return <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 font-semibold">승인됨</Badge>;
      case "rejected":
        return <Badge className="bg-red-500 text-white hover:bg-red-600 font-semibold">반려됨</Badge>;
      default:
        return <Badge variant="outline" className="font-semibold">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-[#2F80ED] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            월별 스케줄 승인
          </h1>
          <p className="text-gray-500 mt-1 sm:mt-2 font-medium text-sm sm:text-base">
            {gymName ? `${gymName} 직원들의 스케줄을 승인합니다.` : "직원들이 제출한 월별 스케줄을 검토하고 승인합니다."}
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {reports.length === 0 ? (
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <CardContent className="py-12 text-center text-gray-400">
              제출된 보고서가 없습니다.
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-[#2F80ED]" />
                      </div>
                      <span className="font-bold text-xl text-gray-900">{report.year_month}</span>
                      {getStatusBadge(report.status)}
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 pl-13">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-700">{report.staffs?.name}</span>
                        <span className="text-gray-400">({report.staffs?.email})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{report.gyms?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">제출일: {new Date(report.submitted_at).toLocaleString('ko-KR')}</span>
                      </div>
                    </div>

                    {/* 통계 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      <div className="bg-blue-50 p-3 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="text-xs text-gray-500 font-medium mb-1">총 PT</div>
                        <div className="text-lg font-bold text-gray-900">{report.stats?.pt_total_count || 0}<span className="text-sm text-gray-500 ml-1">회</span></div>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="text-xs text-gray-500 font-medium mb-1">근무내</div>
                        <div className="text-lg font-bold text-gray-900">{report.stats?.pt_inside_count || 0}<span className="text-sm text-gray-500 ml-1">회</span></div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="text-xs text-gray-500 font-medium mb-1">근무외</div>
                        <div className="text-lg font-bold text-gray-900">{report.stats?.pt_outside_count || 0}<span className="text-sm text-gray-500 ml-1">회</span></div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="text-xs text-gray-500 font-medium mb-1">주말/공휴일</div>
                        <div className="text-lg font-bold text-gray-900">
                          {(report.stats?.pt_weekend_count || 0) + (report.stats?.pt_holiday_count || 0)}<span className="text-sm text-gray-500 ml-1">회</span>
                        </div>
                      </div>
                    </div>

                    {report.staff_memo && (
                      <div className="mt-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="font-semibold text-sm text-gray-700 mb-1.5">직원 메모</div>
                        <div className="text-sm text-gray-600">{report.staff_memo}</div>
                      </div>
                    )}

                    {report.admin_memo && (
                      <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                        <div className="font-semibold text-sm text-gray-700 mb-1.5">관리자 메모</div>
                        <div className="text-sm text-gray-600">{report.admin_memo}</div>
                      </div>
                    )}
                  </div>

                  {report.status === "submitted" && (
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => openReview(report)}
                        className="h-10 bg-[#2F80ED] hover:bg-[#2570d6] text-white font-semibold shadow-sm w-full lg:w-32"
                      >
                        검토하기
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 검토 모달 */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="bg-white max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">스케줄 보고서 검토</DialogTitle>
            <DialogDescription className="sr-only">스케줄 보고서를 검토합니다</DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">직원</div>
                  <div className="font-semibold text-gray-900">{selectedReport.staffs?.name}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">기간</div>
                  <div className="font-semibold text-gray-900">{selectedReport.year_month}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">총 PT</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedReport.stats?.pt_total_count || 0}<span className="text-sm text-gray-500 ml-1">회</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">근무내</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedReport.stats?.pt_inside_count || 0}<span className="text-sm text-gray-500 ml-1">회</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">근무외</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedReport.stats?.pt_outside_count || 0}<span className="text-sm text-gray-500 ml-1">회</span>
                  </div>
                </div>
                <div className="p-3 bg-orange-50 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">주말/공휴일</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {(selectedReport.stats?.pt_weekend_count || 0) + (selectedReport.stats?.pt_holiday_count || 0)}<span className="text-sm text-gray-500 ml-1">회</span>
                  </div>
                </div>
              </div>

              {selectedReport.staff_memo && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="font-semibold text-sm text-gray-700 mb-2">직원 메모</div>
                  <div className="text-sm text-gray-600 whitespace-pre-wrap">{selectedReport.staff_memo}</div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">관리자 메모 (선택사항)</label>
                <Textarea
                  value={adminMemo}
                  onChange={(e) => setAdminMemo(e.target.value)}
                  placeholder="검토 의견을 입력하세요..."
                  rows={4}
                  className="resize-none border-gray-200 focus:border-[#2F80ED] focus:ring-[#2F80ED]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => handleReview("rejected")}
              className="h-10 border-2 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold"
            >
              <XCircle className="w-4 h-4 mr-2" />
              반려
            </Button>
            <Button
              onClick={() => handleReview("approved")}
              className="h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              승인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
