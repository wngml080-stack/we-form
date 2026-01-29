"use client";

import { use } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useHqData } from "./hooks/useHqData";
import { StatCards } from "./components/StatCards";
import { PendingStaffList } from "./components/PendingStaffList";
import { GymList } from "./components/GymList";
import { CompanyEvents } from "./components/CompanyEvents";
import { StaffManagement } from "./components/StaffManagement";
import { GymFormModal } from "./components/modals/GymFormModal";
import { StaffEditModal } from "./components/modals/StaffEditModal";
import { GymDetailModal } from "./components/modals/GymDetailModal";
import { EventModal } from "./components/modals/EventModal";

export default function HQPage(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Next.js 15+에서 params와 searchParams는 Promise이므로 unwrap해야 합니다.
  use(props.params);
  use(props.searchParams);

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
    <div className="min-h-full bg-[#f8fafc] animate-in fade-in duration-700">
      <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-8 lg:space-y-10">
        {/* 헤더 - 더 세련된 디자인 */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-[0.2em] animate-in slide-in-from-left duration-700">
              <span className="w-8 h-[2px] bg-blue-600"></span>
              HEADQUARTERS MANAGEMENT
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              본사 관리
            </h1>
            <p className="text-slate-500 text-base md:text-lg font-medium animate-in slide-in-from-left duration-700 delay-100">
              <span className="font-bold text-slate-700">{companyName}</span>의 지점과 직원을 관리합니다
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 animate-in slide-in-from-right duration-700">
            <div className="flex items-center gap-2 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <Label className="text-sm font-black text-slate-700">회사:</Label>
              {myRole === 'system_admin' ? (
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger className="w-[180px] h-10 bg-slate-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-blue-100">
                    <SelectValue placeholder="회사 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-xl border-none shadow-2xl p-2">
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id} className="rounded-lg font-bold py-2.5">{company.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-100">
                  {companyName}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <Label className="text-sm font-black text-slate-700">지점:</Label>
              <Select value={selectedGymFilter} onValueChange={setSelectedGymFilter}>
                <SelectTrigger className="w-[180px] h-10 bg-slate-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-blue-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl border-none shadow-2xl p-2">
                  <SelectItem value="all" className="rounded-lg font-bold py-2.5">전체</SelectItem>
                  {gyms.map(gym => (
                    <SelectItem key={gym.id} value={gym.id} className="rounded-lg font-bold py-2.5">{gym.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 통계 대시보드 */}
        <StatCards stats={filteredStats} selectedGymFilter={selectedGymFilter} />

        {/* 대기자 & 운영 센터 목록 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
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
      </div>

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
