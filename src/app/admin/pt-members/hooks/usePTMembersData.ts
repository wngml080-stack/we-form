"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

// ============ 타입 정의 ============
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
  registration_type?: string; // 신규, 리뉴, 기간변경 등
}

interface Staff {
  id: string;
  name: string;
  role: string;
}

type MemberCategory = "all" | "pt" | "ot" | "reregistration";
type PeriodType = "current" | "previous" | "custom";

interface PeriodFilter {
  type: PeriodType;
  year: number;
  month: number;
  startDate?: string;
  endDate?: string;
}

// 확장된 통계 인터페이스
interface ExtendedStats {
  // 기본 통계
  totalMembers: number;
  activeMembers: number;
  totalRevenue: number;
  avgSessionsRemaining: number;

  // 회원 분류별 카운트
  memberCounts: {
    all: number;
    pt: number;
    ot: number;
    reregistration: number;
  };

  // 세션 통계
  sessions: {
    total: number;      // 전체 세션
    remaining: number;  // 잔여 세션
  };

  // 당월 매출
  monthlySales: {
    newSales: number;     // 신규 (상담, OT)
    renewSales: number;   // 리뉴 (재등록, 기간변경)
    total: number;
  };

  // 당월 수업
  monthlyLessons: {
    ptInWorkHours: number;   // PT 근무시간 내
    ptOutWorkHours: number;  // PT 근무시간 외
    ot: number;              // OT
    total: number;
  };

  // 순위/평균
  rankings: {
    companyRank: number;        // 회사 순위
    companyTotal: number;       // 회사 전체 트레이너 수
    companyPercentile: number;  // 상위 %
    branchRank: number;         // 지점 순위
    branchTotal: number;        // 지점 전체 트레이너 수
    avg3Months: number;         // 3개월 평균 매출
    avg6Months: number;         // 6개월 평균 매출
    firstHalf: number;          // 상반기 매출
    secondHalf: number;         // 하반기 매출
  };
}

interface UsePTMembersDataProps {
  selectedGymId: string | null;
  selectedCompanyId: string | null;
  filterInitialized: boolean;
}

interface MemberTrainer {
  id: string;
  category: string;
  trainer_id: string;
  assigned_at: string;
  is_primary: boolean;
  status: string;
  trainer?: {
    id: string;
    name: string;
  };
}

// PT 관련 회원권 카테고리 (대소문자 무관)
const PT_CATEGORIES = ["pt", "ppt", "gpt", "개인pt", "그룹pt"];

