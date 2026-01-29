"use client";

import { use } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { useSystemData } from "./hooks/useSystemData";
import { StatsDashboard } from "./components/StatsDashboard";
import { SystemAnnouncementSection } from "./components/SystemAnnouncementSection";
import { CompanyList } from "./components/CompanyList";
import { CompanyEditModal } from "./components/modals/CompanyEditModal";
import { CompanyCreateModal } from "./components/modals/CompanyCreateModal";
import { GymCreateModal } from "./components/modals/GymCreateModal";
import { GymEditModal } from "./components/modals/GymEditModal";
import { StaffEditModal } from "./components/modals/StaffEditModal";
import { AnnouncementCreateModal } from "./components/modals/AnnouncementCreateModal";
import { AnnouncementEditModal } from "./components/modals/AnnouncementEditModal";

export default function SystemAdminPage(props: {
  params: Promise<Record<string, never>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Next.js 15+에서 params와 searchParams는 Promise이므로 unwrap해야 합니다.
  use(props.params);
  use(props.searchParams);

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

  return (
    <div className="min-h-full bg-[#f8fafc] animate-in fade-in duration-700">
      <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-8 lg:space-y-10">
        {/* 헤더 - 더 세련된 디자인 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-[0.2em] animate-in slide-in-from-left duration-700">
              <span className="w-8 h-[2px] bg-blue-600"></span>
              SYSTEM ADMINISTRATION
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              시스템 관리
            </h1>
            <p className="text-slate-500 text-base md:text-lg font-medium animate-in slide-in-from-left duration-700 delay-100">
              서비스를 이용 중인 <span className="font-bold text-slate-700">모든 고객사</span>와 인프라를 관리합니다
            </p>
          </div>

          <Button
            onClick={openCreateCompany}
            className="bg-[#2F80ED] hover:bg-[#1c6cd7] text-white font-black h-12 px-8 rounded-2xl transition-all shadow-lg shadow-blue-100 animate-in slide-in-from-right duration-700"
          >
            <Plus className="w-5 h-5 mr-2" />
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
      </div>

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
