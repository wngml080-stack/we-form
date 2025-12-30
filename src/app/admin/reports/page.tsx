"use client";

import { toast } from "@/lib/toast";
import { useState, useEffect, useMemo } from "react";
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
import { CheckCircle, XCircle, Calendar, User, Building, FileText, ChevronDown, ChevronUp, Clock } from "lucide-react";

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
  const [showAllGyms, setShowAllGyms] = useState(false); // 전체 보기 토글

  // 카드 확장 상태
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [expandedSchedules, setExpandedSchedules] = useState<any[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);

  // Supabase 클라이언트 한 번만 생성 (메모이제이션)
  const supabase = useMemo(() => createSupabaseClient(), []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    if (!["admin", "company_admin", "system_admin"].includes(userRole)) {
      showError("접근 권한이 없습니다.", "권한 확인");
      router.push("/admin");
      return;
    }

    if (filterInitialized) {
      // role별로 다른 필터링 적용
      fetchReports();
    }
  }, [authLoading, user, filterInitialized, selectedGymId, userRole, showAllGyms]);

  const fetchReports = async () => {
    setIsLoading(true);

    try {
      // API를 통해 보고서 조회 (RLS 우회)
      const params = new URLSearchParams();

      // showAllGyms가 아니면 선택된 지점 필터
      if (!showAllGyms && selectedGymId) {
        params.append("gym_id", selectedGymId);
      } else if (showAllGyms) {
        // 전체 보기: all_gyms 파라미터 전달
        params.append("all_gyms", "true");
      } else if (selectedGymId) {
        params.append("gym_id", selectedGymId);
      }

      const response = await fetch(`/api/admin/schedule/reports?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        if (result.error !== 'PGRST116') {
          showError(`보고서 조회 실패: ${result.error}`, "데이터 조회");
        }
        setReports([]);
        return;
      }

      const reportsData = result.reports || [];

      if (reportsData.length === 0) {
        setReports([]);
        return;
      }

      // 관련된 staff, gym 정보 별도 조회 (API에서 staff 정보는 포함됨)
      const gymIds = [...new Set(reportsData.map((r: any) => r.gym_id).filter(Boolean))];

      const { data: gymsData } = await supabase
        .from("gyms")
        .select("id, name")
        .in("id", gymIds);

      const gymMap = new Map(gymsData?.map(g => [g.id, g]) || []);

      const reportsWithRelations = reportsData.map((report: any) => ({
        ...report,
        staffs: report.staffs || { name: "-", email: "-" },
        gyms: gymMap.get(report.gym_id) || { name: "-" },
      }));

      setReports(reportsWithRelations as MonthlyReport[]);
    } catch {
      // 네트워크 오류 등 예외 상황
    } finally {
      setIsLoading(false);
    }
  };

  const openReview = (report: MonthlyReport) => {
    setSelectedReport(report);
    setAdminMemo(report.admin_memo || "");
    setIsReviewOpen(true);
  };

  // 카드 확장 토글
  const toggleExpand = async (reportId: string) => {
    if (expandedReportId === reportId) {
      // 접기
      setExpandedReportId(null);
      setExpandedSchedules([]);
      return;
    }

    // 펼치기 - API로 스케줄 조회
    setExpandedReportId(reportId);
    setIsLoadingSchedules(true);
    setExpandedSchedules([]);

    try {
      const response = await fetch(`/api/admin/schedule/reports/${reportId}/schedules`);
      const result = await response.json();

      if (response.ok && result.success) {
        setExpandedSchedules(result.schedules || []);
      } else {
        toast.error(result.error || "스케줄 조회 실패");
      }
    } catch {
      toast.error("스케줄 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const getScheduleStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      completed: { label: "완료", className: "bg-emerald-100 text-emerald-700" },
      reserved: { label: "예약", className: "bg-blue-100 text-blue-700" },
      no_show: { label: "노쇼", className: "bg-gray-100 text-gray-700" },
      no_show_deducted: { label: "노쇼(차감)", className: "bg-red-100 text-red-700" },
      cancelled: { label: "취소", className: "bg-orange-100 text-orange-700" },
      service: { label: "서비스", className: "bg-sky-100 text-sky-700" },
    };
    const info = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-600" };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${info.className}`}>{info.label}</span>;
  };

  const handleReview = async (action: "approved" | "rejected") => {
    if (!selectedReport || !user) return;

    const confirmMsg = action === "approved"
      ? "승인하시겠습니까? 승인 후에는 해당 월의 스케줄을 수정할 수 없습니다."
      : "반려하시겠습니까?";

    if (!confirm(confirmMsg)) return;

    try {
      const response = await fetch("/api/schedule/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: selectedReport.id,
          approved: action === "approved",
          adminMemo: adminMemo,
          unlockOnReject: true,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "처리 중 오류가 발생했습니다.");
      }

      toast.success(action === "approved" ? "승인되었습니다." : "반려되었습니다.");
      setIsReviewOpen(false);
      fetchReports();
    } catch (error: any) {
      toast.error(error.message || "처리 중 오류가 발생했습니다.");
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
            {showAllGyms
              ? "전체 지점의 스케줄을 검토하고 승인합니다."
              : gymName
                ? `${gymName} 직원들의 스케줄을 승인합니다.`
                : "직원들이 제출한 월별 스케줄을 검토하고 승인합니다."}
          </p>
        </div>
        {/* company_admin, system_admin만 전체 보기 버튼 표시 */}
        {(userRole === "company_admin" || userRole === "system_admin") && (
          <Button
            variant={showAllGyms ? "default" : "outline"}
            onClick={() => setShowAllGyms(!showAllGyms)}
            className={showAllGyms ? "bg-[#2F80ED] hover:bg-[#2570d6]" : ""}
          >
            {showAllGyms ? "선택 지점만 보기" : "전체 지점 보기"}
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {reports.length === 0 ? (
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <CardContent className="py-12 text-center text-gray-500">
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

                {/* 상세 스케줄 보기 토글 버튼 */}
                <button
                  onClick={() => toggleExpand(report.id)}
                  className="w-full mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-[#2F80ED] transition-colors"
                >
                  {expandedReportId === report.id ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      스케줄 상세 접기
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      스케줄 상세 보기
                    </>
                  )}
                </button>

                {/* 확장된 스케줄 목록 */}
                {expandedReportId === report.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {isLoadingSchedules ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-3 border-blue-200 border-t-[#2F80ED] rounded-full animate-spin"></div>
                      </div>
                    ) : expandedSchedules.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        등록된 스케줄이 없습니다.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="py-2 px-3 text-left font-semibold text-gray-600">날짜</th>
                              <th className="py-2 px-3 text-left font-semibold text-gray-600">시간</th>
                              <th className="py-2 px-3 text-left font-semibold text-gray-600">타입</th>
                              <th className="py-2 px-3 text-left font-semibold text-gray-600">회원</th>
                              <th className="py-2 px-3 text-left font-semibold text-gray-600">상태</th>
                              <th className="py-2 px-3 text-left font-semibold text-gray-600">구분</th>
                            </tr>
                          </thead>
                          <tbody>
                            {expandedSchedules.map((schedule: any, idx: number) => (
                              <tr key={schedule.id || idx} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="py-2.5 px-3 text-gray-700">{schedule.date}</td>
                                <td className="py-2.5 px-3 text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    {schedule.time}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    schedule.type === "PT" ? "bg-blue-100 text-blue-700" :
                                    schedule.type === "OT" ? "bg-purple-100 text-purple-700" :
                                    "bg-gray-100 text-gray-700"
                                  }`}>
                                    {schedule.type}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-medium text-gray-800">{schedule.member_name}</td>
                                <td className="py-2.5 px-3">{getScheduleStatusBadge(schedule.status)}</td>
                                <td className="py-2.5 px-3 text-gray-600">
                                  {schedule.schedule_type === "inside" ? "근무내" :
                                   schedule.schedule_type === "outside" ? "근무외" :
                                   schedule.schedule_type === "weekend" ? "주말" :
                                   schedule.schedule_type === "holiday" ? "공휴일" : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
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
