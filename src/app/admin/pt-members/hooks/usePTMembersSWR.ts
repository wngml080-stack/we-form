"use client";

import { useMemo, useState, useCallback } from "react";
import { useSWR, fetcher, buildUrl, swrDataConfig } from "@/lib/swr";
import { useAuth } from "@/contexts/AuthContext";
import { createSupabaseClient } from "@/lib/supabase/client";

// 타입 정의
export interface PTMember {
  id: string;
  payment_id: string;
  member_name: string;
  phone?: string;
  membership_category: string;
  membership_name: string;
  sale_type: string;
  amount: number;
  trainer_id: string;
  trainer_name: string;
  remaining_sessions?: number;
  total_sessions?: number;
  service_sessions?: number;
  used_service_sessions?: number;
  status: string;
  created_at: string;
  memo?: string;
  registration_type?: string;
}

interface Staff {
  id: string;
  name: string;
  role: string;
}

interface PTMembersStats {
  totalMembers: number;
  ptCount: number;
  otCount: number;
  totalRevenue: number;
  totalSessions: number;
  remainingSessions: number;
  avgSessionsRemaining: number;
}

interface PTMembersResponse {
  success: boolean;
  members: PTMember[];
  staffList: Staff[];
  membersByTrainer: Record<string, PTMember[]>;
  stats: PTMembersStats;
}

export interface MemberTrainer {
  id: string;
  category: string;
  trainer_id: string;
  assigned_at: string;
  is_primary: boolean;
  status: string;
  trainer?: { id: string; name: string };
}

interface UsePTMembersSWRProps {
  selectedGymId: string | null;
  selectedCompanyId: string | null;
  filterInitialized: boolean;
}

type MemberCategory = "all" | "pt" | "ot" | "reregistration";
type PeriodType = "current" | "previous" | "custom";

interface PeriodFilter {
  type: PeriodType;
  year: number;
  month: number;
}

