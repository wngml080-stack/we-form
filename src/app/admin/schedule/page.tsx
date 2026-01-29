"use client";

import { use, useMemo } from "react";
import dynamicImport from "next/dynamic";
import WeeklyTimetable from "@/components/WeeklyTimetable";
import { showSuccess, showError } from "@/lib/utils/error-handler";
import { classifyScheduleType } from "@/lib/schedule-utils";
import { DailyStatsWidget } from "@/components/DailyStatsWidget";
import { MonthlySubmissionBanner } from "@/components/MonthlySubmissionBanner";
import { MonthlyStatsSection } from "./components/MonthlyStatsSection";
import { ScheduleHeader } from "./components/ScheduleHeader";
import { ScheduleControls } from "./components/ScheduleControls";
import { AttendanceSection } from "./components/AttendanceSection";
import { StaffSelectionPrompt } from "./components/StaffSelectionPrompt";
import { useSchedulePageData, ScheduleItem } from "./hooks/useSchedulePageData";
import { useScheduleOperations } from "./hooks/useScheduleOperations";
import { exportSchedulesToExcel } from "./utils/excelExport";

// 회원권 멤버십 데이터 타입 (DB에서 조회한 형태)
type MemberMembershipData = {
  id: string;
  member_id: string;
  name: string;
  total_sessions: number | null;
  used_sessions: number | null;
  service_sessions?: number | null;
  used_service_sessions?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
};

// 스케줄 생성 시 사용하는 데이터 타입
type ScheduleInsertData = {
  gym_id: string;
  staff_id: string;
  type: string;
  start_time: string;
  end_time: string;
  schedule_type: string;
  member_id?: string;
  member_name?: string;
  title?: string;
  status?: string;
  counted_for_salary?: boolean;
  inbody_checked?: boolean;
};

// 스케줄 수정 시 사용하는 데이터 타입
type ScheduleUpdateData = {
  type?: string;
  start_time?: string;
  end_time?: string;
  schedule_type?: string;
  member_id?: string;
  member_name?: string;
  title?: string;
  status?: string;
  sub_type?: string;
  inbody_checked?: boolean;
};

// Dynamic imports for modals (코드 스플리팅으로 초기 로드 성능 개선)
const CreateScheduleModal = dynamicImport(
  () => import("./components/modals/CreateScheduleModal").then(mod => ({ default: mod.CreateScheduleModal })),
  { ssr: false }
);
const EditScheduleModal = dynamicImport(
  () => import("./components/modals/EditScheduleModal").then(mod => ({ default: mod.EditScheduleModal })),
  { ssr: false }
);
const QuickStatusModal = dynamicImport(
  () => import("./components/modals/QuickStatusModal").then(mod => ({ default: mod.QuickStatusModal })),
  { ssr: false }
);

