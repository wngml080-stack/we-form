"use client";

import { useState, useEffect, useMemo } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

interface PTMember {
  id: string;
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
  start_date?: string;
  end_date?: string;
  status: "active" | "expired" | "paused";
  created_at: string;
  memo?: string;
}

interface Staff {
  id: string;
  name: string;
  role: string;
}

interface UsePTMembersDataProps {
  selectedGymId: string | null;
  selectedCompanyId: string | null;
  filterInitialized: boolean;
}

export function usePTMembersData({ selectedGymId, selectedCompanyId, filterInitialized }: UsePTMembersDataProps) {
  const supabase = useMemo(() => createSupabaseClient(), []);

  const [ptMembers, setPTMembers] = useState<PTMember[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 필터
  const [trainerFilter, setTrainerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 통계
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalRevenue: 0,
    avgSessionsRemaining: 0
  });

  // 데이터 로드
  useEffect(() => {
    if (filterInitialized && selectedGymId) {
      fetchPTMembers(selectedGymId);
      fetchStaffList(selectedGymId);
    }
  }, [filterInitialized, selectedGymId]);

  const fetchPTMembers = async (gymId: string) => {
    setIsLoading(true);

    // PT 관련 매출 중 담당트레이너가 있는 데이터 조회
    const { data, error } = await supabase
      .from("member_payments")
      .select("*")
      .eq("gym_id", gymId)
      .not("trainer_id", "is", null)
      .in("membership_category", ["PT", "pt", "개인레슨", "퍼스널트레이닝"])
      .order("created_at", { ascending: false });

    if (!error && data) {
      // 회원별로 그룹핑하여 가장 최근 데이터 사용
      const memberMap = new Map<string, PTMember>();

      data.forEach((payment: any) => {
        const key = `${payment.member_name}-${payment.phone || "no-phone"}`;

        if (!memberMap.has(key)) {
          // 회원권명에서 횟수 추출 시도 (예: "10회", "20회")
          const sessionMatch = payment.membership_name?.match(/(\d+)회/);
          const totalSessions = sessionMatch ? parseInt(sessionMatch[1]) : undefined;

          memberMap.set(key, {
            id: payment.id,
            member_name: payment.member_name,
            phone: payment.phone,
            membership_category: payment.membership_category,
            membership_name: payment.membership_name,
            sale_type: payment.sale_type,
            amount: payment.amount,
            trainer_id: payment.trainer_id,
            trainer_name: payment.trainer_name || "",
            remaining_sessions: totalSessions, // 실제로는 출석 데이터와 연동 필요
            total_sessions: totalSessions,
            start_date: payment.start_date,
            end_date: payment.end_date,
            status: "active", // 기본값, 실제로는 날짜 비교 필요
            created_at: payment.created_at,
            memo: payment.memo
          });
        }
      });

      const members = Array.from(memberMap.values());
      setPTMembers(members);
      calculateStats(members);
    }

    setIsLoading(false);
  };

  const fetchStaffList = async (gymId: string) => {
    const { data, error } = await supabase
      .from("staffs")
      .select("id, name, role")
      .eq("gym_id", gymId)
      .eq("status", "active")
      .order("name");

    if (!error && data) {
      setStaffList(data);
    }
  };

  const calculateStats = (members: PTMember[]) => {
    const activeMembers = members.filter(m => m.status === "active").length;
    const totalRevenue = members.reduce((sum, m) => sum + m.amount, 0);
    const membersWithSessions = members.filter(m => m.remaining_sessions != null);
    const avgSessions = membersWithSessions.length > 0
      ? membersWithSessions.reduce((sum, m) => sum + (m.remaining_sessions || 0), 0) / membersWithSessions.length
      : 0;

    setStats({
      totalMembers: members.length,
      activeMembers,
      totalRevenue,
      avgSessionsRemaining: Math.round(avgSessions * 10) / 10
    });
  };

  // 필터링된 PT 회원
  const filteredPTMembers = useMemo(() => {
    return ptMembers.filter(member => {
      // 트레이너 필터
      if (trainerFilter !== "all" && member.trainer_id !== trainerFilter) return false;

      // 상태 필터
      if (statusFilter !== "all" && member.status !== statusFilter) return false;

      // 검색어 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = member.member_name.toLowerCase().includes(query);
        const matchesPhone = member.phone?.includes(query);
        return matchesName || matchesPhone;
      }

      return true;
    });
  }, [ptMembers, trainerFilter, statusFilter, searchQuery]);

  // 트레이너별 회원 수
  const membersByTrainer = useMemo(() => {
    const counts: Record<string, { name: string; count: number }> = {};
    ptMembers.forEach(member => {
      if (member.trainer_id) {
        if (!counts[member.trainer_id]) {
          counts[member.trainer_id] = { name: member.trainer_name, count: 0 };
        }
        counts[member.trainer_id].count++;
      }
    });
    return counts;
  }, [ptMembers]);

  // 회원 상태 업데이트
  const updateMemberStatus = async (id: string, status: "active" | "expired" | "paused") => {
    const { error } = await supabase
      .from("member_payments")
      .update({ status })
      .eq("id", id);

    if (!error && selectedGymId) {
      fetchPTMembers(selectedGymId);
    }
  };

  // 담당 트레이너 변경
  const updateTrainer = async (id: string, trainerId: string, trainerName: string) => {
    const { error } = await supabase
      .from("member_payments")
      .update({ trainer_id: trainerId, trainer_name: trainerName })
      .eq("id", id);

    if (!error && selectedGymId) {
      fetchPTMembers(selectedGymId);
    }
  };

  return {
    ptMembers: filteredPTMembers,
    allPTMembers: ptMembers,
    staffList,
    stats,
    membersByTrainer,
    isLoading,

    // 필터
    trainerFilter,
    setTrainerFilter,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,

    // 액션
    updateMemberStatus,
    updateTrainer,
    refreshData: () => selectedGymId && fetchPTMembers(selectedGymId)
  };
}
