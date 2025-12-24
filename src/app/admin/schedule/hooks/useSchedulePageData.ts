"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { showSuccess, showError } from "@/lib/utils/error-handler";
import { classifyScheduleType } from "@/lib/schedule-utils";
import {
  calculateMonthlyStats as calcStats,
  enrichSchedulesWithSessionInfo as enrichSchedules,
  getSessionNumber as getSessionNum,
} from "../utils/statisticsUtils";

export interface CreateFormData {
  member_id: string;
  type: string;
  duration: string;
  isPersonal: boolean;
  personalTitle: string;
}

export interface EditFormData {
  member_id: string;
  status: string;
  type: string;
  date: string;
  time: string;
  duration: string;
  personalTitle: string;
  sub_type: string;
  inbody_checked: boolean;
}

export interface TimeSlot {
  date: string;
  time: string;
  staffId?: string;
}

export function useSchedulePageData() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { dashboardFilter, isInitialized: filterInitialized } = useAdminFilter();

  const supabase = useMemo(() => createSupabaseClient(), []);

  const [schedules, setSchedules] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [memberMemberships, setMemberMemberships] = useState<Record<string, any[]>>({});
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
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [createForm, setCreateForm] = useState<CreateFormData>({
    member_id: "",
    type: "PT",
    duration: "60",
    isPersonal: false,
    personalTitle: "",
  });
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
  const [editForm, setEditForm] = useState<EditFormData>({
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

  const yearMonth = useMemo(() => {
    const d = new Date(selectedDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, [selectedDate]);

  // 선택된 트레이너에 따라 회원 필터링
  const filteredMembers = useMemo(() => {
    if (selectedStaffId === "all") return members;
    return members.filter((member: any) => member.trainer_id === selectedStaffId);
  }, [members, selectedStaffId]);

  // 스케줄 조회 함수
  const fetchSchedules = async (gymId: string, staffIdFilter: string) => {
    const current = new Date(selectedDate);
    const startDate = new Date(current.getFullYear(), current.getMonth() - 2, 1);
    const endDate = new Date(current.getFullYear(), current.getMonth() + 3, 0);

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
      const enrichedSchedules = enrichSchedules(data || [], memberMemberships);
      setSchedules(enrichedSchedules);
      setMonthlyStats(calcStats(enrichedSchedules, selectedDate));
    }
  };

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
        const staffIdFilter = user.role === "staff" ? user.id : "all";
        setSelectedStaffId(staffIdFilter);

        if (user.role === "staff") {
          const [memberResult, membershipResult] = await Promise.all([
            supabase.from("members").select("id, name").eq("gym_id", selectedGymId).eq("trainer_id", user.id).order("name", { ascending: true }),
            supabase.from("member_memberships").select("id, member_id, name, total_sessions, used_sessions, start_date, end_date, status").eq("gym_id", selectedGymId).eq("status", "active")
          ]);

          if (memberResult.data) setMembers(memberResult.data);
          if (membershipResult.data) {
            const myMemberIds = memberResult.data?.map(m => m.id) || [];
            const filteredMemberships = membershipResult.data.filter(m => myMemberIds.includes(m.member_id));
            const grouped = filteredMemberships.reduce((acc: Record<string, any[]>, m) => {
              if (!acc[m.member_id]) acc[m.member_id] = [];
              acc[m.member_id].push(m);
              return acc;
            }, {});
            setMemberMemberships(grouped);
          }
        } else {
          const [memberResult, staffResult, membershipResult] = await Promise.all([
            supabase.from("members").select("id, name, trainer_id").eq("gym_id", selectedGymId).order("name", { ascending: true }),
            supabase.from("staffs").select("id, name, work_start_time, work_end_time").eq("gym_id", selectedGymId).order("name", { ascending: true }),
            supabase.from("member_memberships").select("id, member_id, name, total_sessions, used_sessions, start_date, end_date, status").eq("gym_id", selectedGymId).eq("status", "active")
          ]);

          if (memberResult.data) setMembers(memberResult.data);
          if (staffResult.data) setStaffs(staffResult.data);
          if (membershipResult.data) {
            const grouped = membershipResult.data.reduce((acc: Record<string, any[]>, m) => {
              if (!acc[m.member_id]) acc[m.member_id] = [];
              acc[m.member_id].push(m);
              return acc;
            }, {});
            setMemberMemberships(grouped);
          }
        }

        fetchSchedules(user.gym_id, staffIdFilter);
      } catch (error) {
        console.error("초기화 에러:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [authLoading, filterInitialized, selectedGymId, user]);

  // 월/날짜/지점 변경 시 내 제출 상태 갱신
  useEffect(() => {
    if (myStaffId && selectedGymId) {
      fetchMyReportStatus(myStaffId, selectedGymId);
    }
  }, [yearMonth, myStaffId, selectedGymId]);

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
  }, [selectedDate, selectedGymId, selectedStaffId]);

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

  // 날짜 네비게이션
  const handlePrevDate = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - (viewType === 'week' ? 7 : 1));
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDate = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + (viewType === 'week' ? 7 : 1));
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // 세션 번호 계산 (컴포넌트 props용)
  const getSessionNumber = (memberId: string, scheduleType: 'pt' | 'ot', scheduleId?: string) => {
    return getSessionNum(schedules, memberId, scheduleType, scheduleId);
  };

  // 타임 슬롯 클릭 -> 스케줄 생성 모달 열기
  const handleTimeSlotClick = (date: Date, time: string) => {
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

  const handleStaffChange = (value: string) => {
    setSelectedStaffId(value);
    if (selectedGymId) fetchSchedules(selectedGymId, value);
  };

  return {
    // Auth/Filter
    user, userRole, myStaffId, gymName,
    workStartTime, workEndTime,
    authLoading, filterInitialized, isLoading, setIsLoading,

    // Data
    schedules, staffs, members, filteredMembers,
    memberMemberships, setMemberMemberships,
    selectedGymId, selectedStaffId,
    monthlyStats, yearMonth,

    // View
    viewType, setViewType,
    selectedDate, setSelectedDate,

    // Submission status
    mySubmissionStatus, mySubmittedAt, myReviewedAt, myAdminMemo,

    // Create modal
    isCreateModalOpen, setIsCreateModalOpen,
    selectedTimeSlot, setSelectedTimeSlot,
    createForm, setCreateForm,
    selectedMemberMembership, setSelectedMemberMembership,

    // Edit modal
    isEditModalOpen, setIsEditModalOpen,
    editForm, setEditForm,

    // Status modal
    isStatusModalOpen, setIsStatusModalOpen,
    selectedSchedule, setSelectedSchedule,

    // Handlers
    fetchSchedules,
    handleSubmitMonth,
    handlePrevDate, handleNextDate, handleToday,
    handleTimeSlotClick, handleScheduleClick,
    handleOpenEditModal, handleStaffChange,
    getSessionNumber,
    supabase,
  };
}