export default function AdminSchedulePage(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Next.js 15+에서 params와 searchParams는 Promise이므로 unwrap해야 합니다.
  use(props.params);
  use(props.searchParams);

  const pageData = useSchedulePageData();
  const {
    user, userRole, myStaffId, gymName,
    workStartTime, workEndTime,
    isLoading, setIsLoading,
    schedules, staffs, members, filteredMembers,
    memberMemberships, setMemberMemberships,
    selectedGymId, selectedStaffId,
    monthlyStats, yearMonth,
    viewType, setViewType,
    selectedDate, setSelectedDate,
    mySubmissionStatus, mySubmittedAt, myReviewedAt, myAdminMemo,
    isCreateModalOpen, setIsCreateModalOpen,
    selectedTimeSlot, createForm, setCreateForm,
    selectedMemberMembership, setSelectedMemberMembership,
    isEditModalOpen, setIsEditModalOpen,
    editForm, setEditForm,
    isStatusModalOpen, setIsStatusModalOpen,
    selectedSchedule, setSelectedSchedule,
    fetchSchedules,
    handleSubmitMonth,
    handlePrevDate, handleNextDate, handleToday,
    handleTimeSlotClick: baseHandleTimeSlotClick,
    handleScheduleClick: baseHandleScheduleClick,
    handleOpenEditModal, handleStaffChange,
    getSessionNumber,
    supabase,
  } = pageData;

  const isLocked = useMemo(() => {
    // 제출됨 또는 승인됨 상태면 기본적으로 잠금 대상
    const isStatusLocked = mySubmissionStatus === "submitted" || mySubmissionStatus === "approved";
    
    if (!isStatusLocked) return false;

    // 최고 관리자(system_admin)는 어떤 경우에도 잠금되지 않음 (운영 편의성)
    if (userRole === "system_admin") return false;

    // 일반 강사(staff)는 본인의 제출 건에 대해 무조건 잠금
    if (userRole === "staff") return true;

    // 관리자(admin, company_admin 등)라도 본인의 스케줄을 보고 있고 제출했다면 잠금 (실수 방지)
    // 단, 타인의 스케줄을 관리할 때는 잠금 해제 (수정 권한 부여)
    if (selectedStaffId === myStaffId) return true;

    return false;
  }, [userRole, mySubmissionStatus, selectedStaffId, myStaffId]);

  // 타임슬롯 클릭 (락 체크 개선: 클릭한 날짜의 월이 현재 보고 있는 월과 같은 경우에만 락 적용)
  const handleTimeSlotClick = (date: Date, time: string) => {
    const clickedYearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    
    if (isLocked && clickedYearMonth === yearMonth) {
      showError("해당 월의 스케줄이 제출되어 생성이 불가능합니다. 반려 처리 후 수정해주세요.", "스케줄 생성");
      return;
    }
    baseHandleTimeSlotClick(date, time);
  };

  // 스케줄 클릭 (락 체크 추가)
  const handleScheduleClick = (schedule: ScheduleItem) => {
    // 상세 정보 모달은 잠금 여부와 상관없이 열리도록 유지 (QuickStatusModal 내부에서 버튼이 비활성화됨)
    baseHandleScheduleClick(schedule);
  };

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
    setIsLoading,
    isLocked,
    yearMonth
  });

  const handleCreateSchedule = async () => {
    if (!selectedTimeSlot || !selectedGymId) return;

    if (isLocked) {
      showError("해당 월의 스케줄이 제출되어 수정이 불가능합니다. 반려 처리 후 수정해주세요.", "스케줄 생성");
      return;
    }

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

      const memberships = memberMemberships[createForm.member_id] || [];
      const ptMembership = memberships.find((m: MemberMembershipData) =>
        m.name?.toLowerCase().includes('pt') || m.name?.includes('피티')
      );

      // 일반 직원(staff)만 담당자 검증 (관리자는 모든 회원 스케줄 생성 가능)
      const isAdmin = userRole === "system_admin" || userRole === "company_admin";
      if (!isAdmin) {
        const selectedMember = members.find(m => m.id === createForm.member_id);
        if (!selectedMember?.trainer_id) {
          showError("담당자가 배정되지 않은 회원은 스케줄을 등록할 수 없습니다.", "스케줄 생성");
          return;
        }
      }

      if (createForm.type === "PT") {
        if (!ptMembership) {
          showError("PT 회원권이 없는 회원입니다. OT 또는 상담으로 등록해주세요.", "스케줄 생성");
          return;
        }
        const remainingSessions = (ptMembership.total_sessions || 0) - (ptMembership.used_sessions || 0);
        if (remainingSessions <= 0) {
          showError("PT 회원권의 잔여 횟수가 없습니다. OT 또는 상담으로 등록해주세요.", "스케줄 생성");
          return;
        }
      }
    }

    try {
      setIsLoading(true);
      const [year, month, day] = selectedTimeSlot.date.split('-').map(Number);
      const [hours, minutes] = selectedTimeSlot.time.split(':').map(Number);
      const startDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
      const duration = parseInt(createForm.duration);
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + duration);
      const targetStaffId = selectedTimeSlot.staffId || myStaffId;

      const { data: existingSchedules } = await supabase
        .from("schedules")
        .select("id, start_time, end_time, member_name")
        .eq("staff_id", targetStaffId)
        .eq("gym_id", selectedGymId);

      const hasOverlap = existingSchedules?.some((s) => {
        const es = new Date(s.start_time);
        const ee = new Date(s.end_time);
        return startDate < ee && es < endDate;
      });

      if (hasOverlap) {
        showError("중복 일정이 있습니다.", "스케줄 생성");
        return;
      }

      const scheduleType = classifyScheduleType(startDate, workStartTime, workEndTime);
      const scheduleData: ScheduleInsertData = {
        gym_id: selectedGymId,
        staff_id: targetStaffId,
        type: createForm.type,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        schedule_type: scheduleType,
      };

      if (createForm.isPersonal) {
        scheduleData.member_name = createForm.personalTitle;
        scheduleData.title = createForm.personalTitle;
        scheduleData.type = "Personal";
        scheduleData.status = "completed";
        scheduleData.counted_for_salary = false;
      } else {
        const selectedMember = members.find(m => m.id === createForm.member_id);
        if (!selectedMember) {
          showError("회원 정보를 찾을 수 없습니다.", "스케줄 생성");
          return;
        }
        scheduleData.member_id = createForm.member_id;
        scheduleData.member_name = selectedMember.name;
        scheduleData.title = `${selectedMember.name} (${createForm.type})`;
        scheduleData.status = "reserved";
        scheduleData.counted_for_salary = true;

        if (createForm.type === 'OT') {
          scheduleData.inbody_checked = createForm.inbody_checked || false;
        }
      }

      const { error } = await supabase.from("schedules").insert(scheduleData);
      if (error) throw error;

      // 선차감: 예약 생성 시 회원권 1회 차감 (PT/OT만)
      if (!createForm.isPersonal && createForm.member_id && (createForm.type === "PT" || createForm.type === "OT")) {
        const typeFilter = createForm.type === "PT"
          ? "name.ilike.%PT%,name.ilike.%피티%"
          : "name.ilike.%OT%,name.ilike.%오티%";

        const { data: membership } = await supabase
          .from("member_memberships")
          .select("id, used_sessions, total_sessions")
          .eq("member_id", createForm.member_id)
          .eq("gym_id", selectedGymId)
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

      setIsCreateModalOpen(false);
      setCreateForm({ member_id: "", type: "PT", duration: "60", isPersonal: false, personalTitle: "", inbody_checked: false });
      setSelectedMemberMembership(null);
      fetchSchedules(selectedGymId, selectedStaffId);
    } catch (error) {
      showError(error, "스케줄 생성");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSchedule = async () => {
    if (!selectedSchedule) return;

    if (isLocked) {
      showError("해당 월의 스케줄이 제출되어 수정이 불가능합니다. 반려 처리 후 수정해주세요.", "스케줄 수정");
      return;
    }

    const isPersonalSchedule = ['personal', '개인'].includes(selectedSchedule?.type?.toLowerCase()) || editForm.type === 'Personal';

    if (isPersonalSchedule && !editForm.personalTitle?.trim()) {
      showError("일정 제목을 입력해주세요.", "스케줄 수정");
      return;
    }

    if (!isPersonalSchedule && !editForm.member_id && selectedSchedule.member_id) {
      showError("회원을 선택해주세요.", "스케줄 수정");
      return;
    }

    try {
      setIsLoading(true);
      const [year, month, day] = editForm.date.split('-').map(Number);
      const [hours, minutes] = editForm.time.split(':').map(Number);
      const startDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
      const duration = parseInt(editForm.duration);
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + duration);

      const originalStart = new Date(selectedSchedule.start_time);
      const originalEnd = new Date(selectedSchedule.end_time);
      const normalize = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), 0, 0).getTime();
      const timeChanged = normalize(startDate) !== normalize(originalStart) || normalize(endDate) !== normalize(originalEnd);

      if (timeChanged) {
        const { data: existingSchedules } = await supabase
          .from("schedules")
          .select("id, start_time, end_time, member_name")
          .eq("staff_id", selectedSchedule.staff_id)
          .eq("gym_id", selectedGymId!)
          .neq("id", selectedSchedule.id);

        const hasOverlap = existingSchedules?.some((s) => {
          const es = new Date(s.start_time);
          const ee = new Date(s.end_time);
          return startDate < ee && es < endDate;
        });

        if (hasOverlap) {
          showError("중복 일정이 있습니다.", "스케줄 수정");
          return;
        }
      }

      const statusChanged = editForm.status !== selectedSchedule.status;
      const needsMembershipUpdate = statusChanged &&
        ["completed", "no_show_deducted"].includes(editForm.status) &&
        !["completed", "no_show_deducted"].includes(selectedSchedule.status);

      if (needsMembershipUpdate) {
        const scheduleType = classifyScheduleType(startDate, workStartTime, workEndTime);
        const selectedMember = members.find(m => m.id === editForm.member_id);
        const updateData: ScheduleUpdateData = {
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

        if (editForm.type === 'OT' || selectedSchedule?.type === 'OT') {
          updateData.inbody_checked = editForm.inbody_checked;
        }

        await supabase.from("schedules").update(updateData).eq("id", selectedSchedule.id);

        const res = await fetch("/api/schedule/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduleId: selectedSchedule.id, newStatus: editForm.status }),
        });

        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || "상태 업데이트 실패");
        }

        if (selectedGymId) {
          const { data: membershipData } = await supabase
            .from("member_memberships")
            .select("id, member_id, name, total_sessions, used_sessions, start_date, end_date, status")
            .eq("gym_id", selectedGymId)
            .eq("status", "active");

          if (membershipData) {
            const grouped = membershipData.reduce((acc: Record<string, MemberMembershipData[]>, m) => {
              if (!acc[m.member_id]) acc[m.member_id] = [];
              acc[m.member_id].push(m as MemberMembershipData);
              return acc;
            }, {});
            setMemberMemberships(grouped);
          }
        }
      } else {
        const scheduleType = classifyScheduleType(startDate, workStartTime, workEndTime);
        const updateData: ScheduleUpdateData = {
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          schedule_type: scheduleType,
        };

        if (isPersonalSchedule) {
          updateData.title = editForm.personalTitle || '개인일정';
          updateData.sub_type = editForm.sub_type;
          updateData.type = 'Personal';
        } else {
          updateData.status = editForm.status;
          updateData.type = editForm.type;

          if (editForm.type === 'Consulting' || selectedSchedule?.type?.toLowerCase() === 'consulting') {
            updateData.sub_type = editForm.sub_type;
          }

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

        const { error } = await supabase.from("schedules").update(updateData).eq("id", selectedSchedule.id);
        if (error) throw error;
      }

      showSuccess("스케줄이 수정되었습니다!");
      setIsEditModalOpen(false);
      if (selectedGymId) fetchSchedules(selectedGymId, selectedStaffId);
    } catch (error) {
      showError(error, "스케줄 수정");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-hex)]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 xl:p-12 max-w-[1920px] mx-auto space-y-6 sm:space-y-10 relative">
      {/* Background Decor - Toss 스타일 */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-[var(--primary-light-hex)]/40 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[5%] left-[-5%] w-[30%] h-[30%] bg-[var(--secondary-light-hex)]/30 rounded-full blur-[100px]"></div>
      </div>

      <ScheduleHeader
        userRole={userRole}
        userName={user?.name || ""}
        gymName={gymName}
        staffs={staffs}
        selectedStaffId={selectedStaffId}
        onStaffChange={handleStaffChange}
        onExportExcel={() => exportSchedulesToExcel(schedules)}
      />

      {(userRole === "staff" || selectedStaffId === myStaffId) && (
        <MonthlySubmissionBanner
          yearMonth={yearMonth}
          status={mySubmissionStatus === "none" ? "not_submitted" : mySubmissionStatus === "submitted" ? "submitted" : mySubmissionStatus === "approved" ? "approved" : "rejected"}
          submittedAt={mySubmittedAt}
          reviewedAt={myReviewedAt}
          adminMemo={myAdminMemo}
          onSubmit={handleSubmitMonth}
          onResubmit={handleSubmitMonth}
        />
      )}

      <ScheduleControls
        viewType={viewType}
        selectedDate={selectedDate}
        onViewTypeChange={setViewType}
        onPrevDate={handlePrevDate}
        onNextDate={handleNextDate}
        onToday={handleToday}
        onDateChange={setSelectedDate}
      />

      {viewType === 'month' ? (
        <MonthlyStatsSection
          monthlyStats={monthlyStats}
          year={new Date(selectedDate).getFullYear()}
          month={new Date(selectedDate).getMonth() + 1}
          mySubmissionStatus={mySubmissionStatus}
          onQuickAttendance={scheduleOps.handleQuickAttendance}
          onSubmitMonth={handleSubmitMonth}
        />
      ) : viewType === 'attendance' ? (
        <AttendanceSection
          schedules={schedules}
          staffs={staffs}
          selectedStaffId={selectedStaffId}
          onScheduleClick={handleScheduleClick}
          isLoading={isLoading}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      ) : selectedStaffId === "all" ? (
        <StaffSelectionPrompt />
      ) : (
        <div className="space-y-8 animate-in fade-in duration-1000 delay-300">
          <div className="bg-white rounded-[32px] p-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#E5E8EB] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow duration-200">
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
          <DailyStatsWidget
            selectedDate={selectedDate}
            schedules={schedules}
            staffName={staffs.find(s => s.id === selectedStaffId)?.name}
          />
        </div>
      )}

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
        isLocked={isLocked}
      />

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
        isLocked={isLocked}
      />

      <QuickStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        selectedSchedule={selectedSchedule}
        setSelectedSchedule={setSelectedSchedule}
        selectedGymId={selectedGymId}
        selectedStaffId={selectedStaffId}
        onStatusChange={(newStatus: string) => scheduleOps.handleQuickStatusChange(selectedSchedule, newStatus, () => setIsStatusModalOpen(false))}
        onSubTypeChange={(newSubType: string) => scheduleOps.handleQuickSubTypeChange(selectedSchedule, newSubType, () => setIsStatusModalOpen(false))}
        onOpenEditModal={handleOpenEditModal}
        onDelete={() => scheduleOps.handleDeleteSchedule(selectedSchedule, () => {
          setIsStatusModalOpen(false);
          setSelectedSchedule(null);
        })}
        fetchSchedules={fetchSchedules}
        isLocked={isLocked}
      />
    </div>
  );
}