export function usePTMembersData({ selectedGymId, selectedCompanyId, filterInitialized }: UsePTMembersDataProps) {
  const supabase = useMemo(() => createSupabaseClient(), []);

  // 기본 상태
  const [ptMembers, setPTMembers] = useState<PTMember[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);

  // 필터
  const [trainerFilter, setTrainerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 새로운 필터
  const [memberCategory, setMemberCategory] = useState<MemberCategory>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(() => {
    const now = new Date();
    return {
      type: "current",
      year: now.getFullYear(),
      month: now.getMonth() + 1
    };
  });

  // 회원 상세 모달 상태
  const [isMemberDetailOpen, setIsMemberDetailOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberPaymentHistory, setMemberPaymentHistory] = useState<any[]>([]);
  const [memberAllMemberships, setMemberAllMemberships] = useState<any[]>([]);
  const [memberActivityLogs, setMemberActivityLogs] = useState<any[]>([]);
  const [memberTrainers, setMemberTrainers] = useState<MemberTrainer[]>([]);

  // 트레이너 모달 상태
  const [isTrainerAssignOpen, setIsTrainerAssignOpen] = useState(false);
  const [isTrainerTransferOpen, setIsTrainerTransferOpen] = useState(false);
  const [trainerTransferTarget, setTrainerTransferTarget] = useState<any>(null);
  const [trainerTransferCategory, setTrainerTransferCategory] = useState<string>("");
  const [isPtTransfer, setIsPtTransfer] = useState(false);

  // 현재 사용자 역할
  const [userRole, setUserRole] = useState<string>("");

  // 확장된 통계
  const [extendedStats, setExtendedStats] = useState<ExtendedStats>({
    totalMembers: 0,
    activeMembers: 0,
    totalRevenue: 0,
    avgSessionsRemaining: 0,
    memberCounts: { all: 0, pt: 0, ot: 0, reregistration: 0 },
    sessions: { total: 0, remaining: 0 },
    monthlySales: { newSales: 0, renewSales: 0, total: 0 },
    monthlyLessons: { ptInWorkHours: 0, ptOutWorkHours: 0, ot: 0, total: 0 },
    rankings: {
      companyRank: 0, companyTotal: 0, companyPercentile: 0,
      branchRank: 0, branchTotal: 0,
      avg3Months: 0, avg6Months: 0, firstHalf: 0, secondHalf: 0
    }
  });

  // 기간 필터 기반 날짜 범위 계산
  const dateRange = useMemo(() => {
    const { type, year, month, startDate, endDate } = periodFilter;

    if (type === "custom" && startDate && endDate) {
      return { start: startDate, end: endDate };
    }

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

  // 현재 로그인한 스태프 ID와 역할 가져오기
  useEffect(() => {
    const fetchCurrentStaff = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("staffs")
          .select("id, role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("현재 스태프 조회 오류:", error);
          return;
        }

        if (data) {
          setCurrentStaffId(data.id);
          setUserRole(data.role || "");
        }
      }
    };
    fetchCurrentStaff();
  }, [supabase]);

  // 데이터 로드
  useEffect(() => {
    if (filterInitialized && selectedGymId && selectedCompanyId) {
      fetchPTMembers(selectedGymId, selectedCompanyId);
      fetchStaffList(selectedGymId);
    }
  }, [filterInitialized, selectedGymId, selectedCompanyId, dateRange]);

  // PT 회원 조회
  const fetchPTMembers = async (gymId: string, companyId: string) => {
    setIsLoading(true);
    try {
      // member_payments에서 모든 결제 정보 조회 (trainer_id 필터 제거)
      const { data: payments, error } = await supabase
        .from("member_payments")
        .select(`
          id,
          amount,
          created_at,
          membership_category,
          membership_name,
          memo,
          trainer_id,
          trainer_name,
          member_name,
          phone,
          sale_type,
          service_sessions
        `)
        .eq("gym_id", gymId)
        .eq("company_id", companyId)
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("PT 회원 조회 오류 상세:", JSON.stringify(error, null, 2));
        setPTMembers([]);
        return;
      }

      // PT 회원권 정보 조회 (잔여 세션 계산용)
      const { data: memberships } = await supabase
        .from("member_memberships")
        .select("member_id, name, total_sessions, used_sessions, service_sessions, used_service_sessions, status")
        .eq("gym_id", gymId)
        .eq("status", "active");

      // 회원별 활성 회원권 매핑
      const membershipMap: Record<string, any> = {};
      (memberships || []).forEach((m: any) => {
        if (!membershipMap[m.member_id]) {
          membershipMap[m.member_id] = m;
        }
      });

      // members 테이블에서 phone으로 member_id 및 현재 담당 트레이너 매핑
      const phones = (payments || []).map((p: any) => p.phone).filter(Boolean);
      const { data: memberData } = await supabase
        .from("members")
        .select(`
          id,
          phone,
          trainer_id,
          trainer:staffs!trainer_id (id, name)
        `)
        .eq("gym_id", gymId)
        .in("phone", phones);

      const phoneToMemberInfo: Record<string, { id: string; trainer_id: string | null; trainer_name: string | null }> = {};
      (memberData || []).forEach((m: any) => {
        if (m.phone) {
          phoneToMemberInfo[m.phone] = {
            id: m.id,
            trainer_id: m.trainer_id || null,
            trainer_name: m.trainer?.name || null
          };
        }
      });

      // 하위 호환성을 위한 phoneToMemberId 유지
      const phoneToMemberId: Record<string, string> = {};
      (memberData || []).forEach((m: any) => {
        if (m.phone) phoneToMemberId[m.phone] = m.id;
      });

      // 데이터 변환 - PT/OT 분류 포함
      const members: PTMember[] = (payments || []).map((p: any) => {
        const category = p.membership_category || "";
        // PT 회원권이 아니면 OT로 분류
        const displayCategory = isPTMembership(category) ? category : (category || "OT");
        const isPT = isPTMembership(category);

        // PT인 경우 회원권에서 잔여 세션 조회
        let remainingSessions: number | undefined = undefined;
        let totalSessions: number | undefined = undefined;

        if (isPT && p.phone) {
          const memberId = phoneToMemberId[p.phone];
          const membership = memberId ? membershipMap[memberId] : null;
          if (membership) {
            const total = (membership.total_sessions || 0) + (membership.service_sessions || 0);
            const used = (membership.used_sessions || 0) + (membership.used_service_sessions || 0);
            totalSessions = total;
            remainingSessions = total - used;
          } else if (p.service_sessions) {
            // 회원권이 없으면 매출에 저장된 세션 수 사용
            totalSessions = parseInt(p.service_sessions) || undefined;
            remainingSessions = totalSessions;
          }
        }

        // 현재 담당 트레이너 정보 (members 테이블 기준, 없으면 매출 등록 시 정보 사용)
        const memberInfo = p.phone ? phoneToMemberInfo[p.phone] : null;
        const currentTrainerId = memberInfo?.trainer_id || p.trainer_id || "";
        const currentTrainerName = memberInfo?.trainer_name || p.trainer_name || "미배정";

        return {
          id: p.id,
          member_name: p.member_name || "Unknown",
          phone: p.phone,
          membership_category: displayCategory,
          membership_name: p.membership_name || "",
          sale_type: p.sale_type || "",
          amount: parseFloat(p.amount) || 0,
          trainer_id: currentTrainerId,
          trainer_name: currentTrainerName,
          remaining_sessions: remainingSessions,
          total_sessions: totalSessions,
          start_date: undefined,
          end_date: undefined,
          status: "active" as const,
          created_at: p.created_at,
          memo: p.memo,
          registration_type: p.sale_type || ""
        };
      });

      setPTMembers(members);
      calculateExtendedStats(members, gymId, companyId);
    } catch (err) {
      console.error("PT 회원 조회 오류:", err);
      setPTMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaffList = async (gymId: string) => {
    const { data, error } = await supabase
      .from("staffs")
      .select("id, name, role")
      .eq("gym_id", gymId)
      .eq("status", "active")
      .order("name");

    if (error) {
      console.error("스태프 목록 조회 오류:", error);
      return;
    }

    if (data) {
      setStaffList(data);
    }
  };

  // PT 회원권 여부 확인
  const isPTMembership = (category: string): boolean => {
    return PT_CATEGORIES.some(pt => category.toLowerCase().includes(pt.toLowerCase()));
  };

  // 재등록 대상자 여부 (잔여 70% 이하)
  const isReregistrationTarget = (member: PTMember): boolean => {
    if (!isPTMembership(member.membership_category)) return false;
    if (!member.total_sessions || member.total_sessions === 0) return false;
    const remainingPercent = ((member.remaining_sessions || 0) / member.total_sessions) * 100;
    return remainingPercent <= 70;
  };

  // 확장된 통계 계산
  const calculateExtendedStats = async (members: PTMember[], gymId: string, companyId: string) => {
    // 기본 통계
    const activeMembers = members.filter(m => m.status === "active").length;
    const totalRevenue = members.reduce((sum, m) => sum + m.amount, 0);
    const membersWithSessions = members.filter(m => m.remaining_sessions != null);
    const avgSessions = membersWithSessions.length > 0
      ? membersWithSessions.reduce((sum, m) => sum + (m.remaining_sessions || 0), 0) / membersWithSessions.length
      : 0;

    // 회원 분류별 카운트
    const ptMembers = members.filter(m => isPTMembership(m.membership_category));
    const otMembers = members.filter(m => !isPTMembership(m.membership_category));
    const reregistrationMembers = members.filter(m => isReregistrationTarget(m));

    // 세션 통계
    const totalSessions = members.reduce((sum, m) => sum + (m.total_sessions || 0), 0);
    const remainingSessions = members.reduce((sum, m) => sum + (m.remaining_sessions || 0), 0);

    // 매출 통계 (신규: 상담/OT, 리뉴: 재등록/기간변경)
    const newTypes = ["신규", "상담", "ot"];
    const renewTypes = ["리뉴", "재등록", "기간변경"];

    const newSales = members
      .filter(m => newTypes.some(t => (m.registration_type || "").toLowerCase().includes(t.toLowerCase())))
      .reduce((sum, m) => sum + m.amount, 0);

    const renewSales = members
      .filter(m => renewTypes.some(t => (m.registration_type || "").toLowerCase().includes(t.toLowerCase())))
      .reduce((sum, m) => sum + m.amount, 0);

    // 수업 통계는 schedules 테이블에서 조회 필요 (간략화)
    const monthlyLessons = { ptInWorkHours: 0, ptOutWorkHours: 0, ot: 0, total: 0 };

    // 순위 계산 (간략화 - 실제로는 더 복잡한 쿼리 필요)
    const rankings = {
      companyRank: 0,
      companyTotal: 0,
      companyPercentile: 0,
      branchRank: 0,
      branchTotal: 0,
      avg3Months: 0,
      avg6Months: 0,
      firstHalf: 0,
      secondHalf: 0
    };

    // 3개월, 6개월 평균 및 상반기/하반기 매출 조회
    try {
      const now = new Date();
      const currentYear = now.getFullYear();

      // 3개월 전
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      // 6개월 전
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // currentStaffId가 있을 때만 개인 매출 통계 조회
      if (currentStaffId) {
        // 3개월 매출
        const { data: sales3m, error: sales3mError } = await supabase
          .from("member_payments")
          .select("amount")
          .eq("gym_id", gymId)
          .eq("trainer_id", currentStaffId)
          .gte("created_at", threeMonthsAgo.toISOString().split("T")[0])
          .lte("created_at", now.toISOString().split("T")[0]);

        if (sales3mError) {
          console.error("3개월 매출 조회 오류:", sales3mError);
        } else if (sales3m) {
          const total3m = sales3m.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
          rankings.avg3Months = Math.round(total3m / 3);
        }

        // 6개월 매출
        const { data: sales6m, error: sales6mError } = await supabase
          .from("member_payments")
          .select("amount")
          .eq("gym_id", gymId)
          .eq("trainer_id", currentStaffId)
          .gte("created_at", sixMonthsAgo.toISOString().split("T")[0])
          .lte("created_at", now.toISOString().split("T")[0]);

        if (sales6mError) {
          console.error("6개월 매출 조회 오류:", sales6mError);
        } else if (sales6m) {
          const total6m = sales6m.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
          rankings.avg6Months = Math.round(total6m / 6);
        }

        // 상반기 (1~6월)
        const { data: firstHalfData, error: firstHalfError } = await supabase
          .from("member_payments")
          .select("amount")
          .eq("gym_id", gymId)
          .eq("trainer_id", currentStaffId)
          .gte("created_at", `${currentYear}-01-01`)
          .lte("created_at", `${currentYear}-06-30`);

        if (firstHalfError) {
          console.error("상반기 매출 조회 오류:", firstHalfError);
        } else if (firstHalfData) {
          rankings.firstHalf = firstHalfData.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
        }

        // 하반기 (7~12월)
        const { data: secondHalfData, error: secondHalfError } = await supabase
          .from("member_payments")
          .select("amount")
          .eq("gym_id", gymId)
          .eq("trainer_id", currentStaffId)
          .gte("created_at", `${currentYear}-07-01`)
          .lte("created_at", `${currentYear}-12-31`);

        if (secondHalfError) {
          console.error("하반기 매출 조회 오류:", secondHalfError);
        } else if (secondHalfData) {
          rankings.secondHalf = secondHalfData.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
        }
      }

      // 순위 계산 (지점 내)
      const { data: branchTrainers, error: branchError } = await supabase
        .from("member_payments")
        .select("trainer_id, amount")
        .eq("gym_id", gymId)
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end);

      if (branchError) {
        console.error("지점 순위 조회 오류:", branchError);
      } else if (branchTrainers) {
        // 트레이너별 매출 집계
        const trainerSales: Record<string, number> = {};
        branchTrainers.forEach((t: any) => {
          if (t.trainer_id) {
            trainerSales[t.trainer_id] = (trainerSales[t.trainer_id] || 0) + parseFloat(t.amount || 0);
          }
        });

        const sortedTrainers = Object.entries(trainerSales)
          .sort(([, a], [, b]) => b - a);

        rankings.branchTotal = sortedTrainers.length;
        const myRank = sortedTrainers.findIndex(([id]) => id === currentStaffId) + 1;
        rankings.branchRank = myRank || sortedTrainers.length;
      }

      // 회사 순위 계산
      const { data: companyTrainers, error: companyError } = await supabase
        .from("member_payments")
        .select("trainer_id, amount")
        .eq("company_id", companyId)
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end);

      if (companyError) {
        console.error("회사 순위 조회 오류:", companyError);
      } else if (companyTrainers) {
        const trainerSales: Record<string, number> = {};
        companyTrainers.forEach((t: any) => {
          if (t.trainer_id) {
            trainerSales[t.trainer_id] = (trainerSales[t.trainer_id] || 0) + parseFloat(t.amount || 0);
          }
        });

        const sortedTrainers = Object.entries(trainerSales)
          .sort(([, a], [, b]) => b - a);

        rankings.companyTotal = sortedTrainers.length;
        const myRank = sortedTrainers.findIndex(([id]) => id === currentStaffId) + 1;
        rankings.companyRank = myRank || sortedTrainers.length;
        rankings.companyPercentile = rankings.companyTotal > 0
          ? Math.round((rankings.companyRank / rankings.companyTotal) * 100)
          : 0;
      }
    } catch (err) {
      console.error("순위 계산 오류:", err);
    }

    setExtendedStats({
      totalMembers: members.length,
      activeMembers,
      totalRevenue,
      avgSessionsRemaining: Math.round(avgSessions * 10) / 10,
      memberCounts: {
        all: members.length,
        pt: ptMembers.length,
        ot: otMembers.length,
        reregistration: reregistrationMembers.length
      },
      sessions: {
        total: totalSessions,
        remaining: remainingSessions
      },
      monthlySales: {
        newSales,
        renewSales,
        total: newSales + renewSales
      },
      monthlyLessons,
      rankings
    });
  };

  // 필터링된 PT 회원
  const filteredPTMembers = useMemo(() => {
    return ptMembers.filter(member => {
      // 회원 분류 필터
      if (memberCategory !== "all") {
        if (memberCategory === "pt" && !isPTMembership(member.membership_category)) return false;
        if (memberCategory === "ot" && isPTMembership(member.membership_category)) return false;
        if (memberCategory === "reregistration" && !isReregistrationTarget(member)) return false;
      }

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
  }, [ptMembers, memberCategory, trainerFilter, statusFilter, searchQuery]);

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

  // 기간 필터 변경
  const changePeriod = useCallback((type: PeriodType, customStart?: string, customEnd?: string) => {
    if (type === "custom" && customStart && customEnd) {
      setPeriodFilter(prev => ({
        ...prev,
        type,
        startDate: customStart,
        endDate: customEnd
      }));
    } else {
      setPeriodFilter(prev => ({ ...prev, type }));
    }
  }, []);

  // 월 이동
  const navigateMonth = useCallback((direction: "prev" | "next") => {
    setPeriodFilter(prev => {
      let newMonth = prev.month + (direction === "next" ? 1 : -1);
      let newYear = prev.year;

      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }

      return { ...prev, year: newYear, month: newMonth, type: "current" };
    });
  }, []);

  // 회원 상태 업데이트
  const updateMemberStatus = async (_id: string, _status: "active" | "expired" | "paused") => {
    // TODO: 구현
  };

  // 담당 트레이너 변경
  const updateTrainer = async (_id: string, _trainerId: string, _trainerName: string) => {
    // TODO: 구현
  };

  // 관리자 권한 체크
  const isAdmin = useMemo(() => {
    return ["system_admin", "company_admin", "admin"].includes(userRole);
  }, [userRole]);

  // 회원 트레이너 조회
  const fetchMemberTrainers = useCallback(async (memberId: string) => {
    try {
      const response = await fetch(`/api/admin/members/${memberId}/trainers`);
      const result = await response.json();
      if (response.ok) {
        setMemberTrainers(result.trainers || []);
      } else {
        setMemberTrainers([]);
      }
    } catch (e) {
      setMemberTrainers([]);
    }
  }, []);

  // 회원 상세 모달 열기 (phone으로 member 조회 후) - 최적화: 모달 먼저 열고 데이터 병렬 로드
  const openMemberDetailModal = async (ptMember: PTMember) => {
    if (!selectedGymId) {
      alert("지점 정보가 없습니다.");
      return;
    }

    if (!ptMember.phone) {
      alert("회원 연락처 정보가 없어 상세 정보를 조회할 수 없습니다.");
      return;
    }

    // 초기 상태 설정 및 모달 즉시 열기
    setSelectedMember(null);
    setMemberAllMemberships([]);
    setMemberPaymentHistory([]);
    setMemberActivityLogs([]);
    setMemberTrainers([]);
    setIsMemberDetailOpen(true);
    setIsLoading(true);

    try {
      // phone으로 실제 member 조회 (하이픈 제거하여 비교)
      const cleanPhone = ptMember.phone.replace(/-/g, "");

      const { data: member, error } = await supabase
        .from("members")
        .select(`
          *,
          trainer:staffs!trainer_id (id, name)
        `)
        .eq("gym_id", selectedGymId)
        .or(`phone.eq.${ptMember.phone},phone.eq.${cleanPhone}`)
        .maybeSingle();

      if (error) {
        console.error("회원 조회 오류:", error);
        setIsMemberDetailOpen(false);
        alert("회원 정보 조회 중 오류가 발생했습니다.");
        return;
      }

      if (!member) {
        setIsMemberDetailOpen(false);
        alert(`회원 "${ptMember.member_name}"의 상세 정보가 없습니다.\n매출 등록 시 회원 정보가 함께 생성되지 않았을 수 있습니다.`);
        return;
      }

      setSelectedMember(member);

      // 상세 정보와 트레이너 정보를 병렬로 조회
      const [detailResponse, trainerResponse] = await Promise.all([
        fetch(`/api/admin/members/${member.id}/detail?gym_id=${selectedGymId}`),
        fetch(`/api/admin/members/${member.id}/trainers`)
      ]);

      // 상세 정보 처리
      if (detailResponse.ok) {
        const detailResult = await detailResponse.json();
        setMemberAllMemberships(detailResult.memberships || []);
        setMemberPaymentHistory(detailResult.payments || []);
        setMemberActivityLogs(detailResult.activityLogs || []);
      }

      // 트레이너 정보 처리
      if (trainerResponse.ok) {
        const trainerResult = await trainerResponse.json();
        setMemberTrainers(trainerResult.trainers || []);
      }
    } catch (e) {
      console.error("회원 상세 조회 오류:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // 트레이너 배정 모달 열기
  const openTrainerAssignModal = () => {
    setIsTrainerAssignOpen(true);
  };

  // 트레이너 인계 모달 열기
  const openTrainerTransferModal = (trainer: any | null, category: string, isPt: boolean) => {
    setTrainerTransferTarget(trainer);
    setTrainerTransferCategory(category);
    setIsPtTransfer(isPt);
    setIsTrainerTransferOpen(true);
  };

  // 트레이너 배정 처리
  const handleAssignTrainer = async (data: { category: string; trainer_id: string }) => {
    if (!selectedMember) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/members/${selectedMember.id}/trainers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!response.ok) {
        alert(result.error || "트레이너 배정에 실패했습니다.");
        return;
      }
      await fetchMemberTrainers(selectedMember.id);
      setIsTrainerAssignOpen(false);
    } catch (e: any) {
      alert(e.message || "트레이너 배정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 트레이너 인계 처리
  const handleTransferTrainer = async (data: { to_trainer_id: string; reason: string; reason_detail?: string }) => {
    if (!selectedMember) return;
    setIsLoading(true);
    try {
      const body: any = {
        ...data,
        is_pt_transfer: isPtTransfer
      };

      if (isPtTransfer) {
        body.from_trainer_id = selectedMember.trainer_id;
      } else if (trainerTransferTarget) {
        body.member_trainer_id = trainerTransferTarget.id;
        body.category = trainerTransferCategory;
        body.from_trainer_id = trainerTransferTarget.trainer_id;
      }

      const response = await fetch(`/api/admin/members/${selectedMember.id}/trainers/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const result = await response.json();
      if (!response.ok) {
        alert(result.error || "트레이너 인계에 실패했습니다.");
        return;
      }

      // PT 인계 시 회원 목록 새로고침
      if (isPtTransfer && selectedGymId && selectedCompanyId) {
        fetchPTMembers(selectedGymId, selectedCompanyId);
      }
      await fetchMemberTrainers(selectedMember.id);

      // 활동 로그 새로고침
      try {
        const detailResponse = await fetch(`/api/admin/members/${selectedMember.id}/detail?gym_id=${selectedGymId}`);
        const detailResult = await detailResponse.json();
        if (detailResponse.ok) {
          setMemberActivityLogs(detailResult.activityLogs || []);
        }
      } catch (e) { /* ignore */ }

      setIsTrainerTransferOpen(false);
    } catch (e: any) {
      alert(e.message || "트레이너 인계 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 트레이너 삭제 처리
  const handleDeleteTrainer = async (trainerId: string) => {
    if (!selectedMember) return;
    if (!confirm("해당 트레이너 배정을 해제하시겠습니까?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/members/${selectedMember.id}/trainers?trainer_id=${trainerId}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (!response.ok) {
        alert(result.error || "트레이너 배정 해제에 실패했습니다.");
        return;
      }
      await fetchMemberTrainers(selectedMember.id);
    } catch (e: any) {
      alert(e.message || "트레이너 배정 해제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // 회원 데이터
    ptMembers: filteredPTMembers,
    allPTMembers: ptMembers,
    staffList,
    isLoading,

    // 통계 (기존 호환)
    stats: {
      totalMembers: extendedStats.totalMembers,
      activeMembers: extendedStats.activeMembers,
      totalRevenue: extendedStats.totalRevenue,
      avgSessionsRemaining: extendedStats.avgSessionsRemaining
    },

    // 확장된 통계
    extendedStats,
    membersByTrainer,

    // 기존 필터
    trainerFilter,
    setTrainerFilter,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,

    // 새 필터
    memberCategory,
    setMemberCategory,
    periodFilter,
    changePeriod,
    navigateMonth,
    dateRange,

    // 액션
    updateMemberStatus,
    updateTrainer,
    refreshData: () => selectedGymId && selectedCompanyId && fetchPTMembers(selectedGymId, selectedCompanyId),

    // 회원 상세 모달
    isMemberDetailOpen, setIsMemberDetailOpen,
    selectedMember,
    memberPaymentHistory,
    memberAllMemberships,
    memberActivityLogs,
    memberTrainers,
    openMemberDetailModal,

    // 트레이너 관리
    isTrainerAssignOpen, setIsTrainerAssignOpen,
    isTrainerTransferOpen, setIsTrainerTransferOpen,
    trainerTransferTarget,
    trainerTransferCategory,
    isPtTransfer,
    isAdmin,
    openTrainerAssignModal,
    openTrainerTransferModal,
    handleAssignTrainer,
    handleTransferTrainer,
    handleDeleteTrainer
  };
}
