"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { toast } from "@/lib/toast";

export interface BranchStats {
  totalMembers: number;
  activeMembers: number;
  monthlyRevenue: number;
  fcBep: number;
  ptBep: number;
  fcProgress: number;
  ptProgress: number;
}

export interface FcStats {
  bep: number;
  totalSales: number;
  bepRate: number;
  avgPrice: number;
  totalCount: number;
  walkinCount: number;
  onlineCount: number;
  renewCount: number;
  newRate: number;
  newSales: number;
}

export interface PtStats {
  bep: number;
  totalSales: number;
  bepRate: number;
  avgPrice: number;
  totalCount: number;
  newCount: number;
  renewCount: number;
  renewRate: number;
  newSales: number;
  renewSales: number;
}

export interface SalesSummary {
  totalRevenue: number;
  fcRevenue: number;
  ptRevenue: number;
  fcCount: number;
  ptCount: number;
  otherRevenue: number;
  otherCount: number;
}

export interface ComparisonData {
  prevMonth: { fcSales: number; ptSales: number; totalSales: number; fcCount: number; ptCount: number };
  prevYear: { fcSales: number; ptSales: number; totalSales: number; fcCount: number; ptCount: number };
}

export interface AnnouncementForm {
  title: string;
  content: string;
  priority: string;
  gym_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface BranchAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: "urgent" | "normal" | "low";
  gym_id: string | null;
  company_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  view_count?: number;
  gyms?: { name: string } | null;
  staffs?: { name: string } | null;
}

export interface GymInfo {
  id: string;
  name: string;
  fc_bep?: number;
  pt_bep?: number;
}

export type SalesPeriod = "thisMonth" | "lastMonth" | "custom";
export type SalesType = "all" | "fc" | "pt";

