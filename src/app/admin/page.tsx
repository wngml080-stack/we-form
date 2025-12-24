"use client";

// Custom Hook
import { useAdminDashboardData } from "./hooks/useAdminDashboardData";

// Components
import { SystemAnnouncementBanner } from "./components/SystemAnnouncementBanner";
import { QuickActions } from "./components/QuickActions";
import { BannerWidget } from "./components/BannerWidget";
import { PTStatsCard } from "./components/PTStatsCard";
import { BranchAnnouncementsCard } from "./components/BranchAnnouncementsCard";
import { TodaySchedulesCard } from "./components/TodaySchedulesCard";
import { CompanyEventsCalendar } from "./components/CompanyEventsCalendar";
import { RecentLogsSection } from "./components/RecentLogsSection";

// Modals
import { EventModal } from "./components/modals/EventModal";
import { SystemAnnouncementModal } from "./components/modals/SystemAnnouncementModal";
import { BranchAnnouncementModal } from "./components/modals/BranchAnnouncementModal";
import { NewMemberModal } from "./components/modals/NewMemberModal";
import { ExistingMemberModal } from "./components/modals/ExistingMemberModal";
import { AddonModal } from "./components/modals/AddonModal";

export default function AdminDashboardPage() {
  const {
    // 사용자 정보
    userName, gymName,

    // 로딩 상태
    isLoading,

    // 통계 데이터
    stats, todaySchedules, announcements, companyEvents, systemAnnouncements, recentLogs,

    // 달력
    currentMonth, setCurrentMonth, selectedDate, setSelectedDate,
    isEventModalOpen, setIsEventModalOpen,

    // 시스템 공지
    isAnnouncementModalOpen, setIsAnnouncementModalOpen,

    // 센터 현황
    centerStatsMonthOffset, setCenterStatsMonthOffset, statsViewMode, setStatsViewMode,

    // 지점 공지
    selectedBranchAnnouncement, setSelectedBranchAnnouncement,
    isBranchAnnouncementModalOpen, setIsBranchAnnouncementModalOpen,

    // 신규회원 등록
    isNewMemberModalOpen, setIsNewMemberModalOpen,
    newMemberForm, setNewMemberForm,
    handleNewMemberRegistration,

    // 기존회원 등록
    isExistingMemberModalOpen, setIsExistingMemberModalOpen,
    existingMemberForm, setExistingMemberForm,
    memberSearchResults, setMemberSearchResults,
    memberSearchQuery, setMemberSearchQuery,
    searchMembers, handleExistingMemberRegistration,

    // 부가상품 등록
    isAddonModalOpen, setIsAddonModalOpen,
    addonForm, setAddonForm,
    handleAddonRegistration,

    // 상품
    products,

    // 저장 상태
    isSaving,

    // 유틸리티
    formatCurrency, getSalesForMonth, getMonthLabel, calculateStatistics, getStatusColor
  } = useAdminDashboardData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-[#2F80ED] rounded-full animate-spin"></div>
      </div>
    );
  }

  const todayDate = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  });

  return (
    <div className="space-y-0">
      {/* 시스템 공지 배너 */}
      <SystemAnnouncementBanner
        announcements={systemAnnouncements}
        onBannerClick={() => setIsAnnouncementModalOpen(true)}
      />

      <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-6 lg:space-y-8">
        {/* Welcome Header */}
        <div>
          <div className="text-sm font-medium text-gray-400 mb-1">{todayDate}</div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            {userName}님 즐거운 오후입니다. <span className="text-yellow-500">😊</span>
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            오늘도 <span className="text-[#2F80ED] font-bold">{gymName}</span>의 성장을 응원합니다!
          </p>
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Banner Widget */}
        <BannerWidget />

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column */}
          <div className="space-y-4 sm:space-y-6">
            <PTStatsCard
              stats={stats}
              statsViewMode={statsViewMode}
              setStatsViewMode={setStatsViewMode}
              centerStatsMonthOffset={centerStatsMonthOffset}
              setCenterStatsMonthOffset={setCenterStatsMonthOffset}
              getSalesForMonth={getSalesForMonth}
              getMonthLabel={getMonthLabel}
              calculateStatistics={calculateStatistics}
              formatCurrency={formatCurrency}
            />

            <BranchAnnouncementsCard
              announcements={announcements}
              onAnnouncementClick={(announcement) => {
                setSelectedBranchAnnouncement(announcement);
                setIsBranchAnnouncementModalOpen(true);
              }}
            />
          </div>

          {/* Center Column */}
          <TodaySchedulesCard
            schedules={todaySchedules}
            getStatusColor={getStatusColor}
          />

          {/* Right Column */}
          <CompanyEventsCalendar
            companyEvents={companyEvents}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            onDateClick={(date, events) => {
              setSelectedDate(date);
              if (events.length > 0) {
                setIsEventModalOpen(true);
              }
            }}
          />
        </div>

        {/* Recent Logs */}
        <RecentLogsSection logs={recentLogs} formatCurrency={formatCurrency} />
      </div>

      {/* Modals */}
      <EventModal
        isOpen={isEventModalOpen}
        onOpenChange={setIsEventModalOpen}
        selectedDate={selectedDate}
        companyEvents={companyEvents}
      />

      <SystemAnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onOpenChange={setIsAnnouncementModalOpen}
        announcements={systemAnnouncements}
      />

      <BranchAnnouncementModal
        isOpen={isBranchAnnouncementModalOpen}
        onOpenChange={setIsBranchAnnouncementModalOpen}
        announcement={selectedBranchAnnouncement}
      />

      <NewMemberModal
        isOpen={isNewMemberModalOpen}
        onOpenChange={setIsNewMemberModalOpen}
        form={newMemberForm}
        setForm={setNewMemberForm}
        products={products}
        onSubmit={handleNewMemberRegistration}
        isSaving={isSaving}
      />

      <ExistingMemberModal
        isOpen={isExistingMemberModalOpen}
        onOpenChange={setIsExistingMemberModalOpen}
        form={existingMemberForm}
        setForm={setExistingMemberForm}
        products={products}
        memberSearchQuery={memberSearchQuery}
        setMemberSearchQuery={setMemberSearchQuery}
        memberSearchResults={memberSearchResults}
        setMemberSearchResults={setMemberSearchResults}
        searchMembers={searchMembers}
        onSubmit={handleExistingMemberRegistration}
        isSaving={isSaving}
      />

      <AddonModal
        isOpen={isAddonModalOpen}
        onOpenChange={setIsAddonModalOpen}
        form={addonForm}
        setForm={setAddonForm}
        onSubmit={handleAddonRegistration}
        isSaving={isSaving}
      />
    </div>
  );
}
