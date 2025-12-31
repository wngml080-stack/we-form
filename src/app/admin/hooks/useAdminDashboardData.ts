"use client";

import { useState, useEffect, useMemo } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "@/lib/toast";

// Types
export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  todaySchedules: number;
  todaySales: number;
  monthSales: number;
  newMembersThisMonth: number;
  totalPTMembers: number;
  activePTMembers: number;
  ghostMembers: number;
}

export interface NewMemberForm {
  name: string;
  phone: string;
  membership_type: string;
  membership_name: string;
  sessions: string;
  amount: string;
  payment_method: string;
  memo: string;
}

export interface ExistingMemberForm extends NewMemberForm {
  member_id: string;
  member_name: string;
}

export interface AddonForm {
  customer_name: string;
  customer_phone: string;
  product_name: string;
  amount: string;
  payment_method: string;
  memo: string;
}

const initialNewMemberForm: NewMemberForm = {
  name: "", phone: "", membership_type: "PT", membership_name: "",
  sessions: "", amount: "", payment_method: "card", memo: ""
};

const initialExistingMemberForm: ExistingMemberForm = {
  name: "", phone: "", member_id: "", member_name: "", membership_type: "PT", membership_name: "",
  sessions: "", amount: "", payment_method: "card", memo: ""
};

const initialAddonForm: AddonForm = {
  customer_name: "", customer_phone: "", product_name: "",
  amount: "", payment_method: "card", memo: ""
};

