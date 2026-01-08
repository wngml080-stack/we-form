"use client";

import { use } from "react";
import dynamicImport from "next/dynamic";
import { Users, DollarSign, Calendar, BarChart3, Building } from "lucide-react";
import { useBranchData } from "./hooks/useBranchData";
import { StatCard, QuickLinkCard } from "./components/StatCards";
import { AnnouncementCalendar } from "./components/AnnouncementCalendar";

// Dynamic imports for modals (코드 스플리팅으로 초기 로드 성능 개선)
const AnnouncementModal = dynamicImport(
  () => import("./components/modals/AnnouncementModal").then(mod => ({ default: mod.AnnouncementModal })),
  { ssr: false }
);
const DateAnnouncementsModal = dynamicImport(
  () => import("./components/modals/DateAnnouncementsModal").then(mod => ({ default: mod.DateAnnouncementsModal })),
  { ssr: false }
);

export default function BranchManagementPage(props: {
  params: Promise<any>;
  searchParams: Promise<any>;
}) {
  // Next.js 15+에서 params와 searchParams는 Promise이므로 unwrap해야 합니다.
  use(props.params);
  use(props.searchParams);

  const {
    // Auth & Filter
    gymName,
    gyms,

    // Loading states
    isLoading,

    // Stats
    stats,

    // Announcements
    announcements,
    announcementForm,
    setAnnouncementForm,
    editingAnnouncement,
    isAnnouncementModalOpen,
    setIsAnnouncementModalOpen,
    openAnnouncementModal,
    handleSaveAnnouncement,
    handleToggleAnnouncementActive,
    handleDeleteAnnouncement,

    // Calendar
    currentCalendarMonth,
    setCurrentCalendarMonth,
    selectedDate,
    setSelectedDate,
    isDateAnnouncementsModalOpen,
    setIsDateAnnouncementsModalOpen,
  } = useBranchData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-10 animate-in fade-in duration-700">
      {/* 헤더 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Building className="w-7 h-7 text-white" />
            </div>
            지점 운영 현황
          </h1>
          <p className="text-slate-400 font-bold ml-15">
            <span className="text-blue-600 underline decoration-blue-100 underline-offset-4">{gymName}</span> 지점의 통합 데이터를 분석합니다.
          </p>
        </div>
      </div>

      {/* 핵심 지표 카드 - 입체감 있는 카드 디자인 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title="전체 회원"
          value={stats.totalMembers}
          suffix="명"
          color="bg-blue-500"
        />
        <StatCard
          icon={Users}
          title="활성 회원"
          value={stats.activeMembers}
          suffix="명"
          color="bg-emerald-500"
        />
        <StatCard
          icon={DollarSign}
          title="이번 달 매출"
          value={Math.round(stats.monthlyRevenue / 10000)}
          suffix="만원"
          color="bg-indigo-500"
        />
        <StatCard
          icon={Calendar}
          title="오늘"
          value={new Date().getDate()}
          suffix="일"
          color="bg-amber-500"
        />
      </div>

      {/* 빠른 링크 - 버튼 스타일로 업그레이드 */}
      <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-100/50 border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              지점 운영 서비스
            </h3>
            <p className="text-slate-400 font-bold ml-13">주요 관리 페이지로 빠르게 이동할 수 있습니다.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickLinkCard
            title="매출 통합 관리"
            description="실시간 매출 현황 분석"
            href="/admin/sales"
            icon={DollarSign}
            color="text-emerald-600 bg-emerald-50 border-emerald-100"
          />
          <QuickLinkCard
            title="투명한 급여 관리"
            description="직원 정산 및 통계"
            href="/admin/salary"
            icon={DollarSign}
            color="text-blue-600 bg-blue-50 border-blue-100"
          />
          <QuickLinkCard
            title="스마트 직원 관리"
            description="정보 및 권한 시스템"
            href="/admin/staff"
            icon={Users}
            color="text-indigo-600 bg-indigo-50 border-indigo-100"
          />
        </div>
      </div>

      {/* 지점 공지사항 관리 - 달력 형태 */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
        <AnnouncementCalendar
          announcements={announcements}
          currentCalendarMonth={currentCalendarMonth}
          setCurrentCalendarMonth={setCurrentCalendarMonth}
          onDateClick={(date, hasAnnouncements) => {
            setSelectedDate(date);
            if (hasAnnouncements) {
              setIsDateAnnouncementsModalOpen(true);
            }
          }}
          onAddClick={() => openAnnouncementModal()}
        />
      </div>

      {/* 지점 공지사항 등록/수정 모달 */}
      <AnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onOpenChange={setIsAnnouncementModalOpen}
        editingAnnouncement={editingAnnouncement}
        announcementForm={announcementForm}
        setAnnouncementForm={setAnnouncementForm}
        gyms={gyms}
        onSave={handleSaveAnnouncement}
        isLoading={isLoading}
      />

      {/* 선택한 날짜의 지점 공지사항 보기 모달 */}
      <DateAnnouncementsModal
        isOpen={isDateAnnouncementsModalOpen}
        onOpenChange={setIsDateAnnouncementsModalOpen}
        selectedDate={selectedDate}
        announcements={announcements}
        onToggleActive={handleToggleAnnouncementActive}
        onEdit={openAnnouncementModal}
        onDelete={handleDeleteAnnouncement}
      />
    </div>
  );
}
