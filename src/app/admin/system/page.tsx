"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Hook
import { useSystemData } from "./hooks/useSystemData";

// Components
import { StatsDashboard } from "./components/StatsDashboard";
import { SystemAnnouncementSection } from "./components/SystemAnnouncementSection";
import { CompanyList } from "./components/CompanyList";

// Modals
import { CompanyEditModal } from "./components/modals/CompanyEditModal";
import { CompanyCreateModal } from "./components/modals/CompanyCreateModal";
import { GymCreateModal } from "./components/modals/GymCreateModal";
import { GymEditModal } from "./components/modals/GymEditModal";
import { StaffEditModal } from "./components/modals/StaffEditModal";
import { AnnouncementCreateModal } from "./components/modals/AnnouncementCreateModal";
import { AnnouncementEditModal } from "./components/modals/AnnouncementEditModal";

export default function SystemAdminPage() {
  const {
    // 로딩
    isLoading,

    // 데이터
    companies, systemAnnouncements,
    totalCompanies, pendingCompanies, totalGymsCount, totalStaffsCount,

    // 확장 상태
    expandedCompanies, expandedGyms, companyGyms, gymStaffs,
    toggleCompany, toggleGym,

    // 회사 수정
    isEditOpen, setIsEditOpen, editForm, setEditForm, openEdit, handleUpdate, handleStatusChange,

    // 지점 생성
    isCreateGymOpen, setIsCreateGymOpen, gymForm, setGymForm,
    openCreateGym, toggleCategory, handleCreateGym,

    // 지점 수정
    isEditGymOpen, setIsEditGymOpen, editGymForm, setEditGymForm,
    openEditGym, toggleEditCategory, handleUpdateGym, handleDeleteGym,

    // 직원 수정
    isEditStaffOpen, setIsEditStaffOpen, editStaffForm, setEditStaffForm,
    openEditStaff, handleUpdateStaff, handleDeleteStaff,

    // 고객사 생성
    isCreateCompanyOpen, setIsCreateCompanyOpen, createCompanyForm, setCreateCompanyForm,
    openCreateCompany, handleCreateCompany,

    // 공지사항
    isCreateAnnouncementOpen, setIsCreateAnnouncementOpen,
    isEditAnnouncementOpen, setIsEditAnnouncementOpen,
    announcementForm, setAnnouncementForm,
    editAnnouncementForm, setEditAnnouncementForm,
    handleCreateAnnouncement, openEditAnnouncement, handleUpdateAnnouncement,
    handleDeleteAnnouncement, toggleAnnouncementActive,

    // 유틸리티
    getRoleBadge
  } = useSystemData();

  if (isLoading) return <div className="p-10 text-center">데이터 로딩 중...</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-4 sm:space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">시스템 관리</h1>
          <p className="text-gray-500 mt-1 sm:mt-2 font-medium text-sm sm:text-base">서비스를 이용 중인 고객사를 관리합니다</p>
        </div>
        <Button
          onClick={openCreateCompany}
          className="bg-[#2F80ED] hover:bg-[#1c6cd7] text-white w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          고객사 추가
        </Button>
      </div>

      {/* 통계 대시보드 */}
      <StatsDashboard
        totalCompanies={totalCompanies}
        totalGymsCount={totalGymsCount}
        totalStaffsCount={totalStaffsCount}
        pendingCount={pendingCompanies.length}
      />

      {/* 시스템 공지사항 관리 */}
      <SystemAnnouncementSection
        announcements={systemAnnouncements}
        onAddClick={() => setIsCreateAnnouncementOpen(true)}
        onEditClick={openEditAnnouncement}
        onDeleteClick={handleDeleteAnnouncement}
        onToggleActive={toggleAnnouncementActive}
      />

      {/* 고객사 목록 */}
      <CompanyList
        companies={companies}
        expandedCompanies={expandedCompanies}
        expandedGyms={expandedGyms}
        companyGyms={companyGyms}
        gymStaffs={gymStaffs}
        onToggleCompany={toggleCompany}
        onToggleGym={toggleGym}
        onStatusChange={handleStatusChange}
        onEditCompany={openEdit}
        onCreateGym={openCreateGym}
        onEditGym={openEditGym}
        onDeleteGym={handleDeleteGym}
        onEditStaff={openEditStaff}
        onDeleteStaff={handleDeleteStaff}
        getRoleBadge={getRoleBadge}
      />

      {/* 모달들 */}
      <CompanyEditModal
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        form={editForm}
        setForm={setEditForm}
        onSubmit={handleUpdate}
      />

      <CompanyCreateModal
        isOpen={isCreateCompanyOpen}
        onOpenChange={setIsCreateCompanyOpen}
        form={createCompanyForm}
        setForm={setCreateCompanyForm}
        onSubmit={handleCreateCompany}
      />

      <GymCreateModal
        isOpen={isCreateGymOpen}
        onOpenChange={setIsCreateGymOpen}
        form={gymForm}
        setForm={setGymForm}
        toggleCategory={toggleCategory}
        onSubmit={handleCreateGym}
      />

      <GymEditModal
        isOpen={isEditGymOpen}
        onOpenChange={setIsEditGymOpen}
        form={editGymForm}
        setForm={setEditGymForm}
        toggleEditCategory={toggleEditCategory}
        onSubmit={handleUpdateGym}
      />

      <StaffEditModal
        isOpen={isEditStaffOpen}
        onOpenChange={setIsEditStaffOpen}
        form={editStaffForm}
        setForm={setEditStaffForm}
        onSubmit={handleUpdateStaff}
      />

      <AnnouncementCreateModal
        isOpen={isCreateAnnouncementOpen}
        onOpenChange={setIsCreateAnnouncementOpen}
        form={announcementForm}
        setForm={setAnnouncementForm}
        onSubmit={handleCreateAnnouncement}
      />

      <AnnouncementEditModal
        isOpen={isEditAnnouncementOpen}
        onOpenChange={setIsEditAnnouncementOpen}
        form={editAnnouncementForm}
        setForm={setEditAnnouncementForm}
        onSubmit={handleUpdateAnnouncement}
      />
    </div>
  );
}