export function usePTMembersSWR({
  selectedGymId,
  selectedCompanyId,
  filterInitialized
}: UsePTMembersSWRProps) {
  const { user } = useAuth();
  const userRole = user?.role || "";
  const currentStaffId = user?.id || "";
  const supabase = useMemo(() => createSupabaseClient(), []);

  // 기간 필터
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(() => {
    const now = new Date();
    return { type: "current", year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  // 날짜 범위 계산
  const dateRange = useMemo(() => {
    const { type, year, month } = periodFilter;
    let targetYear = year;
    let targetMonth = month;

    if (type === "previous") {
      if (month === 1) {
        targetYear = year - 1;
        targetMonth = 12;
      } else {
        targetMonth = month - 1;
      }
    }

    const start = `${targetYear}-${String(targetMonth).padStart(2, "0")}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const end = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${lastDay}`;

    return { start, end };
  }, [periodFilter]);

  // staff 역할인 경우 본인 ID로 필터링
  const trainerId = userRole === "staff" ? currentStaffId : null;

  // API URL 생성
  const url = useMemo(() => {
    if (!selectedGymId || !selectedCompanyId || !filterInitialized) return null;

    return buildUrl("/api/admin/pt-members", {
      gym_id: selectedGymId,
      company_id: selectedCompanyId,
      start_date: dateRange.start,
      end_date: dateRange.end,
      trainer_id: trainerId
    });
  }, [selectedGymId, selectedCompanyId, dateRange, trainerId, filterInitialized]);

  // SWR로 데이터 조회
  const { data, error, isLoading, mutate } = useSWR<PTMembersResponse>(
    url,
    fetcher,
    swrDataConfig
  );

  // 필터 상태
  const [trainerFilter, setTrainerFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [memberCategory, setMemberCategory] = useState<MemberCategory>("all");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // 회원 상세 모달 상태
  const [isMemberDetailOpen, setIsMemberDetailOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<PTMember | null>(null);
  const [memberPaymentHistory, setMemberPaymentHistory] = useState<unknown[]>([]);
  const [memberAllMemberships, setMemberAllMemberships] = useState<unknown[]>([]);
  const [memberActivityLogs, setMemberActivityLogs] = useState<unknown[]>([]);
  const [memberTrainers, setMemberTrainers] = useState<MemberTrainer[]>([]);

  // 트레이너 모달 상태
  const [isTrainerAssignOpen, setIsTrainerAssignOpen] = useState(false);
  const [isTrainerTransferOpen, setIsTrainerTransferOpen] = useState(false);
  const [trainerTransferTarget, setTrainerTransferTarget] = useState<MemberTrainer | null>(null);
  const [trainerTransferCategory, setTrainerTransferCategory] = useState<string>("");
  const [isPtTransfer, setIsPtTransfer] = useState(false);

  // 필터링된 멤버 목록
  const filteredMembers = useMemo(() => {
    let members = data?.members || [];

    // 트레이너 필터
    if (trainerFilter !== "all") {
      members = members.filter(m => m.trainer_id === trainerFilter);
    }

    // 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      members = members.filter(m =>
        m.member_name.toLowerCase().includes(query) ||
        (m.phone && m.phone.includes(query))
      );
    }

    // 카테고리 필터
    const PT_CATEGORIES = ["PT", "Personal", "개인"];
    if (memberCategory === "pt") {
      members = members.filter(m =>
        PT_CATEGORIES.some(pt => m.membership_category.toLowerCase().includes(pt.toLowerCase()))
      );
    } else if (memberCategory === "ot") {
      members = members.filter(m =>
        !PT_CATEGORIES.some(pt => m.membership_category.toLowerCase().includes(pt.toLowerCase()))
      );
    } else if (memberCategory === "reregistration") {
      members = members.filter(m => {
        if (!m.total_sessions || m.total_sessions === 0) return false;
        const remainingPercent = ((m.remaining_sessions || 0) / m.total_sessions) * 100;
        return remainingPercent <= 70;
      });
    }

    return members;
  }, [data?.members, trainerFilter, searchQuery, memberCategory]);

  // 확장된 통계
  const extendedStats = useMemo(() => {
    const baseStats = data?.stats || {
      totalMembers: 0, ptCount: 0, otCount: 0,
      totalRevenue: 0, totalSessions: 0, remainingSessions: 0, avgSessionsRemaining: 0
    };

    const reregistrationCount = (data?.members || []).filter(m => {
      if (!m.total_sessions || m.total_sessions === 0) return false;
      return ((m.remaining_sessions || 0) / m.total_sessions) * 100 <= 70;
    }).length;

    return {
      totalMembers: baseStats.totalMembers,
      activeMembers: baseStats.totalMembers,
      totalRevenue: baseStats.totalRevenue,
      avgSessionsRemaining: baseStats.avgSessionsRemaining,
      memberCounts: {
        all: baseStats.totalMembers,
        pt: baseStats.ptCount,
        ot: baseStats.otCount,
        reregistration: reregistrationCount
      },
      sessions: { total: baseStats.totalSessions, remaining: baseStats.remainingSessions },
      monthlySales: { newSales: 0, renewSales: 0, total: baseStats.totalRevenue },
      monthlyLessons: { ptInWorkHours: 0, ptOutWorkHours: 0, ot: 0, total: 0 },
      rankings: { companyRank: 0, companyTotal: 0, companyPercentile: 0, branchRank: 0, branchTotal: 0, avg3Months: 0, avg6Months: 0, firstHalf: 0, secondHalf: 0 }
    };
  }, [data]);

  // 기간 변경
  const changePeriod = useCallback((type: PeriodType) => {
    const now = new Date();
    setPeriodFilter({ type, year: now.getFullYear(), month: now.getMonth() + 1 });
  }, []);

  const navigateMonth = useCallback((direction: "prev" | "next") => {
    setPeriodFilter(prev => {
      let { year, month } = prev;
      if (direction === "prev") {
        month -= 1;
        if (month < 1) { month = 12; year -= 1; }
      } else {
        month += 1;
        if (month > 12) { month = 1; year += 1; }
      }
      return { ...prev, type: "custom", year, month };
    });
  }, []);

  // 트레이너 변경
  const updateTrainer = useCallback(async (memberId: string, trainerId: string, _trainerName: string) => {
    const { error } = await supabase
      .from("members")
      .update({ trainer_id: trainerId })
      .eq("id", memberId);

    if (!error) mutate();
  }, [supabase, mutate]);

  // 일괄 트레이너 변경
  const handleBulkUpdateTrainer = useCallback(async (trainerId: string, _trainerName: string) => {
    for (const memberId of selectedMemberIds) {
      await supabase.from("members").update({ trainer_id: trainerId }).eq("id", memberId);
    }
    setSelectedMemberIds([]);
    mutate();
  }, [supabase, selectedMemberIds, mutate]);

  // 회원 상세 모달 열기
  const openMemberDetailModal = useCallback(async (member: PTMember) => {
    setSelectedMember(member);
    setIsMemberDetailOpen(true);

    if (!member.phone) return;

    // 회원 상세 데이터 조회
    const { data: memberData } = await supabase
      .from("members")
      .select("id")
      .eq("phone", member.phone)
      .maybeSingle();

    if (memberData?.id) {
      const [paymentsRes, membershipsRes, trainersRes] = await Promise.all([
        supabase.from("member_payments").select("*").eq("phone", member.phone).order("created_at", { ascending: false }),
        supabase.from("member_memberships").select("*").eq("member_id", memberData.id),
        supabase.from("member_trainers").select("*, trainer:staffs(id, name)").eq("member_id", memberData.id)
      ]);

      setMemberPaymentHistory(paymentsRes.data || []);
      setMemberAllMemberships(membershipsRes.data || []);
      setMemberTrainers(trainersRes.data || []);
    }
  }, [supabase]);

  // 트레이너 배정 모달
  const openTrainerAssignModal = useCallback(() => setIsTrainerAssignOpen(true), []);

  const handleAssignTrainer = useCallback(async (trainerId: string, category: string, isPrimary: boolean) => {
    if (!selectedMember?.phone) return;

    const { data: memberData } = await supabase
      .from("members")
      .select("id")
      .eq("phone", selectedMember.phone)
      .maybeSingle();

    if (memberData?.id) {
      await supabase.from("member_trainers").insert({
        member_id: memberData.id,
        trainer_id: trainerId,
        category,
        is_primary: isPrimary,
        status: "active"
      });
    }

    setIsTrainerAssignOpen(false);
    mutate();
  }, [supabase, selectedMember, mutate]);

  // 트레이너 인계 모달
  const openTrainerTransferModal = useCallback((target: MemberTrainer, category: string, isPt: boolean) => {
    setTrainerTransferTarget(target);
    setTrainerTransferCategory(category);
    setIsPtTransfer(isPt);
    setIsTrainerTransferOpen(true);
  }, []);

  const handleTransferTrainer = useCallback(async (newTrainerId: string) => {
    if (isPtTransfer && selectedMember?.phone) {
      const { data: memberData } = await supabase
        .from("members")
        .select("id")
        .eq("phone", selectedMember.phone)
        .maybeSingle();

      if (memberData?.id) {
        await supabase.from("members").update({ trainer_id: newTrainerId }).eq("id", memberData.id);
      }
    } else if (trainerTransferTarget?.id) {
      await supabase.from("member_trainers").update({ trainer_id: newTrainerId }).eq("id", trainerTransferTarget.id);
    }

    setIsTrainerTransferOpen(false);
    mutate();
  }, [supabase, selectedMember, trainerTransferTarget, isPtTransfer, mutate]);

  const handleDeleteTrainer = useCallback(async (memberTrainerId: string) => {
    await supabase.from("member_trainers").delete().eq("id", memberTrainerId);
    mutate();
  }, [supabase, mutate]);

  return {
    // 데이터
    ptMembers: filteredMembers,
    staffList: data?.staffList || [],
    membersByTrainer: data?.membersByTrainer || {},
    extendedStats,

    // 상태
    isLoading,
    error,

    // 필터
    trainerFilter, setTrainerFilter,
    statusFilter, setStatusFilter,
    searchQuery, setSearchQuery,
    memberCategory, setMemberCategory,
    selectedMemberIds, setSelectedMemberIds,

    // 기간 필터
    periodFilter, changePeriod, navigateMonth, dateRange,

    // 트레이너 관리
    updateTrainer, handleBulkUpdateTrainer,

    // 회원 상세 모달
    isMemberDetailOpen, setIsMemberDetailOpen,
    selectedMember, memberPaymentHistory, memberAllMemberships, memberActivityLogs, memberTrainers,
    openMemberDetailModal,

    // 트레이너 모달
    isTrainerAssignOpen, setIsTrainerAssignOpen,
    isTrainerTransferOpen, setIsTrainerTransferOpen,
    trainerTransferTarget, trainerTransferCategory, isPtTransfer,
    openTrainerAssignModal, openTrainerTransferModal,
    handleAssignTrainer, handleTransferTrainer, handleDeleteTrainer,

    // 유틸리티
    isAdmin: userRole !== "staff",
    refresh: mutate
  };
}
