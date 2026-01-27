"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { FcStats, PtStats, SalesSummary, ComparisonData, SalesPeriod, SalesType } from "../components/modals/TotalSalesModal";

export interface Payment {
  id: string;
  member_name: string;
  phone?: string;
  gender?: string;
  birth_date?: string;
  sale_type: string;
  membership_category: string;
  membership_name: string;
  amount: number;
  method: string;
  installment?: number;
  trainer_id?: string;
  trainer_name?: string;
  registrar?: string;
  memo?: string;
  created_at?: string;
  payment_date: string;
  service_sessions?: number;
  bonus_sessions?: number;
  validity_per_session?: number;
  membership_start_date?: string;
  visit_route?: string;
  visit_route_custom?: string;
  expiry_type?: string;
  isNew?: boolean;
}

// 결제 편집 폼 타입
export interface PaymentEditForm {
  payment_date?: string;
  member_name?: string;
  phone?: string;
  sale_type?: string;
  membership_category?: string;
  membership_name?: string;
  amount?: number;
  method?: string;
  installment?: number;
  trainer_id?: string;
  registrar?: string;
  memo?: string;
  service_sessions?: number;
  bonus_sessions?: number;
  validity_per_session?: number;
  membership_start_date?: string;
  visit_route?: string;
  visit_route_custom?: string;
  expiry_type?: string;
  gender?: string;
  birth_date?: string;
}

// 새 결제 행 타입 (아직 저장되지 않은 상태)
export interface NewPaymentRow {
  id: string;
  member_name: string;
  phone: string;
  sale_type: string;
  membership_category: string;
  membership_name: string;
  amount: number;
  method: string;
  installment: number;
  trainer_id: string;
  registrar: string;
  memo: string;
  service_sessions: number;
  bonus_sessions: number;
  validity_per_session: number;
  membership_start_date: string;
  payment_date: string;
  visit_route: string;
  expiry_type: string;
}

// API 응답 결제 데이터 타입
interface ApiPaymentResponse {
  id: string;
  member_name?: string;
  members?: { name?: string; phone?: string };
  phone?: string;
  gender?: string;
  birth_date?: string;
  sale_type?: string;
  registration_type?: string;
  membership_category?: string;
  membership_type?: string;
  membership_name?: string;
  member_memberships?: { name?: string };
  amount?: number;
  method?: string;
  installment?: number;
  installment_count?: number;
  trainer_id?: string;
  trainer_name?: string;
  registrar?: string;
  memo?: string;
  paid_at?: string;
  created_at?: string;
  service_sessions?: number;
  bonus_sessions?: number;
  validity_per_session?: number;
  start_date?: string;
  visit_route?: string;
  expiry_type?: string;
}

interface Staff {
  id: string;
  name: string;
  role: string;
}

interface Stats {
  total: number;
  card: number;
  cash: number;
  transfer: number;
  count: number;
}

interface CustomOption {
  id: string;
  name: string;
  display_order: number;
}

interface GymInfo {
  id: string;
  name: string;
  fc_bep?: number;
  pt_bep?: number;
}

interface UseSalesPageDataProps {
  selectedGymId: string | null;
  selectedCompanyId: string | null;
  filterInitialized: boolean;
}

