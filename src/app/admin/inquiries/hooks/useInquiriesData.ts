"use client";

import { useState, useEffect, useCallback } from "react";

interface Inquiry {
  id: string;
  gym_id: string;
  company_id: string;
  channel: string;
  channel_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  inquiry_type: string;
  subject?: string;
  content?: string;
  status: string;
  priority: string;
  assigned_staff_id?: string;
  assigned_staff?: { id: string; name: string } | null;
  ai_responded: boolean;
  ai_response_content?: string;
  notes?: string;
  tags?: string[];
  reservation?: {
    id: string;
    scheduled_date: string;
    scheduled_time: string;
    status: string;
  } | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

interface InquiryStats {
  today: number;
  week: number;
  month: number;
  pending: number;
  conversionRate: number;
}

interface Reservation {
  id: string;
  gym_id: string;
  company_id: string;
  inquiry_id?: string;
  member_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  reservation_type: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  staff_id?: string;
  staff?: { id: string; name: string } | null;
  status: string;
  notes?: string;
  staff_memo?: string;
  google_calendar_event_id?: string;
  created_at: string;
}

interface UseInquiriesDataProps {
  selectedGymId: string | null;
  selectedCompanyId: string | null;
  filterInitialized: boolean;
}

export function useInquiriesData({
  selectedGymId,
  selectedCompanyId,
  filterInitialized,
}: UseInquiriesDataProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<InquiryStats>({
    today: 0,
    week: 0,
    month: 0,
    pending: 0,
    conversionRate: 0,
  });
  const [byChannel, setByChannel] = useState<Record<string, number>>({});
  const [byStatus, setByStatus] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  // 필터 상태
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 모달 상태
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // 문의 목록 조회
  const fetchInquiries = useCallback(async () => {
    if (!selectedGymId || !filterInitialized) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        gym_id: selectedGymId,
      });

      if (selectedCompanyId) {
        params.append("company_id", selectedCompanyId);
      }

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (channelFilter !== "all") {
        params.append("channel", channelFilter);
      }

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/admin/inquiries?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setInquiries(data.inquiries || []);
      }
    } catch (error) {
      console.error("Failed to fetch inquiries:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedGymId, selectedCompanyId, filterInitialized, statusFilter, channelFilter, searchQuery]);

  // 통계 조회
  const fetchStats = useCallback(async () => {
    if (!selectedGymId || !filterInitialized) return;

    try {
      const response = await fetch(`/api/admin/inquiries/stats?gym_id=${selectedGymId}`);
      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
        setByChannel(data.byChannel || {});
        setByStatus(data.byStatus || {});
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, [selectedGymId, filterInitialized]);

  // 예약 목록 조회
  const fetchReservations = useCallback(async () => {
    if (!selectedGymId || !filterInitialized) return;

    try {
      const today = new Date();
      const startDate = today.toISOString().split("T")[0];
      const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const params = new URLSearchParams({
        gym_id: selectedGymId,
        start_date: startDate,
        end_date: endDate,
      });

      const response = await fetch(`/api/admin/reservations?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setReservations(data.reservations || []);
      }
    } catch (error) {
      console.error("Failed to fetch reservations:", error);
    }
  }, [selectedGymId, filterInitialized]);

  // 문의 생성
  const createInquiry = async (inquiryData: Partial<Inquiry>) => {
    try {
      const response = await fetch("/api/admin/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...inquiryData,
          gym_id: selectedGymId,
          company_id: selectedCompanyId,
        }),
      });

      if (response.ok) {
        await fetchInquiries();
        await fetchStats();
        setIsCreateModalOpen(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to create inquiry:", error);
      return false;
    }
  };

  // 문의 수정
  const updateInquiry = async (id: string, updateData: Partial<Inquiry>) => {
    try {
      const response = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        await fetchInquiries();
        await fetchStats();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to update inquiry:", error);
      return false;
    }
  };

  // 문의 삭제
  const deleteInquiry = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/inquiries/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchInquiries();
        await fetchStats();
        setIsDetailModalOpen(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to delete inquiry:", error);
      return false;
    }
  };

  // 예약 생성
  const createReservation = async (reservationData: Partial<Reservation>) => {
    try {
      const response = await fetch("/api/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reservationData,
          gym_id: selectedGymId,
          company_id: selectedCompanyId,
        }),
      });

      if (response.ok) {
        await fetchReservations();
        setIsReservationModalOpen(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to create reservation:", error);
      return false;
    }
  };

  // 예약 수정
  const updateReservation = async (id: string, updateData: Partial<Reservation>) => {
    try {
      const response = await fetch(`/api/admin/reservations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        await fetchReservations();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to update reservation:", error);
      return false;
    }
  };

  // 예약 삭제
  const deleteReservation = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/reservations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchReservations();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to delete reservation:", error);
      return false;
    }
  };

  // 문의 상세 모달 열기
  const openDetailModal = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setIsDetailModalOpen(true);
  };

  // 예약 모달 열기 (문의에서)
  const openReservationFromInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setSelectedReservation(null);
    setIsReservationModalOpen(true);
  };

  // 데이터 로드
  useEffect(() => {
    fetchInquiries();
    fetchStats();
    fetchReservations();
  }, [fetchInquiries, fetchStats, fetchReservations]);

  return {
    // 데이터
    inquiries,
    reservations,
    stats,
    byChannel,
    byStatus,
    isLoading,

    // 필터
    statusFilter,
    setStatusFilter,
    channelFilter,
    setChannelFilter,
    searchQuery,
    setSearchQuery,

    // 모달 상태
    isCreateModalOpen,
    setIsCreateModalOpen,
    isDetailModalOpen,
    setIsDetailModalOpen,
    isReservationModalOpen,
    setIsReservationModalOpen,
    selectedInquiry,
    setSelectedInquiry,
    selectedReservation,
    setSelectedReservation,

    // 액션
    createInquiry,
    updateInquiry,
    deleteInquiry,
    createReservation,
    updateReservation,
    deleteReservation,
    openDetailModal,
    openReservationFromInquiry,
    refetch: fetchInquiries,
  };
}
