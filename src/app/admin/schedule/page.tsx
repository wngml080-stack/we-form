"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import WeeklyTimetable from "@/components/WeeklyTimetable";
import { showSuccess, showError } from "@/lib/utils/error-handler";
import { classifyScheduleType } from "@/lib/schedule-utils";
import { DailyStatsWidget } from "@/components/DailyStatsWidget";
import { MonthlySubmissionBanner } from "@/components/MonthlySubmissionBanner";
import { CreateScheduleModal } from "./components/modals/CreateScheduleModal";
import { EditScheduleModal } from "./components/modals/EditScheduleModal";
import { QuickStatusModal } from "./components/modals/QuickStatusModal";
import { MonthlyStatsSection } from "./components/MonthlyStatsSection";
import {
  calculateMonthlyStats as calcStats,
  enrichSchedulesWithSessionInfo as enrichSchedules,
  getSessionNumber as getSessionNum,
  MonthlyStats
} from "./utils/statisticsUtils";
import { useScheduleOperations } from "./hooks/useScheduleOperations";
import { exportSchedulesToExcel, getWeekOfMonth } from "./utils/excelExport";

export default function AdminSchedulePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { dashboardFilter, isInitialized: filterInitialized } = useAdminFilter();

  const [schedules, setSchedules] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("all");

  // 대시보드 필터에서 회사/지점 정보 사용
  const selectedGymId = dashboardFilter.selectedGymId;
  const selectedCompanyId = dashboardFilter.selectedCompanyId;
  const gyms = dashboardFilter.gyms;
  const gymName = gyms.find(g => g.id === selectedGymId)?.name || "";

  // AuthContext에서 사용자 정보 사용
  const myStaffId = user?.id || null;
  const userRole = user?.role || "";
  const workStartTime = user?.work_start_time || null;
  const workEndTime = user?.work_end_time || null;

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
  const [memberMemberships, setMemberMemberships] = useState<Record<string, any[]>>({});
  const [selectedMemberMembership, setSelectedMemberMembership] = useState<any | null>(null);

  // 내 스케줄 제출 관련 상태
  const [mySubmissionStatus, setMySubmissionStatus] = useState<"none" | "submitted" | "approved" | "rejected">("none");
  const [mySubmittedAt, setMySubmittedAt] = useState<string | null>(null);
  const [myReviewedAt, setMyReviewedAt] = useState<string | null>(null);
  const [myAdminMemo, setMyAdminMemo] = useState<string | null>(null);

  // 빠른 상태 변경 모달
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  // 스케줄 수정 모달
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    member_id: "",
    status: "",
    type: "",
    date: "",
    time: "",
    duration: "60",
    personalTitle: "",
    sub_type: "",
    inbody_checked: false,
  });

  // Supabase 클라이언트 한 번만 생성 (메모이제이션)
  const supabase = useMemo(() => createSupabaseClient(), []);

  const yearMonth = useMemo(() => {
    const d = new Date(selectedDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
  }, [selectedDate]);

  // 선택된 트레이너에 따라 회원 필터링
  const filteredMembers = useMemo(() => {
    if (selectedStaffId === "all") {
      return members;
    }
    // 특정 트레이너 선택 시 해당 트레이너 담당 회원만 표시
    return members.filter((member: any) => member.trainer_id === selectedStaffId);
  }, [members, selectedStaffId]);

  // AuthContext와 AdminFilter 데이터가 로드되면 초기화
  useEffect(() => {
    if (authLoading || !filterInitialized) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }
    if (!selectedGymId) return;

    const init = async () => {
      try {
        // ✅ 병렬 쿼리 실행: 강사 목록, 회원 목록을 동시에 불러오기
        const staffIdFilter = user.role === "staff" ? user.id : "all";
        setSelectedStaffId(staffIdFilter);

        if (user.role === "staff") {
          // 일반 직원: 담당 회원만 불러오기 (trainer_id가 본인인 회원만)
          const [memberResult, membershipResult] = await Promise.all([
            supabase
              .from("members")
              .select("id, name")
              .eq("gym_id", selectedGymId)
              .eq("trainer_id", user.id)  // 담당 트레이너 필터링
              .order("name", { ascending: true }),
            supabase
              .from("member_memberships")
              .select("id, member_id, name, total_sessions, used_sessions, start_date, end_date, status")
              .eq("gym_id", selectedGymId)
              .eq("status", "active")
          ]);

          if (memberResult.data) setMembers(memberResult.data);
          if (membershipResult.data) {
            // 담당 회원의 회원권만 필터링
            const myMemberIds = memberResult.data?.map(m => m.id) || [];
            const filteredMemberships = membershipResult.data.filter(m => myMemberIds.includes(m.member_id));
            // 회원 ID별로 회원권 그룹화
            const grouped = filteredMemberships.reduce((acc: Record<string, any[]>, m) => {
              if (!acc[m.member_id]) acc[m.member_id] = [];
              acc[m.member_id].push(m);
              return acc;
            }, {});
            setMemberMemberships(grouped);
          }
        } else {
          // 관리자: 강사 목록, 회원 목록, 회원권 정보를 병렬로 불러오기
          const [memberResult, staffResult, membershipResult] = await Promise.all([
            supabase
              .from("members")
              .select("id, name, trainer_id")  // trainer_id 추가
              .eq("gym_id", selectedGymId)
              .order("name", { ascending: true }),
            supabase
              .from("staffs")
              .select("id, name, work_start_time, work_end_time")
              .eq("gym_id", selectedGymId)
              .order("name", { ascending: true }),
            supabase
              .from("member_memberships")
              .select("id, member_id, name, total_sessions, used_sessions, start_date, end_date, status")
              .eq("gym_id", selectedGymId)
              .eq("status", "active")
          ]);

          if (memberResult.data) setMembers(memberResult.data);
          if (staffResult.data) {
            setStaffs(staffResult.data);
          }
          if (membershipResult.data) {
            // 회원 ID별로 회원권 그룹화
            const grouped = membershipResult.data.reduce((acc: Record<string, any[]>, m) => {
              if (!acc[m.member_id]) acc[m.member_id] = [];
              acc[m.member_id].push(m);
              return acc;
            }, {});
            setMemberMemberships(grouped);
          }
        }

        // 스케줄 조회
        fetchSchedules(user.gym_id, staffIdFilter);

      } catch (error) {
        console.error("초기화 에러:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [authLoading, filterInitialized, selectedGymId, user]);

  // 내 제출 상태 조회
  const fetchMyReportStatus = async (staffId: string, gymId: string) => {
    const { data, error } = await supabase
      .from("monthly_schedule_reports")
      .select("id, status, submitted_at, reviewed_at, admin_memo")
      .eq("staff_id", staffId)
      .eq("gym_id", gymId)
      .eq("year_month", yearMonth)
      .maybeSingle();

    if (error) {
      console.error("내 보고서 조회 실패:", error);
      return;
    }

    if (data) {
      setMySubmissionStatus(data.status as any);
      setMySubmittedAt(data.submitted_at);
      setMyReviewedAt(data.reviewed_at);
      setMyAdminMemo(data.admin_memo);
    } else {
      setMySubmissionStatus("none");
      setMySubmittedAt(null);
      setMyReviewedAt(null);
      setMyAdminMemo(null);
    }
  };

  // 내 스케줄 제출
  const handleSubmitMonth = async () => {
    if (!selectedGymId || !myStaffId) return;
    if (!confirm(`${yearMonth} 스케줄을 관리자에게 제출하시겠습니까?\n제출 후 승인 전까지 잠금됩니다.`)) return;

    try {
      const res = await fetch("/api/schedule/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearMonth }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "제출에 실패했습니다.");

      showSuccess(json.message || "제출되었습니다.");
      setMySubmissionStatus("submitted");
      setMySubmittedAt(json.report?.submitted_at ?? null);
      fetchSchedules(selectedGymId, selectedStaffId);
    } catch (e: any) {
      showError(e.message);
    }
  };

  // 월/날짜/지점 변경 시 내 제출 상태 갱신
  useEffect(() => {
    if (myStaffId && selectedGymId) {
      fetchMyReportStatus(myStaffId, selectedGymId);
    }
  }, [yearMonth, myStaffId, selectedGymId]);

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
      // PT/OT 스케줄에 세션 정보 추가
      const enrichedSchedules = enrichSchedules(data || [], memberMemberships);
      setSchedules(enrichedSchedules);
      setMonthlyStats(calcStats(enrichedSchedules, selectedDate));
    }
  };

  // 특정 회원의 PT/OT 회차 계산 (컴포넌트 props용 래퍼 함수)
  const getSessionNumber = (memberId: string, scheduleType: 'pt' | 'ot', scheduleId?: string) => {
    return getSessionNum(schedules, memberId, scheduleType, scheduleId);
  };

  // 스케줄 작업 훅
  const scheduleOps = useScheduleOperations({
    supabase,
    selectedGymId,
    selectedStaffId,
    myStaffId,
    workStartTime,
    workEndTime,
    members,
    memberMemberships,
    setMemberMemberships,
    fetchSchedules,
    setIsLoading
  });

  // 스케줄이 변경되면 통계 재계산
  useEffect(() => {
    if (schedules.length > 0) {
      setMonthlyStats(calcStats(schedules, selectedDate));
    }
  }, [schedules, selectedDate]);

  // 날짜 변경 시 스케줄 다시 불러오기
  useEffect(() => {
    if (selectedGymId && selectedStaffId) {
      fetchSchedules(selectedGymId, selectedStaffId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedGymId, selectedStaffId]);

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

  // 스케줄 클릭 -> 빠른 상태 변경 모달 열기
  const handleScheduleClick = (schedule: any) => {
    setSelectedSchedule(schedule);
    setIsStatusModalOpen(true);
  };

  // 상태 모달에서 수정 모달로 전환
  const handleOpenEditModal = () => {
    if (!selectedSchedule) return;

    const startDate = new Date(selectedSchedule.start_time);
    const endDate = new Date(selectedSchedule.end_time);
    const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

    // 로컬 시간 기준으로 날짜 문자열 생성 (타임존 문제 방지)
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    setEditForm({
      member_id: selectedSchedule.member_id || "",
      status: selectedSchedule.status || "reserved",
      type: selectedSchedule.type || "PT",
      date: dateStr,
      time: `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`,
      duration: String(durationMinutes),
      personalTitle: selectedSchedule.title || "",
      sub_type: selectedSchedule.sub_type || "",
      inbody_checked: selectedSchedule.inbody_checked || false,
    });
    setIsStatusModalOpen(false);
    setIsEditModalOpen(true);
  };

  // 스케줄 수정
  const handleUpdateSchedule = async () => {
    if (!selectedSchedule) return;

    const isPersonalSchedule = selectedSchedule?.type?.toLowerCase() === 'personal' || selectedSchedule?.type === '개인' || editForm.type === 'Personal';

    // 개인일정: 제목 필수
    if (isPersonalSchedule && !editForm.personalTitle?.trim()) {
      showError("일정 제목을 입력해주세요.", "스케줄 수정");
      return;
    }

    // 일반 스케줄: 회원 선택 확인
    if (!isPersonalSchedule && !editForm.member_id && selectedSchedule.member_id) {
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

      // 기존 스케줄의 시간과 비교하여 시간이 변경되었는지 확인 (분 단위로 비교, 초/밀리초 무시)
      const originalStart = new Date(selectedSchedule.start_time);
      const originalEnd = new Date(selectedSchedule.end_time);

      // 분 단위까지만 비교 (초/밀리초 차이 무시)
      const normalizeToMinute = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), 0, 0).getTime();
      };

      const timeChanged = normalizeToMinute(startDate) !== normalizeToMinute(originalStart) ||
                          normalizeToMinute(endDate) !== normalizeToMinute(originalEnd);

      // 시간이 변경된 경우에만 중복 스케줄 체크
      if (timeChanged) {
        const { data: existingSchedules } = await supabase
          .from("schedules")
          .select("id, start_time, end_time, member_name")
          .eq("staff_id", selectedSchedule.staff_id)
          .eq("gym_id", selectedGymId!)
          .neq("id", selectedSchedule.id);

        if (existingSchedules && existingSchedules.length > 0) {
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
      }

      // 상태가 출석완료/노쇼(차감)으로 변경된 경우 API를 통해 처리 (회원권 차감 포함)
      const statusChanged = editForm.status !== selectedSchedule.status;
      const needsMembershipUpdate = statusChanged &&
        ["completed", "no_show_deducted"].includes(editForm.status) &&
        !["completed", "no_show_deducted"].includes(selectedSchedule.status);

      if (needsMembershipUpdate) {
        // 먼저 다른 필드들 업데이트 (상태 제외)
        const scheduleType = classifyScheduleType(startDate, workStartTime, workEndTime);
        const selectedMember = members.find(m => m.id === editForm.member_id);
        const updateData: any = {
          type: editForm.type,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          schedule_type: scheduleType,
        };

        if (editForm.member_id && selectedMember) {
          updateData.member_id = editForm.member_id;
          updateData.member_name = selectedMember.name;
          updateData.title = `${selectedMember.name} (${editForm.type})`;
        }

        // OT인 경우 인바디 체크 여부 저장
        if (editForm.type === 'OT' || selectedSchedule?.type === 'OT') {
          updateData.inbody_checked = editForm.inbody_checked;
        }

        await supabase
          .from("schedules")
          .update(updateData)
          .eq("id", selectedSchedule.id);

        // 상태는 API를 통해 업데이트 (회원권 차감 + 출석부 기록)
        const res = await fetch("/api/schedule/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduleId: selectedSchedule.id,
            newStatus: editForm.status,
          }),
        });

        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || "상태 업데이트 실패");
        }

        // 회원권 정보 새로고침
        if (selectedGymId) {
          const { data: membershipData } = await supabase
            .from("member_memberships")
            .select("id, member_id, name, total_sessions, used_sessions, start_date, end_date, status")
            .eq("gym_id", selectedGymId)
            .eq("status", "active");

          if (membershipData) {
            const grouped = membershipData.reduce((acc: Record<string, any[]>, m) => {
              if (!acc[m.member_id]) acc[m.member_id] = [];
              acc[m.member_id].push(m);
              return acc;
            }, {});
            setMemberMemberships(grouped);
          }
        }
      } else {
        // 일반 업데이트 (회원권 차감 불필요)
        const scheduleType = classifyScheduleType(startDate, workStartTime, workEndTime);
        const isPersonalSchedule = selectedSchedule?.type?.toLowerCase() === 'personal' || selectedSchedule?.type === '개인' || editForm.type === 'Personal';

        const updateData: any = {
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          schedule_type: scheduleType,
        };

        if (isPersonalSchedule) {
          // 개인일정 업데이트
          updateData.title = editForm.personalTitle || '개인일정';
          updateData.sub_type = editForm.sub_type;
          updateData.type = 'Personal';
        } else {
          // 일반 스케줄 업데이트
          updateData.status = editForm.status;
          updateData.type = editForm.type;

          // 상담인 경우 sub_type 저장
          if (editForm.type === 'Consulting' || selectedSchedule?.type?.toLowerCase() === 'consulting') {
            updateData.sub_type = editForm.sub_type;
          }

          // OT인 경우 인바디 체크 여부 저장
          if (editForm.type === 'OT' || selectedSchedule?.type === 'OT') {
            updateData.inbody_checked = editForm.inbody_checked;
          }

          const selectedMember = members.find(m => m.id === editForm.member_id);
          if (editForm.member_id && selectedMember) {
            updateData.member_id = editForm.member_id;
            updateData.member_name = selectedMember.name;
            updateData.title = `${selectedMember.name} (${editForm.type})`;
          }
        }

        const { error } = await supabase
          .from("schedules")
          .update(updateData)
          .eq("id", selectedSchedule.id);

        if (error) throw error;
      }

      showSuccess("스케줄이 수정되었습니다!");
      setIsEditModalOpen(false);

      // 스케줄 목록 새로고침
      if (selectedGymId) {
        fetchSchedules(selectedGymId, selectedStaffId);
      }
    } catch (error) {
      showError(error, "스케줄 수정");
    } finally {
      setIsLoading(false);
    }
  };

  // 스케줄 생성
  const handleCreateSchedule = async () => {
    if (!selectedTimeSlot || !selectedGymId) return;

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

      // PT 수업인 경우 PT 회원권이 있는지 확인
      if (createForm.type === "PT") {
        const memberships = memberMemberships[createForm.member_id] || [];
        const ptMembership = memberships.find((m: any) =>
          m.name?.includes('PT') || m.name?.includes('피티')
        );
        if (!ptMembership) {
          showError("PT 회원권이 없는 회원입니다.\nPT 수업은 PT 회원권이 있는 회원만 등록할 수 있습니다.", "스케줄 생성");
          return;
        }
        // 잔여 횟수 확인
        const remainingSessions = (ptMembership.total_sessions || 0) - (ptMembership.used_sessions || 0);
        if (remainingSessions <= 0) {
          showError("PT 회원권의 잔여 횟수가 없습니다.\n회원권을 갱신해 주세요.", "스케줄 생성");
          return;
        }
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
        .eq("gym_id", selectedGymId);

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
        gym_id: selectedGymId,
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
        scheduleData.type = "Personal"; // 개인 일정 타입 (영문으로 통일)
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

      setIsCreateModalOpen(false);
      setCreateForm({ member_id: "", type: "PT", duration: "60", isPersonal: false, personalTitle: "" });
      setSelectedMemberMembership(null);

      // 스케줄 목록 새로고침
      fetchSchedules(selectedGymId, selectedStaffId);
    } catch (error) {
      showError(error, "스케줄 생성");
    } finally {
      setIsLoading(false);
    }
  };

  const currentDate = new Date(selectedDate);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const weekOfMonth = getWeekOfMonth(currentDate);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F80ED]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-4 sm:space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            {userRole === "staff" ? "내 스케줄" : "통합 스케줄"}
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            {userRole === "staff"
              ? `${user?.name || ""}님의 스케줄을 관리하세요`
              : gymName
                ? `${gymName} 스케줄을 관리하세요`
                : "스케줄을 관리하세요"
            }
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* 강사 필터 (관리자만) */}
          {userRole !== "staff" && (
            <div className="flex flex-col gap-2">
              <Select value={selectedStaffId} onValueChange={(value) => {
                  setSelectedStaffId(value);
                  if (selectedGymId) fetchSchedules(selectedGymId, value);
                }}>
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
            onClick={() => exportSchedulesToExcel(schedules)}
            className="h-10 bg-[#2F80ED] hover:bg-[#2570d6] text-white font-medium rounded-lg shadow-sm transition-all"
          >
            <span className="mr-2">📊</span> 엑셀 다운로드
          </Button>
        </div>
      </div>

      {/* 내 스케줄 제출 배너 - staff 역할에만 표시 */}
      {userRole === "staff" && (
        <MonthlySubmissionBanner
          yearMonth={yearMonth}
          status={
            mySubmissionStatus === "none"
              ? "not_submitted"
              : mySubmissionStatus === "submitted"
              ? "submitted"
              : mySubmissionStatus === "approved"
              ? "approved"
              : "rejected"
          }
          submittedAt={mySubmittedAt}
          reviewedAt={myReviewedAt}
          adminMemo={myAdminMemo}
          onSubmit={handleSubmitMonth}
          onResubmit={handleSubmitMonth}
        />
      )}

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
        <MonthlyStatsSection
          monthlyStats={monthlyStats}
          year={year}
          month={month}
          mySubmissionStatus={mySubmissionStatus}
          onQuickAttendance={scheduleOps.handleQuickAttendance}
          onSubmitMonth={handleSubmitMonth}
        />
      ) : selectedStaffId === "all" ? (
        /* 전체 강사 선택 시 안내 메시지 */
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">직원을 선택해주세요</h3>
          <p className="text-sm text-gray-500">
            타임테이블을 보려면 상단에서 직원을 선택하세요.<br />
            전체 강사 보기는 월별 집계표만 확인할 수 있습니다.
          </p>
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
            staffName={staffs.find(s => s.id === selectedStaffId)?.name}
          />
        </>
      )}

      {/* 스케줄 생성 모달 */}
      <CreateScheduleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        selectedTimeSlot={selectedTimeSlot}
        createForm={createForm}
        setCreateForm={setCreateForm}
        filteredMembers={filteredMembers}
        memberMemberships={memberMemberships}
        selectedMemberMembership={selectedMemberMembership}
        setSelectedMemberMembership={setSelectedMemberMembership}
        selectedStaffId={selectedStaffId}
        schedules={schedules}
        getSessionNumber={getSessionNumber}
        isLoading={isLoading}
        onSubmit={handleCreateSchedule}
      />

      {/* 스케줄 수정 모달 */}
      <EditScheduleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        selectedSchedule={selectedSchedule}
        editForm={editForm}
        setEditForm={setEditForm}
        filteredMembers={filteredMembers}
        memberMemberships={memberMemberships}
        schedules={schedules}
        selectedStaffId={selectedStaffId}
        getSessionNumber={getSessionNumber}
        isLoading={isLoading}
        onUpdate={handleUpdateSchedule}
        onDelete={() => scheduleOps.handleDeleteSchedule(selectedSchedule, () => {
          setIsEditModalOpen(false);
          setSelectedSchedule(null);
        })}
      />

      {/* 빠른 상태 변경 모달 */}
      <QuickStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        selectedSchedule={selectedSchedule}
        setSelectedSchedule={setSelectedSchedule}
        selectedGymId={selectedGymId}
        selectedStaffId={selectedStaffId}
        onStatusChange={(newStatus: string) => scheduleOps.handleQuickStatusChange(
          selectedSchedule,
          newStatus,
          () => setIsStatusModalOpen(false)
        )}
        onSubTypeChange={(newSubType: string) => scheduleOps.handleQuickSubTypeChange(
          selectedSchedule,
          newSubType,
          () => setIsStatusModalOpen(false)
        )}
        onOpenEditModal={handleOpenEditModal}
        onDelete={() => scheduleOps.handleDeleteSchedule(selectedSchedule, () => {
          setIsStatusModalOpen(false);
          setSelectedSchedule(null);
        })}
        fetchSchedules={fetchSchedules}
      />


    </div>
  );
}
