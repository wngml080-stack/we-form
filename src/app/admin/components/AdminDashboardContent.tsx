"use client";

import dynamic from "next/dynamic";

// Custom Hook
import { useAdminDashboardData } from "../hooks/useAdminDashboardData";

// Components - 필수 컴포넌트만 정적 import
import { SystemAnnouncementBanner } from "./SystemAnnouncementBanner";
import { QuickActions } from "./QuickActions";
import { BannerWidget } from "./BannerWidget";

// Components - 지연 로드 가능한 컴포넌트 (로딩 후 표시)
const PTStatsCard = dynamic(() => import("./PTStatsCard").then(mod => ({ default: mod.PTStatsCard })), { ssr: false });
const BranchAnnouncementsCard = dynamic(() => import("./BranchAnnouncementsCard").then(mod => ({ default: mod.BranchAnnouncementsCard })), { ssr: false });
const TodaySchedulesCard = dynamic(() => import("./TodaySchedulesCard").then(mod => ({ default: mod.TodaySchedulesCard })), { ssr: false });
const CompanyEventsCalendar = dynamic(() => import("./CompanyEventsCalendar").then(mod => ({ default: mod.CompanyEventsCalendar })), { ssr: false });
const RecentLogsSection = dynamic(() => import("./RecentLogsSection").then(mod => ({ default: mod.RecentLogsSection })), { ssr: false });

// Modals - 동적 import (사용자 액션 시에만 로드)
const EventModal = dynamic(() => import("./modals/EventModal").then(mod => ({ default: mod.EventModal })), { ssr: false });
const SystemAnnouncementModal = dynamic(() => import("./modals/SystemAnnouncementModal").then(mod => ({ default: mod.SystemAnnouncementModal })), { ssr: false });
const BranchAnnouncementModal = dynamic(() => import("./modals/BranchAnnouncementModal").then(mod => ({ default: mod.BranchAnnouncementModal })), { ssr: false });

// 회원관리 모달 - 회원관리 페이지와 동일한 모달 사용
const NewMemberCreateModal = dynamic(() => import("../members/components/modals/NewMemberCreateModal").then(mod => ({ default: mod.NewMemberCreateModal })), { ssr: false });
const ExistingSalesModal = dynamic(() => import("../members/components/modals/ExistingSalesModal").then(mod => ({ default: mod.ExistingSalesModal })), { ssr: false });
const AddonSalesModal = dynamic(() => import("../members/components/modals/AddonSalesModal").then(mod => ({ default: mod.AddonSalesModal })), { ssr: false });

interface AdminDashboardContentProps {
  // 서버에서 미리 가져온 사용자 이름 (LCP 최적화)
  serverUserName?: string;
}

export function AdminDashboardContent({ serverUserName }: AdminDashboardContentProps) {
  const {
    // 사용자 정보
    userName: clientUserName, gymName,

    // 로딩 상태
    isLoading,

    // 통계 데이터
    stats, todaySchedules, announcements, companyEvents, systemAnnouncements, recentLogs, recentLogsSummary,

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

    // 스태프 목록
    staffList,

    // 회원 목록
    members,

    // 지점/회사 정보
    selectedGymId,
    selectedCompanyId,
    myStaffId,

    // 저장 상태
    isSaving,

    // 대시보드 새로고침
    refreshDashboard,

    // 유틸리티
    formatCurrency, getSalesForMonth, getMonthLabel, calculateStatistics, getStatusColor
  } = useAdminDashboardData();

  // 서버에서 가져온 이름 우선 사용 (LCP 최적화)
  const userName = serverUserName || clientUserName;

  // 데이터 로딩 중일 때는 인사말은 표시하되, 나머지 콘텐츠만 로딩
  const todayDate = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  });

  // 시간대별 인사말
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "좋은 아침입니다";
    if (hour >= 12 && hour < 17) return "즐거운 오후입니다";
    if (hour >= 17 && hour < 21) return "편안한 저녁입니다";
    return "좋은 밤입니다";
  };

  return (
    <div className="space-y-0">
      {/* 시스템 공지 배너 */}
      <SystemAnnouncementBanner
        announcements={systemAnnouncements}
        onBannerClick={() => setIsAnnouncementModalOpen(true)}
      />

      <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-6 lg:space-y-8">
        {/* Welcome Header - 항상 표시 (LCP 최적화) */}
        <div>
          <div className="text-sm font-medium text-gray-400 mb-1">{todayDate}</div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            {userName}님 {getGreeting()}. <span className="text-yellow-500">😊</span>
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            오늘도 <span className="text-[#2F80ED] font-bold">{gymName || "We:form"}</span>의 성장을 응원합니다!
          </p>
        </div>

        {/* 로딩 중일 때 나머지 콘텐츠만 스켈레톤 표시 */}
        {isLoading ? (
          <div className="space-y-6 lg:space-y-8">
            {/* Quick Actions Skeleton */}
            <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />

            {/* Banner Skeleton */}
            <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />

            {/* Bento Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <div className="space-y-4 sm:space-y-6">
                <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
                <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
              </div>
              <div className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
              <div className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            {/* Quick Actions */}
            <QuickActions
              onNewMemberClick={() => setIsNewMemberModalOpen(true)}
              onExistingMemberClick={() => setIsExistingMemberModalOpen(true)}
              onAddonClick={() => setIsAddonModalOpen(true)}
            />

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
            <RecentLogsSection logs={recentLogs} summary={recentLogsSummary} formatCurrency={formatCurrency} />
          </>
        )}
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

      {/* 회원관리 모달 - 회원관리 페이지와 동일 */}
      {selectedGymId && selectedCompanyId && (
        <>
          <NewMemberCreateModal
            isOpen={isNewMemberModalOpen}
            onClose={() => setIsNewMemberModalOpen(false)}
            products={products}
            staffList={staffList}
            gymId={selectedGymId}
            companyId={selectedCompanyId}
            myStaffId={myStaffId}
            onSuccess={() => {
              setIsNewMemberModalOpen(false);
              refreshDashboard();
            }}
          />

          <ExistingSalesModal
            isOpen={isExistingMemberModalOpen}
            onClose={() => setIsExistingMemberModalOpen(false)}
            members={members}
            gymId={selectedGymId}
            companyId={selectedCompanyId}
            products={products}
            myStaffId={myStaffId}
            onSuccess={() => {
              setIsExistingMemberModalOpen(false);
              refreshDashboard();
            }}
          />

          <AddonSalesModal
            isOpen={isAddonModalOpen}
            onClose={() => setIsAddonModalOpen(false)}
            members={members}
            gymId={selectedGymId}
            companyId={selectedCompanyId}
            onSuccess={() => {
              setIsAddonModalOpen(false);
              refreshDashboard();
            }}
          />
        </>
      )}
    </div>
  );
}
