"use client";

import dynamic from "next/dynamic";

// Custom Hook
import { useAdminDashboardData } from "../hooks/useAdminDashboardData";

// Components - 지연 로드 가능한 컴포넌트 (로딩 후 표시)
const BranchAnnouncementsCard = dynamic(() => import("./BranchAnnouncementsCard").then(mod => ({ default: mod.BranchAnnouncementsCard })), { ssr: false });
const TodaySchedulesCard = dynamic(() => import("./TodaySchedulesCard").then(mod => ({ default: mod.TodaySchedulesCard })), { ssr: false });
const CompanyEventsCalendar = dynamic(() => import("./CompanyEventsCalendar").then(mod => ({ default: mod.CompanyEventsCalendar })), { ssr: false });
const AiCommandCenter = dynamic(() => import("./AiCommandCenter").then(mod => ({ default: mod.AiCommandCenter })), { ssr: false });
const SystemAnnouncementBanner = dynamic(() => import("./SystemAnnouncementBanner").then(mod => ({ default: mod.SystemAnnouncementBanner })), { ssr: false });
const QuickActions = dynamic(() => import("./QuickActions").then(mod => ({ default: mod.QuickActions })), { ssr: false });
const BannerWidget = dynamic(() => import("./BannerWidget").then(mod => ({ default: mod.BannerWidget })), { ssr: false });

// Modals - 동적 import (사용자 액션 시에만 로드)
const EventModal = dynamic(() => import("./modals/EventModal").then(mod => ({ default: mod.EventModal })), { ssr: false });
const SystemAnnouncementModal = dynamic(() => import("./modals/SystemAnnouncementModal").then(mod => ({ default: mod.SystemAnnouncementModal })), { ssr: false });
const BranchAnnouncementModal = dynamic(() => import("./modals/BranchAnnouncementModal").then(mod => ({ default: mod.BranchAnnouncementModal })), { ssr: false });

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
    todaySchedules, announcements, companyEvents, systemAnnouncements,

    // 달력
    currentMonth, setCurrentMonth, selectedDate, setSelectedDate,
    isEventModalOpen, setIsEventModalOpen,

    // 시스템 공지
    isAnnouncementModalOpen, setIsAnnouncementModalOpen,

    // 지점 공지
    selectedBranchAnnouncement, setSelectedBranchAnnouncement,
    isBranchAnnouncementModalOpen, setIsBranchAnnouncementModalOpen,

    // 지점/회사 정보 (AI 기능용)
    selectedGymId,

    // 유틸리티
    getStatusColor
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
    <div className="min-h-full bg-[var(--background)] animate-in fade-in duration-700">
      {/* 시스템 공지 배너 */}
      <SystemAnnouncementBanner
        announcements={systemAnnouncements}
        onBannerClick={() => setIsAnnouncementModalOpen(true)}
      />

      <div className="space-y-6 xs:space-y-8 lg:space-y-12 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
        {/* AI Command Center - 자연어 검색바 */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-250">
          <AiCommandCenter gymId={selectedGymId} />
        </div>

        {/* Welcome Header - Toss 스타일 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 xs:gap-6 md:gap-8">
          <div className="space-y-2 xs:space-y-3">
            <p className="text-xs xs:text-sm text-[var(--foreground-subtle)] font-bold uppercase tracking-[0.2em]">{todayDate}</p>
            <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--foreground)] tracking-tight leading-tight">
              {userName}님, <br className="sm:hidden" /> {getGreeting()} 👋
            </h1>
            <p className="text-sm xs:text-base text-[var(--foreground-muted)] font-medium">
              오늘도 <span className="text-[var(--primary-hex)] font-bold decoration-2 underline-offset-4">{gymName || "We:form"}</span>의 성공적인 운영을 위해 함께해요.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6 xs:space-y-8 lg:space-y-12">
            <div className="h-20 xs:h-24 sm:h-28 bg-[var(--background-secondary)] rounded-3xl animate-pulse" />
            <div className="h-32 xs:h-40 sm:h-48 bg-[var(--background-secondary)] rounded-3xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xs:gap-6 sm:gap-8 lg:gap-10">
              <div className="h-[320px] xs:h-[360px] sm:h-[440px] bg-[var(--background-secondary)] rounded-3xl animate-pulse" />
              <div className="h-[320px] xs:h-[360px] sm:h-[440px] bg-[var(--background-secondary)] rounded-3xl animate-pulse" />
              <div className="h-[320px] xs:h-[360px] sm:h-[440px] bg-[var(--background-secondary)] rounded-3xl animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="space-y-8 xs:space-y-10 lg:space-y-16">
            {/* Quick Actions */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <QuickActions />
            </div>

            {/* Banner Widget */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400">
              <BannerWidget />
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xs:gap-6 sm:gap-8 lg:gap-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
              {/* Left Column - 지점 공지 */}
              <div className="h-full">
                <BranchAnnouncementsCard
                  announcements={announcements}
                  onAnnouncementClick={(announcement) => {
                    setSelectedBranchAnnouncement(announcement);
                    setIsBranchAnnouncementModalOpen(true);
                  }}
                />
              </div>

              {/* Center Column - 오늘 스케줄 */}
              <div className="h-full">
                <TodaySchedulesCard
                  schedules={todaySchedules}
                  getStatusColor={getStatusColor}
                />
              </div>

              {/* Right Column - 회사 일정 */}
              <div className="h-full">
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
            </div>
          </div>
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
    </div>
  );
}
