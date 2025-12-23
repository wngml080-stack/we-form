"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import {
  Users, DollarSign, Calendar, TrendingUp, UserPlus,
  CreditCard, Settings, Plus, Bell, Search, CheckCircle2, ChevronLeft, ChevronRight, Building2, Package, BarChart3, Ghost, UserCheck, History, Clock
} from "lucide-react";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/lib/toast";

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading, gymName: authGymName } = useAuth();
  const { dashboardFilter, isInitialized: filterInitialized } = useAdminFilter();

  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    todaySchedules: 0,
    todaySales: 0,
    monthSales: 0,
    newMembersThisMonth: 0,
    // PT회원 현황
    totalPTMembers: 0,
    activePTMembers: 0,
    ghostMembers: 0 // 30일 이상 미출석
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
  const [centerStatsMonthOffset, setCenterStatsMonthOffset] = useState(0); // 0: 이번달, -1: 저번달, ...
  const [monthlySalesData, setMonthlySalesData] = useState<Record<string, number>>({}); // { "2024-01": 1000000, ... }
  const [statsViewMode, setStatsViewMode] = useState<'monthly' | '3month' | '6month' | 'firstHalf' | 'secondHalf'>('monthly');

  // 지점 공지사항 모달 상태
  const [selectedBranchAnnouncement, setSelectedBranchAnnouncement] = useState<any>(null);
  const [isBranchAnnouncementModalOpen, setIsBranchAnnouncementModalOpen] = useState(false);

  // 등록 모달 상태
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [isExistingMemberModalOpen, setIsExistingMemberModalOpen] = useState(false);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 신규회원 등록 폼
  const [newMemberForm, setNewMemberForm] = useState({
    name: "",
    phone: "",
    membership_type: "PT",
    membership_name: "",
    sessions: "",
    amount: "",
    payment_method: "card",
    memo: ""
  });

  // 기존회원 등록 폼
  const [existingMemberForm, setExistingMemberForm] = useState({
    member_id: "",
    member_name: "",
    membership_type: "PT",
    membership_name: "",
    sessions: "",
    amount: "",
    payment_method: "card",
    memo: ""
  });
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  // 부가등록 폼
  const [addonForm, setAddonForm] = useState({
    customer_name: "",
    customer_phone: "",
    product_name: "",
    amount: "",
    payment_method: "card",
    memo: ""
  });

  // 상품 목록
  const [products, setProducts] = useState<any[]>([]);

  // Supabase 클라이언트 한 번만 생성 (메모이제이션)
  const supabase = useMemo(() => createSupabaseClient(), []);

  // AuthContext에서 사용자 정보 사용
  const userName = user?.name || "관리자";
  const myStaffId = user?.id || "";
  const userRole = user?.role || "";

  // 현재 선택된 회사/지점 정보 (AdminFilterContext)
  const selectedCompanyId = dashboardFilter.selectedCompanyId;
  const selectedGymId = dashboardFilter.selectedGymId;
  const gyms = dashboardFilter.gyms;

  // 현재 선택된 지점명
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

  useEffect(() => {
    if (authLoading || !filterInitialized) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    if (selectedGymId && selectedCompanyId) {
      fetchDashboardData(selectedGymId, selectedCompanyId, user.id);
      fetchProducts(selectedGymId);
    }
    setIsLoading(false);
  }, [authLoading, filterInitialized, selectedGymId, selectedCompanyId, user]);

  const fetchDashboardData = async (gymId: string, companyId: string, staffId: string) => {
    if (!gymId || !companyId) return;

    // 한국 시간 기준 오늘 날짜 계산
    const now = new Date();
    const koreaOffset = 9 * 60; // UTC+9
    const koreaTime = new Date(now.getTime() + (koreaOffset + now.getTimezoneOffset()) * 60000);
    const today = koreaTime.toISOString().split('T')[0];

    const thisMonthStart = new Date(koreaTime.getFullYear(), koreaTime.getMonth(), 1);
    const monthStart = thisMonthStart.toISOString();

    // 12개월 전부터의 매출 데이터를 위한 날짜 계산
    const twelveMonthsAgo = new Date(koreaTime.getFullYear(), koreaTime.getMonth() - 11, 1);
    const twelveMonthsAgoStr = twelveMonthsAgo.toISOString();

    // 오늘 스케줄 쿼리 (시스템관리자는 전체, 일반 직원은 본인 담당만)
    // 한국 시간대(+09:00) 명시하여 정확한 날짜 필터링
    let schedulesQuery = supabase.from("schedules")
      .select("id, member_name, type, status, start_time, end_time, staff_id, staffs(name)")
      .eq("gym_id", gymId)
      .gte("start_time", `${today}T00:00:00+09:00`)
      .lte("start_time", `${today}T23:59:59+09:00`)
      .order("start_time", { ascending: true });

    // 시스템관리자가 아니면 본인 담당 스케줄만
    if (userRole !== "system_admin") {
      schedulesQuery = schedulesQuery.eq("staff_id", staffId);
    }

    // 30일 전 날짜 계산 (유령회원 기준)
    const thirtyDaysAgo = new Date(koreaTime);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    // 시스템 공지사항은 API로 별도 조회 (RLS 우회)
    const fetchSystemAnnouncementsPromise = fetch("/api/admin/system/announcements")
      .then(res => res.json())
      .then(data => data.announcements || [])
      .catch(() => []);

    // 회사 일정 & 행사도 API로 조회 (RLS 우회)
    const fetchCompanyEventsPromise = fetch(`/api/admin/schedule/events?company_id=${companyId}&gym_id=${gymId}`)
      .then(res => res.json())
      .then(data => data.events || [])
      .catch(() => []);

    // 모든 쿼리를 병렬로 실행
    const [
      membersResult,
      schedulesResult,
      todayPaymentsResult,
      monthPaymentsResult,
      announcementsResult,
      eventsResult,
      systemAnnouncementsData,
      historicalPaymentsResult,
      ptMembersResult,
      recentSchedulesResult
    ] = await Promise.all([
      // 1. 회원 통계
      supabase.from("members").select("id, status, created_at").eq("gym_id", gymId).eq("company_id", companyId),
      // 2. 오늘 스케줄
      schedulesQuery,
      // 3. 오늘 매출
      supabase.from("member_payments").select("amount").eq("gym_id", gymId).eq("company_id", companyId).gte("paid_at", `${today}T00:00:00`),
      // 4. 이번달 매출
      supabase.from("member_payments").select("amount").eq("gym_id", gymId).eq("company_id", companyId).gte("paid_at", monthStart),
      // 5. 지점 공지사항 (해당 지점 공지 또는 전사 공지)
      supabase.from("announcements").select("*").eq("company_id", companyId).eq("is_active", true)
        .or(`gym_id.eq.${gymId},gym_id.is.null`)
        .order("priority", { ascending: false }).order("created_at", { ascending: false }).limit(10),
      // 6. 회사 일정 & 행사 (API로 조회 - RLS 우회)
      fetchCompanyEventsPromise,
      // 7. 시스템 공지사항 (API로 조회)
      fetchSystemAnnouncementsPromise,
      // 8. 12개월 매출 데이터 + PT 회원 데이터 (통합 조회)
      supabase.from("member_payments")
        .select("*")
        .eq("gym_id", gymId)
        .eq("company_id", companyId),
      // 9. PT 회원권 데이터 (member_memberships에서 조회)
      supabase.from("member_memberships")
        .select("member_id, name, total_sessions, used_sessions, start_date, end_date, status")
        .eq("gym_id", gymId)
        .eq("status", "active"),
      // 10. 최근 30일 스케줄 (유령회원 계산용)
      supabase.from("schedules")
        .select("member_id, start_time, status")
        .eq("gym_id", gymId)
        .gte("start_time", thirtyDaysAgoStr)
    ]);

    const members = membersResult.data || [];
    const schedules = schedulesResult.data || [];
    const todayPayments = todayPaymentsResult.data || [];
    const monthPayments = monthPaymentsResult.data || [];
    const allPayments = historicalPaymentsResult.data || []; // 통합 데이터
    // 최근 스케줄 - completed, reserved 상태만 필터링 (클라이언트)
    const recentSchedules = (recentSchedulesResult.data || []).filter(
      (s: any) => s.status === "completed" || s.status === "reserved"
    );

    // PT/PPT/GPT 타입 정의
    const ptTypes = ["PT", "PPT", "GPT"];

    // 월별 매출 데이터 정리 (최근 12개월만)
    const monthlySales: Record<string, number> = {};
    const twelveMonthsAgoDate = new Date();
    twelveMonthsAgoDate.setMonth(twelveMonthsAgoDate.getMonth() - 11);
    twelveMonthsAgoDate.setDate(1);

    allPayments.forEach((payment: { amount: string; paid_at: string }) => {
      if (!payment.paid_at) return;
      const paymentDate = new Date(payment.paid_at);
      // 12개월 이내 데이터만 포함
      if (paymentDate >= twelveMonthsAgoDate) {
        const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
        monthlySales[monthKey] = (monthlySales[monthKey] || 0) + parseFloat(payment.amount || "0");
      }
    });
    setMonthlySalesData(monthlySales);

    // PT 회원 통계 계산 (member_memberships 기준)
    // ptMembersResult에서 PT/PPT/GPT 회원권 데이터 사용
    const ptMemberships = (ptMembersResult.data || []) as any[];
    // ptTypes는 위에서 이미 선언됨: ["PT", "PPT", "GPT"]

    // 고유 PT 회원 ID 추출
    const ptMemberIds = new Set<string>();
    const activePtMemberIds = new Set<string>();
    const todayDateObj = new Date(today);

    ptMemberships.forEach((membership: any) => {
      if (!membership.member_id) return;

      const membershipName = (membership.name || "").toString().trim().toUpperCase();
      if (!ptTypes.includes(membershipName)) return;

      ptMemberIds.add(membership.member_id);

      // 잔여 횟수 계산: total_sessions - used_sessions
      const totalSessions = parseInt(membership.total_sessions) || 0;
      const usedSessions = parseInt(membership.used_sessions) || 0;
      const remainingSessions = totalSessions - usedSessions;
      const hasRemainingSessions = remainingSessions > 0;

      const endDate = membership.end_date ? new Date(membership.end_date) : null;
      const isNotExpired = endDate && endDate >= todayDateObj;

      if (hasRemainingSessions || isNotExpired) {
        activePtMemberIds.add(membership.member_id);
      }
    });

    // 최근 30일 내 출석한 회원 ID
    const recentlyActiveMemberIds = new Set<string>();
    recentSchedules.forEach((schedule: any) => {
      if (schedule.member_id) {
        recentlyActiveMemberIds.add(schedule.member_id);
      }
    });

    // 유령회원: 활성 PT회원 중 30일 이상 미출석
    let ghostMemberCount = 0;
    activePtMemberIds.forEach(memberId => {
      if (!recentlyActiveMemberIds.has(memberId)) {
        ghostMemberCount++;
      }
    });

    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.status === 'active').length;
    const newMembersThisMonth = members.filter(m => new Date(m.created_at) >= thisMonthStart).length;
    const todaySales = todayPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const monthSales = monthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    setTodaySchedules(schedules);
    setAnnouncements(announcementsResult.data || []);
    setCompanyEvents(eventsResult || []);
    // 시스템 공지사항 - 활성화된 것만 필터링
    const activeSystemAnnouncements = (systemAnnouncementsData || []).filter((a: any) => a.is_active);
    setSystemAnnouncements(activeSystemAnnouncements);

    setStats({
      totalMembers,
      activeMembers,
      todaySchedules: schedules?.length || 0,
      todaySales,
      monthSales,
      newMembersThisMonth,
      totalPTMembers: ptMemberIds.size,
      activePTMembers: activePtMemberIds.size,
      ghostMembers: ghostMemberCount
    });

    // 최근 등록 로그도 함께 조회
    fetchRecentLogs(gymId, companyId);
  };

  // 최근 등록 로그 조회
  const fetchRecentLogs = async (gymId: string, companyId: string) => {
    try {
      const response = await fetch(`/api/admin/schedule/logs?gym_id=${gymId}&company_id=${companyId}&limit=10`);
      const data = await response.json();
      if (data.success) {
        setRecentLogs(data.logs || []);
      }
    } catch (error) {
      console.error("등록 로그 조회 에러:", error);
    }
  };

  // 회원 검색
  const searchMembers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setMemberSearchResults([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("members")
        .select("id, name, phone")
        .eq("gym_id", selectedGymId)
        .eq("company_id", selectedCompanyId)
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(10);

      if (!error && data) {
        setMemberSearchResults(data);
      }
    } catch (error) {
      console.error("회원 검색 에러:", error);
    }
  };

  // 신규회원 등록
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
        setNewMemberForm({ name: "", phone: "", membership_type: "PT", membership_name: "", sessions: "", amount: "", payment_method: "card", memo: "" });
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

  // 기존회원 등록 (회원권 추가)
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
        setExistingMemberForm({ member_id: "", member_name: "", membership_type: "PT", membership_name: "", sessions: "", amount: "", payment_method: "card", memo: "" });
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

  // 부가상품 등록
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
        setAddonForm({ customer_name: "", customer_phone: "", product_name: "", amount: "", payment_method: "card", memo: "" });
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  // 특정 월의 매출 가져오기
  const getSalesForMonth = (offset: number) => {
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
    return monthlySalesData[monthKey] || 0;
  };

  // 월 레이블 가져오기
  const getMonthLabel = (offset: number) => {
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return format(targetDate, "yyyy년 M월", { locale: ko });
  };

  // 통계 평균 계산
  const calculateStatistics = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (statsViewMode) {
      case '3month': {
        // 최근 3개월 평균
        let total = 0;
        let count = 0;
        for (let i = 0; i < 3; i++) {
          const targetDate = new Date(currentYear, currentMonth - i, 1);
          const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
          if (monthlySalesData[monthKey] !== undefined) {
            total += monthlySalesData[monthKey];
            count++;
          }
        }
        return { label: '최근 3개월 평균', value: count > 0 ? total / count : 0 };
      }
      case '6month': {
        // 최근 6개월 평균
        let total = 0;
        let count = 0;
        for (let i = 0; i < 6; i++) {
          const targetDate = new Date(currentYear, currentMonth - i, 1);
          const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
          if (monthlySalesData[monthKey] !== undefined) {
            total += monthlySalesData[monthKey];
            count++;
          }
        }
        return { label: '최근 6개월 평균', value: count > 0 ? total / count : 0 };
      }
      case 'firstHalf': {
        // 상반기 (1~6월) 평균
        let total = 0;
        let count = 0;
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
        // 하반기 (7~12월) 평균
        let total = 0;
        let count = 0;
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
      reserved: "bg-blue-500",
      completed: "bg-emerald-500",
      no_show: "bg-gray-400",
      no_show_deducted: "bg-red-500",
      service: "bg-sky-500"
    };
    return colors[status] || "bg-gray-300";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-[#2F80ED] rounded-full animate-spin"></div>
      </div>
    );
  }

  const todayDate = new Date().toLocaleDateString('ko-KR', { 
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
  });

  return (
    <div className="space-y-0">
      {/* 흘러가는 시스템 공지 배너 */}
      {systemAnnouncements.length > 0 && (
        <div
          className="py-2.5 overflow-hidden cursor-pointer -mx-4 lg:-mx-6 -mt-4 lg:-mt-6 mb-4 lg:mb-6"
          style={{ background: 'linear-gradient(to right, #2F80ED, #1e5bb8)' }}
          onClick={() => setIsAnnouncementModalOpen(true)}
        >
          <div className="flex whitespace-nowrap animate-marquee-scroll">
            {/* 공지사항 세트 x2 (무한 스크롤용) */}
            {[0, 1].map((setIndex) => (
              <div key={setIndex} className="flex shrink-0 items-center px-4">
                {systemAnnouncements.map((announcement, idx) => (
                  <div key={`${setIndex}-${idx}`} className="flex items-center">
                    <span className="text-white/40 mx-6">◆</span>
                    <span className={`text-white text-xs font-bold px-2 py-0.5 rounded mr-3 ${
                      announcement.priority === 'urgent' ? 'bg-red-500/80' : 'bg-white/20'
                    }`}>
                      {announcement.priority === 'urgent' ? '긴급' :
                       announcement.priority === 'update' ? '업데이트' : '공지'}
                    </span>
                    <span className="text-white font-medium text-sm">
                      {announcement.title}
                    </span>
                    <Bell className="w-4 h-4 text-white/80 ml-3" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-6 lg:space-y-8">

        {/* 1. Welcome Header */}
        <div>
          <div className="text-sm font-medium text-gray-400 mb-1">{todayDate}</div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            {userName}님 즐거운 오후입니다. <span className="text-yellow-500">😊</span>
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
             오늘도 <span className="text-[#2F80ED] font-bold">{gymName}</span>의 성장을 응원합니다!
          </p>
        </div>

      {/* 2. Quick Actions (아이콘 메뉴) */}
      <div className="flex gap-6 md:gap-8 overflow-x-auto pb-2 scrollbar-hide">
        <QuickAction icon={UserPlus} label="신규회원 등록" href="/admin/members?type=new" color="bg-blue-100 text-blue-600" />
        <QuickAction icon={Users} label="기존회원 등록" href="/admin/members?type=existing" color="bg-indigo-100 text-indigo-600" />
        <QuickAction icon={Package} label="매출 등록" href="/admin/sales" color="bg-green-100 text-green-600" />
        <QuickAction icon={Calendar} label="스케줄 관리" href="/admin/schedule" color="bg-purple-100 text-purple-600" />
        <QuickAction icon={CheckCircle2} label="출석 체크" href="/admin/attendance" color="bg-orange-100 text-orange-600" />
      </div>

      {/* 3. Banner Widget - Google Calendar 연동 */}
      <div className="bg-gradient-to-r from-[#0a192f] via-[#172a45] to-[#2F80ED] rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-blue-200 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold">Notice</span>
            <span className="font-medium opacity-90">새로운 기능 업데이트</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: '#ffffff' }}>
            Google Calendar 연동 기능이 추가되었습니다!
          </h3>
          <p className="opacity-90 text-sm md:text-base">이제 외부 캘린더와 스케줄을 동기화하여 더 편리하게 관리하세요.</p>
        </div>
        <button
          onClick={() => {
            // TODO: Google Calendar 연동 페이지로 이동 또는 모달 열기
            toast.info("Google Calendar 연동 기능은 곧 출시됩니다!");
          }}
          className="relative z-10 px-6 py-3 bg-white text-[#0a192f] rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-md whitespace-nowrap"
        >
          지금 연동하기
        </button>

        {/* Deco Circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl"></div>
      </div>

      {/* 4. Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">

        {/* Left Column: PT회원 현황 카드 */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <div className="w-1.5 h-6 bg-[#2F80ED] rounded-full"></div>
                PT회원 현황
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-gray-400 hover:text-[#2F80ED] transition-colors p-1.5 rounded-lg hover:bg-blue-50">
                    <BarChart3 className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white">
                  <DropdownMenuItem
                    onClick={() => setStatsViewMode('monthly')}
                    className={cn("cursor-pointer", statsViewMode === 'monthly' && "bg-blue-50 text-blue-600")}
                  >
                    월별 매출
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatsViewMode('3month')}
                    className={cn("cursor-pointer", statsViewMode === '3month' && "bg-blue-50 text-blue-600")}
                  >
                    최근 3개월 평균
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatsViewMode('6month')}
                    className={cn("cursor-pointer", statsViewMode === '6month' && "bg-blue-50 text-blue-600")}
                  >
                    최근 6개월 평균
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatsViewMode('firstHalf')}
                    className={cn("cursor-pointer", statsViewMode === 'firstHalf' && "bg-blue-50 text-blue-600")}
                  >
                    상반기 평균 (1~6월)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatsViewMode('secondHalf')}
                    className={cn("cursor-pointer", statsViewMode === 'secondHalf' && "bg-blue-50 text-blue-600")}
                  >
                    하반기 평균 (7~12월)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-4">
              <StatRow
                icon={Users}
                label="전체회원"
                value={`${stats.totalPTMembers ?? 0}명`}
                subValue={`총 ${stats.totalMembers ?? 0}명 중`}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                href="/admin/members"
              />
              <StatRow
                icon={UserCheck}
                label="활성회원"
                value={`${stats.activePTMembers ?? 0}명`}
                subValue={`${(stats.totalPTMembers ?? 0) > 0 ? (((stats.activePTMembers ?? 0)/(stats.totalPTMembers ?? 1))*100).toFixed(0) : 0}% 활성`}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                href="/admin/members?status=active"
              />
              <StatRow
                icon={Ghost}
                label="30일 이상 유령회원"
                value={`${stats.ghostMembers ?? 0}명`}
                subValue={(stats.ghostMembers ?? 0) > 0 ? "관리 필요" : "없음"}
                iconBg={(stats.ghostMembers ?? 0) > 0 ? "bg-red-50" : "bg-gray-50"}
                iconColor={(stats.ghostMembers ?? 0) > 0 ? "text-red-500" : "text-gray-400"}
                href="/admin/members?filter=ghost"
              />

              {/* 매출 현황 - 스와이프 또는 평균 통계 */}
              {statsViewMode === 'monthly' ? (
                <div className="relative">
                  <div className="flex items-center justify-between group">
                    <Link href="/admin/sales" className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 font-medium mb-0.5">{getMonthLabel(centerStatsMonthOffset)} 매출</div>
                        <div className="text-lg font-bold text-gray-900">{formatCurrency(getSalesForMonth(centerStatsMonthOffset))}</div>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCenterStatsMonthOffset(prev => prev - 1)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={centerStatsMonthOffset <= -11}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCenterStatsMonthOffset(prev => Math.min(prev + 1, 0))}
                        className={cn(
                          "p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors",
                          centerStatsMonthOffset >= 0 && "opacity-30 cursor-not-allowed"
                        )}
                        disabled={centerStatsMonthOffset >= 0}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {centerStatsMonthOffset !== 0 && (
                    <button
                      onClick={() => setCenterStatsMonthOffset(0)}
                      className="mt-2 text-xs text-blue-500 hover:text-blue-600 font-medium"
                    >
                      이번 달로 돌아가기
                    </button>
                  )}
                </div>
              ) : (
                <Link href="/admin/sales" className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 rounded-xl p-2 -m-2 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 font-medium mb-0.5">{calculateStatistics()?.label}</div>
                      <div className="text-lg font-bold text-gray-900">{formatCurrency(calculateStatistics()?.value || 0)}</div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div className="text-xs font-medium text-purple-500 bg-purple-50 px-2 py-1 rounded-md">
                      평균 통계
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </Link>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#2F80ED]" />
                  지점 공지사항
                </h3>
                <span className="text-xs text-gray-400">{announcements.length}개</span>
             </div>
             <div className="space-y-3">
                {announcements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                    <Bell className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">등록된 지점 공지사항이 없습니다.</p>
                  </div>
                ) : (
                  announcements.map((announcement) => {
                    const priorityColors: Record<string, string> = {
                      urgent: "bg-red-100 text-red-600",
                      normal: "bg-blue-100 text-blue-600",
                      low: "bg-gray-100 text-gray-600"
                    };
                    const priorityLabels: Record<string, string> = {
                      urgent: "긴급",
                      normal: "일반",
                      low: "참고"
                    };

                    return (
                      <div
                        key={announcement.id}
                        className="p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border border-gray-100"
                        onClick={() => {
                          setSelectedBranchAnnouncement(announcement);
                          setIsBranchAnnouncementModalOpen(true);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${priorityColors[announcement.priority]}`}>
                            {priorityLabels[announcement.priority]}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-800 text-sm truncate">{announcement.title}</div>
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">{announcement.content}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(announcement.created_at).toLocaleDateString('ko-KR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
             </div>
          </div>
        </div>

        {/* Center Column: 예정된 업무 (오늘 나의 스케줄) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <span className="text-[#2F80ED] text-2xl">●</span>
              나의 오늘 수업 <span className="text-[#2F80ED]">{todaySchedules.length}</span>
            </h3>
            <Link href="/admin/schedule">
               <span className="text-xs font-bold text-gray-400 hover:text-[#2F80ED] cursor-pointer border px-2 py-1 rounded-md">전체보기</span>
            </Link>
          </div>

          <div className="flex-1 overflow-auto space-y-3 custom-scrollbar pr-2">
            {todaySchedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Calendar className="w-10 h-10 mb-2 opacity-20" />
                <p>오늘 담당하신 수업이 없습니다.</p>
              </div>
            ) : (
              todaySchedules.map((schedule) => (
                <Link
                  key={schedule.id}
                  href={`/admin/schedule?date=${new Date().toISOString().split('T')[0]}&highlight=${schedule.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-blue-50/50 border border-transparent hover:border-blue-100 transition-all group cursor-pointer"
                >
                  <div className="flex flex-col items-center min-w-[50px]">
                    <span className="text-xs font-bold text-[#2F80ED] bg-blue-100 px-2 py-1 rounded-md mb-1">
                      {schedule.type}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-800 flex items-center gap-2">
                      {schedule.member_name} 회원님
                      {schedule.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(schedule.status)}`}></div>
                      {new Date(schedule.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      <span className="text-gray-300">|</span>
                      {schedule.staffs?.name} 강사
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right Column: 회사 일정 & 행사 - 미니 달력 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
               <Calendar className="w-5 h-5 text-[#2F80ED]" />
               회사 일정 & 행사
             </h3>
             <span className="text-xs text-gray-400">{companyEvents.length}개</span>
          </div>

          {/* 달력 네비게이션 */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                const prev = new Date(currentMonth);
                prev.setMonth(prev.getMonth() - 1);
                setCurrentMonth(prev);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-700">
              {format(currentMonth, "yyyy년 M월", { locale: ko })}
            </span>
            <button
              onClick={() => {
                const next = new Date(currentMonth);
                next.setMonth(next.getMonth() + 1);
                setCurrentMonth(next);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* 미니 달력 */}
          <div className="flex-1 overflow-auto custom-scrollbar">
            {(() => {
              const monthStart = startOfMonth(currentMonth);
              const monthEnd = endOfMonth(currentMonth);
              const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
              const startDayOfWeek = monthStart.getDay();

              // 날짜별 행사 맵 생성
              const eventsByDate: Record<string, any[]> = {};
              companyEvents.forEach((event) => {
                const dateKey = event.event_date;
                if (!eventsByDate[dateKey]) {
                  eventsByDate[dateKey] = [];
                }
                eventsByDate[dateKey].push(event);
              });

              const eventTypeColors: Record<string, string> = {
                general: "bg-blue-500",
                training: "bg-purple-500",
                meeting: "bg-orange-500",
                holiday: "bg-red-500",
                celebration: "bg-pink-500"
              };

              return (
                <div>
                  {/* 요일 헤더 */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["일", "월", "화", "수", "목", "금", "토"].map((day, idx) => (
                      <div
                        key={day}
                        className={cn(
                          "text-center text-xs font-semibold py-1",
                          idx === 0 ? "text-red-600" : idx === 6 ? "text-blue-600" : "text-gray-600"
                        )}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* 날짜 그리드 */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* 빈 칸 */}
                    {Array.from({ length: startDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square"></div>
                    ))}

                    {/* 날짜 */}
                    {daysInMonth.map((date) => {
                      const dateKey = format(date, "yyyy-MM-dd");
                      const dayEvents = eventsByDate[dateKey] || [];
                      const isToday = isSameDay(date, new Date());
                      const isCurrentMonth = isSameMonth(date, currentMonth);

                      return (
                        <div
                          key={dateKey}
                          className={cn(
                            "aspect-square p-1 rounded-lg cursor-pointer transition-all relative",
                            isToday && "bg-blue-100 ring-2 ring-blue-500",
                            !isToday && dayEvents.length > 0 && "hover:bg-gray-100",
                            !isToday && dayEvents.length === 0 && "hover:bg-gray-50"
                          )}
                          onClick={() => {
                            setSelectedDate(date);
                            if (dayEvents.length > 0) {
                              setIsEventModalOpen(true);
                            }
                          }}
                        >
                          <div className={cn(
                            "text-xs font-medium text-center",
                            isToday ? "text-blue-700 font-bold" : "text-gray-700",
                            !isCurrentMonth && "text-gray-300"
                          )}>
                            {format(date, "d")}
                          </div>
                          {dayEvents.length > 0 && (
                            <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                              {dayEvents.slice(0, 3).map((event, idx) => (
                                <div
                                  key={idx}
                                  className={cn(
                                    "w-1 h-1 rounded-full",
                                    eventTypeColors[event.event_type] || "bg-gray-400"
                                  )}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

      </div>

      {/* 5. 최근 등록 기록 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-[#2F80ED]" />
            최근 등록 기록
          </h3>
          <span className="text-xs text-gray-400">{recentLogs.length}건</span>
        </div>
        <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
          {recentLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Clock className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">최근 등록 기록이 없습니다.</p>
            </div>
          ) : (
            recentLogs.map((log) => {
              const typeLabels: Record<string, { label: string; color: string }> = {
                new_member: { label: "신규회원", color: "bg-blue-100 text-blue-600" },
                existing_member: { label: "재등록", color: "bg-indigo-100 text-indigo-600" },
                addon: { label: "부가상품", color: "bg-green-100 text-green-600" },
                other: { label: "기타", color: "bg-gray-100 text-gray-600" }
              };
              const typeInfo = typeLabels[log.type] || typeLabels.other;
              const methodLabels: Record<string, string> = {
                card: "카드",
                cash: "현금",
                transfer: "계좌이체"
              };

              return (
                <Link
                  key={log.id}
                  href={log.member_id ? `/admin/members?member=${log.member_id}` : `/admin/sales`}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-blue-50/50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    <div>
                      <div className="font-medium text-gray-800 text-sm">{log.member_name}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <span>{log.membership_type || log.memo}</span>
                        <span className="text-gray-300">|</span>
                        <span>{methodLabels[log.payment_method] || log.payment_method}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-gray-900 text-sm">{formatCurrency(log.amount)}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(log.created_at).toLocaleString('ko-KR', {
                          month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* 선택한 날짜의 행사 모달 */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, "yyyy년 M월 d일 (EEE)", { locale: ko })} 행사
            </DialogTitle>
            <DialogDescription className="sr-only">선택한 날짜의 행사 목록입니다</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {selectedDate && (() => {
              const dateKey = format(selectedDate, "yyyy-MM-dd");
              const dayEvents = companyEvents.filter(event => event.event_date === dateKey);

              const eventTypeColors: Record<string, string> = {
                general: "bg-blue-100 text-blue-600",
                training: "bg-purple-100 text-purple-600",
                meeting: "bg-orange-100 text-orange-600",
                holiday: "bg-red-100 text-red-600",
                celebration: "bg-pink-100 text-pink-600"
              };

              const eventTypeLabels: Record<string, string> = {
                general: "일반",
                training: "교육",
                meeting: "회의",
                holiday: "휴무",
                celebration: "행사"
              };

              if (dayEvents.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Calendar className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">이 날짜에 등록된 행사가 없습니다.</p>
                  </div>
                );
              }

              return dayEvents.map((event) => (
                <div key={event.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${eventTypeColors[event.event_type]}`}>
                      {eventTypeLabels[event.event_type]}
                    </span>
                    {event.gym_id ? (
                      <span className="text-xs text-gray-500">특정 지점</span>
                    ) : (
                      <span className="text-xs text-green-600 font-semibold">전사</span>
                    )}
                  </div>
                  <div className="font-bold text-gray-800 mb-2">{event.title}</div>
                  {event.description && (
                    <div className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{event.description}</div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    {event.start_time && (
                      <span>🕐 {event.start_time.substring(0, 5)}</span>
                    )}
                    {event.location && (
                      <span>📍 {event.location}</span>
                    )}
                  </div>
                </div>
              ));
            })()}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEventModalOpen(false)}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 시스템 공지사항 모달 */}
      <Dialog open={isAnnouncementModalOpen} onOpenChange={setIsAnnouncementModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2F80ED] to-[#56CCF2] flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              시스템 공지사항
            </DialogTitle>
            <DialogDescription className="sr-only">시스템 공지사항 내용입니다</DialogDescription>
          </DialogHeader>

          {systemAnnouncements.length > 0 && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              {systemAnnouncements.map((announcement) => (
                <div key={announcement.id} className={`border rounded-xl p-4 ${
                  announcement.priority === 'urgent' ? 'bg-red-50 border-red-100' :
                  announcement.priority === 'update' ? 'bg-purple-50 border-purple-100' :
                  announcement.priority === 'info' ? 'bg-cyan-50 border-cyan-100' :
                  'bg-blue-50 border-blue-100'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      announcement.priority === 'urgent' ? 'bg-red-500 text-white' :
                      announcement.priority === 'update' ? 'bg-purple-500 text-white' :
                      announcement.priority === 'info' ? 'bg-cyan-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {announcement.priority === 'urgent' ? '긴급' :
                       announcement.priority === 'update' ? '업데이트' :
                       announcement.priority === 'info' ? '안내' : '일반'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {announcement.start_date && new Date(announcement.start_date).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">{announcement.title}</h4>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                    {announcement.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setIsAnnouncementModalOpen(false)}
              className="bg-[#2F80ED] hover:bg-[#2570d6] text-white"
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 지점 공지사항 모달 */}
      <Dialog open={isBranchAnnouncementModalOpen} onOpenChange={setIsBranchAnnouncementModalOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2F80ED] to-[#1c60b8] flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              지점 공지사항
            </DialogTitle>
            <DialogDescription className="sr-only">지점 공지사항 상세 내용입니다</DialogDescription>
          </DialogHeader>

          {selectedBranchAnnouncement && (
            <div className="py-4">
              <div className={`border rounded-xl p-5 ${
                selectedBranchAnnouncement.priority === 'urgent' ? 'bg-red-50 border-red-200' :
                selectedBranchAnnouncement.priority === 'low' ? 'bg-gray-50 border-gray-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                    selectedBranchAnnouncement.priority === 'urgent' ? 'bg-red-500 text-white' :
                    selectedBranchAnnouncement.priority === 'low' ? 'bg-gray-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    {selectedBranchAnnouncement.priority === 'urgent' ? '긴급' :
                     selectedBranchAnnouncement.priority === 'low' ? '참고' : '일반'}
                  </span>
                  {selectedBranchAnnouncement.gym_id ? (
                    <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border">지점 공지</span>
                  ) : (
                    <span className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-0.5 rounded">전사 공지</span>
                  )}
                </div>
                <h4 className="font-bold text-gray-900 text-lg mb-3">{selectedBranchAnnouncement.title}</h4>
                <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed mb-4">
                  {selectedBranchAnnouncement.content}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
                  <span>
                    게시일: {new Date(selectedBranchAnnouncement.start_date || selectedBranchAnnouncement.created_at).toLocaleDateString('ko-KR')}
                  </span>
                  {selectedBranchAnnouncement.end_date && (
                    <span>
                      종료일: {new Date(selectedBranchAnnouncement.end_date).toLocaleDateString('ko-KR')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setIsBranchAnnouncementModalOpen(false)}
              className="bg-[#2F80ED] hover:bg-[#2570d6] text-white"
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 신규회원 등록 모달 */}
      <Dialog open={isNewMemberModalOpen} onOpenChange={setIsNewMemberModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              신규회원 등록
            </DialogTitle>
            <DialogDescription className="sr-only">신규 회원을 등록합니다</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>이름 *</Label>
                <Input
                  value={newMemberForm.name}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                  placeholder="홍길동"
                />
              </div>
              <div>
                <Label>연락처 *</Label>
                <Input
                  value={newMemberForm.phone}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                  placeholder="010-1234-5678"
                />
              </div>
            </div>
            <div>
              <Label>상품 선택 *</Label>
              <Select
                value={newMemberForm.membership_name}
                onValueChange={(productId) => {
                  const product = products.find(p => p.id === productId);
                  if (product) {
                    setNewMemberForm({
                      ...newMemberForm,
                      membership_type: product.membership_type,
                      membership_name: product.id,
                      sessions: product.default_sessions?.toString() || "",
                      amount: product.default_price?.toString() || ""
                    });
                  }
                }}
              >
                <SelectTrigger><SelectValue placeholder="상품을 선택하세요" /></SelectTrigger>
                <SelectContent>
                  {products.length === 0 ? (
                    <SelectItem value="" disabled>등록된 상품이 없습니다</SelectItem>
                  ) : (
                    products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.membership_type}) - {product.default_price?.toLocaleString()}원
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {products.length === 0 && (
                <p className="text-xs text-orange-500 mt-1">매출관리 &gt; 상품관리에서 상품을 먼저 등록해주세요.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>횟수</Label>
                <Input
                  type="number"
                  value={newMemberForm.sessions}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, sessions: e.target.value })}
                  placeholder="30"
                />
              </div>
              <div>
                <Label>결제금액 *</Label>
                <Input
                  type="number"
                  value={newMemberForm.amount}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, amount: e.target.value })}
                  placeholder="1000000"
                />
              </div>
            </div>
            <div>
              <Label>결제방법</Label>
              <Select value={newMemberForm.payment_method} onValueChange={(v) => setNewMemberForm({ ...newMemberForm, payment_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">카드</SelectItem>
                  <SelectItem value="cash">현금</SelectItem>
                  <SelectItem value="transfer">계좌이체</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>메모</Label>
              <Input
                value={newMemberForm.memo}
                onChange={(e) => setNewMemberForm({ ...newMemberForm, memo: e.target.value })}
                placeholder="특이사항"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewMemberModalOpen(false)}>취소</Button>
            <Button onClick={handleNewMemberRegistration} disabled={isSaving}>
              {isSaving ? "등록 중..." : "등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 기존회원 등록 모달 */}
      <Dialog open={isExistingMemberModalOpen} onOpenChange={setIsExistingMemberModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              기존회원 등록
            </DialogTitle>
            <DialogDescription className="sr-only">기존 회원에게 회원권을 추가합니다</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>회원 검색 *</Label>
              <Input
                value={memberSearchQuery}
                onChange={(e) => {
                  setMemberSearchQuery(e.target.value);
                  searchMembers(e.target.value);
                }}
                placeholder="이름 또는 전화번호로 검색"
              />
              {memberSearchResults.length > 0 && (
                <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
                  {memberSearchResults.map((member) => (
                    <div
                      key={member.id}
                      className="p-2 hover:bg-blue-50 cursor-pointer flex justify-between"
                      onClick={() => {
                        setExistingMemberForm({ ...existingMemberForm, member_id: member.id, member_name: member.name });
                        setMemberSearchQuery(member.name);
                        setMemberSearchResults([]);
                      }}
                    >
                      <span className="font-medium">{member.name}</span>
                      <span className="text-gray-400 text-sm">{member.phone}</span>
                    </div>
                  ))}
                </div>
              )}
              {existingMemberForm.member_id && (
                <div className="mt-2 text-sm text-green-600">선택됨: {existingMemberForm.member_name}</div>
              )}
            </div>
            <div>
              <Label>상품 선택 *</Label>
              <Select
                value={existingMemberForm.membership_name}
                onValueChange={(productId) => {
                  const product = products.find(p => p.id === productId);
                  if (product) {
                    setExistingMemberForm({
                      ...existingMemberForm,
                      membership_type: product.membership_type,
                      membership_name: product.id,
                      sessions: product.default_sessions?.toString() || "",
                      amount: product.default_price?.toString() || ""
                    });
                  }
                }}
              >
                <SelectTrigger><SelectValue placeholder="상품을 선택하세요" /></SelectTrigger>
                <SelectContent>
                  {products.length === 0 ? (
                    <SelectItem value="" disabled>등록된 상품이 없습니다</SelectItem>
                  ) : (
                    products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.membership_type}) - {product.default_price?.toLocaleString()}원
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {products.length === 0 && (
                <p className="text-xs text-orange-500 mt-1">매출관리 &gt; 상품관리에서 상품을 먼저 등록해주세요.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>횟수</Label>
                <Input
                  type="number"
                  value={existingMemberForm.sessions}
                  onChange={(e) => setExistingMemberForm({ ...existingMemberForm, sessions: e.target.value })}
                  placeholder="30"
                />
              </div>
              <div>
                <Label>결제금액 *</Label>
                <Input
                  type="number"
                  value={existingMemberForm.amount}
                  onChange={(e) => setExistingMemberForm({ ...existingMemberForm, amount: e.target.value })}
                  placeholder="1000000"
                />
              </div>
            </div>
            <div>
              <Label>결제방법</Label>
              <Select value={existingMemberForm.payment_method} onValueChange={(v) => setExistingMemberForm({ ...existingMemberForm, payment_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">카드</SelectItem>
                  <SelectItem value="cash">현금</SelectItem>
                  <SelectItem value="transfer">계좌이체</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>메모</Label>
              <Input
                value={existingMemberForm.memo}
                onChange={(e) => setExistingMemberForm({ ...existingMemberForm, memo: e.target.value })}
                placeholder="특이사항"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExistingMemberModalOpen(false)}>취소</Button>
            <Button onClick={handleExistingMemberRegistration} disabled={isSaving}>
              {isSaving ? "등록 중..." : "등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 부가상품 등록 모달 */}
      <Dialog open={isAddonModalOpen} onOpenChange={setIsAddonModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              회원이외 부가등록
            </DialogTitle>
            <DialogDescription className="sr-only">부가상품을 등록합니다</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>고객명 *</Label>
                <Input
                  value={addonForm.customer_name}
                  onChange={(e) => setAddonForm({ ...addonForm, customer_name: e.target.value })}
                  placeholder="홍길동"
                />
              </div>
              <div>
                <Label>연락처</Label>
                <Input
                  value={addonForm.customer_phone}
                  onChange={(e) => setAddonForm({ ...addonForm, customer_phone: e.target.value })}
                  placeholder="010-1234-5678"
                />
              </div>
            </div>
            <div>
              <Label>상품명 *</Label>
              <Input
                value={addonForm.product_name}
                onChange={(e) => setAddonForm({ ...addonForm, product_name: e.target.value })}
                placeholder="운동복, 프로틴 등"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>금액 *</Label>
                <Input
                  type="number"
                  value={addonForm.amount}
                  onChange={(e) => setAddonForm({ ...addonForm, amount: e.target.value })}
                  placeholder="50000"
                />
              </div>
              <div>
                <Label>결제방법</Label>
                <Select value={addonForm.payment_method} onValueChange={(v) => setAddonForm({ ...addonForm, payment_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">카드</SelectItem>
                    <SelectItem value="cash">현금</SelectItem>
                    <SelectItem value="transfer">계좌이체</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>메모</Label>
              <Input
                value={addonForm.memo}
                onChange={(e) => setAddonForm({ ...addonForm, memo: e.target.value })}
                placeholder="특이사항"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddonModalOpen(false)}>취소</Button>
            <Button onClick={handleAddonRegistration} disabled={isSaving}>
              {isSaving ? "등록 중..." : "등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

// Sub Components

function QuickAction({ icon: Icon, label, href, color, disabled }: { icon: any, label: string, href: string, color: string, disabled?: boolean }) {
  if (disabled) {
    return (
      <div className="flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${color} flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <span className="text-xs font-bold text-gray-400 text-center leading-tight">{label}</span>
      </div>
    );
  }
  return (
    <Link href={href} className="flex flex-col items-center gap-2 group">
      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <span className="text-xs font-bold text-gray-600 group-hover:text-[#2F80ED] transition-colors text-center leading-tight">{label}</span>
    </Link>
  );
}

function QuickActionButton({ icon: Icon, label, onClick, color }: { icon: any, label: string, onClick: () => void, color: string }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group">
      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <span className="text-xs font-bold text-gray-600 group-hover:text-[#2F80ED] transition-colors text-center leading-tight">{label}</span>
    </button>
  );
}

function StatRow({ icon: Icon, label, value, subValue, iconBg, iconColor, href, onClick }: any) {
  const content = (
    <div className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 rounded-xl p-2 -m-2 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <div className="text-xs text-gray-400 font-medium mb-0.5">{label}</div>
          <div className="text-lg font-bold text-gray-900">{value}</div>
        </div>
      </div>
      <div className="text-right flex items-center gap-2">
        <div className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
           {subValue}
        </div>
        {(href || onClick) && (
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  if (onClick) {
    return <button onClick={onClick} className="w-full text-left">{content}</button>;
  }
  return content;
}
