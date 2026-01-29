"use client";

import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { useMeetingsData } from "./hooks/useMeetingsData";
import { MeetingsHeader } from "./components/MeetingsHeader";
import { MeetingsList } from "./components/MeetingsList";
import { MeetingStatsCards } from "./components/MeetingStatsCards";
import { CreateMeetingModal } from "./components/modals/CreateMeetingModal";
import { MeetingDetailModal } from "./components/modals/MeetingDetailModal";

export default function MeetingsPage() {
  const { selectedGymId, selectedCompanyId, isInitialized } = useAdminFilter();

  const {
    meetings,
    total,
    page,
    limit,
    selectedMeeting,
    isLoading,
    isDetailLoading,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    searchQuery,
    setSearchQuery,
    setPage,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isDetailModalOpen,
    setIsDetailModalOpen,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    updateMeetingStatus,
    addParticipants,
    addNote,
    addActionItem,
    updateActionItemStatus,
    openDetailModal,
    fetchMeetings: _fetchMeetings,
  } = useMeetingsData({
    selectedGymId,
    selectedCompanyId,
    filterInitialized: isInitialized,
  });

  return (
    <div className="p-3 xs:p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8 xs:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* 헤더 */}
      <MeetingsHeader
        onCreateClick={() => setIsCreateModalOpen(true)}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 통계 카드 */}
      <MeetingStatsCards meetings={meetings} />

      {/* 회의 목록 */}
      <MeetingsList
        meetings={meetings}
        isLoading={isLoading}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onMeetingClick={openDetailModal}
        onStatusChange={updateMeetingStatus}
      />

      {/* 회의 생성 모달 */}
      <CreateMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createMeeting}
        gymId={selectedGymId}
        companyId={selectedCompanyId}
      />

      {/* 회의 상세 모달 */}
      {selectedMeeting && (
        <MeetingDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          meeting={selectedMeeting}
          isLoading={isDetailLoading}
          onUpdate={updateMeeting}
          onDelete={deleteMeeting}
          onStatusChange={updateMeetingStatus}
          onAddParticipants={addParticipants}
          onAddNote={addNote}
          onAddActionItem={addActionItem}
          onUpdateActionItemStatus={updateActionItemStatus}
        />
      )}
    </div>
  );
}