export function useBranchData() {
  const { user, isLoading: authLoading } = useAuth();
  const { branchFilter, isInitialized: filterInitialized } = useAdminFilter();

  const selectedGymId = branchFilter.selectedGymId;
  const selectedCompanyId = branchFilter.selectedCompanyId;
  const gyms = branchFilter.gyms;

  const [gymData, setGymData] = useState<GymInfo | null>(null);
  const [stats, setStats] = useState<BranchStats>({
    totalMembers: 0,
    activeMembers: 0,
    monthlyRevenue: 0,
    fcBep: 0,
    ptBep: 0,
    fcProgress: 0,
    ptProgress: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Announcement management
  const [announcements, setAnnouncements] = useState<BranchAnnouncement[]>([]);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<BranchAnnouncement | null>(null);
  const [announcementForm, setAnnouncementForm] = useState<AnnouncementForm>({
    title: "",
    content: "",
    priority: "normal",
    gym_id: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    is_active: true
  });

  // Calendar related state
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDateAnnouncementsModalOpen, setIsDateAnnouncementsModalOpen] = useState(false);

  // 매출 통계 모달
  const [isFcModalOpen, setIsFcModalOpen] = useState(false);
  const [isPtModalOpen, setIsPtModalOpen] = useState(false);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>("thisMonth");
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [detailedSales, setDetailedSales] = useState<any[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary>({
    totalRevenue: 0,
    fcRevenue: 0,
    ptRevenue: 0,
    fcCount: 0,
    ptCount: 0,
    otherRevenue: 0,
    otherCount: 0
  });
  const [fcStats, setFcStats] = useState<FcStats>({
    bep: 0,
    totalSales: 0,
    bepRate: 0,
    avgPrice: 0,
    totalCount: 0,
    walkinCount: 0,
    onlineCount: 0,
    renewCount: 0,
    newRate: 0,
    newSales: 0
  });
  const [ptStats, setPtStats] = useState<PtStats>({
    bep: 0,
    totalSales: 0,
    bepRate: 0,
    avgPrice: 0,
    totalCount: 0,
    newCount: 0,
    renewCount: 0,
    renewRate: 0,
    newSales: 0,
    renewSales: 0
  });
  const [salesLoading, setSalesLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState<ComparisonData>({
    prevMonth: { fcSales: 0, ptSales: 0, totalSales: 0, fcCount: 0, ptCount: 0 },
    prevYear: { fcSales: 0, ptSales: 0, totalSales: 0, fcCount: 0, ptCount: 0 }
  });

  const supabase = useMemo(() => createSupabaseClient(), []);
  const gymName = gyms.find(g => g.id === selectedGymId)?.name || "We:form";

  const getDateRange = useCallback((period: SalesPeriod) => {
    const now = new Date();
    if (period === "thisMonth") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start, end };
    } else if (period === "lastMonth") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start, end };
    } else {
      return {
        start: new Date(customDateRange.start),
        end: new Date(customDateRange.end)
      };
    }
  }, [customDateRange]);

  const isPT = useCallback((payment: any) => {
    const membershipType = payment.membership_type || '';
    return membershipType.toUpperCase().includes('PT');
  }, []);

  const fetchBranchData = useCallback(async (gymId: string, companyId: string, gym: any) => {
    if (!gymId || !companyId) return;

    const { data: members } = await supabase
      .from("members")
      .select("id, status")
      .eq("gym_id", gymId)
      .eq("company_id", companyId);

    const totalMembers = members?.length || 0;
    const activeMembers = members?.filter(m => m.status === 'active').length || 0;

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const { data: salesData } = await supabase
      .from("member_payments")
      .select("amount, membership_type")
      .eq("gym_id", gymId)
      .gte("paid_at", thisMonthStart.toISOString());

    const monthlyRevenue = salesData?.reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0) || 0;

    const fcRevenue = salesData?.filter(s => s.membership_type === 'membership' || s.membership_type === 'FC')
      .reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0) || 0;
    const ptRevenue = salesData?.filter(s => s.membership_type === 'pt' || s.membership_type === 'PT')
      .reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0) || 0;

    const fcBep = gym.fc_bep || 75000000;
    const ptBep = gym.pt_bep || 100000000;

    setStats({
      totalMembers,
      activeMembers,
      monthlyRevenue,
      fcBep,
      ptBep,
      fcProgress: fcBep > 0 ? (fcRevenue / fcBep) * 100 : 0,
      ptProgress: ptBep > 0 ? (ptRevenue / ptBep) * 100 : 0,
    });
  }, [supabase]);

  const fetchAnnouncements = useCallback(async (companyId: string, gymId: string) => {
    if (!companyId || !gymId) return;

    const { data: announcementsData } = await supabase
      .from("announcements")
      .select("*, gyms(name), staffs(name)")
      .eq("company_id", companyId)
      .or(`gym_id.is.null,gym_id.eq.${gymId}`)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    if (announcementsData) setAnnouncements(announcementsData);
  }, [supabase]);

  const openAnnouncementModal = useCallback((announcement: any = null) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setAnnouncementForm({
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        gym_id: announcement.gym_id || selectedGymId,
        start_date: announcement.start_date,
        end_date: announcement.end_date || "",
        is_active: announcement.is_active
      });
    } else {
      setEditingAnnouncement(null);
      setAnnouncementForm({
        title: "",
        content: "",
        priority: "normal",
        gym_id: selectedGymId,
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
        is_active: true
      });
    }
    setIsAnnouncementModalOpen(true);
  }, [selectedGymId]);

  const handleSaveAnnouncement = useCallback(async () => {
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      toast.warning("제목과 내용을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      if (!selectedCompanyId) throw new Error("회사 정보를 찾을 수 없습니다.");
      if (!user) throw new Error("로그인 정보를 찾을 수 없습니다.");

      const announcementData = {
        company_id: selectedCompanyId,
        gym_id: announcementForm.gym_id,
        title: announcementForm.title,
        content: announcementForm.content,
        priority: announcementForm.priority,
        start_date: announcementForm.start_date,
        end_date: announcementForm.end_date || null,
        is_active: announcementForm.is_active,
        author_id: user.id
      };

      if (editingAnnouncement) {
        const { error } = await supabase
          .from("announcements")
          .update(announcementData)
          .eq("id", editingAnnouncement.id);

        if (error) throw error;
        toast.success("지점 공지사항이 수정되었습니다.");
      } else {
        const { error } = await supabase
          .from("announcements")
          .insert(announcementData);

        if (error) throw error;
        toast.success("지점 공지사항이 등록되었습니다.");
      }

      setIsAnnouncementModalOpen(false);
      await fetchAnnouncements(selectedCompanyId, selectedGymId);
    } catch (error: any) {
      toast.error("오류: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [announcementForm, editingAnnouncement, fetchAnnouncements, selectedCompanyId, selectedGymId, supabase, user]);

  const handleToggleAnnouncementActive = useCallback(async (announcement: any) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: !announcement.is_active })
        .eq("id", announcement.id);

      if (error) throw error;
      await fetchAnnouncements(selectedCompanyId, selectedGymId);
    } catch (error: any) {
      toast.error("오류: " + error.message);
    }
  }, [fetchAnnouncements, selectedCompanyId, selectedGymId, supabase]);

  const handleDeleteAnnouncement = useCallback(async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("지점 공지사항이 삭제되었습니다.");
      await fetchAnnouncements(selectedCompanyId, selectedGymId);
    } catch (error: any) {
      toast.error("오류: " + error.message);
    }
  }, [fetchAnnouncements, selectedCompanyId, selectedGymId, supabase]);

  const fetchDetailedSales = useCallback(async (type: SalesType, period: SalesPeriod) => {
    setSalesLoading(true);

    if (!selectedGymId || !selectedCompanyId) {
      setSalesLoading(false);
      return;
    }

    const { start, end } = getDateRange(period);

    const { data: salesData } = await supabase
      .from("member_payments")
      .select("*, members(name, phone)")
      .eq("gym_id", selectedGymId)
      .eq("company_id", selectedCompanyId)
      .gte("paid_at", start.toISOString())
      .lte("paid_at", end.toISOString())
      .order("paid_at", { ascending: false });

    if (salesData) {
      const ptPayments = salesData.filter(p => isPT(p));
      const fcPayments = salesData.filter(p => !isPT(p));

      if (type === "fc") {
        setDetailedSales(fcPayments);
      } else if (type === "pt") {
        setDetailedSales(ptPayments);
      } else {
        setDetailedSales(salesData);
      }

      // FC 통계 계산
      const fcTotalSales = fcPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const fcNewPayments = fcPayments.filter(p => p.registration_type === '신규');
      const fcRenewPayments = fcPayments.filter(p => p.registration_type === '리뉴');
      const fcNewSales = fcNewPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const fcOnlineCount = fcPayments.filter(p => {
        const route = (p.visit_route || '').toLowerCase();
        return route.includes('인터넷') || route.includes('네이버') || route.includes('온라인') || route.includes('비대면');
      }).length;
      const fcWalkinCount = fcPayments.length - fcOnlineCount;
      const fcAvgPrice = fcPayments.length > 0 ? fcTotalSales / fcPayments.length : 0;
      const fcNewRate = fcPayments.length > 0 ? (fcNewPayments.length / fcPayments.length * 100) : 0;
      const fcBep = gymData?.fc_bep || 75000000;
      const fcBepRate = fcBep > 0 ? (fcTotalSales / fcBep * 100) : 0;

      setFcStats({
        bep: fcBep,
        totalSales: fcTotalSales,
        bepRate: fcBepRate,
        avgPrice: fcAvgPrice,
        totalCount: fcPayments.length,
        walkinCount: fcWalkinCount,
        onlineCount: fcOnlineCount,
        renewCount: fcRenewPayments.length,
        newRate: fcNewRate,
        newSales: fcNewSales
      });

      // PT 통계 계산
      const ptTotalSales = ptPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const ptNewPayments = ptPayments.filter(p => p.registration_type === '신규');
      const ptRenewPayments = ptPayments.filter(p => p.registration_type === '리뉴');
      const ptNewSales = ptNewPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const ptRenewSales = ptRenewPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const ptAvgPrice = ptPayments.length > 0 ? ptTotalSales / ptPayments.length : 0;
      const ptRenewRate = ptPayments.length > 0 ? (ptRenewPayments.length / ptPayments.length * 100) : 0;
      const ptBep = gymData?.pt_bep || 100000000;
      const ptBepRate = ptBep > 0 ? (ptTotalSales / ptBep * 100) : 0;

      setPtStats({
        bep: ptBep,
        totalSales: ptTotalSales,
        bepRate: ptBepRate,
        avgPrice: ptAvgPrice,
        totalCount: ptPayments.length,
        newCount: ptNewPayments.length,
        renewCount: ptRenewPayments.length,
        renewRate: ptRenewRate,
        newSales: ptNewSales,
        renewSales: ptRenewSales
      });

      setSalesSummary({
        totalRevenue: salesData.reduce((sum, s) => sum + (Number(s.amount) || 0), 0),
        fcRevenue: fcTotalSales,
        ptRevenue: ptTotalSales,
        fcCount: fcPayments.length,
        ptCount: ptPayments.length,
        otherRevenue: 0,
        otherCount: 0
      });

      // 비교 데이터 fetch
      const now = new Date();
      const currentMonth = period === "thisMonth" ? now.getMonth() : period === "lastMonth" ? now.getMonth() - 1 : new Date(customDateRange.start).getMonth();
      const currentYear = period === "thisMonth" ? now.getFullYear() : period === "lastMonth" ? now.getFullYear() : new Date(customDateRange.start).getFullYear();

      const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
      const prevMonthEnd = new Date(currentYear, currentMonth, 0);
      const prevYearStart = new Date(currentYear - 1, currentMonth, 1);
      const prevYearEnd = new Date(currentYear - 1, currentMonth + 1, 0);

      const { data: prevMonthData } = await supabase
        .from("member_payments")
        .select("membership_type, amount")
        .eq("gym_id", selectedGymId)
        .eq("company_id", selectedCompanyId)
        .gte("paid_at", prevMonthStart.toISOString())
        .lte("paid_at", prevMonthEnd.toISOString());

      const { data: prevYearData } = await supabase
        .from("member_payments")
        .select("membership_type, amount")
        .eq("gym_id", selectedGymId)
        .eq("company_id", selectedCompanyId)
        .gte("paid_at", prevYearStart.toISOString())
        .lte("paid_at", prevYearEnd.toISOString());

      const prevMonthPt = prevMonthData?.filter(p => isPT(p)) || [];
      const prevMonthFc = prevMonthData?.filter(p => !isPT(p)) || [];
      const prevMonthFcSales = prevMonthFc.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const prevMonthPtSales = prevMonthPt.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      const prevYearPt = prevYearData?.filter(p => isPT(p)) || [];
      const prevYearFc = prevYearData?.filter(p => !isPT(p)) || [];
      const prevYearFcSales = prevYearFc.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const prevYearPtSales = prevYearPt.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      setComparisonData({
        prevMonth: {
          fcSales: prevMonthFcSales,
          ptSales: prevMonthPtSales,
          totalSales: prevMonthFcSales + prevMonthPtSales,
          fcCount: prevMonthFc.length,
          ptCount: prevMonthPt.length
        },
        prevYear: {
          fcSales: prevYearFcSales,
          ptSales: prevYearPtSales,
          totalSales: prevYearFcSales + prevYearPtSales,
          fcCount: prevYearFc.length,
          ptCount: prevYearPt.length
        }
      });
    }

    setSalesLoading(false);
  }, [customDateRange, getDateRange, gymData, isPT, selectedCompanyId, selectedGymId, supabase]);

  const openFcModal = useCallback(() => {
    setSalesPeriod("thisMonth");
    fetchDetailedSales("fc", "thisMonth");
    setIsFcModalOpen(true);
  }, [fetchDetailedSales]);

  const openPtModal = useCallback(() => {
    setSalesPeriod("thisMonth");
    fetchDetailedSales("pt", "thisMonth");
    setIsPtModalOpen(true);
  }, [fetchDetailedSales]);

  const openSalesModal = useCallback(() => {
    setSalesPeriod("thisMonth");
    fetchDetailedSales("all", "thisMonth");
    setIsSalesModalOpen(true);
  }, [fetchDetailedSales]);

  const handlePeriodChange = useCallback((type: SalesType, newPeriod: SalesPeriod) => {
    setSalesPeriod(newPeriod);
    if (newPeriod !== "custom") {
      fetchDetailedSales(type, newPeriod);
    }
  }, [fetchDetailedSales]);

  // 초기 데이터 로드
  useEffect(() => {
    if (authLoading || !filterInitialized) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    if (selectedGymId && selectedCompanyId) {
      const selectedGym = gyms.find(g => g.id === selectedGymId);
      if (selectedGym) {
        setGymData(selectedGym);
        fetchBranchData(selectedGymId, selectedCompanyId, selectedGym);
        fetchAnnouncements(selectedCompanyId, selectedGymId);
      }
    }

    setIsLoading(false);
  }, [authLoading, fetchAnnouncements, fetchBranchData, filterInitialized, gyms, selectedCompanyId, selectedGymId, user]);

  return {
    // Auth & Filter
    user,
    selectedGymId,
    selectedCompanyId,
    gyms,
    gymName,
    gymData,

    // Loading states
    isLoading,
    salesLoading,

    // Stats
    stats,
    fcStats,
    ptStats,
    salesSummary,
    comparisonData,
    detailedSales,

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
    setSalesPeriod,
    customDateRange,
    setCustomDateRange,
    openFcModal,
    openPtModal,
    openSalesModal,
    handlePeriodChange,
    fetchDetailedSales,
  };
}
