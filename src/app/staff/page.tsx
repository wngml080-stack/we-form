"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { MonthlySubmissionBanner } from "@/components/MonthlySubmissionBanner";
import { DailyStatsWidget } from "@/components/DailyStatsWidget";

// Hook
import { useStaffPageData } from "./hooks/useStaffPageData";

// Components
import { StaffHeader } from "./components/StaffHeader";
import { WelcomeSection } from "./components/WelcomeSection";
import { SchedulerSection } from "./components/SchedulerSection";

// Modals - 동적 import (사용자 액션 시에만 로드)
const AddClassModal = dynamic(() => import("./components/modals/AddClassModal").then(mod => ({ default: mod.AddClassModal })), { ssr: false });
const AddMemberModal = dynamic(() => import("./components/modals/AddMemberModal").then(mod => ({ default: mod.AddMemberModal })), { ssr: false });
const StatusChangeModal = dynamic(() => import("./components/modals/StatusChangeModal").then(mod => ({ default: mod.StatusChangeModal })), { ssr: false });
const EditClassModal = dynamic(() => import("./components/modals/EditClassModal").then(mod => ({ default: mod.EditClassModal })), { ssr: false });

export default function StaffPage(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Next.js 15+에서 params와 searchParams는 Promise이므로 unwrap해야 합니다.
  use(props.params);
  use(props.searchParams);

  const {
    // Auth & Loading
    authLoading, isLoading,

    // Data
    schedules, filteredMembers, monthlyStats,

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
    myStaffName, myGymName, myCompanyName,

    // Submission Status
    submissionStatus,
    submittedAt, reviewedAt, adminMemo,
    isMonthApproved, isMonthLocked,

    // Form State - Add Class
    newClassType, setNewClassType,
    startTime, setStartTime,
    duration, setDuration,

    // Form State - New Member
    newMemberData, setNewMemberData,

    // Form State - Selected Event
    selectedEvent,

    // Form State - Edit
    editDate, setEditDate,
    editStartTime, setEditStartTime,
    editDuration, setEditDuration,
    editClassType, setEditClassType,
    editMemberName,
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
  } = useStaffPageData();

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2F80ED]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-10 safe-area-inset">
      {/* Header */}
      <StaffHeader
        myStaffName={myStaffName}
        myGymName={myGymName}
        myCompanyName={myCompanyName}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 xs:px-4 md:px-6 py-4 xs:py-6 space-y-4 xs:space-y-6">
        {/* Welcome & Quick Actions */}
        <WelcomeSection
          myStaffName={myStaffName}
          totalMonthlySchedules={monthlyStats?.total || 0}
          todayStr={todayStr}
          onOpenAddMember={() => setIsAddMemberModalOpen(true)}
          onOpenAddClass={() => {
            setSelectedDate(todayStr);
            setStartTime("09:00");
            setIsAddModalOpen(true);
          }}
        />

        {/* 제출 상태 배너 */}
        <MonthlySubmissionBanner
          yearMonth={getYearMonth()}
          status={
            submissionStatus === "none"
              ? "not_submitted"
              : submissionStatus === "submitted"
              ? "submitted"
              : submissionStatus === "approved"
              ? "approved"
              : "rejected"
          }
          submittedAt={submittedAt}
          reviewedAt={reviewedAt}
          adminMemo={adminMemo}
          onSubmit={handleSubmitMonth}
          onResubmit={handleSubmitMonth}
        />

        {/* 당일 통계 위젯 */}
        <DailyStatsWidget
          selectedDate={selectedDate}
          schedules={schedules}
          staffName={myStaffName || undefined}
        />

        {/* Scheduler Section */}
        <SchedulerSection
          viewType={viewType}
          setViewType={setViewType}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          year={year}
          month={month}
          todayStr={todayStr}
          schedules={schedules}
          monthlyStats={monthlyStats}
          isMonthApproved={isMonthApproved}
          isMonthLocked={isMonthLocked}
          submissionStatus={submissionStatus}
          onPrevDate={handlePrevDate}
          onNextDate={handleNextDate}
          onScheduleClick={handleScheduleClick}
          onTimeSlotClick={handleTimeSlotClick}
          onSubmitMonth={handleSubmitMonth}
        />
      </main>

      {/* Floating Action Button (Mobile Only) */}
      {!isMonthApproved && (
        <button
          onClick={() => {
            setSelectedDate(new Date().toISOString().split('T')[0]);
            setIsAddModalOpen(true);
          }}
          className="md:hidden fixed bottom-6 right-4 xs:right-6 bg-[#2F80ED] text-white p-3.5 xs:p-4 rounded-full shadow-xl shadow-blue-200 hover:bg-[#1c6cd7] transition-all active:scale-95 z-50 flex items-center justify-center safe-area-bottom"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0)' }}
        >
          <Plus className="w-5 xs:w-6 h-5 xs:h-6 stroke-[3px]" />
        </button>
      )}

      {/* Modals */}
      <AddClassModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        memberSearchQuery={memberSearchQuery}
        setMemberSearchQuery={setMemberSearchQuery}
        showMemberDropdown={showMemberDropdown}
        setShowMemberDropdown={setShowMemberDropdown}
        filteredMembers={filteredMembers}
        onSelectMember={handleSelectMember}
        startTime={startTime}
        setStartTime={setStartTime}
        duration={duration}
        setDuration={setDuration}
        newClassType={newClassType}
        setNewClassType={setNewClassType}
        onSubmit={handleAddClass}
        onOpenAddMember={() => {
          setIsAddModalOpen(false);
          setIsAddMemberModalOpen(true);
        }}
      />

      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onOpenChange={setIsAddMemberModalOpen}
        newMemberData={newMemberData}
        setNewMemberData={setNewMemberData}
        onSubmit={handleCreateMember}
      />

      <StatusChangeModal
        isOpen={isStatusModalOpen}
        onOpenChange={setIsStatusModalOpen}
        selectedEvent={selectedEvent}
        isMonthApproved={isMonthApproved}
        onStatusChange={handleStatusChange}
        onSubTypeChange={handleSubTypeChange}
        onOpenEditModal={handleOpenEditModal}
        onDelete={handleDeleteSchedule}
      />

      <EditClassModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        selectedEvent={selectedEvent}
        editDate={editDate}
        setEditDate={setEditDate}
        editStartTime={editStartTime}
        setEditStartTime={setEditStartTime}
        editDuration={editDuration}
        setEditDuration={setEditDuration}
        editClassType={editClassType}
        setEditClassType={setEditClassType}
        editMemberName={editMemberName}
        editPersonalTitle={editPersonalTitle}
        setEditPersonalTitle={setEditPersonalTitle}
        editSubType={editSubType}
        setEditSubType={setEditSubType}
        onSubmit={handleEditClass}
      />
    </div>
  );
}