export function useSalesPageData({ selectedGymId, selectedCompanyId, filterInitialized }: UseSalesPageDataProps) {
  const supabase = useMemo(() => createSupabaseClient(), []);

  // 결제 데이터
  const [payments, setPayments] = useState<Payment[]>([]);
  const [previousMonthPayments, setPreviousMonthPayments] = useState<Payment[]>([]);
  const [lastYearPayments, setLastYearPayments] = useState<Payment[]>([]);

  // 스태프 목록
  const [staffList, setStaffList] = useState<Staff[]>([]);

  // 필터
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [methodFilter, setMethodFilter] = useState("all");
  const [membershipTypeFilter, setMembershipTypeFilter] = useState("all");
  const [registrationTypeFilter, setRegistrationTypeFilter] = useState("all");
  const [quickSelect, setQuickSelect] = useState("thisMonth");

  // 커스텀 옵션들
  const [customSaleTypes, setCustomSaleTypes] = useState<CustomOption[]>([]);
  const [customMembershipCategories, setCustomMembershipCategories] = useState<CustomOption[]>([]);
  const [customMembershipNames, setCustomMembershipNames] = useState<CustomOption[]>([]);
  const [customPaymentMethods, setCustomPaymentMethods] = useState<CustomOption[]>([]);

  // 설정 모달
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 새 행 추가
  const [newRows, setNewRows] = useState<NewPaymentRow[]>([]);

  // 통계
  const [stats, setStats] = useState<Stats>({
    total: 0,
    card: 0,
    cash: 0,
    transfer: 0,
    count: 0
  });

  // 지점 BEP 데이터
  const [gymData, setGymData] = useState<GymInfo | null>(null);

  // BEP 달성률 관련 상태
  const [fcStats, setFcStats] = useState<FcStats>({
    bep: 0, totalSales: 0, bepRate: 0, avgPrice: 0, totalCount: 0,
    walkinCount: 0, onlineCount: 0, renewCount: 0, newRate: 0, newSales: 0
  });
  const [ptStats, setPtStats] = useState<PtStats>({
    bep: 0, totalSales: 0, bepRate: 0, avgPrice: 0, totalCount: 0,
    newCount: 0, renewCount: 0, renewRate: 0, newSales: 0, renewSales: 0
  });
  const [salesSummary, setSalesSummary] = useState<SalesSummary>({
    totalRevenue: 0, fcRevenue: 0, ptRevenue: 0, fcCount: 0, ptCount: 0,
    otherRevenue: 0, otherCount: 0
  });
  const [comparisonData, setComparisonData] = useState<ComparisonData>({
    prevMonth: { fcSales: 0, ptSales: 0, totalSales: 0, fcCount: 0, ptCount: 0 },
    prevYear: { fcSales: 0, ptSales: 0, totalSales: 0, fcCount: 0, ptCount: 0 }
  });

  // 매출 통계 모달 상태
  const [isFcModalOpen, setIsFcModalOpen] = useState(false);
  const [isPtModalOpen, setIsPtModalOpen] = useState(false);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>("thisMonth");
  const [modalCustomDateRange, setModalCustomDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [salesLoading, setSalesLoading] = useState(false);

  // 전체 옵션
  const allSaleTypes = useMemo(() => [...new Set(["신규", "리뉴", "연장", "양도", "환불", ...customSaleTypes.map(t => t.name)])], [customSaleTypes]);
  const allMembershipCategories = useMemo(() => [...new Set(["PT", "헬스", "필라테스", "요가", "수영", "골프", "GX", ...customMembershipCategories.map(t => t.name)])], [customMembershipCategories]);
  const allMembershipNames = useMemo(() => [...new Set(["1개월", "3개월", "6개월", "12개월", "1회", "10회", "20회", "30회", "50회", ...customMembershipNames.map(t => t.name)])], [customMembershipNames]);
  const allPaymentMethods = useMemo(() => [...new Set(["card", "cash", "transfer", ...customPaymentMethods.map(m => m.name)])], [customPaymentMethods]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (methodFilter !== "all" && p.method !== methodFilter) return false;
      if (membershipTypeFilter !== "all" && p.membership_category !== membershipTypeFilter) return false;
      if (registrationTypeFilter !== "all" && p.sale_type !== registrationTypeFilter) return false;
      return true;
    });
  }, [payments, methodFilter, membershipTypeFilter, registrationTypeFilter]);

  // 비교 데이터 로드 함수
  const fetchComparisonPayments = async (gymId: string, companyId: string) => {
    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);

    // 전월
    const prevMonthStart = new Date(currentStart);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
    const prevMonthEnd = new Date(currentEnd);
    prevMonthEnd.setMonth(prevMonthEnd.getMonth() - 1);

    // 전년
    const prevYearStart = new Date(currentStart);
    prevYearStart.setFullYear(prevYearStart.getFullYear() - 1);
    const prevYearEnd = new Date(currentEnd);
    prevYearEnd.setFullYear(prevYearEnd.getFullYear() - 1);

    const fetchRange = async (start: Date, end: Date) => {
      const s = start.toISOString().split("T")[0];
      const e = end.toISOString().split("T")[0];
      const res = await fetch(`/api/admin/sales?gym_id=${gymId}&company_id=${companyId}&start_date=${s}&end_date=${e}`);
      const json = await res.json();
      return json.success ? json.payments : [];
    };

    const [prevMonth, prevYear] = await Promise.all([
      fetchRange(prevMonthStart, prevMonthEnd),
      fetchRange(prevYearStart, prevYearEnd)
    ]);

    setPreviousMonthPayments(prevMonth || []);
    setLastYearPayments(prevYear || []);
  };

  const fetchGymData = useCallback(async (gymId: string) => {
    try {
      const { data, error } = await supabase.from("gyms").select("*").eq("id", gymId).maybeSingle();
      if (!error && data) {
        setGymData(data);
        setFcStats(prev => ({ ...prev, bep: data.fc_bep || 75000000 }));
        setPtStats(prev => ({ ...prev, bep: data.pt_bep || 100000000 }));
      }
    } catch {}
  }, [supabase]);

  const fetchDetailedSales = useCallback(async (_type: SalesType, _period: SalesPeriod) => {
    if (!selectedGymId || !selectedCompanyId) return;
    setSalesLoading(true);
    
    const fcBep = gymData?.fc_bep || 75000000;
    const ptBep = gymData?.pt_bep || 100000000;

    const fcPayments = payments.filter(p => p.membership_category !== "PT");
    const fcTotalSales = fcPayments.reduce((sum, p) => sum + p.amount, 0);
    const fcNewPayments = fcPayments.filter(p => p.sale_type === "신규");
    const fcRenewPayments = fcPayments.filter(p => ["재등록", "리뉴", "연장"].includes(p.sale_type));

    setFcStats({
      bep: fcBep, totalSales: fcTotalSales, bepRate: fcBep > 0 ? (fcTotalSales / fcBep) * 100 : 0,
      avgPrice: fcPayments.length > 0 ? fcTotalSales / fcPayments.length : 0,
      totalCount: fcPayments.length, walkinCount: fcNewPayments.filter(p => p.visit_route === "워크인" || !p.visit_route).length,
      onlineCount: fcNewPayments.filter(p => ["온라인", "인터넷", "네이버"].includes(p.visit_route || "")).length,
      renewCount: fcRenewPayments.length, newRate: fcPayments.length > 0 ? (fcNewPayments.length / fcPayments.length) * 100 : 0,
      newSales: fcNewPayments.reduce((sum, p) => sum + p.amount, 0)
    });

    const ptPayments = payments.filter(p => p.membership_category === "PT");
    const ptTotalSales = ptPayments.reduce((sum, p) => sum + p.amount, 0);
    const ptNewPayments = ptPayments.filter(p => p.sale_type === "신규");
    const ptRenewPayments = ptPayments.filter(p => ["재등록", "리뉴", "연장"].includes(p.sale_type));

    setPtStats({
      bep: ptBep, totalSales: ptTotalSales, bepRate: ptBep > 0 ? (ptTotalSales / ptBep) * 100 : 0,
      avgPrice: ptPayments.length > 0 ? ptTotalSales / ptPayments.length : 0,
      totalCount: ptPayments.length, newCount: ptNewPayments.length, renewCount: ptRenewPayments.length,
      renewRate: ptPayments.length > 0 ? (ptRenewPayments.length / ptPayments.length) * 100 : 0,
      newSales: ptNewPayments.reduce((sum, p) => sum + p.amount, 0),
      renewSales: ptRenewPayments.reduce((sum, p) => sum + p.amount, 0)
    });

    setSalesSummary({
      totalRevenue: fcTotalSales + ptTotalSales, fcRevenue: fcTotalSales, ptRevenue: ptTotalSales,
      fcCount: fcPayments.length, ptCount: ptPayments.length, otherRevenue: 0, otherCount: 0
    });

    setSalesLoading(false);
  }, [selectedGymId, selectedCompanyId, payments, gymData]);

  const openFcModal = useCallback(() => { setSalesPeriod("thisMonth"); fetchDetailedSales("fc", "thisMonth"); setIsFcModalOpen(true); }, [fetchDetailedSales]);
  const openPtModal = useCallback(() => { setSalesPeriod("thisMonth"); fetchDetailedSales("pt", "thisMonth"); setIsPtModalOpen(true); }, [fetchDetailedSales]);
  const openSalesModal = useCallback(() => { setSalesPeriod("thisMonth"); fetchDetailedSales("all", "thisMonth"); setIsSalesModalOpen(true); }, [fetchDetailedSales]);

  const handlePeriodChange = useCallback((type: SalesType, newPeriod: SalesPeriod) => {
    setSalesPeriod(newPeriod);
    if (newPeriod !== "custom") fetchDetailedSales(type, newPeriod);
  }, [fetchDetailedSales]);

  useEffect(() => {
    if (filterInitialized && selectedGymId && selectedCompanyId) {
      // 모든 API 요청을 병렬로 실행 (성능 최적화)
      Promise.all([
        fetchPayments(selectedGymId, selectedCompanyId),
        fetchComparisonPayments(selectedGymId, selectedCompanyId),
        fetchCustomOptions(selectedGymId),
        fetchStaffList(selectedGymId),
        fetchGymData(selectedGymId)
      ]).catch(console.error);
    }
  }, [filterInitialized, selectedGymId, selectedCompanyId, startDate, endDate, fetchGymData]);

  const fetchPayments = async (gymId: string, companyId: string) => {
    try {
      const response = await fetch(`/api/admin/sales?gym_id=${gymId}&company_id=${companyId}&start_date=${startDate}&end_date=${endDate}`);
      const result = await response.json();
      if (result.success && result.payments) {
        const formatted: Payment[] = result.payments.map((p: ApiPaymentResponse) => ({
          id: p.id,
          member_name: p.member_name || p.members?.name || "",
          phone: p.phone || p.members?.phone || "",
          gender: p.gender || "",
          birth_date: p.birth_date || "",
          sale_type: p.sale_type || p.registration_type || "",
          membership_category: p.membership_category || p.membership_type || "",
          membership_name: p.membership_name || p.member_memberships?.name || "",
          amount: p.amount || 0,
          method: p.method || "card",
          installment: p.installment || p.installment_count || 1,
          trainer_id: p.trainer_id || "",
          trainer_name: p.trainer_name || "",
          registrar: p.registrar || "",
          memo: p.memo || "",
          created_at: p.paid_at || p.created_at,
          payment_date: p.paid_at || p.created_at || "",
          service_sessions: p.service_sessions || 0,
          bonus_sessions: p.bonus_sessions || 0,
          validity_per_session: p.validity_per_session || 0,
          membership_start_date: p.start_date || "",
          visit_route: p.visit_route || "",
          expiry_type: p.expiry_type || "",
        }));
        setPayments(formatted);
        const calculatedStats = formatted.reduce((acc: Stats, p: Payment) => {
          acc.total += p.amount; acc.count += 1;
          if (p.method === "card") acc.card += p.amount;
          else if (p.method === "cash") acc.cash += p.amount;
          else if (p.method === "transfer") acc.transfer += p.amount;
          return acc;
        }, { total: 0, card: 0, cash: 0, transfer: 0, count: 0 });
        setStats(calculatedStats);
      }
    } catch (error) {
      console.error("매출 조회 오류:", error);
    }
  };

  const fetchStaffList = async (gymId: string) => {
    const { data, error } = await supabase.from("staffs").select("id, name, role").eq("gym_id", gymId).eq("employment_status", "재직").order("name");
    if (!error && data) setStaffList(data);
  };

  const fetchCustomOptions = async (gymId: string) => {
    try {
      const [saleTypesRes, categoriesRes, namesRes, methodsRes] = await Promise.all([
        supabase.from("sale_types").select("*").eq("gym_id", gymId).order("display_order"),
        supabase.from("membership_categories").select("*").eq("gym_id", gymId).order("display_order"),
        supabase.from("membership_names").select("*").eq("gym_id", gymId).order("display_order"),
        supabase.from("payment_methods").select("*").eq("gym_id", gymId).order("display_order")
      ]);
      if (saleTypesRes.data) setCustomSaleTypes(saleTypesRes.data);
      if (categoriesRes.data) setCustomMembershipCategories(categoriesRes.data);
      if (namesRes.data) setCustomMembershipNames(namesRes.data);
      if (methodsRes.data) setCustomPaymentMethods(methodsRes.data);
    } catch {}
  };

  const handleQuickSelect = (value: string) => {
    setQuickSelect(value);
    const today = new Date();
    let start: Date, end: Date;
    switch (value) {
      case "today": start = end = today; break;
      case "thisWeek": start = new Date(today); start.setDate(today.getDate() - today.getDay()); end = today; break;
      case "thisMonth": start = new Date(today.getFullYear(), today.getMonth(), 1); end = today; break;
      case "lastMonth": start = new Date(today.getFullYear(), today.getMonth() - 1, 1); end = new Date(today.getFullYear(), today.getMonth(), 0); break;
      default: return;
    }
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  const addNewRow = () => {
    setNewRows(prev => [...prev, {
      id: `new-${Date.now()}`, member_name: "", phone: "", sale_type: "신규",
      membership_category: "", membership_name: "", amount: 0, method: "card",
      installment: 1, trainer_id: "", registrar: "", memo: "",
      service_sessions: 0, bonus_sessions: 0, validity_per_session: 0,
      membership_start_date: new Date().toISOString().split("T")[0],
      payment_date: new Date().toISOString().split("T")[0],
      visit_route: "워크인", expiry_type: "60일 이내"
    }]);
  };

  const updateNewRow = (id: string, field: string, value: string | number) => { setNewRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row)); };
  const removeNewRow = (id: string) => { setNewRows(prev => prev.filter(r => r.id !== id)); };

  const deletePayment = async (id: string) => {
    if (!selectedGymId || !selectedCompanyId) return;
    try {
      const response = await fetch(`/api/admin/sales?id=${id}`, { method: "DELETE" });
      if ((await response.json()).success) fetchPayments(selectedGymId, selectedCompanyId);
    } catch {}
  };

  const updatePayment = async (id: string, updates: Partial<Payment>) => {
    if (!selectedGymId || !selectedCompanyId) return;
    try {
      const response = await fetch("/api/admin/sales", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updates }),
      });
      if ((await response.json()).success) fetchPayments(selectedGymId, selectedCompanyId);
    } catch {}
  };

  type CustomOptionType = "sale_type" | "membership_category" | "membership_name" | "payment_method";
  const tableMap: Record<CustomOptionType, string> = {
    sale_type: "sale_types",
    membership_category: "membership_categories",
    membership_name: "membership_names",
    payment_method: "payment_methods"
  };

  const addCustomOption = async (type: CustomOptionType, name: string) => {
    if (!name.trim() || !selectedGymId || !selectedCompanyId) return;
    const { error } = await supabase.from(tableMap[type]).insert({
      gym_id: selectedGymId, company_id: selectedCompanyId, name: name.trim(), display_order: 1
    });
    if (!error) fetchCustomOptions(selectedGymId);
  };

  const deleteCustomOption = async (type: CustomOptionType, id: string) => {
    const { error } = await supabase.from(tableMap[type]).delete().eq("id", id);
    if (!error && selectedGymId) fetchCustomOptions(selectedGymId);
  };

  return {
    filteredPayments, stats, staffList, allSaleTypes, allMembershipCategories, allMembershipNames, allPaymentMethods,
    defaultInstallments: [1, 2, 3, 4, 5, 6, 10, 12], customSaleTypes, customMembershipCategories, customMembershipNames,
    customPaymentMethods, isSettingsOpen, fetchPayments, setIsSettingsOpen, startDate, setStartDate, endDate, setEndDate,
    methodFilter, setMethodFilter, membershipTypeFilter, setMembershipTypeFilter, registrationTypeFilter, setRegistrationTypeFilter,
    quickSelect, handleQuickSelect, newRows, addNewRow, updateNewRow, removeNewRow, deletePayment, updatePayment,
    addCustomOption, deleteCustomOption, gymData, fcStats, ptStats,
    fcProgress: (gymData?.fc_bep || 75000000) > 0 ? (payments.filter(p => p.membership_category !== "PT").reduce((s, p) => s + p.amount, 0) / (gymData?.fc_bep || 75000000)) * 100 : 0,
    ptProgress: (gymData?.pt_bep || 100000000) > 0 ? (payments.filter(p => p.membership_category === "PT").reduce((s, p) => s + p.amount, 0) / (gymData?.pt_bep || 100000000)) * 100 : 0,
    salesSummary, comparisonData, salesLoading, isFcModalOpen, setIsFcModalOpen, isPtModalOpen, setIsPtModalOpen,
    isSalesModalOpen, setIsSalesModalOpen, salesPeriod, modalCustomDateRange, setModalCustomDateRange, openFcModal,
    openPtModal, openSalesModal, handlePeriodChange, fetchDetailedSales,
    previousMonthPayments, lastYearPayments
  };
}
