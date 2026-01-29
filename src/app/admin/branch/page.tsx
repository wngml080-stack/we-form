"use client";

import { use } from "react";
import dynamicImport from "next/dynamic";
import { Users, DollarSign, BarChart3, Building, MessageSquare, Plus } from "lucide-react";
import { useBranchData } from "./hooks/useBranchData";
import { QuickLinkCard } from "./components/StatCards";
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
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-hex)]"></div>
      </div>
    );
  }

  return (
    <div className="p-2 xs:p-3 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-4 xs:space-y-6 lg:space-y-10 animate-in fade-in duration-700">
      {/* 헤더 - Toss 스타일 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 xs:gap-4 lg:gap-6">
        <div className="space-y-1">
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tighter flex items-center gap-2 xs:gap-3">
            <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 bg-[var(--primary-hex)] rounded-xl xs:rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(49,130,246,0.25)]">
              <Building className="w-4 h-4 xs:w-5 xs:h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            지점 운영 현황
          </h1>
          <p className="text-xs xs:text-sm text-[var(--foreground-muted)] font-bold ml-10 xs:ml-13 sm:ml-15">
            <span className="text-[var(--primary-hex)]">{gymName}</span> 지점의 통합 데이터를 분석합니다.
          </p>
        </div>
      </div>

      {/* 빠른 링크 - Toss 스타일 */}
      <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-3 xs:p-4 sm:p-6 lg:p-10 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#E5E8EB] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow duration-200">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between mb-4 xs:mb-6 sm:mb-8 gap-2">
          <div className="space-y-1">
            <h3 className="text-base xs:text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 xs:gap-3">
              <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-lg xs:rounded-xl flex items-center justify-center">
                <BarChart3 className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              지점 운영 서비스
            </h3>
            <p className="text-[10px] xs:text-xs sm:text-sm text-slate-400 font-bold ml-9 xs:ml-11 sm:ml-13">주요 관리 페이지로 빠르게 이동할 수 있습니다.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-6">
          <QuickLinkCard
            title="매출 통합 관리"
            description="실시간 매출 현황 분석"
            href="/admin/sales?tab=sales"
            icon={DollarSign}
            color="text-emerald-600 bg-emerald-50 border-emerald-100"
          />
          <QuickLinkCard
            title="지출 내역 관리"
            description="운영 지출 및 항목 분석"
            href="/admin/sales?tab=expenses"
            icon={DollarSign}
            color="text-rose-600 bg-rose-50 border-rose-100"
          />
          <QuickLinkCard
            title="신규 관리"
            description="채널별 문의 및 자동 응답"
            href="/admin/sales?tab=new_inquiries"
            icon={MessageSquare}
            color="text-indigo-600 bg-indigo-50 border-indigo-100"
          />
          <QuickLinkCard
            title="리뉴 관리"
            description="재등록 대상자 집중 관리"
            href="/admin/sales?tab=renewals"
            icon={Plus}
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
            color="text-slate-600 bg-slate-50 border-slate-100"
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
