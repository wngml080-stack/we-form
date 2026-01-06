"use client";

import dynamic from "next/dynamic";

// Custom Hook
import { useAdminDashboardData } from "../hooks/useAdminDashboardData";

// Components - 지연 로드 가능한 컴포넌트 (로딩 후 표시)
const BranchAnnouncementsCard = dynamic(() => import("./BranchAnnouncementsCard").then(mod => ({ default: mod.BranchAnnouncementsCard })), { ssr: false });
const TodaySchedulesCard = dynamic(() => import("./TodaySchedulesCard").then(mod => ({ default: mod.TodaySchedulesCard })), { ssr: false });
const CompanyEventsCalendar = dynamic(() => import("./CompanyEventsCalendar").then(mod => ({ default: mod.CompanyEventsCalendar })), { ssr: false });
const AiInsightsWidget = dynamic(() => import("./AiInsightsWidget").then(mod => ({ default: mod.AiInsightsWidget })), { ssr: false });
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

    // 유틸리티
    getStatusColor
  } = useAdminDashboardData();

  const stats = {
    // 필요한 경우 stats 객체 구성
  };

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
    <div className="min-h-full bg-[#f8fafc] animate-in fade-in duration-700">
      {/* 시스템 공지 배너 */}
      <SystemAnnouncementBanner
        announcements={systemAnnouncements}
        onBannerClick={() => setIsAnnouncementModalOpen(true)}
      />

      <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-8 lg:space-y-10">
        {/* AI Command Center - 자연어 검색바 */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-250">
          <AiCommandCenter />
        </div>

        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <p className="text-slate-500 font-medium">{todayDate}</p>
            <h1 className="text-3xl font-bold text-slate-900">
              {userName}님, {getGreeting()} 👋
            </h1>
            <p className="text-slate-500">
              오늘도 <span className="text-primary font-semibold">{gymName || "We:form"}</span>의 성공적인 운영을 위해 힘내세요!
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-center border-r border-gray-100 pr-4">
              <p className="text-xs text-slate-500 mb-1">오늘의 수업</p>
              <p className="text-xl font-bold text-slate-900">{todaySchedules.length}건</p>
            </div>
            <div className="text-center pl-4">
              <p className="text-xs text-slate-500 mb-1">공지사항</p>
              <p className="text-xl font-bold text-slate-900">{announcements.length}건</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-8">
            <div className="h-24 bg-gray-100 rounded-[32px] animate-pulse" />
            <div className="h-40 bg-gray-100 rounded-[32px] animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              <div className="h-[400px] bg-gray-100 rounded-[32px] animate-pulse" />
              <div className="h-[400px] bg-gray-100 rounded-[32px] animate-pulse" />
              <div className="h-[400px] bg-gray-100 rounded-[32px] animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="space-y-8 lg:space-y-10">
            {/* Quick Actions */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <QuickActions />
            </div>

            {/* Banner Widget */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400">
              <BannerWidget />
            </div>

            {/* AI Insights Widget */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-450">
              <AiInsightsWidget stats={stats} gymName={gymName} />
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
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
