"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Custom Hook
import { useHqData } from "./hooks/useHqData";

// Components
import { StatCards } from "./components/StatCards";
import { PendingStaffList } from "./components/PendingStaffList";
import { GymList } from "./components/GymList";
import { CompanyEvents } from "./components/CompanyEvents";
import { StaffManagement } from "./components/StaffManagement";

// Modals
import { GymFormModal } from "./components/modals/GymFormModal";
import { StaffEditModal } from "./components/modals/StaffEditModal";
import { GymDetailModal } from "./components/modals/GymDetailModal";
import { EventModal } from "./components/modals/EventModal";

export default function HQPage() {
  const {
    // 기본 데이터
    gyms,
    pendingStaffs,
    allStaffs,
    members,
    recentActivities,

    // 회사 정보
    companyName,
    myRole,
    companies,
    selectedCompanyId,
    setSelectedCompanyId,

    // 통계
    filteredStats,

    // 발령
    setSelectedGym,
    setSelectedRole,
    handleAssign,

    // 필터
    selectedGymFilter,
    setSelectedGymFilter,

    // 지점 상세
    selectedGymDetail,
    isGymDetailOpen,
    setIsGymDetailOpen,
    selectedMonth,
    setSelectedMonth,
    isEditingBep,
    setIsEditingBep,
    bepForm,
    setBepForm,
    openGymDetailModal,
    handleUpdateBep,

    // 직원 수정
    isStaffEditOpen,
    setIsStaffEditOpen,
    staffEditForm,
    setStaffEditForm,
    openStaffEditModal,
    handleStaffUpdate,

    // 이벤트
    companyEvents,
    isEventModalOpen,
    setIsEventModalOpen,
    editingEvent,
    eventForm,
    setEventForm,
    openEventModal,
    handleSaveEvent,
    handleDeleteEvent,
    handleToggleEventActive,

    // 지점 CRUD
    formData,
    setFormData,
    isCreateOpen,
    setIsCreateOpen,
    isEditOpen,
    setIsEditOpen,
    isLoading,
    toggleCategory,
    handleCreateBranch,
    handleUpdateGym,
    openEditModal,
    handleDeleteGym,

    // 유틸리티
    formatDate,
    getCategoryColor,
    initialFormData
  } = useHqData();

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-4 sm:space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">본사 관리</h1>
          <p className="text-gray-500 mt-1 sm:mt-2 font-medium text-sm sm:text-base">{companyName}의 지점과 직원을 관리합니다</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-gray-700">회사:</Label>
            {myRole === 'system_admin' ? (
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="회사 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="px-3 py-1.5 bg-[#2F80ED] text-white rounded-md text-sm font-medium">
                {companyName}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-gray-700">지점:</Label>
            <Select value={selectedGymFilter} onValueChange={setSelectedGymFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">전체</SelectItem>
                {gyms.map(gym => (
                  <SelectItem key={gym.id} value={gym.id}>{gym.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 통계 대시보드 */}
      <StatCards stats={filteredStats} selectedGymFilter={selectedGymFilter} />

      {/* 대기자 & 운영 센터 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingStaffList
          pendingStaffs={pendingStaffs}
          gyms={gyms}
          onGymChange={setSelectedGym}
          onRoleChange={setSelectedRole}
          onAssign={handleAssign}
        />

        <GymList
          gyms={gyms}
          onCreateClick={() => { setFormData(initialFormData); setIsCreateOpen(true); }}
          onGymDetailClick={openGymDetailModal}
          onEditClick={openEditModal}
          onDeleteClick={handleDeleteGym}
          getCategoryColor={getCategoryColor}
        />
      </div>

      {/* 회사 일정 & 행사 관리 */}
      <CompanyEvents
        companyEvents={companyEvents}
        onAddClick={() => openEventModal()}
        onEditClick={openEventModal}
        onDeleteClick={handleDeleteEvent}
        onToggleActive={handleToggleEventActive}
      />

      {/* 직원 재직 현황 & 최근 활동 */}
      <StaffManagement
        allStaffs={allStaffs}
        selectedGymFilter={selectedGymFilter}
        onEditClick={openStaffEditModal}
        pendingStaffs={pendingStaffs}
        recentActivities={recentActivities}
        formatDate={formatDate}
      />

      {/* 모달들 */}
      <GymFormModal
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        isEditMode={false}
        formData={formData}
        setFormData={setFormData}
        allStaffs={allStaffs}
        toggleCategory={toggleCategory}
        onSubmit={handleCreateBranch}
        isLoading={isLoading}
      />

      <GymFormModal
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        isEditMode={true}
        formData={formData}
        setFormData={setFormData}
        allStaffs={allStaffs}
        toggleCategory={toggleCategory}
        onSubmit={handleUpdateGym}
        isLoading={isLoading}
      />

      <StaffEditModal
        isOpen={isStaffEditOpen}
        onOpenChange={setIsStaffEditOpen}
        staffEditForm={staffEditForm}
        setStaffEditForm={setStaffEditForm}
        onSubmit={handleStaffUpdate}
        isLoading={isLoading}
      />

      <GymDetailModal
        isOpen={isGymDetailOpen}
        onOpenChange={setIsGymDetailOpen}
        selectedGymDetail={selectedGymDetail}
        members={members}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        isEditingBep={isEditingBep}
        setIsEditingBep={setIsEditingBep}
        bepForm={bepForm}
        setBepForm={setBepForm}
        onUpdateBep={handleUpdateBep}
      />

      <EventModal
        isOpen={isEventModalOpen}
        onOpenChange={setIsEventModalOpen}
        editingEvent={editingEvent}
        eventForm={eventForm}
        setEventForm={setEventForm}
        gyms={gyms}
        onSubmit={handleSaveEvent}
        isLoading={isLoading}
      />
    </div>
  );
}
