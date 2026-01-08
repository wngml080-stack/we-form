"use client";

import { use } from "react";
import dynamicImport from "next/dynamic";
import WeeklyTimetable from "@/components/WeeklyTimetable";
import { showSuccess, showError } from "@/lib/utils/error-handler";
import { classifyScheduleType } from "@/lib/schedule-utils";
import { DailyStatsWidget } from "@/components/DailyStatsWidget";
import { MonthlySubmissionBanner } from "@/components/MonthlySubmissionBanner";
import { MonthlyStatsSection } from "./components/MonthlyStatsSection";
import { ScheduleHeader } from "./components/ScheduleHeader";
import { ScheduleControls } from "./components/ScheduleControls";
import { StaffSelectionPrompt } from "./components/StaffSelectionPrompt";
import { useSchedulePageData } from "./hooks/useSchedulePageData";
import { useScheduleOperations } from "./hooks/useScheduleOperations";
import { exportSchedulesToExcel } from "./utils/excelExport";

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
  params: Promise<any>;
  searchParams: Promise<any>;
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
    handleTimeSlotClick, handleScheduleClick,
    handleOpenEditModal, handleStaffChange,
    getSessionNumber,
    supabase,
  } = pageData;

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

  const handleCreateSchedule = async () => {
    if (!selectedTimeSlot || !selectedGymId) return;

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
      const ptMembership = memberships.find((m: any) =>
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
      const scheduleData: any = {
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
      setCreateForm({ member_id: "", type: "PT", duration: "60", isPersonal: false, personalTitle: "" });
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
            const grouped = membershipData.reduce((acc: Record<string, any[]>, m) => {
              if (!acc[m.member_id]) acc[m.member_id] = [];
              acc[m.member_id].push(m);
              return acc;
            }, {});
            setMemberMemberships(grouped);
          }
        }
      } else {
        const scheduleType = classifyScheduleType(startDate, workStartTime, workEndTime);
        const updateData: any = {
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F80ED]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-4 sm:space-y-6">
      <ScheduleHeader
        userRole={userRole}
        userName={user?.name || ""}
        gymName={gymName}
        staffs={staffs}
        selectedStaffId={selectedStaffId}
        onStaffChange={handleStaffChange}
        onExportExcel={() => exportSchedulesToExcel(schedules)}
      />

      {userRole === "staff" && (
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
      ) : selectedStaffId === "all" ? (
        <StaffSelectionPrompt />
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
          <DailyStatsWidget
            selectedDate={selectedDate}
            schedules={schedules}
            staffName={staffs.find(s => s.id === selectedStaffId)?.name}
          />
        </>
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
      />
    </div>
  );
}