export function useAdminDashboardData() {
  const { user, isLoading: authLoading, gymName: authGymName } = useAuth();
  const { dashboardFilter, isInitialized: filterInitialized } = useAdminFilter();

  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0, activeMembers: 0, todaySchedules: 0, todaySales: 0,
    monthSales: 0, newMembersThisMonth: 0, totalPTMembers: 0, activePTMembers: 0, ghostMembers: 0
  });
  const [todaySchedules, setTodaySchedules] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [companyEvents, setCompanyEvents] = useState<any[]>([]);
  const [systemAnnouncements, setSystemAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 달력 관련 상태
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

  // 센터 현황 관련 상태
  const [centerStatsMonthOffset, setCenterStatsMonthOffset] = useState(0);
  const [monthlySalesData, setMonthlySalesData] = useState<Record<string, number>>({});
  const [statsViewMode, setStatsViewMode] = useState<'monthly' | '3month' | '6month' | 'firstHalf' | 'secondHalf'>('monthly');

  // 지점 공지사항 모달 상태
  const [selectedBranchAnnouncement, setSelectedBranchAnnouncement] = useState<any>(null);
  const [isBranchAnnouncementModalOpen, setIsBranchAnnouncementModalOpen] = useState(false);

  // 등록 모달 상태
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [isExistingMemberModalOpen, setIsExistingMemberModalOpen] = useState(false);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [recentLogsSummary, setRecentLogsSummary] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 폼 상태
  const [newMemberForm, setNewMemberForm] = useState<NewMemberForm>(initialNewMemberForm);
  const [existingMemberForm, setExistingMemberForm] = useState<ExistingMemberForm>(initialExistingMemberForm);
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [addonForm, setAddonForm] = useState<AddonForm>(initialAddonForm);
  const [products, setProducts] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // Supabase 클라이언트
  const supabase = useMemo(() => createSupabaseClient(), []);

  // AuthContext에서 사용자 정보 사용
  const userName = user?.name || "관리자";
  const myStaffId = user?.id || "";
  const userRole = user?.role || "";

  // 현재 선택된 회사/지점 정보
  const selectedCompanyId = dashboardFilter.selectedCompanyId;
  const selectedGymId = dashboardFilter.selectedGymId;
  const gyms = dashboardFilter.gyms;
  const gymName = gyms.find(g => g.id === selectedGymId)?.name || authGymName || "We:form";

  // 상품 목록 조회
  const fetchProducts = async (gymId: string) => {
    try {
      const response = await fetch(`/api/admin/schedule/products?gym_id=${gymId}`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("상품 목록 조회 에러:", error);
    }
  };

  // 스태프 목록 조회
  const fetchStaffList = async (gymId: string) => {
    try {
      const { data, error } = await supabase
        .from("staffs")
        .select("id, name, job_title")
        .eq("gym_id", gymId)
        .order("name", { ascending: true });
      if (!error && data) {
        setStaffList(data);
      }
    } catch (error) {
      console.error("스태프 목록 조회 에러:", error);
    }
  };

  // 회원 목록 조회 - 임시 비활성화 (테이블 재연결 예정)
  const fetchMembers = async (_gymId: string, _companyId: string) => {
    setMembers([]);
  };

  useEffect(() => {
    if (authLoading || !filterInitialized) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    if (selectedGymId && selectedCompanyId) {
      fetchDashboardData(selectedGymId, selectedCompanyId, user.id);
      fetchProducts(selectedGymId);
      fetchStaffList(selectedGymId);
      fetchMembers(selectedGymId, selectedCompanyId);
    }
    setIsLoading(false);
  }, [authLoading, filterInitialized, selectedGymId, selectedCompanyId, user]);

  const fetchDashboardData = async (gymId: string, companyId: string, staffId: string) => {
    if (!gymId || !companyId) return;

    const now = new Date();
    const koreaOffset = 9 * 60;
    const koreaTime = new Date(now.getTime() + (koreaOffset + now.getTimezoneOffset()) * 60000);
    const today = koreaTime.toISOString().split('T')[0];

    let schedulesQuery = supabase.from("schedules")
      .select("id, member_name, type, status, start_time, end_time, staff_id, staffs(name)")
      .eq("gym_id", gymId)
      .gte("start_time", `${today}T00:00:00+09:00`)
      .lte("start_time", `${today}T23:59:59+09:00`)
      .order("start_time", { ascending: true });

    if (userRole !== "system_admin") {
      schedulesQuery = schedulesQuery.eq("staff_id", staffId);
    }

    const fetchSystemAnnouncementsPromise = fetch("/api/admin/system/announcements")
      .then(res => res.json())
      .then(data => data.announcements || [])
      .catch(() => []);

    const fetchCompanyEventsPromise = fetch(`/api/admin/schedule/events?company_id=${companyId}&gym_id=${gymId}`)
      .then(res => res.json())
      .then(data => data.events || [])
      .catch(() => []);

    const [
      schedulesResult, announcementsResult, eventsResult, systemAnnouncementsData
    ] = await Promise.all([
      schedulesQuery,
      supabase.from("announcements").select("*").eq("company_id", companyId).eq("is_active", true)
        .or(`gym_id.eq.${gymId},gym_id.is.null`)
        .order("priority", { ascending: false }).order("created_at", { ascending: false }).limit(10),
      fetchCompanyEventsPromise,
      fetchSystemAnnouncementsPromise
    ]);

    const schedules = schedulesResult.data || [];

    setTodaySchedules(schedules);
    setAnnouncements(announcementsResult.data || []);
    setCompanyEvents(eventsResult || []);
    const activeSystemAnnouncements = (systemAnnouncementsData || []).filter((a: any) => a.is_active);
    setSystemAnnouncements(activeSystemAnnouncements);

    // 회원/매출 관련 통계 - 임시 비활성화 (테이블 재연결 예정)
    setStats({
      totalMembers: 0, activeMembers: 0, todaySchedules: schedules?.length || 0,
      todaySales: 0, monthSales: 0, newMembersThisMonth: 0,
      totalPTMembers: 0, activePTMembers: 0, ghostMembers: 0
    });
    setMonthlySalesData({});

    fetchRecentLogs(gymId, companyId);
  };

  const fetchRecentLogs = async (gymId: string, companyId: string) => {
    try {
      // today_only=true로 당일 매출만 조회
      const response = await fetch(`/api/admin/schedule/logs?gym_id=${gymId}&company_id=${companyId}&today_only=true`);
      const data = await response.json();
      if (data.success) {
        setRecentLogs(data.logs || []);
        setRecentLogsSummary(data.summary || null);
      }
    } catch {
      // 조회 실패 시 빈 배열 유지
    }
  };

  // 회원 검색 - 임시 비활성화 (테이블 재연결 예정)
  const searchMembers = async (_query: string) => {
    setMemberSearchResults([]);
  };

  const handleNewMemberRegistration = async () => {
    if (!newMemberForm.name || !newMemberForm.phone || !newMemberForm.amount) {
      toast.warning("이름, 연락처, 금액은 필수입니다.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/schedule/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "new_member",
          gym_id: selectedGymId,
          company_id: selectedCompanyId,
          staff_id: myStaffId,
          data: newMemberForm
        })
      });
      const result = await response.json();
      if (result.success) {
        toast.success("신규 회원이 등록되었습니다!");
        setIsNewMemberModalOpen(false);
        setNewMemberForm(initialNewMemberForm);
        fetchRecentLogs(selectedGymId, selectedCompanyId);
        fetchDashboardData(selectedGymId, selectedCompanyId, myStaffId);
      } else {
        toast.error(result.error || "등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("신규회원 등록 에러:", error);
      toast.error("등록 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExistingMemberRegistration = async () => {
    if (!existingMemberForm.member_id || !existingMemberForm.amount) {
      toast.warning("회원 선택과 금액은 필수입니다.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/schedule/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "existing_member",
          gym_id: selectedGymId,
          company_id: selectedCompanyId,
          staff_id: myStaffId,
          data: existingMemberForm
        })
      });
      const result = await response.json();
      if (result.success) {
        toast.success("회원권이 등록되었습니다!");
        setIsExistingMemberModalOpen(false);
        setExistingMemberForm(initialExistingMemberForm);
        setMemberSearchQuery("");
        setMemberSearchResults([]);
        fetchRecentLogs(selectedGymId, selectedCompanyId);
        fetchDashboardData(selectedGymId, selectedCompanyId, myStaffId);
      } else {
        toast.error(result.error || "등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("기존회원 등록 에러:", error);
      toast.error("등록 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddonRegistration = async () => {
    if (!addonForm.customer_name || !addonForm.product_name || !addonForm.amount) {
      toast.warning("고객명, 상품명, 금액은 필수입니다.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/schedule/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "addon",
          gym_id: selectedGymId,
          company_id: selectedCompanyId,
          staff_id: myStaffId,
          data: addonForm
        })
      });
      const result = await response.json();
      if (result.success) {
        toast.success("부가상품이 등록되었습니다!");
        setIsAddonModalOpen(false);
        setAddonForm(initialAddonForm);
        fetchRecentLogs(selectedGymId, selectedCompanyId);
        fetchDashboardData(selectedGymId, selectedCompanyId, myStaffId);
      } else {
        toast.error(result.error || "등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("부가상품 등록 에러:", error);
      toast.error("등록 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 유틸리티 함수들
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const getSalesForMonth = (offset: number) => {
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
    return monthlySalesData[monthKey] || 0;
  };

  const getMonthLabel = (offset: number) => {
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return format(targetDate, "yyyy년 M월", { locale: ko });
  };

  const calculateStatistics = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth();

    switch (statsViewMode) {
      case '3month': {
        let total = 0, count = 0;
        for (let i = 0; i < 3; i++) {
          const targetDate = new Date(currentYear, currentMonthNum - i, 1);
          const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
          if (monthlySalesData[monthKey] !== undefined) {
            total += monthlySalesData[monthKey];
            count++;
          }
        }
        return { label: '최근 3개월 평균', value: count > 0 ? total / count : 0 };
      }
      case '6month': {
        let total = 0, count = 0;
        for (let i = 0; i < 6; i++) {
          const targetDate = new Date(currentYear, currentMonthNum - i, 1);
          const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
          if (monthlySalesData[monthKey] !== undefined) {
            total += monthlySalesData[monthKey];
            count++;
          }
        }
        return { label: '최근 6개월 평균', value: count > 0 ? total / count : 0 };
      }
      case 'firstHalf': {
        let total = 0, count = 0;
        for (let m = 0; m < 6; m++) {
          const monthKey = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
          if (monthlySalesData[monthKey] !== undefined) {
            total += monthlySalesData[monthKey];
            count++;
          }
        }
        return { label: `${currentYear}년 상반기 평균 (1~6월)`, value: count > 0 ? total / count : 0 };
      }
      case 'secondHalf': {
        let total = 0, count = 0;
        for (let m = 6; m < 12; m++) {
          const monthKey = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
          if (monthlySalesData[monthKey] !== undefined) {
            total += monthlySalesData[monthKey];
            count++;
          }
        }
        return { label: `${currentYear}년 하반기 평균 (7~12월)`, value: count > 0 ? total / count : 0 };
      }
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      reserved: "bg-blue-500", completed: "bg-emerald-500", no_show: "bg-gray-400",
      no_show_deducted: "bg-red-500", service: "bg-sky-500"
    };
    return colors[status] || "bg-gray-300";
  };

  // 대시보드 새로고침 (모달 성공 후 호출용)
  const refreshDashboard = () => {
    if (selectedGymId && selectedCompanyId && myStaffId) {
      fetchRecentLogs(selectedGymId, selectedCompanyId);
      fetchDashboardData(selectedGymId, selectedCompanyId, myStaffId);
    }
  };

  return {
    // 사용자 정보
    userName, gymName, userRole,

    // 로딩 상태
    isLoading,

    // 통계 데이터
    stats, todaySchedules, announcements, companyEvents, systemAnnouncements, recentLogs, recentLogsSummary,

    // 달력
    currentMonth, setCurrentMonth, selectedDate, setSelectedDate,
    isEventModalOpen, setIsEventModalOpen,

    // 시스템 공지
    isAnnouncementModalOpen, setIsAnnouncementModalOpen,

    // 센터 현황
    centerStatsMonthOffset, setCenterStatsMonthOffset, statsViewMode, setStatsViewMode,

    // 지점 공지
    selectedBranchAnnouncement, setSelectedBranchAnnouncement,
    isBranchAnnouncementModalOpen, setIsBranchAnnouncementModalOpen,

    // 신규회원 등록
    isNewMemberModalOpen, setIsNewMemberModalOpen,
    newMemberForm, setNewMemberForm,
    handleNewMemberRegistration,

    // 기존회원 등록
    isExistingMemberModalOpen, setIsExistingMemberModalOpen,
    existingMemberForm, setExistingMemberForm,
    memberSearchResults, setMemberSearchResults,
    memberSearchQuery, setMemberSearchQuery,
    searchMembers, handleExistingMemberRegistration,

    // 부가상품 등록
    isAddonModalOpen, setIsAddonModalOpen,
    addonForm, setAddonForm,
    handleAddonRegistration,

    // 상품
    products,

    // 스태프 목록
    staffList,

    // 회원 목록
    members,

    // 지점/회사 정보
    selectedGymId,
    selectedCompanyId,
    myStaffId,

    // 저장 상태
    isSaving,

    // 대시보드 새로고침
    refreshDashboard,

    // 유틸리티
    formatCurrency, getSalesForMonth, getMonthLabel, calculateStatistics, getStatusColor
  };
}
