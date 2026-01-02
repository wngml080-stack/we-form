"use client";

import dynamic from "next/dynamic";

// Custom Hook
import { useAdminDashboardData } from "../hooks/useAdminDashboardData";

// Components - 필수 컴포넌트만 정적 import
import { SystemAnnouncementBanner } from "./SystemAnnouncementBanner";
import { QuickActions } from "./QuickActions";
import { BannerWidget } from "./BannerWidget";

// Components - 지연 로드 가능한 컴포넌트 (로딩 후 표시)
const BranchAnnouncementsCard = dynamic(() => import("./BranchAnnouncementsCard").then(mod => ({ default: mod.BranchAnnouncementsCard })), { ssr: false });
const TodaySchedulesCard = dynamic(() => import("./TodaySchedulesCard").then(mod => ({ default: mod.TodaySchedulesCard })), { ssr: false });
const CompanyEventsCalendar = dynamic(() => import("./CompanyEventsCalendar").then(mod => ({ default: mod.CompanyEventsCalendar })), { ssr: false });

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
        {/* Welcome Header - 더 감각적인 디자인 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-[0.2em] animate-in slide-in-from-left duration-700">
              <span className="w-8 h-[2px] bg-blue-600"></span>
              {todayDate}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter animate-in slide-in-from-left duration-700 delay-100">
              {userName}님, {getGreeting()} <span className="inline-block animate-bounce ml-1">👋</span>
            </h1>
            <p className="text-slate-500 font-bold text-lg flex items-center gap-2 animate-in slide-in-from-left duration-700 delay-200">
              오늘도 <span className="text-[#2F80ED] border-b-2 border-blue-100 px-1">{gymName || "We:form"}</span>의 성공적인 운영을 위해 힘내세요!
            </p>
          </div>
          
          <div className="hidden lg:flex items-center gap-4 bg-white p-2 rounded-[24px] shadow-sm border border-gray-100 animate-in slide-in-from-right duration-700">
            <div className="px-4 py-2 text-center border-r border-gray-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">오늘의 수업</p>
              <p className="text-xl font-black text-slate-900">{todaySchedules.length}건</p>
            </div>
            <div className="px-4 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">공지사항</p>
              <p className="text-xl font-black text-slate-900">{announcements.length}건</p>
            </div>
          </div>
        </div>

        {/* 로딩 중일 때 나머지 콘텐츠만 스켈레톤 표시 */}
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

            {/* Grid Layout - 입체감 있는 3단 구성 */}
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
