"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import WeeklyTimetable from "@/components/WeeklyTimetable";
import * as XLSX from "xlsx";
import { showSuccess, showError } from "@/lib/utils/error-handler";
import { classifyScheduleType } from "@/lib/schedule-utils";
import { DailyStatsWidget } from "@/components/DailyStatsWidget";
import { MonthlySubmissionBanner } from "@/components/MonthlySubmissionBanner";

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
      const enrichedSchedules = enrichSchedulesWithSessionInfo(data || []);
      setSchedules(enrichedSchedules);
      calculateMonthlyStats(enrichedSchedules);
    }
  };

  // 스케줄에 세션 정보 추가 (PT/OT)
  // 진행된 수업(completed, service)만 회차로 카운트
  const enrichSchedulesWithSessionInfo = (allSchedules: any[]) => {
    // 회원별 PT/OT 스케줄 그룹화
    const memberSchedules: Record<string, { pt: any[]; ot: any[] }> = {};

    allSchedules.forEach(s => {
      if (!s.member_id) return;
      const type = (s.type || '').toLowerCase();
      if (type !== 'pt' && type !== 'ot') return;

      if (!memberSchedules[s.member_id]) {
        memberSchedules[s.member_id] = { pt: [], ot: [] };
      }
      if (type === 'pt') {
        memberSchedules[s.member_id].pt.push(s);
      } else if (type === 'ot') {
        memberSchedules[s.member_id].ot.push(s);
      }
    });

    // 차감되는 수업인지 확인 (회차로 카운트됨)
    const isCompleted = (status: string) => status === 'completed' || status === 'service' || status === 'no_show_deducted';

    // 각 회원별로 시간순 정렬 후 세션 번호 할당
    Object.values(memberSchedules).forEach(({ pt, ot }) => {
      // PT 스케줄 정렬 및 세션 번호 할당
      pt.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      let ptSessionCount = 0;
      pt.forEach((schedule) => {
        // 회원의 멤버십에서 total_sessions 가져오기
        const membership = memberMemberships[schedule.member_id]?.find(
          (m: any) => m.name?.toLowerCase().includes('pt')
        );
        if (membership) {
          schedule.total_sessions = membership.total_sessions;
        }

        // 진행된 수업만 회차 카운트, 나머지는 상태 표시용
        if (isCompleted(schedule.status)) {
          ptSessionCount++;
          schedule.session_number = ptSessionCount;
        } else {
          // 노쇼/취소 등은 다음 회차 번호로 표시 (아직 진행 안된 수업)
          schedule.session_number = ptSessionCount + 1;
          schedule.is_not_completed = true; // 미진행 표시용
        }
      });

      // OT 스케줄 정렬 및 세션 번호 할당
      ot.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      let otSessionCount = 0;
      ot.forEach((schedule) => {
        if (isCompleted(schedule.status)) {
          otSessionCount++;
          schedule.session_number = otSessionCount;
        } else {
          schedule.session_number = otSessionCount + 1;
          schedule.is_not_completed = true;
        }
      });
    });

    return allSchedules;
  };

  // 회차로 카운트되는 수업인지 확인 (차감되는 수업)
  // completed, service, no_show_deducted → 회차 카운트 (횟수 차감됨)
  // no_show, cancelled, reserved → 회차 카운트 안함
  const isCompletedSession = (status: string) => {
    return status === 'completed' || status === 'service' || status === 'no_show_deducted';
  };

  // 특정 회원의 PT/OT 회차 계산 헬퍼 함수
  // 차감되는 수업(completed, service, no_show_deducted)만 회차로 카운트
  const getSessionNumber = (memberId: string, scheduleType: 'pt' | 'ot', scheduleId?: string) => {
    const type = scheduleType.toLowerCase();
    const memberSchedules = schedules
      .filter(s => s.member_id === memberId && (s.type || '').toLowerCase() === type)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    // 기존 스케줄의 회차 찾기 (해당 스케줄 이전의 완료된 수업 개수 + 1)
    if (scheduleId) {
      const scheduleIndex = memberSchedules.findIndex(s => s.id === scheduleId);
      if (scheduleIndex < 0) return 1;

      // 이 스케줄 이전의 완료된 수업 개수
      let completedBefore = 0;
      for (let i = 0; i < scheduleIndex; i++) {
        if (isCompletedSession(memberSchedules[i].status)) {
          completedBefore++;
        }
      }
      return completedBefore + 1;
    }

    // 새 스케줄 생성 시: 완료된 수업 개수 + 1
    const completedCount = memberSchedules.filter(s => isCompletedSession(s.status)).length;
    return completedCount + 1;
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
      GX: 0,
      Personal: 0, // 개인일정
      Other: 0, // 기타
      completed: 0,
      no_show_deducted: 0,
      no_show: 0,
      service: 0,
      unregistered: unregistered.length,
      unregisteredList: unregistered,
      total: monthlySchedules.length,
      totalHours: 0,
      // 계층 구조 통계
      ptStats: { total: 0, completed: 0, no_show_deducted: 0, no_show: 0, service: 0, cancelled: 0, attendanceRate: 0 },
      otStats: { total: 0, completed: 0, no_show: 0, cancelled: 0, converted: 0 },
      consultingStats: { total: 0, sales: 0, info: 0, status: 0, other: 0 },
      personalStats: { total: 0, meal: 0, conference: 0, meeting: 0, rest: 0, workout: 0, other: 0 },
      dailyStats: {} as Record<string, {
        date: string;
        PT: { count: number; hours: number };
        OT: { count: number; hours: number };
        Consulting: { count: number; hours: number };
        GX: { count: number; hours: number };
        Personal: { count: number; hours: number };
        Other: { count: number; hours: number };
        total: { count: number; hours: number };
      }>
    };

    monthlySchedules.forEach(s => {
      // 시간 계산 (분 -> 시간)
      const start = new Date(s.start_time);
      const end = new Date(s.end_time);
      const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      // 날짜 키 생성 (YYYY-MM-DD)
      const dateKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;

      // 일자별 통계 초기화
      if (!stats.dailyStats[dateKey]) {
        stats.dailyStats[dateKey] = {
          date: dateKey,
          PT: { count: 0, hours: 0 },
          OT: { count: 0, hours: 0 },
          Consulting: { count: 0, hours: 0 },
          GX: { count: 0, hours: 0 },
          Personal: { count: 0, hours: 0 },
          Other: { count: 0, hours: 0 },
          total: { count: 0, hours: 0 }
        };
      }

      // 타입별 집계 (대소문자 구분 없이)
      const scheduleType = (s.type || '').toLowerCase();
      const scheduleStatus = s.status || '';
      const subType = (s.sub_type || s.title || '').toLowerCase(); // 서브타입 또는 제목으로 세부 분류

      if (scheduleType === 'pt') {
        stats.PT++;
        stats.dailyStats[dateKey].PT.count++;
        stats.dailyStats[dateKey].PT.hours += durationHours;
        // PT 세부 통계
        stats.ptStats.total++;
        if (scheduleStatus === 'completed') stats.ptStats.completed++;
        else if (scheduleStatus === 'no_show_deducted') stats.ptStats.no_show_deducted++;
        else if (scheduleStatus === 'no_show') stats.ptStats.no_show++;
        else if (scheduleStatus === 'service') stats.ptStats.service++;
        else if (scheduleStatus === 'cancelled') stats.ptStats.cancelled++;
      } else if (scheduleType === 'ot') {
        stats.OT++;
        stats.dailyStats[dateKey].OT.count++;
        stats.dailyStats[dateKey].OT.hours += durationHours;
        // OT 세부 통계
        stats.otStats.total++;
        if (scheduleStatus === 'completed') stats.otStats.completed++;
        else if (scheduleStatus === 'no_show') stats.otStats.no_show++;
        else if (scheduleStatus === 'cancelled') stats.otStats.cancelled++;
        else if (scheduleStatus === 'converted' || subType.includes('pt전환')) stats.otStats.converted++;
      } else if (scheduleType === 'consulting' || scheduleType === '상담') {
        stats.Consulting++;
        stats.dailyStats[dateKey].Consulting.count++;
        stats.dailyStats[dateKey].Consulting.hours += durationHours;
        // 상담 세부 통계
        stats.consultingStats.total++;
        if (subType.includes('세일즈') || subType.includes('sales')) stats.consultingStats.sales++;
        else if (subType.includes('안내') || subType.includes('info')) stats.consultingStats.info++;
        else if (subType.includes('현황') || subType.includes('status')) stats.consultingStats.status++;
        else stats.consultingStats.other++;
      } else if (scheduleType === 'gx') {
        stats.GX++;
        stats.dailyStats[dateKey].GX.count++;
        stats.dailyStats[dateKey].GX.hours += durationHours;
      } else if (scheduleType === '개인' || scheduleType === 'personal') {
        stats.Personal++;
        stats.dailyStats[dateKey].Personal.count++;
        stats.dailyStats[dateKey].Personal.hours += durationHours;
        // 개인일정 세부 통계
        stats.personalStats.total++;
        if (subType.includes('점심') || subType.includes('lunch') || subType.includes('식사') || subType.includes('meal')) stats.personalStats.meal++;
        else if (subType.includes('회의') || subType.includes('conference')) stats.personalStats.conference++;
        else if (subType.includes('미팅') || subType.includes('meeting')) stats.personalStats.meeting++;
        else if (subType.includes('휴식') || subType.includes('rest') || subType.includes('휴게')) stats.personalStats.rest++;
        else if (subType.includes('운동') || subType.includes('workout') || subType.includes('헬스')) stats.personalStats.workout++;
        else stats.personalStats.other++;
      } else {
        // 기타 (매칭되지 않는 타입)
        stats.Other++;
        stats.dailyStats[dateKey].Other.count++;
        stats.dailyStats[dateKey].Other.hours += durationHours;
      }

      // 일자별 총합
      stats.dailyStats[dateKey].total.count++;
      stats.dailyStats[dateKey].total.hours += durationHours;
      stats.totalHours += durationHours;

      // 상태별 집계
      if (scheduleStatus === 'completed') stats.completed++;
      else if (scheduleStatus === 'no_show_deducted') stats.no_show_deducted++;
      else if (scheduleStatus === 'no_show') stats.no_show++;
      else if (scheduleStatus === 'service') stats.service++;
    });

    // PT 출석률 계산 (진행된 수업: completed + service / 전체 PT)
    if (stats.ptStats.total > 0) {
      const attended = stats.ptStats.completed + stats.ptStats.service;
      stats.ptStats.attendanceRate = Math.round((attended / stats.ptStats.total) * 100);
    }

    setMonthlyStats(stats);
  };

  // 스케줄이 변경되면 통계 재계산
  useEffect(() => {
    if (schedules.length > 0) {
      calculateMonthlyStats(schedules);
    }
  }, [schedules]);

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

  // 빠른 상태 변경
  const handleQuickStatusChange = async (newStatus: string) => {
    if (!selectedSchedule) return;

    try {
      // 출석완료/노쇼(차감)인 경우 API 호출 (회원권 차감)
      if (["completed", "no_show_deducted"].includes(newStatus) &&
          !["completed", "no_show_deducted"].includes(selectedSchedule.status)) {
        const res = await fetch("/api/schedule/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduleId: selectedSchedule.id,
            newStatus,
          }),
        });

        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || "상태 변경 실패");
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
        // 일반 상태 변경
        const { error } = await supabase
          .from("schedules")
          .update({ status: newStatus })
          .eq("id", selectedSchedule.id);

        if (error) throw error;
      }

      showSuccess("상태가 변경되었습니다!");
      setIsStatusModalOpen(false);

      // 스케줄 목록 새로고침
      if (selectedGymId) {
        fetchSchedules(selectedGymId, selectedStaffId);
      }
    } catch (error) {
      showError(error, "상태 변경");
    }
  };

  // 빠른 서브타입 변경 (상담, 개인일정용)
  const handleQuickSubTypeChange = async (newSubType: string) => {
    if (!selectedSchedule) return;

    try {
      const { error } = await supabase
        .from("schedules")
        .update({ sub_type: newSubType })
        .eq("id", selectedSchedule.id);

      if (error) throw error;

      showSuccess("분류가 변경되었습니다!");
      setIsStatusModalOpen(false);

      // 스케줄 목록 새로고침
      if (selectedGymId) {
        fetchSchedules(selectedGymId, selectedStaffId);
      }
    } catch (error) {
      showError(error, "분류 변경");
    }
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

  // 스케줄 삭제
  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("schedules")
        .delete()
        .eq("id", selectedSchedule.id);

      if (error) throw error;

      setIsEditModalOpen(false);
      setSelectedSchedule(null);

      // 스케줄 목록 새로고침
      if (selectedGymId) {
        fetchSchedules(selectedGymId, selectedStaffId);
      }
    } catch (error) {
      showError(error, "스케줄 삭제");
    } finally {
      setIsLoading(false);
    }
  };

  // 출석 처리 (미등록 리스트에서 빠른 출석 처리)
  const handleQuickAttendance = async (scheduleId: string) => {
    try {
      const res = await fetch("/api/schedule/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId,
          newStatus: "completed",
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "출석 처리 실패");
      }

      showSuccess("출석 처리되었습니다!");

      // 스케줄 목록 및 회원권 정보 새로고침
      if (selectedGymId) {
        fetchSchedules(selectedGymId, selectedStaffId);

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
    } catch (error) {
      showError(error, "출석 처리");
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

  // 필터 변경 시 재조회
  const handleFilterChange = (value: string) => {
    setSelectedStaffId(value);
    if (selectedGymId) {
      fetchSchedules(selectedGymId, value);
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
    const fileName = `스케줄_${today}.xlsx`;

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
        <div className="space-y-6">
          {/* 월간 요약 + 출석 현황 통합 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-[#2F80ED] rounded-full"></div>
                  {year}년 {month}월 현황
                </h2>
                <p className="text-xs text-gray-500 mt-1 ml-3.5">
                  총 {monthlyStats?.total || 0}건 · {monthlyStats?.totalHours?.toFixed(1) || 0}시간
                </p>
              </div>
              {/* 출석률 */}
              {monthlyStats && monthlyStats.total > 0 && (
                <div className="text-right">
                  <div className="text-xs text-gray-500">출석률</div>
                  <div className="text-2xl font-bold text-[#2F80ED]">
                    {((monthlyStats.completed / monthlyStats.total) * 100).toFixed(0)}%
                  </div>
                </div>
              )}
            </div>

            {/* 계층 구조 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PT 예약 */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-800">PT 예약</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-blue-600">{monthlyStats?.ptStats?.total || 0}건</span>
                    {monthlyStats?.ptStats?.total > 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                        출석률 {monthlyStats?.ptStats?.attendanceRate || 0}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded">수업완료 {monthlyStats?.ptStats?.completed || 0}</span>
                  <span className="px-2 py-1 bg-red-50 text-red-600 rounded">노쇼(차감) {monthlyStats?.ptStats?.no_show_deducted || 0}</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">노쇼 {monthlyStats?.ptStats?.no_show || 0}</span>
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">서비스 {monthlyStats?.ptStats?.service || 0}</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded">취소 {monthlyStats?.ptStats?.cancelled || 0}</span>
                </div>
              </div>

              {/* OT 예약 */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-800">OT 예약</span>
                  <span className="text-xl font-bold text-purple-600">{monthlyStats?.otStats?.total || 0}건</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded">수업완료 {monthlyStats?.otStats?.completed || 0}</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">노쇼 {monthlyStats?.otStats?.no_show || 0}</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded">취소 {monthlyStats?.otStats?.cancelled || 0}</span>
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">PT전환 {monthlyStats?.otStats?.converted || 0}</span>
                </div>
              </div>

              {/* 상담 */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-800">상담</span>
                  <span className="text-xl font-bold text-emerald-600">{monthlyStats?.consultingStats?.total || 0}건</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded">세일즈 {monthlyStats?.consultingStats?.sales || 0}</span>
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">안내상담 {monthlyStats?.consultingStats?.info || 0}</span>
                  <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded">현황상담 {monthlyStats?.consultingStats?.status || 0}</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">기타 {monthlyStats?.consultingStats?.other || 0}</span>
                </div>
              </div>

              {/* 개인일정 */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-800">개인일정</span>
                  <span className="text-xl font-bold text-gray-600">{monthlyStats?.personalStats?.total || 0}건</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded">식사 {monthlyStats?.personalStats?.meal || 0}</span>
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded">회의 {monthlyStats?.personalStats?.conference || 0}</span>
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">미팅 {monthlyStats?.personalStats?.meeting || 0}</span>
                  <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded">휴식 {monthlyStats?.personalStats?.rest || 0}</span>
                  <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded">운동 {monthlyStats?.personalStats?.workout || 0}</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">기타 {monthlyStats?.personalStats?.other || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 일자별 상세 집계 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <div className="w-1.5 h-6 bg-gray-400 rounded-full"></div>
                일자별 상세 집계
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300 bg-gray-50">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">날짜</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-700">PT</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-700">OT</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-700">상담</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-700">GX</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-700">개인</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-700">기타</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-700">합계</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyStats?.dailyStats && Object.keys(monthlyStats.dailyStats).length > 0 ? (
                    Object.entries(monthlyStats.dailyStats)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([dateKey, dayStats]: [string, any]) => {
                        const date = new Date(dateKey);
                        const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        const shortDate = `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

                        return (
                          <tr key={dateKey} className={`border-b border-gray-100 hover:bg-gray-50 ${isWeekend ? 'bg-gray-50' : ''}`}>
                            <td className="py-2 px-3">
                              <span className="font-medium text-gray-800">{shortDate}</span>
                              <span className={`ml-1 text-xs ${isWeekend ? 'text-red-500' : 'text-gray-400'}`}>({dayOfWeek})</span>
                            </td>
                            <td className="text-center py-2 px-3 text-gray-700">
                              {dayStats.PT.count > 0 ? `${dayStats.PT.count}회 (${dayStats.PT.hours.toFixed(1)}h)` : '-'}
                            </td>
                            <td className="text-center py-2 px-3 text-gray-700">
                              {dayStats.OT.count > 0 ? `${dayStats.OT.count}회 (${dayStats.OT.hours.toFixed(1)}h)` : '-'}
                            </td>
                            <td className="text-center py-2 px-3 text-gray-700">
                              {dayStats.Consulting.count > 0 ? `${dayStats.Consulting.count}건 (${dayStats.Consulting.hours.toFixed(1)}h)` : '-'}
                            </td>
                            <td className="text-center py-2 px-3 text-gray-700">
                              {dayStats.GX.count > 0 ? `${dayStats.GX.count}회 (${dayStats.GX.hours.toFixed(1)}h)` : '-'}
                            </td>
                            <td className="text-center py-2 px-3 text-gray-700">
                              {dayStats.Personal.count > 0 ? `${dayStats.Personal.count}건 (${dayStats.Personal.hours.toFixed(1)}h)` : '-'}
                            </td>
                            <td className="text-center py-2 px-3 text-gray-700">
                              {dayStats.Other.count > 0 ? `${dayStats.Other.count}건 (${dayStats.Other.hours.toFixed(1)}h)` : '-'}
                            </td>
                            <td className="text-center py-2 px-3 font-semibold text-gray-900">
                              {dayStats.total.count}건 ({dayStats.total.hours.toFixed(1)}h)
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-400">
                        이번 달 스케줄이 없습니다
                      </td>
                    </tr>
                  )}
                </tbody>
                {/* 합계 행 */}
                {monthlyStats?.dailyStats && Object.keys(monthlyStats.dailyStats).length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                      <td className="py-2 px-3 text-gray-800">월 합계</td>
                      <td className="text-center py-2 px-3 text-gray-800">{monthlyStats.PT}회</td>
                      <td className="text-center py-2 px-3 text-gray-800">{monthlyStats.OT}회</td>
                      <td className="text-center py-2 px-3 text-gray-800">{monthlyStats.Consulting}건</td>
                      <td className="text-center py-2 px-3 text-gray-800">{monthlyStats.GX}회</td>
                      <td className="text-center py-2 px-3 text-gray-800">{monthlyStats.Personal}건</td>
                      <td className="text-center py-2 px-3 text-gray-800">{monthlyStats.Other}건</td>
                      <td className="text-center py-2 px-3 text-gray-900 font-bold">
                        {monthlyStats.total}건 ({monthlyStats.totalHours?.toFixed(1)}h)
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* 출석 미등록자 리스트 */}
          {monthlyStats && monthlyStats.unregistered > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-yellow-500 rounded-full"></div>
                  출석 미등록자 리스트
                </h2>
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
                      onClick={() => handleQuickAttendance(schedule.id)}
                    >
                      출석 처리
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 제출 버튼 영역 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <Button
              disabled={mySubmissionStatus === "submitted" || mySubmissionStatus === "approved"}
              className="w-full h-14 text-lg font-bold bg-[#2F80ED] hover:bg-[#1c6cd7] shadow-lg shadow-blue-200 disabled:shadow-none disabled:bg-gray-200 disabled:text-gray-400 rounded-xl transition-all"
              onClick={handleSubmitMonth}
            >
              {mySubmissionStatus === "approved"
                ? "승인 완료 (수정 불가)"
                : mySubmissionStatus === "submitted"
                ? "승인 대기 중 (수정 불가)"
                : "관리자에게 스케줄 전송 (마감)"}
            </Button>
            <p className="text-xs text-gray-400 text-center mt-3">
              * 매월 1일 ~ 5일 사이에 전송해주세요. 전송 후에는 수정이 불가능합니다.
            </p>
          </div>
        </div>
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
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
        setIsCreateModalOpen(open);
        if (!open) {
          setCreateForm({ member_id: "", type: "PT", duration: "60", isPersonal: false, personalTitle: "" });
          setSelectedMemberMembership(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#2F80ED]" />
              스케줄 생성
            </DialogTitle>
            <DialogDescription className="sr-only">새로운 스케줄을 생성합니다</DialogDescription>
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
                  onValueChange={(value) => {
                    setCreateForm({ ...createForm, member_id: value });
                    // 선택된 회원의 PT 회원권 정보 업데이트
                    const memberships = memberMemberships[value] || [];
                    const ptMembership = memberships.find((m: any) =>
                      m.name?.includes('PT') || m.name?.includes('피티')
                    );
                    setSelectedMemberMembership(ptMembership || null);
                  }}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="회원을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredMembers.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {selectedStaffId !== "all" ? "담당 회원이 없습니다" : "등록된 회원이 없습니다"}
                      </SelectItem>
                    ) : (
                      filteredMembers.map((member) => {
                        const memberships = memberMemberships[member.id] || [];
                        const hasPT = memberships.some((m: any) =>
                          m.name?.includes('PT') || m.name?.includes('피티')
                        );
                        return (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} {hasPT && <span className="text-blue-500 ml-1">●</span>}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>

                {/* PT 회원권 정보 표시 */}
                {createForm.member_id && (() => {
                  const memberships = memberMemberships[createForm.member_id] || [];
                  const ptMembership = memberships.find((m: any) =>
                    m.name?.includes('PT') || m.name?.includes('피티')
                  );

                  if (ptMembership) {
                    const today = new Date();
                    const startDate = ptMembership.start_date ? new Date(ptMembership.start_date) : null;
                    const endDate = ptMembership.end_date ? new Date(ptMembership.end_date) : null;
                    const remainingDays = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
                    // 실제 스케줄 기반 회차 계산
                    const nextSessionNumber = getSessionNumber(createForm.member_id, 'pt');

                    // 날짜 포맷 함수
                    const formatDate = (date: Date | null) => {
                      if (!date) return null;
                      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
                    };

                    // PT 스케줄 상태별 통계 계산
                    const memberPtSchedules = schedules.filter((s: any) =>
                      s.member_id === createForm.member_id && s.type?.toLowerCase() === 'pt'
                    );
                    const ptStats = {
                      reserved: memberPtSchedules.filter((s: any) => s.status === 'reserved').length,
                      completed: memberPtSchedules.filter((s: any) => s.status === 'completed').length,
                      noShowDeducted: memberPtSchedules.filter((s: any) => s.status === 'no_show_deducted').length,
                      noShow: memberPtSchedules.filter((s: any) => s.status === 'no_show').length,
                      service: memberPtSchedules.filter((s: any) => s.status === 'service').length,
                      cancelled: memberPtSchedules.filter((s: any) => s.status === 'cancelled').length,
                    };

                    return (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">PT 회원권 정보</div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 flex-wrap">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {ptMembership.total_sessions}회
                          </span>
                          <span className="text-gray-400">/</span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                            {nextSessionNumber}회차
                          </span>
                          {remainingDays !== null && (
                            <>
                              <span className="text-gray-400">/</span>
                              <span className={`px-2 py-0.5 rounded ${
                                remainingDays <= 7 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                잔여 {remainingDays}일
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-2 space-y-0.5">
                          <div>
                            예약 {ptStats.reserved}건 | 완료 {ptStats.completed}건 | 노쇼(차감) {ptStats.noShowDeducted}건 | 노쇼 {ptStats.noShow}건 | 서비스 {ptStats.service}건 | 취소 {ptStats.cancelled}건
                          </div>
                          <div>
                            유효기간: {formatDate(startDate) || '시작일 미설정'} ~ {formatDate(endDate) || '종료일 미설정'}
                          </div>
                        </div>
                      </div>
                    );
                  } else if (createForm.type === "PT") {
                    return (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="text-sm text-yellow-700 font-medium">
                          ⚠️ PT 회원권이 없습니다
                        </div>
                        <div className="text-xs text-yellow-600 mt-1">
                          PT 수업은 PT 회원권이 있는 회원만 등록할 수 있습니다.
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
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
              {(selectedSchedule?.type?.toLowerCase() === 'personal' || selectedSchedule?.type === '개인') ? '개인일정 수정' : '스케줄 수정'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {(selectedSchedule?.type?.toLowerCase() === 'personal' || selectedSchedule?.type === '개인') ? '개인일정 정보를 수정합니다' : '스케줄 정보를 수정합니다'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 개인일정: 제목 입력 */}
            {(selectedSchedule?.type?.toLowerCase() === 'personal' || selectedSchedule?.type === '개인' || editForm.type === 'Personal') && (
              <div className="space-y-2">
                <Label htmlFor="edit_personal_title">일정 제목 *</Label>
                <input
                  type="text"
                  id="edit_personal_title"
                  value={editForm.personalTitle}
                  onChange={(e) => setEditForm({ ...editForm, personalTitle: e.target.value })}
                  placeholder="일정 제목을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED]"
                />
              </div>
            )}

            {/* 회원 선택 (개인일정이 아닌 경우에만) */}
            {selectedSchedule?.member_id && selectedSchedule?.type?.toLowerCase() !== 'personal' && selectedSchedule?.type !== '개인' && (
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
                    {filteredMembers.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {selectedStaffId !== "all" ? "담당 회원이 없습니다" : "등록된 회원이 없습니다"}
                      </SelectItem>
                    ) : (
                      filteredMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {/* PT 회원권 정보 표시 (수정 모달) */}
                {editForm.member_id && editForm.type === "PT" && (() => {
                  const memberships = memberMemberships[editForm.member_id] || [];
                  const ptMembership = memberships.find((m: any) =>
                    m.name?.includes('PT') || m.name?.includes('피티')
                  );

                  if (ptMembership) {
                    const today = new Date();
                    const startDate = ptMembership.start_date ? new Date(ptMembership.start_date) : null;
                    const endDate = ptMembership.end_date ? new Date(ptMembership.end_date) : null;
                    const remainingDays = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
                    // 실제 스케줄 기반 회차 계산 (수정 중인 스케줄 ID 전달)
                    const currentSessionNumber = getSessionNumber(editForm.member_id, 'pt', selectedSchedule?.id);

                    // 날짜 포맷 함수
                    const formatDate = (date: Date | null) => {
                      if (!date) return null;
                      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
                    };

                    // 상태 표시 (취소/노쇼/서비스) - 노쇼(차감)은 회차로 표기
                    const scheduleStatus = selectedSchedule?.status;
                    const isSpecialStatus = ['cancelled', 'no_show', 'service'].includes(scheduleStatus);
                    const statusLabel = scheduleStatus === 'cancelled' ? '취소' :
                                        scheduleStatus === 'no_show' ? '노쇼' :
                                        scheduleStatus === 'service' ? '서비스' : null;
                    const statusColor = scheduleStatus === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                                        scheduleStatus === 'no_show' ? 'bg-orange-100 text-orange-700' :
                                        scheduleStatus === 'service' ? 'bg-purple-100 text-purple-700' : '';

                    // PT 스케줄 상태별 통계 계산
                    const memberPtSchedules = schedules.filter((s: any) =>
                      s.member_id === editForm.member_id && s.type?.toLowerCase() === 'pt'
                    );
                    const ptStats = {
                      reserved: memberPtSchedules.filter((s: any) => s.status === 'reserved').length,
                      completed: memberPtSchedules.filter((s: any) => s.status === 'completed').length,
                      noShowDeducted: memberPtSchedules.filter((s: any) => s.status === 'no_show_deducted').length,
                      noShow: memberPtSchedules.filter((s: any) => s.status === 'no_show').length,
                      service: memberPtSchedules.filter((s: any) => s.status === 'service').length,
                      cancelled: memberPtSchedules.filter((s: any) => s.status === 'cancelled').length,
                    };

                    return (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">PT 회원권 정보</div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 flex-wrap">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {ptMembership.total_sessions}회
                          </span>
                          <span className="text-gray-400">/</span>
                          {isSpecialStatus ? (
                            <span className={`px-2 py-0.5 rounded ${statusColor}`}>
                              {statusLabel}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                              {currentSessionNumber}회차
                            </span>
                          )}
                          {remainingDays !== null && (
                            <>
                              <span className="text-gray-400">/</span>
                              <span className={`px-2 py-0.5 rounded ${
                                remainingDays <= 7 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                잔여 {remainingDays}일
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-2 space-y-0.5">
                          <div>
                            예약 {ptStats.reserved}건 | 완료 {ptStats.completed}건 | 노쇼(차감) {ptStats.noShowDeducted}건 | 노쇼 {ptStats.noShow}건 | 서비스 {ptStats.service}건 | 취소 {ptStats.cancelled}건
                          </div>
                          <div>
                            유효기간: {formatDate(startDate) || '시작일 미설정'} ~ {formatDate(endDate) || '종료일 미설정'}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
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

            {/* 수업 타입 (개인일정이 아닌 경우에만) */}
            {selectedSchedule?.type?.toLowerCase() !== 'personal' && selectedSchedule?.type !== '개인' && (
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
                    <SelectItem value="Consulting">상담</SelectItem>
                    <SelectItem value="GX">GX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 개인일정: sub_type 선택 */}
            {(selectedSchedule?.type?.toLowerCase() === 'personal' || selectedSchedule?.type === '개인' || editForm.type === 'Personal') && (
              <div className="space-y-2">
                <Label htmlFor="edit_sub_type">일정 분류 *</Label>
                <Select
                  value={editForm.sub_type}
                  onValueChange={(value) => setEditForm({ ...editForm, sub_type: value })}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="분류를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meal">식사</SelectItem>
                    <SelectItem value="conference">회의</SelectItem>
                    <SelectItem value="meeting">미팅</SelectItem>
                    <SelectItem value="rest">휴식</SelectItem>
                    <SelectItem value="workout">운동</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 상담: sub_type 선택 */}
            {(selectedSchedule?.type?.toLowerCase() === 'consulting' || editForm.type === 'Consulting') && (
              <div className="space-y-2">
                <Label htmlFor="edit_sub_type">상담 분류</Label>
                <Select
                  value={editForm.sub_type}
                  onValueChange={(value) => setEditForm({ ...editForm, sub_type: value })}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="분류를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">세일즈</SelectItem>
                    <SelectItem value="info">안내상담</SelectItem>
                    <SelectItem value="status">현황상담</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 출석 상태 - PT */}
            {(selectedSchedule?.type === 'PT' || editForm.type === 'PT') && (
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
                    <SelectItem value="reserved">예약완료</SelectItem>
                    <SelectItem value="completed">수업완료</SelectItem>
                    <SelectItem value="no_show_deducted">노쇼 (차감)</SelectItem>
                    <SelectItem value="no_show">노쇼</SelectItem>
                    <SelectItem value="service">서비스</SelectItem>
                    <SelectItem value="cancelled">취소</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 출석 상태 - OT */}
            {(selectedSchedule?.type === 'OT' || editForm.type === 'OT') && (
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
                    <SelectItem value="completed">수업완료</SelectItem>
                    <SelectItem value="no_show">노쇼</SelectItem>
                    <SelectItem value="cancelled">취소</SelectItem>
                    <SelectItem value="converted">PT전환</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 인바디 체크 - OT */}
            {(selectedSchedule?.type === 'OT' || editForm.type === 'OT') && (
              <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <input
                  type="checkbox"
                  id="inbody_checked"
                  checked={editForm.inbody_checked}
                  onChange={(e) => setEditForm({ ...editForm, inbody_checked: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <Label htmlFor="inbody_checked" className="text-sm font-medium text-purple-700 cursor-pointer">
                  인바디 측정 완료
                </Label>
              </div>
            )}

            {/* 출석 상태 - 상담/기타 (개인일정 제외) */}
            {selectedSchedule?.type?.toLowerCase() !== 'personal' &&
             selectedSchedule?.type !== '개인' &&
             selectedSchedule?.type !== 'PT' &&
             selectedSchedule?.type !== 'OT' &&
             editForm.type !== 'PT' &&
             editForm.type !== 'OT' && (
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
                    <SelectItem value="reserved">예약완료</SelectItem>
                    <SelectItem value="completed">완료</SelectItem>
                    <SelectItem value="no_show">노쇼</SelectItem>
                    <SelectItem value="cancelled">취소</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={handleDeleteSchedule}
              disabled={isLoading}
              className="mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              삭제
            </Button>
            <div className="flex gap-2">
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
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 빠른 상태 변경 모달 */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#2F80ED]">상태 변경</DialogTitle>
            <DialogDescription className="sr-only">스케줄 상태를 변경합니다</DialogDescription>
          </DialogHeader>

          {selectedSchedule && (
            <div className="space-y-4">
              {/* 스케줄 정보 */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-semibold text-gray-900">
                  {selectedSchedule.member_name || selectedSchedule.title || '일정'}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {new Date(selectedSchedule.start_time).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}
                  {' '}
                  {new Date(selectedSchedule.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  {' - '}
                  {new Date(selectedSchedule.end_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
                {/* 개인일정이 아닌 경우에만 상태 배지 표시 */}
                {selectedSchedule.type?.toLowerCase() !== 'personal' && selectedSchedule.type !== '개인' && (
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      selectedSchedule.status === 'completed' ? 'bg-green-100 text-green-700' :
                      selectedSchedule.status === 'no_show_deducted' ? 'bg-red-100 text-red-700' :
                      selectedSchedule.status === 'no_show' ? 'bg-gray-100 text-gray-700' :
                      selectedSchedule.status === 'service' ? 'bg-blue-100 text-blue-700' :
                      selectedSchedule.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {selectedSchedule.status === 'completed' ? '출석완료' :
                       selectedSchedule.status === 'no_show_deducted' ? '노쇼(차감)' :
                       selectedSchedule.status === 'no_show' ? '노쇼' :
                       selectedSchedule.status === 'service' ? '서비스' :
                       selectedSchedule.status === 'cancelled' ? '취소됨' :
                       '예약됨'}
                    </span>
                  </div>
                )}
              </div>

              {/* 타입별 상태 변경 버튼 */}
              {(() => {
                const scheduleType = (selectedSchedule.type || '').toLowerCase();

                // PT 상태 버튼
                if (scheduleType === 'pt') {
                  return (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 font-medium">PT 상태 변경</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={selectedSchedule.status === 'reserved' ? 'default' : 'outline'}
                          className={selectedSchedule.status === 'reserved' ? 'bg-indigo-500 hover:bg-indigo-600' : 'hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300'}
                          onClick={() => handleQuickStatusChange('reserved')}
                          disabled={selectedSchedule.status === 'reserved'}
                        >
                          예약완료
                        </Button>
                        <Button
                          variant={selectedSchedule.status === 'completed' ? 'default' : 'outline'}
                          className={selectedSchedule.status === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' : 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'}
                          onClick={() => handleQuickStatusChange('completed')}
                          disabled={selectedSchedule.status === 'completed'}
                        >
                          수업완료
                        </Button>
                        <Button
                          variant={selectedSchedule.status === 'no_show_deducted' ? 'default' : 'outline'}
                          className={selectedSchedule.status === 'no_show_deducted' ? 'bg-red-500 hover:bg-red-600' : 'hover:bg-red-50 hover:text-red-700 hover:border-red-300'}
                          onClick={() => handleQuickStatusChange('no_show_deducted')}
                          disabled={selectedSchedule.status === 'no_show_deducted'}
                        >
                          노쇼(차감)
                        </Button>
                        <Button
                          variant={selectedSchedule.status === 'no_show' ? 'default' : 'outline'}
                          className={selectedSchedule.status === 'no_show' ? 'bg-gray-500 hover:bg-gray-600' : 'hover:bg-gray-100'}
                          onClick={() => handleQuickStatusChange('no_show')}
                          disabled={selectedSchedule.status === 'no_show'}
                        >
                          노쇼
                        </Button>
                        <Button
                          variant={selectedSchedule.status === 'service' ? 'default' : 'outline'}
                          className={selectedSchedule.status === 'service' ? 'bg-blue-500 hover:bg-blue-600' : 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'}
                          onClick={() => handleQuickStatusChange('service')}
                          disabled={selectedSchedule.status === 'service'}
                        >
                          서비스
                        </Button>
                        <Button
                          variant={selectedSchedule.status === 'cancelled' ? 'default' : 'outline'}
                          className={selectedSchedule.status === 'cancelled' ? 'bg-gray-400 hover:bg-gray-500' : 'hover:bg-gray-100'}
                          onClick={() => handleQuickStatusChange('cancelled')}
                          disabled={selectedSchedule.status === 'cancelled'}
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  );
                }

                // OT 상태 버튼
                if (scheduleType === 'ot') {
                  return (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 font-medium">OT 상태 변경</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={selectedSchedule.status === 'completed' ? 'default' : 'outline'}
                          className={selectedSchedule.status === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' : 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'}
                          onClick={() => handleQuickStatusChange('completed')}
                          disabled={selectedSchedule.status === 'completed'}
                        >
                          수업완료
                        </Button>
                        <Button
                          variant={selectedSchedule.status === 'no_show' ? 'default' : 'outline'}
                          className={selectedSchedule.status === 'no_show' ? 'bg-gray-500 hover:bg-gray-600' : 'hover:bg-gray-100'}
                          onClick={() => handleQuickStatusChange('no_show')}
                          disabled={selectedSchedule.status === 'no_show'}
                        >
                          노쇼
                        </Button>
                        <Button
                          variant={selectedSchedule.status === 'cancelled' ? 'default' : 'outline'}
                          className={selectedSchedule.status === 'cancelled' ? 'bg-gray-400 hover:bg-gray-500' : 'hover:bg-gray-100'}
                          onClick={() => handleQuickStatusChange('cancelled')}
                          disabled={selectedSchedule.status === 'cancelled'}
                        >
                          취소
                        </Button>
                        <Button
                          variant={selectedSchedule.status === 'converted' ? 'default' : 'outline'}
                          className={selectedSchedule.status === 'converted' ? 'bg-blue-500 hover:bg-blue-600' : 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'}
                          onClick={() => handleQuickStatusChange('converted')}
                          disabled={selectedSchedule.status === 'converted'}
                        >
                          PT전환
                        </Button>
                      </div>
                      {/* 인바디 체크 토글 */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                          onClick={async () => {
                            const newValue = !selectedSchedule.inbody_checked;
                            const { error } = await supabase
                              .from("schedules")
                              .update({ inbody_checked: newValue })
                              .eq("id", selectedSchedule.id);
                            if (!error) {
                              setSelectedSchedule({ ...selectedSchedule, inbody_checked: newValue });
                              showSuccess(newValue ? "인바디 측정 완료!" : "인바디 체크 해제됨");
                              if (selectedGymId) fetchSchedules(selectedGymId, selectedStaffId);
                            }
                          }}
                          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                            selectedSchedule.inbody_checked
                              ? 'bg-purple-100 border-purple-300 text-purple-700'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-purple-50'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                            selectedSchedule.inbody_checked ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
                          }`}>
                            {selectedSchedule.inbody_checked && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          <span className="text-sm font-medium">인바디 측정 완료</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                // 상담 상태 버튼
                if (scheduleType === 'consulting' || scheduleType === '상담') {
                  return (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 font-medium">상담 분류</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={selectedSchedule.sub_type === 'sales' ? 'default' : 'outline'}
                          className={selectedSchedule.sub_type === 'sales' ? 'bg-orange-500 hover:bg-orange-600' : 'hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300'}
                          onClick={() => handleQuickSubTypeChange('sales')}
                        >
                          세일즈
                        </Button>
                        <Button
                          variant={selectedSchedule.sub_type === 'info' ? 'default' : 'outline'}
                          className={selectedSchedule.sub_type === 'info' ? 'bg-blue-500 hover:bg-blue-600' : 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'}
                          onClick={() => handleQuickSubTypeChange('info')}
                        >
                          안내상담
                        </Button>
                        <Button
                          variant={selectedSchedule.sub_type === 'status' ? 'default' : 'outline'}
                          className={selectedSchedule.sub_type === 'status' ? 'bg-purple-500 hover:bg-purple-600' : 'hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300'}
                          onClick={() => handleQuickSubTypeChange('status')}
                        >
                          현황상담
                        </Button>
                        <Button
                          variant={selectedSchedule.sub_type === 'other' ? 'default' : 'outline'}
                          className={selectedSchedule.sub_type === 'other' ? 'bg-gray-500 hover:bg-gray-600' : 'hover:bg-gray-100'}
                          onClick={() => handleQuickSubTypeChange('other')}
                        >
                          기타
                        </Button>
                      </div>
                    </div>
                  );
                }

                // 개인일정 분류 버튼
                if (scheduleType === '개인' || scheduleType === 'personal') {
                  return (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 font-medium">개인일정 분류</div>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant={selectedSchedule.sub_type === 'meal' ? 'default' : 'outline'}
                          className={selectedSchedule.sub_type === 'meal' ? 'bg-yellow-500 hover:bg-yellow-600' : 'hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-300'}
                          onClick={() => handleQuickSubTypeChange('meal')}
                        >
                          식사
                        </Button>
                        <Button
                          variant={selectedSchedule.sub_type === 'conference' ? 'default' : 'outline'}
                          className={selectedSchedule.sub_type === 'conference' ? 'bg-indigo-500 hover:bg-indigo-600' : 'hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300'}
                          onClick={() => handleQuickSubTypeChange('conference')}
                        >
                          회의
                        </Button>
                        <Button
                          variant={selectedSchedule.sub_type === 'meeting' ? 'default' : 'outline'}
                          className={selectedSchedule.sub_type === 'meeting' ? 'bg-blue-500 hover:bg-blue-600' : 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'}
                          onClick={() => handleQuickSubTypeChange('meeting')}
                        >
                          미팅
                        </Button>
                        <Button
                          variant={selectedSchedule.sub_type === 'rest' ? 'default' : 'outline'}
                          className={selectedSchedule.sub_type === 'rest' ? 'bg-purple-500 hover:bg-purple-600' : 'hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300'}
                          onClick={() => handleQuickSubTypeChange('rest')}
                        >
                          휴식
                        </Button>
                        <Button
                          variant={selectedSchedule.sub_type === 'workout' ? 'default' : 'outline'}
                          className={selectedSchedule.sub_type === 'workout' ? 'bg-orange-500 hover:bg-orange-600' : 'hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300'}
                          onClick={() => handleQuickSubTypeChange('workout')}
                        >
                          운동
                        </Button>
                        <Button
                          variant={selectedSchedule.sub_type === 'other' ? 'default' : 'outline'}
                          className={selectedSchedule.sub_type === 'other' ? 'bg-gray-500 hover:bg-gray-600' : 'hover:bg-gray-100'}
                          onClick={() => handleQuickSubTypeChange('other')}
                        >
                          기타
                        </Button>
                      </div>
                    </div>
                  );
                }

                // 기타 타입 (기본 상태 버튼)
                return (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 font-medium">상태 변경</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={selectedSchedule.status === 'completed' ? 'default' : 'outline'}
                        className={selectedSchedule.status === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' : 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'}
                        onClick={() => handleQuickStatusChange('completed')}
                        disabled={selectedSchedule.status === 'completed'}
                      >
                        완료
                      </Button>
                      <Button
                        variant={selectedSchedule.status === 'cancelled' ? 'default' : 'outline'}
                        className={selectedSchedule.status === 'cancelled' ? 'bg-gray-400 hover:bg-gray-500' : 'hover:bg-gray-100'}
                        onClick={() => handleQuickStatusChange('cancelled')}
                        disabled={selectedSchedule.status === 'cancelled'}
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                );
              })()}

              {/* 하단 버튼 영역 */}
              <div className="pt-2 border-t space-y-2">
                <Button
                  variant="ghost"
                  className="w-full text-gray-600 hover:text-[#2F80ED]"
                  onClick={handleOpenEditModal}
                >
                  상세 수정 (시간/회원 변경)
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    if (confirm('이 스케줄을 삭제하시겠습니까?')) {
                      handleDeleteSchedule();
                      setIsStatusModalOpen(false);
                    }
                  }}
                >
                  스케줄 삭제
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
