"use client";

import { Users, DollarSign, Calendar, Target, Award, BarChart3 } from "lucide-react";
import { useBranchData } from "./hooks/useBranchData";
import { StatCard, BEPCard, QuickLinkCard } from "./components/StatCards";
import { AnnouncementCalendar } from "./components/AnnouncementCalendar";
import { AnnouncementModal } from "./components/modals/AnnouncementModal";
import { DateAnnouncementsModal } from "./components/modals/DateAnnouncementsModal";
import { FcSalesModal } from "./components/modals/FcSalesModal";
import { PtSalesModal } from "./components/modals/PtSalesModal";
import { TotalSalesModal } from "./components/modals/TotalSalesModal";

export default function BranchManagementPage() {
  const {
    // Auth & Filter
    gymName,
    gyms,

    // Loading states
    isLoading,
    salesLoading,

    // Stats
    stats,
    fcStats,
    ptStats,
    salesSummary,
    comparisonData,

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

    // Sales modals
    isFcModalOpen,
    setIsFcModalOpen,
    isPtModalOpen,
    setIsPtModalOpen,
    isSalesModalOpen,
    setIsSalesModalOpen,
    salesPeriod,
    customDateRange,
    setCustomDateRange,
    openFcModal,
    openPtModal,
    openSalesModal,
    handlePeriodChange,
    fetchDetailedSales,
  } = useBranchData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-4 sm:space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            지점 관리
          </h1>
          <p className="text-gray-500 mt-1 sm:mt-2 font-medium text-sm sm:text-base">
            <span className="text-[#2F80ED] font-bold">{gymName}</span> 지점의 운영 현황을 확인하세요
          </p>
        </div>
      </div>

      {/* 핵심 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          color="bg-green-500"
        />
        <StatCard
          icon={DollarSign}
          title="이번 달 매출"
          value={Math.round(stats.monthlyRevenue / 10000)}
          suffix="만원"
          color="bg-purple-500"
          onClick={openSalesModal}
        />
        <StatCard
          icon={Calendar}
          title="오늘"
          value={new Date().getDate()}
          suffix="일"
          color="bg-orange-500"
        />
      </div>

      {/* BEP 달성률 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BEPCard
          title="FC (회원권) BEP 달성률"
          progress={stats.fcProgress}
          target={Math.round(stats.fcBep / 10000)}
          icon={Target}
          onClick={openFcModal}
          helpText="BEP(손익분기점)는 이 금액 이상 매출이 나와야 손해를 보지 않는 기준입니다. FC는 회원권/부가상품 매출을 의미합니다."
        />
        <BEPCard
          title="PT BEP 달성률"
          progress={stats.ptProgress}
          target={Math.round(stats.ptBep / 10000)}
          icon={Award}
          onClick={openPtModal}
          helpText="PT(Personal Training) 매출의 손익분기점 달성률입니다. 100% 이상이면 목표 달성입니다."
        />
      </div>

      {/* 빠른 링크 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#2F80ED]" />
          지점 운영 관리
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickLinkCard
            title="매출 관리"
            description="매출 현황 및 분석"
            href="/admin/sales"
            icon={DollarSign}
            color="text-green-600 bg-green-50"
          />
          <QuickLinkCard
            title="급여 관리"
            description="직원 급여 계산 및 관리"
            href="/admin/salary"
            icon={DollarSign}
            color="text-blue-600 bg-blue-50"
          />
          <QuickLinkCard
            title="스케줄 승인"
            description="제출된 스케줄 검토"
            href="/admin/reports"
            icon={Calendar}
            color="text-purple-600 bg-purple-50"
          />
        </div>
      </div>

      {/* 지점 공지사항 관리 - 달력 형태 */}
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

      {/* FC 매출 통계 모달 */}
      <FcSalesModal
        isOpen={isFcModalOpen}
        onOpenChange={setIsFcModalOpen}
        salesPeriod={salesPeriod}
        onPeriodChange={handlePeriodChange}
        customDateRange={customDateRange}
        setCustomDateRange={setCustomDateRange}
        onCustomSearch={() => fetchDetailedSales("fc", "custom")}
        fcStats={fcStats}
        isLoading={salesLoading}
      />

      {/* PT 매출 통계 모달 */}
      <PtSalesModal
        isOpen={isPtModalOpen}
        onOpenChange={setIsPtModalOpen}
        salesPeriod={salesPeriod}
        onPeriodChange={handlePeriodChange}
        customDateRange={customDateRange}
        setCustomDateRange={setCustomDateRange}
        onCustomSearch={() => fetchDetailedSales("pt", "custom")}
        ptStats={ptStats}
        isLoading={salesLoading}
      />

      {/* 총 매출 통계 모달 */}
      <TotalSalesModal
        isOpen={isSalesModalOpen}
        onOpenChange={setIsSalesModalOpen}
        salesPeriod={salesPeriod}
        onPeriodChange={handlePeriodChange}
        customDateRange={customDateRange}
        setCustomDateRange={setCustomDateRange}
        onCustomSearch={() => fetchDetailedSales("all", "custom")}
        fcStats={fcStats}
        ptStats={ptStats}
        salesSummary={salesSummary}
        comparisonData={comparisonData}
        isLoading={salesLoading}
      />
    </div>
  );
}
