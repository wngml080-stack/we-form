"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/lib/toast";
import { classifyScheduleType } from "@/lib/schedule-utils";

// Types
export interface SelectedEvent {
  id: string;
  memberName: string;
  timeLabel: string;
  startTime: Date;
  type: string;
  duration: string;
  memberId: string | null;
  status: string;
  is_locked?: boolean;
  title?: string;
  sub_type?: string;
}

export interface NewMemberData {
  name: string;
  phone: string;
  memo: string;
}

export function useStaffPageData() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading, isApproved, gymName: authGymName, companyName: authCompanyName } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // 데이터 상태
  const [schedules, setSchedules] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);

  // UI 상태
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  // 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 내 정보 상태
  const [myStaffId, setMyStaffId] = useState<string | null>(null);
  const [myStaffName, setMyStaffName] = useState<string | null>(null);
  const [myJobTitle, setMyJobTitle] = useState<string | null>(null);
  const [myGymId, setMyGymId] = useState<string | null>(null);
  const [myGymName, setMyGymName] = useState<string | null>(null);
  const [myCompanyId, setMyCompanyId] = useState<string | null>(null);
  const [myCompanyName, setMyCompanyName] = useState<string | null>(null);
  const [myWorkStartTime, setMyWorkStartTime] = useState<string | null>(null);
  const [myWorkEndTime, setMyWorkEndTime] = useState<string | null>(null);

  // 통계 및 승인 상태
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [submissionStatus, setSubmissionStatus] = useState<"none" | "submitted" | "approved" | "rejected">("none");
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [reviewedAt, setReviewedAt] = useState<string | null>(null);
  const [adminMemo, setAdminMemo] = useState<string | null>(null);
  const [isMonthApproved, setIsMonthApproved] = useState(false);

  // 입력 폼 상태
  const [newMemberName, setNewMemberName] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [newClassType, setNewClassType] = useState("PT");
  const [startTime, setStartTime] = useState("10:00");
  const [duration, setDuration] = useState("50");
  const [newMemberData, setNewMemberData] = useState<NewMemberData>({ name: "", phone: "", memo: "" });
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);

  // 수정용 상태
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editDuration, setEditDuration] = useState("50");
  const [editClassType, setEditClassType] = useState("PT");
  const [editMemberName, setEditMemberName] = useState("");
  const [editPersonalTitle, setEditPersonalTitle] = useState("");
  const [editSubType, setEditSubType] = useState("");

  const supabase = useMemo(() => createSupabaseClient(), []);

  // 유틸 함수
  const currentDate = new Date(selectedDate);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const todayStr = new Date().toISOString().split('T')[0];
  const isMonthLocked = submissionStatus === "submitted" || submissionStatus === "approved";

  const getYearMonth = () => {
    const d = new Date(selectedDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
  };

  // 초기 로딩
  useEffect(() => {
    if (authLoading) return;
    if (!authUser || !isApproved) {
      setIsLoading(false);
      router.push("/sign-in");
      return;
    }

    const fetchMyInfo = async () => {
      try {
        const { data: staff } = await supabase
          .from("staffs")
          .select("id, gym_id, company_id, work_start_time, work_end_time, name, job_title, gyms(name)")
          .eq("id", authUser.id)
          .single();

        if (staff) {
          setMyStaffId(staff.id);
          setMyStaffName(staff.name);
          setMyJobTitle(staff.job_title);
          setMyGymId(staff.gym_id);
          // @ts-ignore
          setMyGymName(staff.gyms?.name || authGymName);
          setMyCompanyId(staff.company_id);
          setMyCompanyName(authCompanyName || "");
          setMyWorkStartTime(staff.work_start_time);
          setMyWorkEndTime(staff.work_end_time);

          await Promise.all([
            fetchSchedules(staff.id),
            fetchMembers(staff.gym_id, staff.company_id)
          ]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyInfo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, authUser, isApproved, authGymName, authCompanyName]);

  // 멤버 검색 필터링
  useEffect(() => {
    if (!memberSearchQuery.trim()) {
      setFilteredMembers(members);
      setShowMemberDropdown(false);
    } else {
      const query = memberSearchQuery.toLowerCase();
      const filtered = members.filter(m =>
        m.name?.toLowerCase().includes(query) || m.phone?.includes(query)
      );
      setFilteredMembers(filtered);
      setShowMemberDropdown(true);
    }
  }, [memberSearchQuery, members]);

  // 스케줄 데이터 변경 시 월간 통계 재계산
  useEffect(() => {
    if (schedules.length > 0) {
      calculateMonthlyStats(schedules);
    }
  }, [selectedDate, schedules]);

  // 월/날짜 변경 시 리포트 상태도 갱신
  useEffect(() => {
    if (myStaffId) {
      fetchReportStatus(myStaffId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, myStaffId]);

  // API 호출 함수들
  const fetchMembers = async (gymId: string | null, companyId: string | null) => {
    if (!gymId || !companyId) return;

    // !inner 제거: 회원권이 없는 회원도 조회되도록 LEFT JOIN 사용
    const { data, error } = await supabase
      .from("members")
      .select(`*, member_memberships (id, name, total_sessions, used_sessions, status)`)
      .eq("gym_id", gymId)
      .eq("company_id", companyId)
      .eq("status", "active")
      .order("name");

    if (error) {
      console.error("회원 조회 에러:", error);
      return;
    }

    const membersWithMemberships = (data || []).map((member: any) => {
      const memberships = member.member_memberships || [];
      const activeMembership = memberships.find((m: any) => m.status === 'active');
      const remaining = activeMembership
        ? (activeMembership.total_sessions - activeMembership.used_sessions)
        : 0;
      return { ...member, activeMembership, remaining };
    });

    setMembers(membersWithMemberships);
  };

  const fetchSchedules = async (staffId: string) => {
    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("staff_id", staffId);

    if (error) {
      console.error("스케줄 로딩 실패:", error);
    } else {
      const enrichedSchedules = enrichSchedulesWithSessionInfo(data || []);
      setSchedules(enrichedSchedules);
      calculateMonthlyStats(enrichedSchedules);
    }
  };

  const enrichSchedulesWithSessionInfo = (allSchedules: any[]) => {
    const memberSchedules: Record<string, { pt: any[]; ot: any[] }> = {};

    allSchedules.forEach(s => {
      if (!s.member_id) return;
      const type = (s.type || '').toLowerCase();
      if (type !== 'pt' && type !== 'ot') return;

      if (!memberSchedules[s.member_id]) {
        memberSchedules[s.member_id] = { pt: [], ot: [] };
      }
      if (type === 'pt') memberSchedules[s.member_id].pt.push(s);
      else if (type === 'ot') memberSchedules[s.member_id].ot.push(s);
    });

    // 회차 차감되는 상태만: completed, no_show_deducted (service는 차감 없음)
    const isCompleted = (status: string) => status === 'completed' || status === 'no_show_deducted';

    Object.values(memberSchedules).forEach(({ pt, ot }) => {
      pt.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      let ptSessionCount = 0;
      pt.forEach((schedule) => {
        const member = members.find(m => m.id === schedule.member_id);
        const membership = member?.memberships?.find((m: any) => m.name?.toLowerCase().includes('pt'));
        if (membership) schedule.total_sessions = membership.total_sessions;

        if (isCompleted(schedule.status)) {
          ptSessionCount++;
          schedule.session_number = ptSessionCount;
        } else {
          schedule.session_number = ptSessionCount + 1;
          schedule.is_not_completed = true;
        }
      });

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

  const calculateMonthlyStats = (scheduleList: any[]) => {
    const current = new Date(selectedDate);
    const targetYear = current.getFullYear();
    const targetMonth = current.getMonth();

    const monthlySchedules = scheduleList.filter(s => {
      const d = new Date(s.start_time);
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    });

    const stats = {
      PT: 0, OT: 0, Consulting: 0,
      completed: 0, no_show_deducted: 0, no_show: 0, service: 0,
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

  const fetchReportStatus = async (staffId: string) => {
    const yearMonth = getYearMonth();
    const { data, error } = await supabase
      .from("monthly_schedule_reports")
      .select("id, status, submitted_at, reviewed_at, admin_memo")
      .eq("staff_id", staffId)
      .eq("year_month", yearMonth)
      .maybeSingle();

    if (error) {
      console.error("보고서 조회 실패:", error);
      return;
    }

    if (data) {
      setSubmissionStatus(data.status as any);
      setCurrentReportId(data.id);
      setSubmittedAt(data.submitted_at);
      setReviewedAt(data.reviewed_at);
      setAdminMemo(data.admin_memo);
      setIsMonthApproved(data.status === "approved");
    } else {
      setSubmissionStatus("none");
      setCurrentReportId(null);
      setSubmittedAt(null);
      setReviewedAt(null);
      setAdminMemo(null);
      setIsMonthApproved(false);
    }
  };

  // 핸들러 함수들
  const handleCreateMember = async () => {
    if (!newMemberData.name || !myGymId || !myCompanyId) return;

    const { data, error } = await supabase
      .from("members")
      .insert({
        name: newMemberData.name,
        phone: newMemberData.phone,
        gym_id: myGymId,
        company_id: myCompanyId,
        status: 'active',
        memo: newMemberData.memo
      })
      .select()
      .single();

    if (error) {
      toast.error("회원 생성 실패: " + error.message);
    } else {
      toast.success("회원이 생성되었습니다.");
      setIsAddMemberModalOpen(false);
      setNewMemberData({ name: "", phone: "", memo: "" });
      fetchMembers(myGymId, myCompanyId);

      setNewMemberName(data.name);
      setSelectedMemberId(data.id);
      setMemberSearchQuery(data.name);
      if (!isAddModalOpen) setIsAddModalOpen(true);
    }
  };

  const handleAddClass = async () => {
    if (isMonthLocked) {
      toast.warning("제출(승인 대기/승인)된 달은 수정이 불가합니다.");
      return;
    }
    if (!newMemberName || !myStaffId || !myGymId) return;

    const startDateTime = new Date(`${selectedDate}T${startTime}:00`);
    const durationMin = parseInt(duration);
    const endDateTime = new Date(startDateTime.getTime() + durationMin * 60 * 1000);

    const scheduleType = classifyScheduleType(startDateTime, myWorkStartTime, myWorkEndTime);

    const { error } = await supabase.from("schedules").insert({
      gym_id: myGymId,
      staff_id: myStaffId,
      member_id: selectedMemberId,
      member_name: newMemberName,
      type: newClassType,
      status: "reserved",
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      title: `${newMemberName} (${newClassType})`,
      schedule_type: scheduleType,
      counted_for_salary: true,
    });

    if (error) {
      toast.error("등록 실패!");
      console.error(error);
    } else {
      // 선차감: 예약 생성 시 회원권 1회 차감 (PT/OT만)
      if (selectedMemberId && (newClassType === "PT" || newClassType === "OT")) {
        const typeFilter = newClassType === "PT"
          ? "name.ilike.%PT%,name.ilike.%피티%"
          : "name.ilike.%OT%,name.ilike.%오티%";

        const { data: membership } = await supabase
          .from("member_memberships")
          .select("id, used_sessions, total_sessions")
          .eq("member_id", selectedMemberId)
          .eq("gym_id", myGymId)
          .eq("status", "active")
          .or(typeFilter)
          .order("end_date", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (membership && membership.used_sessions < membership.total_sessions) {
          await supabase
            .from("member_memberships")
            .update({ used_sessions: membership.used_sessions + 1 })
            .eq("id", membership.id);
        }
      }

      setIsAddModalOpen(false);
      setNewMemberName("");
      setSelectedMemberId(null);
      setMemberSearchQuery("");
      fetchSchedules(myStaffId);

      fetch("/api/n8n", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate, time: startTime, member_name: newMemberName,
          type: newClassType, status: "reserved", staff_id: myStaffId,
        }),
      }).catch(e => console.error(e));
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedEvent || !myStaffId) return;

    try {
      const { data: schedule, error: scheduleError } = await supabase
        .from("schedules")
        .select("id, member_id, status")
        .eq("id", selectedEvent.id)
        .single();

      if (scheduleError) throw scheduleError;

      const oldStatus = schedule?.status || "reserved";

      const { error: updateError } = await supabase
        .from("schedules")
        .update({ status: newStatus })
        .eq("id", selectedEvent.id)
        .eq("staff_id", myStaffId);

      if (updateError) throw updateError;

      const shouldDeduct = (status: string) => status === "completed" || status === "no_show_deducted";
      const wasDeducted = shouldDeduct(oldStatus);
      const willDeduct = shouldDeduct(newStatus);

      if (schedule?.member_id && wasDeducted !== willDeduct) {
        const { data: membership } = await supabase
          .from("member_memberships")
          .select("id, used_sessions")
          .eq("member_id", schedule.member_id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (membership) {
          let newUsedSessions = membership.used_sessions;
          if (willDeduct && !wasDeducted) newUsedSessions += 1;
          else if (!willDeduct && wasDeducted) newUsedSessions = Math.max(0, newUsedSessions - 1);

          await supabase
            .from("member_memberships")
            .update({ used_sessions: newUsedSessions })
            .eq("id", membership.id);
        }
      }

      setIsStatusModalOpen(false);
      setSelectedEvent(null);
      fetchSchedules(myStaffId);
      if (myGymId && myCompanyId) fetchMembers(myGymId, myCompanyId);
    } catch (error: any) {
      console.error(error);
      toast.error("상태 변경 실패: " + error.message);
    }
  };

  const handleSubTypeChange = async (newSubType: string) => {
    if (!selectedEvent || !myStaffId) return;

    try {
      const { error } = await supabase
        .from("schedules")
        .update({ sub_type: newSubType })
        .eq("id", selectedEvent.id)
        .eq("staff_id", myStaffId);

      if (error) throw error;

      setIsStatusModalOpen(false);
      setSelectedEvent(null);
      fetchSchedules(myStaffId);
    } catch (error: any) {
      console.error(error);
      toast.error("분류 변경 실패: " + error.message);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!selectedEvent || !myStaffId) return;
    if (selectedEvent.is_locked || isMonthLocked) {
      toast.warning("제출/승인된 스케줄은 삭제할 수 없습니다.");
      return;
    }
    if (!confirm("정말 이 스케줄을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/schedule/${selectedEvent.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "삭제에 실패했습니다.");

      setIsStatusModalOpen(false);
      setSelectedEvent(null);
      fetchSchedules(myStaffId);
      if (myGymId && myCompanyId) fetchMembers(myGymId, myCompanyId);
    } catch (error: any) {
      toast.error("삭제 실패: " + error.message);
    }
  };

  const handleEditClass = async () => {
    if (!selectedEvent || !myStaffId || !myGymId) return;
    if (selectedEvent.is_locked || isMonthLocked) {
      toast.warning("제출/승인된 스케줄은 수정할 수 없습니다.");
      return;
    }

    const isPersonalSchedule = selectedEvent.type?.toLowerCase() === 'personal';

    if (isPersonalSchedule && !editPersonalTitle?.trim()) {
      toast.warning("일정 제목을 입력해주세요.");
      return;
    }

    const startDateTime = new Date(`${editDate}T${editStartTime}:00`);
    const durationMin = parseInt(editDuration);
    const endDateTime = new Date(startDateTime.getTime() + durationMin * 60 * 1000);
    const scheduleType = classifyScheduleType(startDateTime, myWorkStartTime, myWorkEndTime);

    const updateData: any = {
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      schedule_type: scheduleType,
    };

    if (isPersonalSchedule) {
      updateData.title = editPersonalTitle || '개인일정';
      updateData.sub_type = editSubType;
      updateData.type = 'Personal';
    } else if (selectedEvent.type?.toLowerCase() === 'consulting') {
      updateData.type = 'Consulting';
      updateData.sub_type = editSubType;
      updateData.title = `${editMemberName} (상담)`;
    } else {
      updateData.type = editClassType;
      updateData.title = `${editMemberName} (${editClassType})`;
    }

    const { error } = await supabase
      .from("schedules")
      .update(updateData)
      .eq("id", selectedEvent.id)
      .eq("staff_id", myStaffId);

    if (error) toast.error("수정 실패!");
    else {
      setIsEditModalOpen(false);
      setSelectedEvent(null);
      fetchSchedules(myStaffId);
    }
  };

  const handleSubmitMonth = async () => {
    if (!myGymId || !myStaffId) return;
    const yearMonth = getYearMonth();
    if (!confirm(`${yearMonth} 스케줄을 관리자에게 제출하시겠습니까?\n제출 후 승인 전까지 잠금됩니다.`)) return;

    try {
      const res = await fetch("/api/schedule/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearMonth }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "제출에 실패했습니다.");

      toast.success(json.message || "제출되었습니다.");
      setSubmissionStatus("submitted");
      setCurrentReportId(json.report?.id ?? null);
      setSubmittedAt(json.report?.submitted_at ?? null);
      setIsMonthApproved(false);
      fetchSchedules(myStaffId);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Navigation handlers
  const handlePrevDate = () => {
    const date = new Date(selectedDate);
    if (viewType === 'week') date.setDate(date.getDate() - 7);
    else date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDate = () => {
    const date = new Date(selectedDate);
    if (viewType === 'week') date.setDate(date.getDate() + 7);
    else date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleTimeSlotClick = (date: Date, time: string) => {
    if (isMonthLocked) {
      toast.warning("제출(승인 대기/승인)된 달은 수정이 불가합니다.");
      return;
    }
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    setStartTime(time);
    setIsAddModalOpen(true);
  };

  const handleScheduleClick = (schedule: any) => {
    const st = new Date(schedule.start_time);
    const et = new Date(schedule.end_time);
    const timeLabel = `${st.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })} ~ ${et.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    const diffMs = et.getTime() - st.getTime();
    const durationMin = Math.round(diffMs / (1000 * 60));

    setSelectedEvent({
      id: schedule.id,
      memberName: schedule.member_name,
      timeLabel,
      startTime: st,
      type: schedule.type,
      duration: String(durationMin),
      memberId: schedule.member_id,
      status: schedule.status,
      is_locked: schedule.is_locked,
      title: schedule.title,
      sub_type: schedule.sub_type
    });
    setIsStatusModalOpen(true);
  };

  const handleOpenEditModal = () => {
    if (!selectedEvent) return;
    const startDate = selectedEvent.startTime;
    const y = startDate.getFullYear();
    const m = String(startDate.getMonth() + 1).padStart(2, '0');
    const d = String(startDate.getDate()).padStart(2, '0');
    setEditDate(`${y}-${m}-${d}`);
    setEditStartTime(selectedEvent.startTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }));
    setEditDuration(selectedEvent.duration);
    setEditClassType(selectedEvent.type);
    setEditMemberName(selectedEvent.memberName);
    setEditPersonalTitle(selectedEvent.title || '');
    setEditSubType(selectedEvent.sub_type || '');
    setIsStatusModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleSelectMember = (member: any) => {
    setNewMemberName(member.name);
    setSelectedMemberId(member.id);
    setMemberSearchQuery(member.name);
    setShowMemberDropdown(false);
  };

  return {
    // Auth & Loading
    authLoading, isLoading, router,

    // Data
    schedules, members, filteredMembers, monthlyStats,

    // UI State
    viewType, setViewType,
    selectedDate, setSelectedDate,
    memberSearchQuery, setMemberSearchQuery,
    showMemberDropdown, setShowMemberDropdown,

    // Modal State
    isAddModalOpen, setIsAddModalOpen,
    isAddMemberModalOpen, setIsAddMemberModalOpen,
    isStatusModalOpen, setIsStatusModalOpen,
    isEditModalOpen, setIsEditModalOpen,

    // My Info
    myStaffId, myStaffName, myJobTitle,
    myGymId, myGymName, myCompanyId, myCompanyName,
    myWorkStartTime, myWorkEndTime,

    // Submission Status
    submissionStatus, currentReportId,
    submittedAt, reviewedAt, adminMemo,
    isMonthApproved, isMonthLocked,

    // Form State - Add Class
    newMemberName, setNewMemberName,
    selectedMemberId, setSelectedMemberId,
    newClassType, setNewClassType,
    startTime, setStartTime,
    duration, setDuration,

    // Form State - New Member
    newMemberData, setNewMemberData,

    // Form State - Selected Event
    selectedEvent, setSelectedEvent,

    // Form State - Edit
    editDate, setEditDate,
    editStartTime, setEditStartTime,
    editDuration, setEditDuration,
    editClassType, setEditClassType,
    editMemberName, setEditMemberName,
    editPersonalTitle, setEditPersonalTitle,
    editSubType, setEditSubType,

    // Handlers
    handleCreateMember, handleAddClass,
    handleStatusChange, handleSubTypeChange,
    handleDeleteSchedule, handleEditClass,
    handleSubmitMonth,
    handlePrevDate, handleNextDate,
    handleTimeSlotClick, handleScheduleClick,
    handleOpenEditModal, handleSelectMember,

    // Utils
    year, month, todayStr, getYearMonth
  };
}
