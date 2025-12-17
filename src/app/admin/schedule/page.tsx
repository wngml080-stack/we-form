"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Filter, ShieldCheck, ShieldOff } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import WeeklyTimetable from "@/components/WeeklyTimetable";
import * as XLSX from "xlsx";
import { showSuccess, showError } from "@/lib/utils/error-handler";
import { classifyScheduleType } from "@/lib/schedule-utils";
import { useScheduleReports } from "./hooks/useScheduleReports";
import { ApproveModal } from "./components/ApproveModal";
import { ReportStatusBadge } from "./components/ReportStatusBadge";
import { DailyStatsWidget } from "@/components/DailyStatsWidget";

export default function AdminSchedulePage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("all");
  const [gymName, setGymName] = useState("");
  const [myGymId, setMyGymId] = useState<string | null>(null);
  const [myStaffId, setMyStaffId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [workStartTime, setWorkStartTime] = useState<string | null>(null);
  const [workEndTime, setWorkEndTime] = useState<string | null>(null);

  // 뷰 타입 및 날짜
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('week');
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // 월별 통계
  const [monthlyStats, setMonthlyStats] = useState<any>(null);

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);

  // 스케줄 생성 모달
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    date: string;
    time: string;
    staffId?: string;
  } | null>(null);
  const [createForm, setCreateForm] = useState({
    member_id: "",
    type: "PT",
    duration: "60",
    isPersonal: false,
    personalTitle: "",
  });
  const [members, setMembers] = useState<any[]>([]);
  const [reportFilter, setReportFilter] = useState<"all" | "submitted" | "approved" | "rejected">("submitted");
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

  // 스케줄 수정 모달
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    member_id: "",
    status: "",
    type: "",
    date: "",
    time: "",
    duration: "60",
  });

  const supabase = createSupabaseClient();
  const yearMonth = useMemo(() => {
    const d = new Date(selectedDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
  }, [selectedDate]);

  const { reports, isLoading: isReportLoading, refetch: refetchReports } = useScheduleReports({
    gymId: myGymId,
    companyId: null,
    status: reportFilter === "all" ? "all" : reportFilter,
    yearMonth,
  });

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push("/login");

        const { data: me, error: meError } = await supabase
          .from("staffs")
          .select("id, gym_id, role, work_start_time, work_end_time, gyms(name)")
          .eq("user_id", user.id)
          .maybeSingle();

        if (meError) {
          console.error("❌ 사용자 정보 조회 에러:", meError);
          alert("사용자 정보를 불러오는 중 오류가 발생했습니다.");
          return;
        }

        if (!me) {
          console.warn("⚠️ 사용자 데이터 없음");
          alert("사용자 정보를 찾을 수 없습니다. 계정이 승인되었는지 확인해주세요.");
          return router.push("/login");
        }

        // @ts-ignore
        setGymName(me.gyms?.name || "센터");
        setMyGymId(me.gym_id);
        setMyStaffId(me.id);
        setUserRole(me.role);
        setWorkStartTime(me.work_start_time);
        setWorkEndTime(me.work_end_time);

        // ✅ 병렬 쿼리 실행: 강사 목록, 회원 목록을 동시에 불러오기
        const staffIdFilter = me.role === "staff" ? me.id : "all";
        setSelectedStaffId(staffIdFilter);

        if (me.role === "staff") {
          // 일반 직원: 회원 목록만 불러오기
          const { data: memberList } = await supabase
            .from("members")
            .select("id, name")
            .eq("gym_id", me.gym_id)
            .order("name", { ascending: true });

          if (memberList) setMembers(memberList);
        } else {
          // 관리자: 강사 목록과 회원 목록을 병렬로 불러오기
          const [memberResult, staffResult] = await Promise.all([
            supabase
              .from("members")
              .select("id, name")
              .eq("gym_id", me.gym_id)
              .order("name", { ascending: true }),
            supabase
              .from("staffs")
              .select("id, name, work_start_time, work_end_time")
              .eq("gym_id", me.gym_id)
              .order("name", { ascending: true })
          ]);

          if (memberResult.data) setMembers(memberResult.data);
          if (staffResult.data) {
            console.log("📋 강사 목록:", staffResult.data);
            setStaffs(staffResult.data);
          }
        }

        // 스케줄 조회
        fetchSchedules(me.gym_id, staffIdFilter);

        // 보고서 목록
        refetchReports();

      } catch (error) {
        console.error("초기화 에러:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [refetchReports]);

  // 스케줄 조회 함수
  const fetchSchedules = async (gymId: string, staffIdFilter: string) => {
    // ✅ 날짜 필터링: 현재 선택된 날짜의 전후 2개월 데이터만 조회
    const current = new Date(selectedDate);
    const startDate = new Date(current.getFullYear(), current.getMonth() - 2, 1);
    const endDate = new Date(current.getFullYear(), current.getMonth() + 3, 0); // 다음달 마지막일

    let query = supabase
      .from("schedules")
      .select("*")
      .eq("gym_id", gymId)
      .gte("start_time", startDate.toISOString())
      .lte("start_time", endDate.toISOString());

    if (staffIdFilter !== "all") {
      query = query.eq("staff_id", staffIdFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("스케줄 조회 실패:", error);
    } else {
      setSchedules(data || []);
      calculateMonthlyStats(data || []);
    }
  };

  // 월별 통계 계산
  const calculateMonthlyStats = (allSchedules: any[]) => {
    const current = new Date(selectedDate);
    const targetYear = current.getFullYear();
    const targetMonth = current.getMonth();

    const monthlySchedules = allSchedules.filter(s => {
      const d = new Date(s.start_time);
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    });

    const unregistered = monthlySchedules.filter(s => !s.status);

    const stats = {
      PT: 0,
      OT: 0,
      Consulting: 0,
      completed: 0,
      no_show_deducted: 0,
      no_show: 0,
      service: 0,
      unregistered: unregistered.length,
      unregisteredList: unregistered,
      total: monthlySchedules.length
    };

    monthlySchedules.forEach(s => {
      if (s.type === 'PT') stats.PT++;
      else if (s.type === 'OT') stats.OT++;
      else if (s.type === 'Consulting') stats.Consulting++;

      if (s.status === 'completed') stats.completed++;
      else if (s.status === 'no_show_deducted') stats.no_show_deducted++;
      else if (s.status === 'no_show') stats.no_show++;
      else if (s.status === 'service') stats.service++;
    });

    setMonthlyStats(stats);
  };

  // 날짜 변경 시 통계 재계산 및 월 변경 시 데이터 재조회
  useEffect(() => {
    if (schedules.length > 0) {
      calculateMonthlyStats(schedules);
    }

    // ✅ 월이 변경되면 스케줄 다시 불러오기
    if (myGymId && selectedStaffId) {
      const current = new Date(selectedDate);
      const scheduleMonths = schedules.map(s => {
        const d = new Date(s.start_time);
        return `${d.getFullYear()}-${d.getMonth()}`;
      });
      const currentMonth = `${current.getFullYear()}-${current.getMonth()}`;

      // 현재 월의 데이터가 없으면 다시 불러오기
      if (!scheduleMonths.includes(currentMonth) && schedules.length > 0) {
        fetchSchedules(myGymId, selectedStaffId);
      }
    }
  }, [selectedDate, schedules]);

  // 날짜 네비게이션
  const handlePrevDate = () => {
    const date = new Date(selectedDate);
    if (viewType === 'week') {
      date.setDate(date.getDate() - 7);
    } else {
      date.setDate(date.getDate() - 1);
    }
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleApproveSubmit = async (params: { approved: boolean; adminMemo?: string; unlockOnReject?: boolean }) => {
    if (!selectedReport) return;
    try {
      const res = await fetch("/api/schedule/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: selectedReport.id,
          approved: params.approved,
          adminMemo: params.adminMemo,
          unlockOnReject: params.unlockOnReject,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "승인 처리 실패");
      showSuccess(json.message || "처리되었습니다.");
      setIsApproveModalOpen(false);
      setSelectedReport(null);
      refetchReports();
      // 승인/거절 후 스케줄 잠금 상태가 변할 수 있으므로 새로고침
      if (myGymId) fetchSchedules(myGymId, selectedStaffId);
    } catch (e: any) {
      showError(e.message);
    }
  };

  const handleNextDate = () => {
    const date = new Date(selectedDate);
    if (viewType === 'week') {
      date.setDate(date.getDate() + 7);
    } else {
      date.setDate(date.getDate() + 1);
    }
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // 타임 슬롯 클릭 -> 스케줄 생성 모달 열기
  const handleTimeSlotClick = (date: Date, time: string) => {
    // 로컬 시간 기준으로 날짜 문자열 생성 (타임존 문제 방지)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    setSelectedTimeSlot({
      date: dateStr,
      time,
      staffId: selectedStaffId !== "all" ? selectedStaffId : undefined,
    });
    setIsCreateModalOpen(true);
  };

  // 스케줄 클릭 -> 스케줄 수정 모달 열기
  const handleScheduleClick = (schedule: any) => {
    const startDate = new Date(schedule.start_time);
    const endDate = new Date(schedule.end_time);
    const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

    setSelectedSchedule(schedule);
    setEditForm({
      member_id: schedule.member_id || "",
      status: schedule.status || "reserved",
      type: schedule.type || "PT",
      date: startDate.toISOString().split('T')[0],
      time: `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`,
      duration: String(durationMinutes),
    });
    setIsEditModalOpen(true);
  };

  // 스케줄 수정
  const handleUpdateSchedule = async () => {
    if (!selectedSchedule) return;

    // 회원 선택 확인 (개인 일정이 아닌 경우)
    if (!editForm.member_id && selectedSchedule.member_id) {
      showError("회원을 선택해주세요.", "스케줄 수정");
      return;
    }

    try {
      setIsLoading(true);

      // 날짜와 시간을 조합하여 start_time, end_time 생성
      const [year, month, day] = editForm.date.split('-').map(Number);
      const [hours, minutes] = editForm.time.split(':').map(Number);
      const startDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

      const duration = parseInt(editForm.duration);
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + duration);

      // 중복 스케줄 체크 (자기 자신은 제외)
      const { data: existingSchedules } = await supabase
        .from("schedules")
        .select("id, start_time, end_time, member_name")
        .eq("staff_id", selectedSchedule.staff_id)
        .eq("gym_id", myGymId!)
        .neq("id", selectedSchedule.id); // 수정 중인 스케줄은 제외

      if (existingSchedules && existingSchedules.length > 0) {
        // 시간 겹침 체크
        const hasOverlap = existingSchedules.some((schedule) => {
          const existingStart = new Date(schedule.start_time);
          const existingEnd = new Date(schedule.end_time);
          return startDate < existingEnd && existingStart < endDate;
        });

        if (hasOverlap) {
          const overlappingSchedule = existingSchedules.find((schedule) => {
            const existingStart = new Date(schedule.start_time);
            const existingEnd = new Date(schedule.end_time);
            return startDate < existingEnd && existingStart < endDate;
          });

          showError(
            `중복 일정이 있습니다.\n기존 일정: ${overlappingSchedule?.member_name || '일정'} (${new Date(overlappingSchedule!.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${new Date(overlappingSchedule!.end_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })})`,
            "스케줄 수정"
          );
          return;
        }
      }

      // schedule_type 자동 분류
      const scheduleType = classifyScheduleType(
        startDate,
        workStartTime,
        workEndTime
      );

      // 회원 정보 업데이트
      const selectedMember = members.find(m => m.id === editForm.member_id);
      const updateData: any = {
        status: editForm.status,
        type: editForm.type,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        schedule_type: scheduleType,
      };

      // 회원 일정인 경우 회원 정보 업데이트
      if (editForm.member_id && selectedMember) {
        updateData.member_id = editForm.member_id;
        updateData.member_name = selectedMember.name;
        updateData.title = `${selectedMember.name} (${editForm.type})`;
      }

      const { error } = await supabase
        .from("schedules")
        .update(updateData)
        .eq("id", selectedSchedule.id);

      if (error) throw error;

      showSuccess("스케줄이 수정되었습니다!");
      setIsEditModalOpen(false);

      // 스케줄 목록 새로고침
      if (myGymId) {
        fetchSchedules(myGymId, selectedStaffId);
      }
    } catch (error) {
      showError(error, "스케줄 수정");
    } finally {
      setIsLoading(false);
    }
  };

  // 스케줄 생성
  const handleCreateSchedule = async () => {
    if (!selectedTimeSlot || !myGymId) return;

    // 개인 일정인 경우 제목 확인, 회원 일정인 경우 회원 선택 확인
    if (createForm.isPersonal) {
      if (!createForm.personalTitle.trim()) {
        showError("일정 제목을 입력해주세요.", "스케줄 생성");
        return;
      }
    } else {
      if (!createForm.member_id) {
        showError("회원을 선택해주세요.", "스케줄 생성");
        return;
      }
    }

    try {
      setIsLoading(true);

      // 날짜를 안전하게 파싱 (타임존 문제 방지)
      const [year, month, day] = selectedTimeSlot.date.split('-').map(Number);
      const [hours, minutes] = selectedTimeSlot.time.split(':').map(Number);
      const startDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

      const duration = parseInt(createForm.duration);
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + duration);

      const targetStaffId = selectedTimeSlot.staffId || myStaffId;

      // 중복 스케줄 체크
      const { data: existingSchedules } = await supabase
        .from("schedules")
        .select("id, start_time, end_time, member_name")
        .eq("staff_id", targetStaffId)
        .eq("gym_id", myGymId);

      if (existingSchedules && existingSchedules.length > 0) {
        // 시간 겹침 체크
        const hasOverlap = existingSchedules.some((schedule) => {
          const existingStart = new Date(schedule.start_time);
          const existingEnd = new Date(schedule.end_time);
          // 시간이 겹치는지 확인: 새 스케줄의 시작이 기존 종료보다 빠르고, 기존 시작이 새 종료보다 빠르면 겹침
          return startDate < existingEnd && existingStart < endDate;
        });

        if (hasOverlap) {
          const overlappingSchedule = existingSchedules.find((schedule) => {
            const existingStart = new Date(schedule.start_time);
            const existingEnd = new Date(schedule.end_time);
            return startDate < existingEnd && existingStart < endDate;
          });

          showError(
            `중복 일정이 있습니다.\n기존 일정: ${overlappingSchedule?.member_name || '일정'} (${new Date(overlappingSchedule!.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${new Date(overlappingSchedule!.end_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })})`,
            "스케줄 생성"
          );
          return;
        }
      }

      // schedule_type 자동 분류
      const scheduleType = classifyScheduleType(
        startDate,
        workStartTime,
        workEndTime
      );

      let scheduleData: any = {
        gym_id: myGymId,
        staff_id: targetStaffId,
        type: createForm.type,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        schedule_type: scheduleType,
      };

      if (createForm.isPersonal) {
        // 개인 일정
        scheduleData.member_name = createForm.personalTitle;
        scheduleData.title = createForm.personalTitle;
        scheduleData.type = "개인"; // 개인 일정 타입
        scheduleData.status = "completed"; // 개인 일정은 자동 완료 처리
        scheduleData.counted_for_salary = false; // 급여 계산 제외
      } else {
        // 회원 일정
        const selectedMember = members.find(m => m.id === createForm.member_id);
        if (!selectedMember) {
          showError("회원 정보를 찾을 수 없습니다.", "스케줄 생성");
          return;
        }
        scheduleData.member_id = createForm.member_id;
        scheduleData.member_name = selectedMember.name;
        scheduleData.title = `${selectedMember.name} (${createForm.type})`;
        scheduleData.status = "reserved";
        scheduleData.counted_for_salary = true; // 급여 계산 포함
      }

      const { error } = await supabase.from("schedules").insert(scheduleData);

      if (error) throw error;

      showSuccess(createForm.isPersonal ? "개인 일정이 생성되었습니다!" : "스케줄이 생성되었습니다!");
      setIsCreateModalOpen(false);
      setCreateForm({ member_id: "", type: "PT", duration: "60", isPersonal: false, personalTitle: "" });

      // 스케줄 목록 새로고침
      fetchSchedules(myGymId, selectedStaffId);
    } catch (error) {
      showError(error, "스케줄 생성");
    } finally {
      setIsLoading(false);
    }
  };

  // 필터 변경 시 재조회
  const handleFilterChange = (value: string) => {
    setSelectedStaffId(value);
    if (myGymId) {
      fetchSchedules(myGymId, value);
    }
  };

  // 엑셀 다운로드
  const handleExcelDownload = () => {
    if (schedules.length === 0) {
      alert("다운로드할 스케줄이 없습니다.");
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
    const fileName = `${gymName}_스케줄_${today}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  const currentDate = new Date(selectedDate);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // 해당 날짜가 그 달의 몇 주차인지 계산
  const getWeekOfMonth = (date: Date) => {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const offsetDate = date.getDate() + firstDayOfWeek - 1;
    return Math.ceil(offsetDate / 7);
  };

  const weekOfMonth = getWeekOfMonth(currentDate);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F80ED]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            {userRole === "staff" ? "내 스케줄" : "통합 스케줄"}
          </h1>
          <p className="text-gray-500 mt-2 font-medium">{gymName}의 스케줄을 관리하세요</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          {/* 강사 필터 (관리자만) */}
          {userRole !== "staff" && (
            <div className="flex flex-col gap-2">
              <Select value={selectedStaffId} onValueChange={handleFilterChange}>
                <SelectTrigger className="h-10 bg-white border-gray-200 rounded-lg hover:border-[#2F80ED] transition-colors">
                  <SelectValue placeholder="강사 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">전체 강사 보기</SelectItem>
                  {staffs.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* 선택된 강사의 근무시간 표시 */}
              {selectedStaffId !== "all" && (() => {
                const selectedStaff = staffs.find(s => s.id === selectedStaffId);
                console.log("🔍 선택된 강사:", selectedStaff);
                if (selectedStaff) {
                  const formatTime = (time: string | null) => time ? time.substring(0, 5) : '--:--';
                  return (
                    <div className="text-xs text-gray-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                      <span className="font-semibold text-[#2F80ED]">근무시간:</span> {formatTime(selectedStaff.work_start_time)} ~ {formatTime(selectedStaff.work_end_time)}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* 엑셀 다운로드 */}
          <Button
            onClick={handleExcelDownload}
            className="h-10 bg-[#2F80ED] hover:bg-[#2570d6] text-white font-medium rounded-lg shadow-sm transition-all"
          >
            <span className="mr-2">📊</span> 엑셀 다운로드
          </Button>
        </div>
      </div>

      {/* 승인/보고서 패널 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <Filter className="w-4 h-4 text-[#2F80ED]" />
            <span>{yearMonth} 제출/승인 현황</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>상태</span>
            <Select value={reportFilter} onValueChange={(v) => setReportFilter(v as any)}>
              <SelectTrigger className="h-9 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="submitted">승인 대기</SelectItem>
                <SelectItem value="approved">승인됨</SelectItem>
                <SelectItem value="rejected">거절됨</SelectItem>
                <SelectItem value="all">전체</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {isReportLoading && (
            <div className="p-4 text-sm text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              로딩 중...
            </div>
          )}
          {!isReportLoading && reports.length === 0 && (
            <div className="p-4 text-sm text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              제출된 보고서가 없습니다.
            </div>
          )}
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => { setSelectedReport(report); setIsApproveModalOpen(true); }}
              className="p-4 text-left bg-gray-50 hover:bg-white border border-gray-100 rounded-xl shadow-sm transition-colors flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-gray-900">{report.staffs?.name ?? "이름없음"}</div>
                <ReportStatusBadge status={report.status} />
              </div>
              <div className="text-xs text-gray-500">{report.staffs?.job_title ?? ""}</div>
              <div className="text-xs text-gray-500">제출일: {report.submitted_at ? new Date(report.submitted_at).toLocaleDateString("ko-KR") : "-"}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 컨트롤 바 (날짜 + 뷰 전환) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

          {/* 날짜 네비게이션 */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-gray-100 rounded-lg"
              onClick={handlePrevDate}
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <div className="relative group flex items-center justify-center min-w-[160px]">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <div className="px-4 py-2 text-sm font-bold text-gray-700 cursor-pointer hover:text-[#2F80ED] transition-colors">
                {viewType === 'day' && `${year}년 ${month}월 ${currentDate.getDate()}일`}
                {viewType === 'week' && `${year}년 ${month}월 ${weekOfMonth}주차`}
                {viewType === 'month' && `${year}년 ${month}월`}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-gray-100 rounded-lg"
              onClick={handleNextDate}
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </Button>
            <div className="w-px h-6 bg-gray-200 mx-2"></div>
            <Button
              variant="ghost"
              size="sm"
              className="px-3 py-2 text-sm font-bold text-[#2F80ED] hover:bg-blue-50 rounded-lg transition-colors"
              onClick={handleToday}
            >
              오늘
            </Button>
          </div>

          {/* 뷰 전환 버튼 */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            {(['day', 'week', 'month'] as const).map((type) => (
              <Button
                key={type}
                onClick={() => setViewType(type)}
                variant="ghost"
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                  viewType === type
                    ? 'bg-white text-[#2F80ED] shadow-sm'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                {type === 'day' ? '일' : type === 'week' ? '주' : '월집계'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* 타임테이블 또는 월별 통계 */}
      {viewType === 'month' ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <div className="w-1.5 h-6 bg-[#2F80ED] rounded-full"></div>
                {year}년 {month}월 출석 현황
              </h2>
              <p className="text-xs text-gray-500 mt-1 ml-3.5">이번 달 스케줄 요약 및 출석 통계</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-xs text-gray-500 font-medium mb-1">PT 진행</div>
              <div className="text-2xl font-bold text-gray-900">{monthlyStats?.PT || 0}<span className="text-sm text-gray-500 ml-1">회</span></div>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-xs text-gray-500 font-medium mb-1">OT 진행</div>
              <div className="text-2xl font-bold text-gray-900">{monthlyStats?.OT || 0}<span className="text-sm text-gray-500 ml-1">회</span></div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-xs text-gray-500 font-medium mb-1">상담</div>
              <div className="text-2xl font-bold text-gray-900">{monthlyStats?.Consulting || 0}<span className="text-sm text-gray-500 ml-1">건</span></div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-xs text-gray-500 font-medium mb-1">총 일정</div>
              <div className="text-2xl font-bold text-gray-900">{monthlyStats?.total || 0}<span className="text-sm text-gray-500 ml-1">건</span></div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">상세 현황</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-50/50 border border-transparent hover:border-blue-100 transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-lg">🟢</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium mb-0.5">출석 완료</div>
                    <div className="text-lg font-bold text-gray-900">{monthlyStats?.completed || 0}회</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-50/50 border border-transparent hover:border-blue-100 transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-lg">🔴</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium mb-0.5">노쇼 (차감)</div>
                    <div className="text-lg font-bold text-gray-900">{monthlyStats?.no_show_deducted || 0}회</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-50/50 border border-transparent hover:border-blue-100 transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-lg">⚪</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium mb-0.5">단순 노쇼</div>
                    <div className="text-lg font-bold text-gray-900">{monthlyStats?.no_show || 0}회</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-50/50 border border-transparent hover:border-blue-100 transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-lg">🔵</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium mb-0.5">서비스</div>
                    <div className="text-lg font-bold text-gray-900">{monthlyStats?.service || 0}회</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 출석 미등록자 리스트 */}
          {monthlyStats && monthlyStats.unregistered > 0 && (
            <div className="border-t border-gray-100 pt-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  출석 미등록자 리스트
                </h3>
                <div className="text-sm font-bold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                  {monthlyStats.unregistered}건
                </div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {monthlyStats.unregisteredList?.map((schedule: any) => (
                  <div key={schedule.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-100 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`px-2 py-1 rounded text-xs font-bold ${
                        schedule.type === 'PT' ? 'bg-blue-100 text-blue-600' :
                        schedule.type === 'OT' ? 'bg-purple-100 text-purple-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {schedule.type}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{schedule.member_name || '회원명 없음'}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(schedule.start_time).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                          {' '}
                          {new Date(schedule.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          {schedule.trainer_name && ` · ${schedule.trainer_name}`}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs bg-white hover:bg-yellow-100 border border-yellow-200"
                    >
                      출석 처리
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <WeeklyTimetable
              schedules={schedules}
              onScheduleClick={handleScheduleClick}
              onTimeSlotClick={handleTimeSlotClick}
              viewType={viewType}
              selectedDate={selectedDate}
              workStartTime={workStartTime}
              workEndTime={workEndTime}
              selectedStaffId={selectedStaffId}
              staffs={staffs}
            />
          </div>

          {/* 당일 통계 위젯 */}
          <DailyStatsWidget
            selectedDate={selectedDate}
            schedules={schedules}
            staffName={
              selectedStaffId !== "all"
                ? staffs.find(s => s.id === selectedStaffId)?.name
                : undefined
            }
          />
        </>
      )}

      {/* 스케줄 생성 모달 */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#2F80ED]" />
              스케줄 생성
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 선택된 시간 표시 */}
            {selectedTimeSlot && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-gray-600">선택된 시간</div>
                <div className="font-bold text-gray-900">
                  {selectedTimeSlot.date} {selectedTimeSlot.time}
                </div>
              </div>
            )}

            {/* 일정 유형 선택 */}
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                id="isPersonal"
                checked={createForm.isPersonal}
                onChange={(e) => setCreateForm({
                  ...createForm,
                  isPersonal: e.target.checked,
                  member_id: "",
                  personalTitle: ""
                })}
                className="w-4 h-4 rounded border-gray-300 text-[#2F80ED] focus:ring-[#2F80ED]"
              />
              <Label htmlFor="isPersonal" className="cursor-pointer font-medium">
                개인 일정 <span className="text-xs text-gray-500">(급여 계산 제외)</span>
              </Label>
            </div>

            {/* 조건부 렌더링: 개인 일정이면 제목 입력, 회원 일정이면 회원 선택 */}
            {createForm.isPersonal ? (
              <div className="space-y-2">
                <Label htmlFor="personalTitle">일정 제목 *</Label>
                <input
                  type="text"
                  id="personalTitle"
                  value={createForm.personalTitle}
                  onChange={(e) => setCreateForm({ ...createForm, personalTitle: e.target.value })}
                  placeholder="예: 회의, 휴식, 개인 업무 등"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED]"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="member_id">회원 선택 *</Label>
                <Select
                  value={createForm.member_id}
                  onValueChange={(value) => setCreateForm({ ...createForm, member_id: value })}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="회원을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.length === 0 ? (
                      <SelectItem value="none" disabled>등록된 회원이 없습니다</SelectItem>
                    ) : (
                      members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 수업 타입 (개인 일정이 아닐 때만 표시) */}
            {!createForm.isPersonal && (
              <div className="space-y-2">
                <Label htmlFor="type">수업 타입 *</Label>
                <Select
                  value={createForm.type}
                  onValueChange={(value) => setCreateForm({ ...createForm, type: value })}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PT">PT</SelectItem>
                    <SelectItem value="OT">OT</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="GX">GX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 진행 시간 */}
            <div className="space-y-2">
              <Label htmlFor="duration">진행 시간 *</Label>
              <Select
                value={createForm.duration}
                onValueChange={(value) => setCreateForm({ ...createForm, duration: value })}
              >
                <SelectTrigger className="border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30분</SelectItem>
                  <SelectItem value="60">60분</SelectItem>
                  <SelectItem value="90">90분</SelectItem>
                  <SelectItem value="120">120분</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              className="border-gray-300"
            >
              취소
            </Button>
            <Button
              onClick={handleCreateSchedule}
              disabled={isLoading}
              className="bg-[#2F80ED] hover:bg-[#2F80ED]/90"
            >
              {isLoading ? "생성 중..." : "생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 스케줄 수정 모달 */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#2F80ED]">
              스케줄 수정
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 회원 선택 */}
            {selectedSchedule?.member_id && (
              <div className="space-y-2">
                <Label htmlFor="edit_member_id">회원 선택 *</Label>
                <Select
                  value={editForm.member_id}
                  onValueChange={(value) => setEditForm({ ...editForm, member_id: value })}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="회원을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.length === 0 ? (
                      <SelectItem value="none" disabled>등록된 회원이 없습니다</SelectItem>
                    ) : (
                      members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 날짜 선택 */}
            <div className="space-y-2">
              <Label htmlFor="edit_date">날짜 *</Label>
              <input
                type="date"
                id="edit_date"
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED]"
              />
            </div>

            {/* 시간 선택 */}
            <div className="space-y-2">
              <Label htmlFor="edit_time">시작 시간 *</Label>
              <input
                type="time"
                id="edit_time"
                value={editForm.time}
                onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED]"
              />
            </div>

            {/* 진행 시간 */}
            <div className="space-y-2">
              <Label htmlFor="edit_duration">진행 시간 *</Label>
              <Select
                value={editForm.duration}
                onValueChange={(value) => setEditForm({ ...editForm, duration: value })}
              >
                <SelectTrigger className="border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30분</SelectItem>
                  <SelectItem value="60">60분</SelectItem>
                  <SelectItem value="90">90분</SelectItem>
                  <SelectItem value="120">120분</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 수업 타입 */}
            <div className="space-y-2">
              <Label htmlFor="edit_type">수업 타입 *</Label>
              <Select
                value={editForm.type}
                onValueChange={(value) => setEditForm({ ...editForm, type: value })}
              >
                <SelectTrigger className="border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PT">PT</SelectItem>
                  <SelectItem value="OT">OT</SelectItem>
                  <SelectItem value="Consulting">Consulting</SelectItem>
                  <SelectItem value="GX">GX</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 출석 상태 */}
            <div className="space-y-2">
              <Label htmlFor="edit_status">출석 상태 *</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger className="border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reserved">예약됨</SelectItem>
                  <SelectItem value="completed">출석완료</SelectItem>
                  <SelectItem value="no_show">노쇼</SelectItem>
                  <SelectItem value="no_show_deducted">노쇼 (차감)</SelectItem>
                  <SelectItem value="service">서비스</SelectItem>
                  <SelectItem value="cancelled">취소됨</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="border-gray-300"
            >
              취소
            </Button>
            <Button
              onClick={handleUpdateSchedule}
              disabled={isLoading}
              className="bg-[#2F80ED] hover:bg-[#2F80ED]/90"
            >
              {isLoading ? "수정 중..." : "수정"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 승인 모달 */}
      <ApproveModal
        open={isApproveModalOpen}
        onOpenChange={setIsApproveModalOpen}
        report={selectedReport}
        onSubmit={handleApproveSubmit}
      />
    </div>
  );
}
