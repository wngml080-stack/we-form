"use client";

import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Users, DollarSign, Calendar,
  ChevronRight, Target, Award, BarChart3, Bell, Plus, Pencil, Trash2, Activity, TrendingUp, Search
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { HelpTooltip } from "@/components/ui/help-tooltip";

export default function BranchManagementPage() {
  // AuthContext에서 사용자 정보 가져오기
  const { user, isLoading: authLoading, companyName: authCompanyName, gymName: authGymName, gyms: authGyms, companies: authCompanies } = useAuth();

  const [gymName, setGymName] = useState("");
  const [gymData, setGymData] = useState<any>(null);
  const [stats, setStats] = useState({
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
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
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

  // Gym and company IDs
  const [gymId, setGymId] = useState<string>("");
  const [companyId, setCompanyId] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const myRole = user?.role || "";
  const myGymId = user?.gym_id || "";

  // system_admin용 회사 목록
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  // 지점 필터 (gyms, companies는 AuthContext에서 가져옴)
  const [selectedGymId, setSelectedGymId] = useState<string>("");
  const gyms = authGyms;
  const companies = authCompanies;

  // 매출 통계 모달
  const [isFcModalOpen, setIsFcModalOpen] = useState(false);
  const [isPtModalOpen, setIsPtModalOpen] = useState(false);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [salesPeriod, setSalesPeriod] = useState<"thisMonth" | "lastMonth" | "custom">("thisMonth");
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [detailedSales, setDetailedSales] = useState<any[]>([]);
  const [salesSummary, setSalesSummary] = useState({
    totalRevenue: 0,
    fcRevenue: 0,
    ptRevenue: 0,
    fcCount: 0,
    ptCount: 0,
    otherRevenue: 0,
    otherCount: 0
  });
  const [fcStats, setFcStats] = useState({
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
  const [ptStats, setPtStats] = useState({
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

  // 비교 데이터 (전월, 전년 동월)
  const [comparisonData, setComparisonData] = useState({
    prevMonth: { fcSales: 0, ptSales: 0, totalSales: 0, fcCount: 0, ptCount: 0 },
    prevYear: { fcSales: 0, ptSales: 0, totalSales: 0, fcCount: 0, ptCount: 0 }
  });

  const supabase = createSupabaseClient();

  // AuthContext 데이터가 로드되면 초기화
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    // AuthContext에서 데이터 설정
    setCompanyId(user.company_id);
    setCompanyName(authCompanyName);

    if (user.role === 'system_admin') {
      setSelectedCompanyId(user.company_id);
    }

    // 내 지점 정보 찾기
    const myGym = gyms.find((g: any) => g.id === user.gym_id);

    if (myGym) {
      setGymName(myGym.name ?? "");
      setGymData(myGym);
      setGymId(user.gym_id);
      setSelectedGymId(user.gym_id);
      fetchBranchData(user.gym_id, user.company_id, myGym);
      fetchAnnouncements(user.company_id, user.gym_id);
    } else if (gyms.length > 0) {
      // 지점이 없으면 첫 번째 지점 선택
      const firstGym = gyms[0];
      setGymName(firstGym.name ?? "");
      setGymData(firstGym);
      setGymId(firstGym.id);
      setSelectedGymId(firstGym.id);
      fetchBranchData(firstGym.id, user.company_id, firstGym);
      fetchAnnouncements(user.company_id, firstGym.id);
    }

    setIsLoading(false);
  }, [authLoading, user, gyms]);

  // system_admin이 회사를 변경했을 때 (AuthContext에서 처리하므로 간단히)
  useEffect(() => {
    if (selectedCompanyId && myRole === 'system_admin') {
      const selectedCompany = companies.find(c => c.id === selectedCompanyId);
      if (selectedCompany) {
        setCompanyName(selectedCompany.name);
      }
    }
  }, [selectedCompanyId, companies, myRole]);

  // 지점 선택이 변경되었을 때 데이터 다시 가져오기
  useEffect(() => {
    if (selectedGymId && companyId) {
      const targetCompanyId = myRole === 'system_admin' ? selectedCompanyId : companyId;
      const selectedGym = gyms.find(g => g.id === selectedGymId);
      if (selectedGym) {
        setGymName(selectedGym.name);
        setGymData(selectedGym);
        fetchBranchData(selectedGymId, targetCompanyId, selectedGym);
        fetchAnnouncements(targetCompanyId, selectedGymId);
      }
    }
  }, [selectedGymId]);

  const fetchBranchData = async (gymId: string, companyId: string, gym: any) => {
    if (!gymId || !companyId) return;

    // 회원 통계
    const { data: members } = await supabase
      .from("members")
      .select("id, status")
      .eq("gym_id", gymId)
      .eq("company_id", companyId);

    const totalMembers = members?.length || 0;
    const activeMembers = members?.filter(m => m.status === 'active').length || 0;

    // 이번 달 매출 (간단 계산)
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const { data: salesData } = await supabase
      .from("member_payments")
      .select("amount, membership_type")
      .eq("gym_id", gymId)
      .gte("paid_at", thisMonthStart.toISOString());

    const monthlyRevenue = salesData?.reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0) || 0;

    // FC/PT 매출 분리
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
  };

  // Fetch announcements for this branch
  const fetchAnnouncements = async (companyId: string, gymId: string) => {
    if (!companyId || !gymId) return;

    const { data: announcementsData } = await supabase
      .from("announcements")
      .select("*, gyms(name), staffs(name)")
      .eq("company_id", companyId)
      .or(`gym_id.is.null,gym_id.eq.${gymId}`)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    if (announcementsData) setAnnouncements(announcementsData);
  };

  // Open announcement modal for create/edit
  const openAnnouncementModal = (announcement: any = null) => {
    if (announcement) {
      // Edit mode
      setEditingAnnouncement(announcement);
      setAnnouncementForm({
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        gym_id: announcement.gym_id || gymId,
        start_date: announcement.start_date,
        end_date: announcement.end_date || "",
        is_active: announcement.is_active
      });
    } else {
      // Create mode
      setEditingAnnouncement(null);
      setAnnouncementForm({
        title: "",
        content: "",
        priority: "normal",
        gym_id: gymId,
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
        is_active: true
      });
    }
    setIsAnnouncementModalOpen(true);
  };

  // Save announcement (create or update)
  const handleSaveAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      return alert("제목과 내용을 입력해주세요.");
    }

    setIsLoading(true);
    try {
      if (!companyId) {
        throw new Error("회사 정보를 찾을 수 없습니다.");
      }

      // Get current user's staff info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인 정보를 찾을 수 없습니다.");

      const { data: me } = await supabase
        .from("staffs")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!me) throw new Error("사용자 정보를 찾을 수 없습니다.");

      const announcementData = {
        company_id: companyId,
        gym_id: announcementForm.gym_id,
        title: announcementForm.title,
        content: announcementForm.content,
        priority: announcementForm.priority,
        start_date: announcementForm.start_date,
        end_date: announcementForm.end_date || null,
        is_active: announcementForm.is_active,
        author_id: me.id
      };

      if (editingAnnouncement) {
        // Update existing announcement
        const { error } = await supabase
          .from("announcements")
          .update(announcementData)
          .eq("id", editingAnnouncement.id);

        if (error) throw error;
        alert("공지사항이 수정되었습니다.");
      } else {
        // Create new announcement
        const { error } = await supabase
          .from("announcements")
          .insert(announcementData);

        if (error) throw error;
        alert("공지사항이 등록되었습니다.");
      }

      setIsAnnouncementModalOpen(false);
      await fetchAnnouncements(companyId, gymId);
    } catch (error: any) {
      alert("오류: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle announcement active status
  const handleToggleAnnouncementActive = async (announcement: any) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: !announcement.is_active })
        .eq("id", announcement.id);

      if (error) throw error;

      await fetchAnnouncements(companyId, gymId);
    } catch (error: any) {
      alert("오류: " + error.message);
    }
  };

  // Delete announcement
  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      alert("공지사항이 삭제되었습니다.");
      await fetchAnnouncements(companyId, gymId);
    } catch (error: any) {
      alert("오류: " + error.message);
    }
  };

  // 기간에 따른 날짜 범위 계산
  const getDateRange = (period: "thisMonth" | "lastMonth" | "custom") => {
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
  };

  // PT 여부 확인 함수
  const isPT = (payment: any) => {
    const membershipType = payment.membership_type || '';
    return membershipType.toUpperCase().includes('PT');
  };

  // 상세 매출 데이터 가져오기
  const fetchDetailedSales = async (type: "all" | "fc" | "pt", period: "thisMonth" | "lastMonth" | "custom") => {
    setSalesLoading(true);
    const targetGymId = selectedGymId || gymId;
    const targetCompanyId = myRole === 'system_admin' ? selectedCompanyId : companyId;

    if (!targetGymId || !targetCompanyId) {
      setSalesLoading(false);
      return;
    }

    const { start, end } = getDateRange(period);

    const { data: salesData } = await supabase
      .from("member_payments")
      .select("*, members(name, phone)")
      .eq("gym_id", targetGymId)
      .eq("company_id", targetCompanyId)
      .gte("paid_at", start.toISOString())
      .lte("paid_at", end.toISOString())
      .order("paid_at", { ascending: false });

    if (salesData) {
      // PT와 FC로 분류
      const ptPayments = salesData.filter(p => isPT(p));
      const fcPayments = salesData.filter(p => !isPT(p));

      // 타입에 따라 필터링된 데이터 설정
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

      // 전체 요약
      setSalesSummary({
        totalRevenue: salesData.reduce((sum, s) => sum + (Number(s.amount) || 0), 0),
        fcRevenue: fcTotalSales,
        ptRevenue: ptTotalSales,
        fcCount: fcPayments.length,
        ptCount: ptPayments.length,
        otherRevenue: 0,
        otherCount: 0
      });

      // 비교 데이터 fetch (전월, 전년 동월)
      const now = new Date();
      const currentMonth = period === "thisMonth" ? now.getMonth() : period === "lastMonth" ? now.getMonth() - 1 : new Date(customDateRange.start).getMonth();
      const currentYear = period === "thisMonth" ? now.getFullYear() : period === "lastMonth" ? now.getFullYear() : new Date(customDateRange.start).getFullYear();

      // 전월 날짜 범위
      const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
      const prevMonthEnd = new Date(currentYear, currentMonth, 0);

      // 전년 동월 날짜 범위
      const prevYearStart = new Date(currentYear - 1, currentMonth, 1);
      const prevYearEnd = new Date(currentYear - 1, currentMonth + 1, 0);

      // 전월 데이터 fetch
      const { data: prevMonthData } = await supabase
        .from("member_payments")
        .select("membership_type, amount")
        .eq("gym_id", targetGymId)
        .eq("company_id", targetCompanyId)
        .gte("paid_at", prevMonthStart.toISOString())
        .lte("paid_at", prevMonthEnd.toISOString());

      // 전년 동월 데이터 fetch
      const { data: prevYearData } = await supabase
        .from("member_payments")
        .select("membership_type, amount")
        .eq("gym_id", targetGymId)
        .eq("company_id", targetCompanyId)
        .gte("paid_at", prevYearStart.toISOString())
        .lte("paid_at", prevYearEnd.toISOString());

      // 전월 통계 계산
      const prevMonthPt = prevMonthData?.filter(p => isPT(p)) || [];
      const prevMonthFc = prevMonthData?.filter(p => !isPT(p)) || [];
      const prevMonthFcSales = prevMonthFc.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const prevMonthPtSales = prevMonthPt.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      // 전년 동월 통계 계산
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
  };

  // FC 모달 열기
  const openFcModal = () => {
    setSalesPeriod("thisMonth");
    fetchDetailedSales("fc", "thisMonth");
    setIsFcModalOpen(true);
  };

  // PT 모달 열기
  const openPtModal = () => {
    setSalesPeriod("thisMonth");
    fetchDetailedSales("pt", "thisMonth");
    setIsPtModalOpen(true);
  };

  // 총 매출 모달 열기
  const openSalesModal = () => {
    setSalesPeriod("thisMonth");
    fetchDetailedSales("all", "thisMonth");
    setIsSalesModalOpen(true);
  };

  // 기간 변경 핸들러
  const handlePeriodChange = (type: "all" | "fc" | "pt", newPeriod: "thisMonth" | "lastMonth" | "custom") => {
    setSalesPeriod(newPeriod);
    if (newPeriod !== "custom") {
      fetchDetailedSales(type, newPeriod);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            지점 관리
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            <span className="text-[#2F80ED] font-bold">{gymName}</span> 지점의 운영 현황을 확인하세요
          </p>
        </div>

        {/* 회사/지점 필터 */}
        {!isLoading && (
          <div className="flex items-center gap-3">
            {/* Company selector for system_admin */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700">회사:</Label>
              {myRole === 'system_admin' ? (
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue>
                      {selectedCompanyId ? (companies.find(c => c.id === selectedCompanyId)?.name || '회사 선택') : '회사 선택'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="px-3 py-1.5 bg-[#2F80ED] text-white rounded-md text-sm font-medium">
                  {companyName}
                </div>
              )}
            </div>

            {/* Gym selector */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700">지점:</Label>
              {gyms.length >= 1 ? (
                <Select value={selectedGymId} onValueChange={setSelectedGymId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue>
                      {selectedGymId ? (gyms.find(g => g.id === selectedGymId)?.name || '지점 선택') : '지점 선택'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {gyms.map(gym => (
                      <SelectItem key={gym.id} value={gym.id}>{gym.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="px-3 py-1.5 bg-gray-200 text-gray-500 rounded-md text-sm font-medium">
                  지점 없음
                </div>
              )}
            </div>
          </div>
        )}
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

      {/* 공지사항 관리 - 달력 형태 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bell className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-gray-900">공지사항 관리</h3>
              <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {announcements.length}개
              </span>
            </div>
          </div>
          <Button
            onClick={() => openAnnouncementModal()}
            size="sm"
            className="bg-purple-600 text-white hover:bg-purple-700"
          >
            <Plus className="mr-1 h-4 w-4" /> 공지 등록
          </Button>
        </div>

        {/* 달력 네비게이션 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const prevMonth = new Date(currentCalendarMonth);
              prevMonth.setMonth(prevMonth.getMonth() - 1);
              setCurrentCalendarMonth(prevMonth);
            }}
          >
            이전 달
          </Button>
          <h4 className="text-lg font-semibold text-gray-900">
            {format(currentCalendarMonth, "yyyy년 M월", { locale: ko })}
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const nextMonth = new Date(currentCalendarMonth);
              nextMonth.setMonth(nextMonth.getMonth() + 1);
              setCurrentCalendarMonth(nextMonth);
            }}
          >
            다음 달
          </Button>
        </div>

        {/* 달력 UI */}
        <div className="p-6">
          {(() => {
            // 달력 생성 로직
            const year = currentCalendarMonth.getFullYear();
            const month = currentCalendarMonth.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const daysInMonth = lastDay.getDate();
            const startDayOfWeek = firstDay.getDay();

            // 날짜별 공지사항 맵 생성
            const announcementsByDate: Record<string, any[]> = {};
            announcements.forEach((announcement) => {
              const startDate = new Date(announcement.start_date);
              const endDate = announcement.end_date ? new Date(announcement.end_date) : new Date(announcement.start_date);

              // 시작일부터 종료일까지의 모든 날짜에 공지사항 추가
              let currentDate = new Date(startDate);
              while (currentDate <= endDate) {
                const dateKey = format(currentDate, "yyyy-MM-dd");
                if (!announcementsByDate[dateKey]) {
                  announcementsByDate[dateKey] = [];
                }
                announcementsByDate[dateKey].push(announcement);
                currentDate.setDate(currentDate.getDate() + 1);
              }
            });

            // 달력 그리드 생성
            const calendarDays = [];

            // 빈 칸 추가 (월의 시작 전)
            for (let i = 0; i < startDayOfWeek; i++) {
              calendarDays.push(<div key={`empty-${i}`} className="h-24 border border-gray-100"></div>);
            }

            // 날짜 추가
            for (let day = 1; day <= daysInMonth; day++) {
              const date = new Date(year, month, day);
              const dateKey = format(date, "yyyy-MM-dd");
              const dayAnnouncements = announcementsByDate[dateKey] || [];
              const isToday = format(new Date(), "yyyy-MM-dd") === dateKey;

              calendarDays.push(
                <div
                  key={day}
                  className={cn(
                    "h-24 border border-gray-100 p-2 cursor-pointer hover:bg-purple-50 transition-colors",
                    isToday && "bg-blue-50 border-blue-300"
                  )}
                  onClick={() => {
                    setSelectedDate(date);
                    if (dayAnnouncements.length > 0) {
                      setIsDateAnnouncementsModalOpen(true);
                    }
                  }}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isToday ? "text-blue-600" : "text-gray-700"
                  )}>
                    {day}
                  </div>
                  {dayAnnouncements.length > 0 && (
                    <div className="space-y-1">
                      {dayAnnouncements.slice(0, 2).map((ann, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded truncate",
                            ann.priority === "urgent" ? "bg-red-100 text-red-700" :
                            ann.priority === "normal" ? "bg-purple-100 text-purple-700" :
                            "bg-gray-100 text-gray-700"
                          )}
                        >
                          {ann.title}
                        </div>
                      ))}
                      {dayAnnouncements.length > 2 && (
                        <div className="text-xs text-gray-500 pl-1">
                          +{dayAnnouncements.length - 2}개 더
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div>
                {/* 요일 헤더 */}
                <div className="grid grid-cols-7 gap-0 mb-2">
                  {["일", "월", "화", "수", "목", "금", "토"].map((day, idx) => (
                    <div
                      key={day}
                      className={cn(
                        "text-center py-2 font-semibold text-sm",
                        idx === 0 ? "text-red-600" : idx === 6 ? "text-blue-600" : "text-gray-700"
                      )}
                    >
                      {day}
                    </div>
                  ))}
                </div>
                {/* 날짜 그리드 */}
                <div className="grid grid-cols-7 gap-0 border-t border-l border-gray-200">
                  {calendarDays}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 공지사항 등록/수정 모달 */}
      <Dialog open={isAnnouncementModalOpen} onOpenChange={setIsAnnouncementModalOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {editingAnnouncement ? '공지사항 수정' : '새 공지사항 등록'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 제목 */}
            <div>
              <Label htmlFor="announcement-title" className="text-sm font-semibold text-gray-700">
                제목 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="announcement-title"
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                placeholder="공지사항 제목을 입력하세요"
                className="mt-1"
              />
            </div>

            {/* 내용 */}
            <div>
              <Label htmlFor="announcement-content" className="text-sm font-semibold text-gray-700">
                내용 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="announcement-content"
                value={announcementForm.content}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                placeholder="공지사항 내용을 입력하세요"
                className="mt-1 min-h-[120px]"
              />
            </div>

            {/* 우선순위 */}
            <div>
              <Label htmlFor="announcement-priority" className="text-sm font-semibold text-gray-700">
                우선순위 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={announcementForm.priority}
                onValueChange={(value) => setAnnouncementForm({ ...announcementForm, priority: value })}
              >
                <SelectTrigger className="mt-1 bg-white">
                  <SelectValue placeholder="우선순위 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="urgent">긴급</SelectItem>
                  <SelectItem value="normal">일반</SelectItem>
                  <SelectItem value="low">참고</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 대상 지점 */}
            <div>
              <Label htmlFor="announcement-gym" className="text-sm font-semibold text-gray-700">
                대상 지점
              </Label>
              <Select
                value={announcementForm.gym_id}
                onValueChange={(value) => setAnnouncementForm({ ...announcementForm, gym_id: value })}
              >
                <SelectTrigger className="mt-1 bg-white">
                  <SelectValue placeholder="지점 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {gyms.map((gym) => (
                    <SelectItem key={gym.id} value={gym.id}>
                      {gym.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                현재 지점에 대한 공지사항이 등록됩니다.
              </p>
            </div>

            {/* 날짜 범위 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-gray-700">
                  시작일 <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full mt-1 justify-start text-left font-normal",
                        !announcementForm.start_date && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {announcementForm.start_date ? (
                        format(new Date(announcementForm.start_date), "PPP", { locale: ko })
                      ) : (
                        <span>날짜를 선택하세요</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={announcementForm.start_date ? new Date(announcementForm.start_date) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setAnnouncementForm({
                            ...announcementForm,
                            start_date: format(date, "yyyy-MM-dd")
                          });
                        }
                      }}
                      locale={ko}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700">
                  종료일
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full mt-1 justify-start text-left font-normal",
                        !announcementForm.end_date && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {announcementForm.end_date ? (
                        format(new Date(announcementForm.end_date), "PPP", { locale: ko })
                      ) : (
                        <span>무기한</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={announcementForm.end_date ? new Date(announcementForm.end_date) : undefined}
                      onSelect={(date) => {
                        setAnnouncementForm({
                          ...announcementForm,
                          end_date: date ? format(date, "yyyy-MM-dd") : ""
                        });
                      }}
                      locale={ko}
                      initialFocus
                    />
                    <div className="p-3 border-t">
                      <Button
                        variant="ghost"
                        className="w-full text-sm"
                        onClick={() => setAnnouncementForm({ ...announcementForm, end_date: "" })}
                      >
                        무기한으로 설정
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-gray-500 mt-1">
                  비워두면 무기한으로 표시됩니다.
                </p>
              </div>
            </div>

            {/* 활성 상태 */}
            <div className="flex items-center gap-2 pt-2">
              <input
                id="announcement-active"
                type="checkbox"
                checked={announcementForm.is_active}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <Label htmlFor="announcement-active" className="text-sm text-gray-700 cursor-pointer">
                즉시 활성화 (체크 해제 시 비활성 상태로 저장)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAnnouncementModalOpen(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              onClick={handleSaveAnnouncement}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? '저장 중...' : (editingAnnouncement ? '수정' : '등록')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 선택한 날짜의 공지사항 보기 모달 */}
      <Dialog open={isDateAnnouncementsModalOpen} onOpenChange={setIsDateAnnouncementsModalOpen}>
        <DialogContent className="max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, "yyyy년 M월 d일 (EEE)", { locale: ko })} 공지사항
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {selectedDate && (() => {
              const dateKey = format(selectedDate, "yyyy-MM-dd");
              const dateAnnouncements = announcements.filter(announcement => {
                const startDate = new Date(announcement.start_date);
                const endDate = announcement.end_date ? new Date(announcement.end_date) : new Date(announcement.start_date);
                const selected = new Date(dateKey);
                return selected >= startDate && selected <= endDate;
              });

              const priorityColors: Record<string, string> = {
                urgent: "bg-red-100 text-red-700 border-red-200",
                normal: "bg-blue-100 text-blue-700 border-blue-200",
                low: "bg-gray-100 text-gray-700 border-gray-200"
              };
              const priorityLabels: Record<string, string> = {
                urgent: "긴급",
                normal: "일반",
                low: "참고"
              };

              if (dateAnnouncements.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Bell className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">이 날짜에 등록된 공지사항이 없습니다.</p>
                  </div>
                );
              }

              return dateAnnouncements.map((announcement) => (
                <div key={announcement.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all bg-white">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="outline" className={priorityColors[announcement.priority]}>
                          {priorityLabels[announcement.priority]}
                        </Badge>
                        {announcement.gym_id ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {announcement.gyms?.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            전사 공지
                          </Badge>
                        )}
                        {!announcement.is_active && (
                          <Badge className="bg-gray-400">비활성</Badge>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{announcement.title}</h4>
                      <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{announcement.content}</p>
                      <div className="text-xs text-gray-500 flex gap-3 items-center flex-wrap">
                        <span>작성자: {announcement.staffs?.name || '알 수 없음'}</span>
                        <span>시작: {announcement.start_date}</span>
                        {announcement.end_date && <span>종료: {announcement.end_date}</span>}
                        <span>조회: {announcement.view_count || 0}회</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-purple-50"
                        onClick={() => handleToggleAnnouncementActive(announcement)}
                        title={announcement.is_active ? "비활성화" : "활성화"}
                      >
                        <Activity className={`h-4 w-4 ${announcement.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-purple-50"
                        onClick={() => {
                          setIsDateAnnouncementsModalOpen(false);
                          openAnnouncementModal(announcement);
                        }}
                      >
                        <Pencil className="h-4 w-4 text-purple-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-50"
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* FC 매출 통계 모달 */}
      <Dialog open={isFcModalOpen} onOpenChange={setIsFcModalOpen}>
        <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-6 h-6 text-[#2F80ED]" />
              FC (회원권) 매출 현황
            </DialogTitle>
          </DialogHeader>

          {/* 기간 선택 */}
          <div className="flex items-center gap-2 py-4 border-b">
            <Button
              variant={salesPeriod === "thisMonth" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodChange("fc", "thisMonth")}
              className={salesPeriod === "thisMonth" ? "bg-[#2F80ED]" : ""}
            >
              이번 달
            </Button>
            <Button
              variant={salesPeriod === "lastMonth" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodChange("fc", "lastMonth")}
              className={salesPeriod === "lastMonth" ? "bg-[#2F80ED]" : ""}
            >
              지난 달
            </Button>
            <Button
              variant={salesPeriod === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => setSalesPeriod("custom")}
              className={salesPeriod === "custom" ? "bg-[#2F80ED]" : ""}
            >
              날짜 지정
            </Button>
            {salesPeriod === "custom" && (
              <div className="flex items-center gap-2 ml-2">
                <Input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                  className="w-36"
                />
                <span>~</span>
                <Input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                  className="w-36"
                />
                <Button size="sm" onClick={() => fetchDetailedSales("fc", "custom")}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* FC 회원권 / 부가상품 상세 DATA */}
          {salesLoading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : (
            <div className="space-y-4 py-4">
              {/* 첫 번째 행: BEP, 총 매출, BEP 달성률, 객단가 */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200">
                  <div className="text-xs text-blue-600 font-medium mb-1">FC BEP</div>
                  <div className="text-xl font-bold text-blue-700">{Math.round(fcStats.bep / 10000).toLocaleString()}만원</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200">
                  <div className="text-xs text-green-600 font-medium mb-1">FC 총 매출</div>
                  <div className="text-xl font-bold text-green-700">{Math.round(fcStats.totalSales / 10000).toLocaleString()}만원</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border border-purple-200">
                  <div className="text-xs text-purple-600 font-medium mb-1">BEP 달성률</div>
                  <div className="text-xl font-bold text-purple-700">{Math.round(fcStats.bepRate)}%</div>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 text-center border border-indigo-200">
                  <div className="text-xs text-indigo-600 font-medium mb-1 flex items-center justify-center">FC 객단가<HelpTooltip content="1건당 평균 결제 금액입니다." iconClassName="w-3 h-3" /></div>
                  <div className="text-xl font-bold text-indigo-700">{Math.round(fcStats.avgPrice / 10000).toLocaleString()}만원</div>
                </div>
              </div>

              {/* 두 번째 행: 총 등록, 워크인, 비대면, 리뉴얼, 신규율 */}
              <div className="grid grid-cols-5 gap-3">
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                  <div className="text-xs text-gray-500 font-medium mb-1">총 등록</div>
                  <div className="text-xl font-bold text-gray-700">{fcStats.totalCount}건</div>
                </div>
                <div className="bg-cyan-50 rounded-xl p-4 text-center border border-cyan-200">
                  <div className="text-xs text-cyan-600 font-medium mb-1 flex items-center justify-center">
                    워크인<HelpTooltip content="직접 센터를 방문하여 등록한 회원입니다." iconClassName="w-3 h-3" />
                  </div>
                  <div className="text-xl font-bold text-cyan-700">{fcStats.walkinCount}건</div>
                </div>
                <div className="bg-teal-50 rounded-xl p-4 text-center border border-teal-200">
                  <div className="text-xs text-teal-600 font-medium mb-1 flex items-center justify-center">
                    비대면<HelpTooltip content="온라인/인터넷/네이버 등을 통해 등록한 회원입니다." iconClassName="w-3 h-3" />
                  </div>
                  <div className="text-xl font-bold text-teal-700">{fcStats.onlineCount}건</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-200">
                  <div className="text-xs text-amber-600 font-medium mb-1 flex items-center justify-center">
                    FC 리뉴얼<HelpTooltip content="기존 회원이 회원권을 재등록한 건수입니다." iconClassName="w-3 h-3" />
                  </div>
                  <div className="text-xl font-bold text-amber-700">{fcStats.renewCount}건</div>
                </div>
                <div className="bg-rose-50 rounded-xl p-4 text-center border border-rose-200">
                  <div className="text-xs text-rose-600 font-medium mb-1 flex items-center justify-center">
                    신규율<HelpTooltip content="전체 등록 중 신규 회원의 비율입니다. 높을수록 신규 유입이 활발합니다." iconClassName="w-3 h-3" />
                  </div>
                  <div className="text-xl font-bold text-rose-700">{Math.round(fcStats.newRate)}%</div>
                </div>
              </div>

              {/* 세 번째 행: FC 신규매출 */}
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 text-center">
                  <div className="text-sm text-blue-100 font-medium mb-1">FC 신규매출 ({salesPeriod === "thisMonth" ? "이번 달" : salesPeriod === "lastMonth" ? "지난 달" : "지정 기간"})</div>
                  <div className="text-2xl font-bold text-white">{Math.round(fcStats.newSales / 10000).toLocaleString()}만원</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PT 매출 통계 모달 */}
      <Dialog open={isPtModalOpen} onOpenChange={setIsPtModalOpen}>
        <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-6 h-6 text-orange-500" />
              PT 매출 현황
            </DialogTitle>
          </DialogHeader>

          {/* 기간 선택 */}
          <div className="flex items-center gap-2 py-4 border-b">
            <Button
              variant={salesPeriod === "thisMonth" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodChange("pt", "thisMonth")}
              className={salesPeriod === "thisMonth" ? "bg-orange-500 hover:bg-orange-600" : ""}
            >
              이번 달
            </Button>
            <Button
              variant={salesPeriod === "lastMonth" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodChange("pt", "lastMonth")}
              className={salesPeriod === "lastMonth" ? "bg-orange-500 hover:bg-orange-600" : ""}
            >
              지난 달
            </Button>
            <Button
              variant={salesPeriod === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => setSalesPeriod("custom")}
              className={salesPeriod === "custom" ? "bg-orange-500 hover:bg-orange-600" : ""}
            >
              날짜 지정
            </Button>
            {salesPeriod === "custom" && (
              <div className="flex items-center gap-2 ml-2">
                <Input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                  className="w-36"
                />
                <span>~</span>
                <Input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                  className="w-36"
                />
                <Button size="sm" onClick={() => fetchDetailedSales("pt", "custom")} className="bg-orange-500 hover:bg-orange-600">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* PT / PPT 상세 DATA */}
          {salesLoading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : (
            <div className="space-y-4 py-4">
              {/* 첫 번째 행: BEP, 총 매출, BEP 달성률, 객단가 */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center border border-orange-200">
                  <div className="text-xs text-orange-600 font-medium mb-1">PT BEP</div>
                  <div className="text-xl font-bold text-orange-700">{Math.round(ptStats.bep / 10000).toLocaleString()}만원</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200">
                  <div className="text-xs text-green-600 font-medium mb-1">PT 총 매출</div>
                  <div className="text-xl font-bold text-green-700">{Math.round(ptStats.totalSales / 10000).toLocaleString()}만원</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border border-purple-200">
                  <div className="text-xs text-purple-600 font-medium mb-1">BEP 달성률</div>
                  <div className="text-xl font-bold text-purple-700">{Math.round(ptStats.bepRate)}%</div>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 text-center border border-indigo-200">
                  <div className="text-xs text-indigo-600 font-medium mb-1 flex items-center justify-center">PT 객단가<HelpTooltip content="PT 1건당 평균 결제 금액입니다." iconClassName="w-3 h-3" /></div>
                  <div className="text-xl font-bold text-indigo-700">{Math.round(ptStats.avgPrice / 10000).toLocaleString()}만원</div>
                </div>
              </div>

              {/* 두 번째 행: 총 등록, 신규, 재등록, 재등록률 */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                  <div className="text-xs text-gray-500 font-medium mb-1">PT 총 등록</div>
                  <div className="text-xl font-bold text-gray-700">{ptStats.totalCount}건</div>
                </div>
                <div className="bg-cyan-50 rounded-xl p-4 text-center border border-cyan-200">
                  <div className="text-xs text-cyan-600 font-medium mb-1">PT 신규</div>
                  <div className="text-xl font-bold text-cyan-700">{ptStats.newCount}건</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-200">
                  <div className="text-xs text-amber-600 font-medium mb-1">PT 재등록</div>
                  <div className="text-xl font-bold text-amber-700">{ptStats.renewCount}건</div>
                </div>
                <div className="bg-rose-50 rounded-xl p-4 text-center border border-rose-200">
                  <div className="text-xs text-rose-600 font-medium mb-1 flex items-center justify-center">재등록률<HelpTooltip content="전체 PT 등록 중 기존 회원이 재등록한 비율입니다. 높을수록 회원 유지율이 좋습니다." iconClassName="w-3 h-3" /></div>
                  <div className="text-xl font-bold text-rose-700">{Math.round(ptStats.renewRate)}%</div>
                </div>
              </div>

              {/* 세 번째 행: 신규 등록 매출, 재등록 매출 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-5 text-center">
                  <div className="text-sm text-orange-100 font-medium mb-1">신규 등록 매출 ({salesPeriod === "thisMonth" ? "이번 달" : salesPeriod === "lastMonth" ? "지난 달" : "지정 기간"})</div>
                  <div className="text-2xl font-bold text-white">{Math.round(ptStats.newSales / 10000).toLocaleString()}만원</div>
                </div>
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-5 text-center">
                  <div className="text-sm text-amber-100 font-medium mb-1">재등록 매출 ({salesPeriod === "thisMonth" ? "이번 달" : salesPeriod === "lastMonth" ? "지난 달" : "지정 기간"})</div>
                  <div className="text-2xl font-bold text-white">{Math.round(ptStats.renewSales / 10000).toLocaleString()}만원</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 총 매출 통계 모달 */}
      <Dialog open={isSalesModalOpen} onOpenChange={setIsSalesModalOpen}>
        <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              매출 현황
            </DialogTitle>
          </DialogHeader>

          {/* 기간 선택 */}
          <div className="flex items-center gap-2 py-4 border-b">
            <Button
              variant={salesPeriod === "thisMonth" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodChange("all", "thisMonth")}
              className={salesPeriod === "thisMonth" ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              이번 달
            </Button>
            <Button
              variant={salesPeriod === "lastMonth" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodChange("all", "lastMonth")}
              className={salesPeriod === "lastMonth" ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              지난 달
            </Button>
            <Button
              variant={salesPeriod === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => setSalesPeriod("custom")}
              className={salesPeriod === "custom" ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              날짜 지정
            </Button>
            {salesPeriod === "custom" && (
              <div className="flex items-center gap-2 ml-2">
                <Input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                  className="w-36"
                />
                <span>~</span>
                <Input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                  className="w-36"
                />
                <Button size="sm" onClick={() => fetchDetailedSales("all", "custom")} className="bg-purple-600 hover:bg-purple-700">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* 전체 통계 */}
          {salesLoading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : (
            <div className="space-y-6 py-4">
              {/* 총 매출 요약 */}
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-5 text-center">
                <div className="text-sm text-purple-100 font-medium mb-1">총 매출 ({salesPeriod === "thisMonth" ? "이번 달" : salesPeriod === "lastMonth" ? "지난 달" : "지정 기간"})</div>
                <div className="text-3xl font-bold text-white">{Math.round(salesSummary.totalRevenue / 10000).toLocaleString()}만원</div>
                <div className="text-sm text-purple-200 mt-2">FC {salesSummary.fcCount}건 + PT {salesSummary.ptCount}건</div>
              </div>

              {/* FC 회원권 / 부가상품 상세 DATA */}
              <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/30">
                <h4 className="font-bold text-blue-700 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  FC 회원권 / 부가상품 상세 DATA
                </h4>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
                    <div className="text-xs text-blue-600 font-medium">FC BEP</div>
                    <div className="text-lg font-bold text-blue-700">{Math.round(fcStats.bep / 10000).toLocaleString()}만원</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-green-100">
                    <div className="text-xs text-green-600 font-medium">FC 총 매출</div>
                    <div className="text-lg font-bold text-green-700">{Math.round(fcStats.totalSales / 10000).toLocaleString()}만원</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-purple-100">
                    <div className="text-xs text-purple-600 font-medium">BEP 달성률</div>
                    <div className="text-lg font-bold text-purple-700">{Math.round(fcStats.bepRate)}%</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-indigo-100">
                    <div className="text-xs text-indigo-600 font-medium">FC 객단가</div>
                    <div className="text-lg font-bold text-indigo-700">{Math.round(fcStats.avgPrice / 10000).toLocaleString()}만원</div>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <div className="bg-white rounded-lg p-2 text-center border border-gray-100">
                    <div className="text-xs text-gray-500">총 등록</div>
                    <div className="text-sm font-bold text-gray-700">{fcStats.totalCount}건</div>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center border border-cyan-100">
                    <div className="text-xs text-cyan-600">워크인</div>
                    <div className="text-sm font-bold text-cyan-700">{fcStats.walkinCount}건</div>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center border border-teal-100">
                    <div className="text-xs text-teal-600">비대면</div>
                    <div className="text-sm font-bold text-teal-700">{fcStats.onlineCount}건</div>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center border border-amber-100">
                    <div className="text-xs text-amber-600">리뉴얼</div>
                    <div className="text-sm font-bold text-amber-700">{fcStats.renewCount}건</div>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center border border-rose-100">
                    <div className="text-xs text-rose-600">신규율</div>
                    <div className="text-sm font-bold text-rose-700">{Math.round(fcStats.newRate)}%</div>
                  </div>
                </div>
                <div className="mt-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-3 text-center">
                  <div className="text-xs text-blue-100">FC 신규매출</div>
                  <div className="text-xl font-bold text-white">{Math.round(fcStats.newSales / 10000).toLocaleString()}만원</div>
                </div>
              </div>

              {/* PT / PPT 상세 DATA */}
              <div className="border border-orange-200 rounded-xl p-4 bg-orange-50/30">
                <h4 className="font-bold text-orange-700 mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  PT / PPT 상세 DATA
                </h4>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="bg-white rounded-lg p-3 text-center border border-orange-100">
                    <div className="text-xs text-orange-600 font-medium">PT BEP</div>
                    <div className="text-lg font-bold text-orange-700">{Math.round(ptStats.bep / 10000).toLocaleString()}만원</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-green-100">
                    <div className="text-xs text-green-600 font-medium">PT 총 매출</div>
                    <div className="text-lg font-bold text-green-700">{Math.round(ptStats.totalSales / 10000).toLocaleString()}만원</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-purple-100">
                    <div className="text-xs text-purple-600 font-medium">BEP 달성률</div>
                    <div className="text-lg font-bold text-purple-700">{Math.round(ptStats.bepRate)}%</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-indigo-100">
                    <div className="text-xs text-indigo-600 font-medium">PT 객단가</div>
                    <div className="text-lg font-bold text-indigo-700">{Math.round(ptStats.avgPrice / 10000).toLocaleString()}만원</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-white rounded-lg p-2 text-center border border-gray-100">
                    <div className="text-xs text-gray-500">PT 총 등록</div>
                    <div className="text-sm font-bold text-gray-700">{ptStats.totalCount}건</div>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center border border-cyan-100">
                    <div className="text-xs text-cyan-600">PT 신규</div>
                    <div className="text-sm font-bold text-cyan-700">{ptStats.newCount}건</div>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center border border-amber-100">
                    <div className="text-xs text-amber-600">PT 재등록</div>
                    <div className="text-sm font-bold text-amber-700">{ptStats.renewCount}건</div>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center border border-rose-100">
                    <div className="text-xs text-rose-600">재등록률</div>
                    <div className="text-sm font-bold text-rose-700">{Math.round(ptStats.renewRate)}%</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-3 text-center">
                    <div className="text-xs text-orange-100">신규 등록 매출</div>
                    <div className="text-xl font-bold text-white">{Math.round(ptStats.newSales / 10000).toLocaleString()}만원</div>
                  </div>
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg p-3 text-center">
                    <div className="text-xs text-amber-100">재등록 매출</div>
                    <div className="text-xl font-bold text-white">{Math.round(ptStats.renewSales / 10000).toLocaleString()}만원</div>
                  </div>
                </div>
              </div>

              {/* 전월/전년 대비 비교 */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  전월/전년 대비 비교
                </h4>

                {/* 비교 테이블 */}
                <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">구분</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">현재</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">전월</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">전월대비</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">전년동월</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">전년대비</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">총 매출</td>
                        <td className="px-4 py-3 text-right font-bold text-purple-600">{Math.round(salesSummary.totalRevenue / 10000).toLocaleString()}만원</td>
                        <td className="px-4 py-3 text-right text-gray-600">{Math.round(comparisonData.prevMonth.totalSales / 10000).toLocaleString()}만원</td>
                        <td className={`px-4 py-3 text-right font-semibold ${comparisonData.prevMonth.totalSales > 0 ? (salesSummary.totalRevenue >= comparisonData.prevMonth.totalSales ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                          {comparisonData.prevMonth.totalSales > 0
                            ? `${salesSummary.totalRevenue >= comparisonData.prevMonth.totalSales ? '▲' : '▼'} ${Math.abs(Math.round((salesSummary.totalRevenue - comparisonData.prevMonth.totalSales) / comparisonData.prevMonth.totalSales * 100))}%`
                            : '-'
                          }
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">{Math.round(comparisonData.prevYear.totalSales / 10000).toLocaleString()}만원</td>
                        <td className={`px-4 py-3 text-right font-semibold ${comparisonData.prevYear.totalSales > 0 ? (salesSummary.totalRevenue >= comparisonData.prevYear.totalSales ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                          {comparisonData.prevYear.totalSales > 0
                            ? `${salesSummary.totalRevenue >= comparisonData.prevYear.totalSales ? '▲' : '▼'} ${Math.abs(Math.round((salesSummary.totalRevenue - comparisonData.prevYear.totalSales) / comparisonData.prevYear.totalSales * 100))}%`
                            : '-'
                          }
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-blue-700">FC 매출</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-600">{Math.round(fcStats.totalSales / 10000).toLocaleString()}만원</td>
                        <td className="px-4 py-3 text-right text-gray-600">{Math.round(comparisonData.prevMonth.fcSales / 10000).toLocaleString()}만원</td>
                        <td className={`px-4 py-3 text-right font-semibold ${comparisonData.prevMonth.fcSales > 0 ? (fcStats.totalSales >= comparisonData.prevMonth.fcSales ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                          {comparisonData.prevMonth.fcSales > 0
                            ? `${fcStats.totalSales >= comparisonData.prevMonth.fcSales ? '▲' : '▼'} ${Math.abs(Math.round((fcStats.totalSales - comparisonData.prevMonth.fcSales) / comparisonData.prevMonth.fcSales * 100))}%`
                            : '-'
                          }
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">{Math.round(comparisonData.prevYear.fcSales / 10000).toLocaleString()}만원</td>
                        <td className={`px-4 py-3 text-right font-semibold ${comparisonData.prevYear.fcSales > 0 ? (fcStats.totalSales >= comparisonData.prevYear.fcSales ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                          {comparisonData.prevYear.fcSales > 0
                            ? `${fcStats.totalSales >= comparisonData.prevYear.fcSales ? '▲' : '▼'} ${Math.abs(Math.round((fcStats.totalSales - comparisonData.prevYear.fcSales) / comparisonData.prevYear.fcSales * 100))}%`
                            : '-'
                          }
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-orange-700">PT 매출</td>
                        <td className="px-4 py-3 text-right font-bold text-orange-600">{Math.round(ptStats.totalSales / 10000).toLocaleString()}만원</td>
                        <td className="px-4 py-3 text-right text-gray-600">{Math.round(comparisonData.prevMonth.ptSales / 10000).toLocaleString()}만원</td>
                        <td className={`px-4 py-3 text-right font-semibold ${comparisonData.prevMonth.ptSales > 0 ? (ptStats.totalSales >= comparisonData.prevMonth.ptSales ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                          {comparisonData.prevMonth.ptSales > 0
                            ? `${ptStats.totalSales >= comparisonData.prevMonth.ptSales ? '▲' : '▼'} ${Math.abs(Math.round((ptStats.totalSales - comparisonData.prevMonth.ptSales) / comparisonData.prevMonth.ptSales * 100))}%`
                            : '-'
                          }
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">{Math.round(comparisonData.prevYear.ptSales / 10000).toLocaleString()}만원</td>
                        <td className={`px-4 py-3 text-right font-semibold ${comparisonData.prevYear.ptSales > 0 ? (ptStats.totalSales >= comparisonData.prevYear.ptSales ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                          {comparisonData.prevYear.ptSales > 0
                            ? `${ptStats.totalSales >= comparisonData.prevYear.ptSales ? '▲' : '▼'} ${Math.abs(Math.round((ptStats.totalSales - comparisonData.prevYear.ptSales) / comparisonData.prevYear.ptSales * 100))}%`
                            : '-'
                          }
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 비교 바 차트 */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {/* 총 매출 차트 */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-gray-500 font-medium mb-3 text-center">총 매출 비교</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-12 text-gray-600">현재</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(salesSummary.totalRevenue, comparisonData.prevMonth.totalSales, comparisonData.prevYear.totalSales) > 0 ? (salesSummary.totalRevenue / Math.max(salesSummary.totalRevenue, comparisonData.prevMonth.totalSales, comparisonData.prevYear.totalSales) * 100) : 0)}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-12 text-gray-600">전월</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div className="bg-gray-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(salesSummary.totalRevenue, comparisonData.prevMonth.totalSales, comparisonData.prevYear.totalSales) > 0 ? (comparisonData.prevMonth.totalSales / Math.max(salesSummary.totalRevenue, comparisonData.prevMonth.totalSales, comparisonData.prevYear.totalSales) * 100) : 0)}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-12 text-gray-600">전년</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div className="bg-gray-300 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(salesSummary.totalRevenue, comparisonData.prevMonth.totalSales, comparisonData.prevYear.totalSales) > 0 ? (comparisonData.prevYear.totalSales / Math.max(salesSummary.totalRevenue, comparisonData.prevMonth.totalSales, comparisonData.prevYear.totalSales) * 100) : 0)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FC 매출 차트 */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-gray-500 font-medium mb-3 text-center">FC 매출 비교</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-12 text-gray-600">현재</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(fcStats.totalSales, comparisonData.prevMonth.fcSales, comparisonData.prevYear.fcSales) > 0 ? (fcStats.totalSales / Math.max(fcStats.totalSales, comparisonData.prevMonth.fcSales, comparisonData.prevYear.fcSales) * 100) : 0)}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-12 text-gray-600">전월</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div className="bg-blue-300 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(fcStats.totalSales, comparisonData.prevMonth.fcSales, comparisonData.prevYear.fcSales) > 0 ? (comparisonData.prevMonth.fcSales / Math.max(fcStats.totalSales, comparisonData.prevMonth.fcSales, comparisonData.prevYear.fcSales) * 100) : 0)}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-12 text-gray-600">전년</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div className="bg-blue-200 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(fcStats.totalSales, comparisonData.prevMonth.fcSales, comparisonData.prevYear.fcSales) > 0 ? (comparisonData.prevYear.fcSales / Math.max(fcStats.totalSales, comparisonData.prevMonth.fcSales, comparisonData.prevYear.fcSales) * 100) : 0)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PT 매출 차트 */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-gray-500 font-medium mb-3 text-center">PT 매출 비교</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-12 text-gray-600">현재</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(ptStats.totalSales, comparisonData.prevMonth.ptSales, comparisonData.prevYear.ptSales) > 0 ? (ptStats.totalSales / Math.max(ptStats.totalSales, comparisonData.prevMonth.ptSales, comparisonData.prevYear.ptSales) * 100) : 0)}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-12 text-gray-600">전월</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div className="bg-orange-300 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(ptStats.totalSales, comparisonData.prevMonth.ptSales, comparisonData.prevYear.ptSales) > 0 ? (comparisonData.prevMonth.ptSales / Math.max(ptStats.totalSales, comparisonData.prevMonth.ptSales, comparisonData.prevYear.ptSales) * 100) : 0)}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-12 text-gray-600">전년</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div className="bg-orange-200 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(ptStats.totalSales, comparisonData.prevMonth.ptSales, comparisonData.prevYear.ptSales) > 0 ? (comparisonData.prevYear.ptSales / Math.max(ptStats.totalSales, comparisonData.prevMonth.ptSales, comparisonData.prevYear.ptSales) * 100) : 0)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  suffix,
  color,
  onClick
}: {
  icon: any;
  title: string;
  value: number;
  suffix: string;
  color: string;
  onClick?: () => void;
}) {
  // Extract background color for the card
  const bgColorMap: Record<string, string> = {
    'bg-blue-500': 'bg-blue-50',
    'bg-green-500': 'bg-green-50',
    'bg-purple-500': 'bg-purple-50',
    'bg-orange-500': 'bg-orange-50'
  };

  const iconColorMap: Record<string, string> = {
    'bg-blue-500': 'text-blue-600',
    'bg-green-500': 'text-green-600',
    'bg-purple-500': 'text-purple-600',
    'bg-orange-500': 'text-orange-600'
  };

  const cardBgColor = bgColorMap[color] || 'bg-gray-50';
  const iconColor = iconColorMap[color] || 'text-gray-600';

  return (
    <div
      className={`${cardBgColor} rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`${iconColor} p-3 rounded-xl bg-white shadow-sm`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-xs text-gray-500">{title}</div>
      </div>
      <div className="text-3xl md:text-4xl font-bold text-gray-900">
        {value.toLocaleString()}
      </div>
      <div className="text-sm text-gray-600 mt-1">{suffix}</div>
    </div>
  );
}

function BEPCard({
  title,
  progress,
  target,
  icon: Icon,
  onClick,
  helpText
}: {
  title: string;
  progress: number;
  target: number;
  icon: any;
  onClick?: () => void;
  helpText?: string;
}) {
  const isAchieved = progress >= 100;

  return (
    <div
      className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-[#2F80ED]" />
          <h4 className="font-bold text-gray-900">{title}</h4>
          {helpText && <HelpTooltip content={helpText} />}
        </div>
        <span className={`text-2xl font-bold ${isAchieved ? 'text-green-600' : 'text-[#2F80ED]'}`}>
          {Math.round(progress)}%
        </span>
      </div>

      <div className="relative w-full h-4 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${isAchieved ? 'bg-green-500' : 'bg-[#2F80ED]'} transition-all duration-500 rounded-full`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <p className="text-sm text-gray-500">
        목표: <span className="font-semibold text-gray-700">{target.toLocaleString()}만원</span>
      </p>
    </div>
  );
}

function QuickLinkCard({
  title,
  description,
  href,
  icon: Icon,
  color
}: {
  title: string;
  description: string;
  href: string;
  icon: any;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-all border border-gray-100 hover:border-gray-200"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`${color} p-2 rounded-lg inline-flex mb-3`}>
            <Icon className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>
    </Link>
  );
}
