"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  MeetingListItem,
  MeetingDetail,
  MeetingCreateInput,
  MeetingUpdateInput,
  MeetingStatus,
  MeetingType,
} from "@/types/meeting";

interface UseMeetingsDataProps {
  selectedGymId: string | null;
  selectedCompanyId: string | null;
  filterInitialized: boolean;
}

export function useMeetingsData({
  selectedGymId,
  selectedCompanyId,
  filterInitialized,
}: UseMeetingsDataProps) {
  // 목록 데이터
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // 상세 데이터
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingDetail | null>(null);

  // 상태
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // 필터 상태
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<MeetingType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);

  // 모달 상태
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 회의 목록 조회
  const fetchMeetings = useCallback(async () => {
    if (!filterInitialized) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      if (selectedGymId) {
        params.append("gym_id", selectedGymId);
      }

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (typeFilter !== "all") {
        params.append("meeting_type", typeFilter);
      }

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      if (dateFrom) {
        params.append("date_from", dateFrom);
      }

      if (dateTo) {
        params.append("date_to", dateTo);
      }

      const response = await fetch(`/api/admin/meetings?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setMeetings(data.meetings || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch meetings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filterInitialized, selectedGymId, statusFilter, typeFilter, searchQuery, dateFrom, dateTo, page, limit]);

  // 회의 상세 조회
  const fetchMeetingDetail = useCallback(async (meetingId: string) => {
    setIsDetailLoading(true);
    try {
      const response = await fetch(`/api/admin/meetings/${meetingId}`);
      const data = await response.json();

      if (response.ok) {
        setSelectedMeeting(data.meeting);
        return data.meeting;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch meeting detail:", error);
      return null;
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  // 회의 생성
  const createMeeting = async (input: MeetingCreateInput) => {
    try {
      const response = await fetch("/api/admin/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          company_id: selectedCompanyId,
          gym_id: input.gym_id || selectedGymId,
        }),
      });

      if (response.ok) {
        await fetchMeetings();
        setIsCreateModalOpen(false);
        return true;
      }
      const error = await response.json();
      console.error("Failed to create meeting:", error);
      return false;
    } catch (error) {
      console.error("Failed to create meeting:", error);
      return false;
    }
  };

  // 회의 수정
  const updateMeeting = async (meetingId: string, input: MeetingUpdateInput) => {
    try {
      const response = await fetch(`/api/admin/meetings/${meetingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (response.ok) {
        await fetchMeetings();
        if (selectedMeeting?.id === meetingId) {
          await fetchMeetingDetail(meetingId);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to update meeting:", error);
      return false;
    }
  };

  // 회의 삭제
  const deleteMeeting = async (meetingId: string) => {
    try {
      const response = await fetch(`/api/admin/meetings/${meetingId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchMeetings();
        setIsDetailModalOpen(false);
        setSelectedMeeting(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to delete meeting:", error);
      return false;
    }
  };

  // 회의 상태 변경
  const updateMeetingStatus = async (meetingId: string, status: MeetingStatus) => {
    const updateData: MeetingUpdateInput = { status };

    if (status === "in_progress") {
      updateData.started_at = new Date().toISOString();
    } else if (status === "completed") {
      updateData.ended_at = new Date().toISOString();
    }

    return updateMeeting(meetingId, updateData);
  };

  // 참석자 추가
  const addParticipants = async (meetingId: string, staffIds: string[]) => {
    try {
      const response = await fetch(`/api/admin/meetings/${meetingId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_ids: staffIds }),
      });

      if (response.ok) {
        if (selectedMeeting?.id === meetingId) {
          await fetchMeetingDetail(meetingId);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to add participants:", error);
      return false;
    }
  };

  // 회의록 추가
  const addNote = async (meetingId: string, content: string) => {
    try {
      const response = await fetch(`/api/admin/meetings/${meetingId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        if (selectedMeeting?.id === meetingId) {
          await fetchMeetingDetail(meetingId);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to add note:", error);
      return false;
    }
  };

  // 액션 아이템 추가
  const addActionItem = async (
    meetingId: string,
    data: { title: string; assignee_id?: string; due_date?: string; priority?: string }
  ) => {
    try {
      const response = await fetch(`/api/admin/meetings/${meetingId}/action-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        if (selectedMeeting?.id === meetingId) {
          await fetchMeetingDetail(meetingId);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to add action item:", error);
      return false;
    }
  };

  // 액션 아이템 상태 변경
  const updateActionItemStatus = async (
    meetingId: string,
    actionItemId: string,
    status: string
  ) => {
    try {
      const response = await fetch(`/api/admin/meetings/${meetingId}/action-items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_item_id: actionItemId, status }),
      });

      if (response.ok) {
        if (selectedMeeting?.id === meetingId) {
          await fetchMeetingDetail(meetingId);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to update action item:", error);
      return false;
    }
  };

  // 상세 모달 열기
  const openDetailModal = async (meetingId: string) => {
    await fetchMeetingDetail(meetingId);
    setIsDetailModalOpen(true);
  };

  // 데이터 로드
  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  // 필터 변경 시 페이지 리셋
  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, searchQuery, dateFrom, dateTo]);

  return {
    // 데이터
    meetings,
    total,
    page,
    limit,
    selectedMeeting,

    // 상태
    isLoading,
    isDetailLoading,

    // 필터
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    searchQuery,
    setSearchQuery,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,

    // 페이지네이션
    setPage,

    // 모달
    isCreateModalOpen,
    setIsCreateModalOpen,
    isDetailModalOpen,
    setIsDetailModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,

    // 액션
    fetchMeetings,
    fetchMeetingDetail,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    updateMeetingStatus,
    addParticipants,
    addNote,
    addActionItem,
    updateActionItemStatus,
    openDetailModal,
    setSelectedMeeting,
  };
}
