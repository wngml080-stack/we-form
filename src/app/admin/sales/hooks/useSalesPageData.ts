"use client";

import { useState, useEffect, useMemo } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

interface Payment {
  id: string;
  member_name: string;
  phone?: string;
  sale_type: string;         // 유형 (신규, 재등록, 양도 등)
  membership_category: string; // 회원권 (PT, 헬스, 필라테스 등)
  membership_name: string;   // 회원권명 (1개월, 3개월 등)
  amount: number;
  method: string;
  installment?: number;      // 할부
  trainer_id?: string;
  trainer_name?: string;
  memo?: string;
  created_at: string;
  // 상세 필드
  service_sessions?: number;      // 서비스 세션
  validity_per_session?: number;  // 1회당 유효기간 (일)
  membership_start_date?: string; // 회원권 시작일
  visit_route?: string;           // 방문 경로 (신규용)
  expiry_type?: string;           // 만기 구분 (재등록/리뉴용: 60일 이내/이외)
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

interface UseSalesPageDataProps {
  selectedGymId: string | null;
  selectedCompanyId: string | null;
  filterInitialized: boolean;
}

export function useSalesPageData({ selectedGymId, selectedCompanyId, filterInitialized }: UseSalesPageDataProps) {
  const supabase = useMemo(() => createSupabaseClient(), []);

  // 결제 데이터
  const [payments, setPayments] = useState<Payment[]>([]);

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
  const [customSaleTypes, setCustomSaleTypes] = useState<CustomOption[]>([]);           // 유형
  const [customMembershipCategories, setCustomMembershipCategories] = useState<CustomOption[]>([]); // 회원권
  const [customMembershipNames, setCustomMembershipNames] = useState<CustomOption[]>([]); // 회원권명
  const [customPaymentMethods, setCustomPaymentMethods] = useState<CustomOption[]>([]);

  // 설정 모달
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 새 행 추가
  const [newRows, setNewRows] = useState<any[]>([]);

  // 인라인 편집
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  // 통계
  const [stats, setStats] = useState<Stats>({
    total: 0,
    card: 0,
    cash: 0,
    transfer: 0,
    count: 0
  });

  // 기본 옵션들
  const defaultSaleTypes = ["신규", "재등록", "연장", "양도", "환불"];
  const defaultMembershipCategories = ["PT", "헬스", "필라테스", "요가", "수영", "골프", "GX"];
  const defaultMembershipNames = ["1개월", "3개월", "6개월", "12개월", "1회", "10회", "20회", "30회", "50회"];
  const defaultPaymentMethods = ["card", "cash", "transfer"];
  const defaultInstallments = [1, 2, 3, 4, 5, 6, 10, 12];

  // 전체 옵션 (기본 + 커스텀)
  const allSaleTypes = useMemo(() => {
    const custom = customSaleTypes.map(t => t.name);
    return [...new Set([...defaultSaleTypes, ...custom])];
  }, [customSaleTypes]);

  const allMembershipCategories = useMemo(() => {
    const custom = customMembershipCategories.map(t => t.name);
    return [...new Set([...defaultMembershipCategories, ...custom])];
  }, [customMembershipCategories]);

  const allMembershipNames = useMemo(() => {
    const custom = customMembershipNames.map(t => t.name);
    return [...new Set([...defaultMembershipNames, ...custom])];
  }, [customMembershipNames]);

  const allPaymentMethods = useMemo(() => {
    const custom = customPaymentMethods.map(m => m.name);
    return [...new Set([...defaultPaymentMethods, ...custom])];
  }, [customPaymentMethods]);

  // 필터링된 결제 데이터
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (methodFilter !== "all" && p.method !== methodFilter) return false;
      if (membershipTypeFilter !== "all" && p.membership_category !== membershipTypeFilter) return false;
      if (registrationTypeFilter !== "all" && p.sale_type !== registrationTypeFilter) return false;
      return true;
    });
  }, [payments, methodFilter, membershipTypeFilter, registrationTypeFilter]);

  // 데이터 로드
  useEffect(() => {
    if (filterInitialized && selectedGymId && selectedCompanyId) {
      fetchPayments(selectedGymId, selectedCompanyId);
      fetchCustomOptions(selectedGymId);
      fetchStaffList(selectedGymId);
    }
  }, [filterInitialized, selectedGymId, selectedCompanyId]);

  // 날짜 필터 변경 시
  useEffect(() => {
    if (selectedGymId && selectedCompanyId) {
      fetchPayments(selectedGymId, selectedCompanyId);
    }
  }, [startDate, endDate]);

  // 결제 데이터 조회
  const fetchPayments = async (gymId: string, companyId: string) => {
    try {
      const response = await fetch(
        `/api/admin/sales?gym_id=${gymId}&company_id=${companyId}&start_date=${startDate}&end_date=${endDate}`
      );
      const result = await response.json();

      if (result.success && result.payments) {
        const formattedPayments: Payment[] = result.payments.map((p: any) => ({
          id: p.id,
          member_name: p.member_name || p.members?.name || "",
          phone: p.phone || p.members?.phone || "",
          sale_type: p.sale_type || p.registration_type || "",
          membership_category: p.membership_category || p.membership_type || "",
          membership_name: p.membership_name || p.member_memberships?.name || "",
          amount: p.amount || 0,
          method: p.method || "card",
          installment: p.installment || p.installment_count || 1,
          trainer_id: p.trainer_id || "",
          trainer_name: p.trainer_name || "",
          memo: p.memo || "",
          created_at: p.paid_at || p.created_at,
          service_sessions: p.service_sessions || 0,
          validity_per_session: p.validity_per_session || 0,
          membership_start_date: p.start_date || "",
          visit_route: p.visit_route || "",
          expiry_type: p.expiry_type || "",
        }));
        setPayments(formattedPayments);
        calculateStats(formattedPayments);
      } else {
        setPayments([]);
        setStats({ total: 0, card: 0, cash: 0, transfer: 0, count: 0 });
      }
    } catch (error) {
      console.error("매출 조회 중 오류:", error);
      setPayments([]);
      setStats({ total: 0, card: 0, cash: 0, transfer: 0, count: 0 });
    }
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

  const fetchCustomOptions = async (gymId: string) => {
    try {
      const [saleTypesRes, categoriesRes, namesRes, methodsRes] = await Promise.all([
        supabase.from("sale_types").select("*").eq("gym_id", gymId).order("display_order"),
        supabase.from("membership_categories").select("*").eq("gym_id", gymId).order("display_order"),
        supabase.from("membership_names").select("*").eq("gym_id", gymId).order("display_order"),
        supabase.from("payment_methods").select("*").eq("gym_id", gymId).order("display_order")
      ]);

      if (saleTypesRes.error) console.error("sale_types 조회 오류:", saleTypesRes.error);
      if (categoriesRes.error) console.error("membership_categories 조회 오류:", categoriesRes.error);
      if (namesRes.error) console.error("membership_names 조회 오류:", namesRes.error);
      if (methodsRes.error) console.error("payment_methods 조회 오류:", methodsRes.error);

      if (saleTypesRes.data) setCustomSaleTypes(saleTypesRes.data);
      if (categoriesRes.data) setCustomMembershipCategories(categoriesRes.data);
      if (namesRes.data) setCustomMembershipNames(namesRes.data);
      if (methodsRes.data) setCustomPaymentMethods(methodsRes.data);
    } catch (error) {
      console.error("커스텀 옵션 조회 중 오류:", error);
    }
  };

  const calculateStats = (data: Payment[]) => {
    const stats = data.reduce((acc, p) => {
      acc.total += p.amount;
      acc.count += 1;
      if (p.method === "card") acc.card += p.amount;
      else if (p.method === "cash") acc.cash += p.amount;
      else if (p.method === "transfer") acc.transfer += p.amount;
      return acc;
    }, { total: 0, card: 0, cash: 0, transfer: 0, count: 0 });
    setStats(stats);
  };

  const handleQuickSelect = (value: string) => {
    setQuickSelect(value);
    const today = new Date();
    let start: Date, end: Date;

    switch (value) {
      case "today":
        start = end = today;
        break;
      case "thisWeek":
        start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        end = today;
        break;
      case "thisMonth":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      case "lastMonth":
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        return;
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  // 새 행 관련
  const addNewRow = () => {
    setNewRows(prev => [...prev, {
      id: `new-${Date.now()}`,
      member_name: "",
      phone: "",
      sale_type: "신규",
      membership_category: "",
      membership_name: "",
      amount: 0,
      method: "card",
      installment: 1,
      trainer_id: "",
      memo: "",
      service_sessions: 0,
      validity_per_session: 0,
      membership_start_date: new Date().toISOString().split("T")[0],
      visit_route: "워크인",
      expiry_type: "60일 이내"
    }]);
  };

  const updateNewRow = (id: string, field: string, value: any) => {
    setNewRows(prev => prev.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // 새 행 저장
  const saveNewRow = async (id: string) => {
    const row = newRows.find(r => r.id === id);
    if (!row || !selectedGymId || !selectedCompanyId) return;

    try {
      const response = await fetch("/api/admin/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: selectedCompanyId,
          gym_id: selectedGymId,
          member_name: row.member_name,
          phone: row.phone,
          sale_type: row.sale_type,
          membership_category: row.membership_category,
          membership_name: row.membership_name,
          amount: row.amount,
          method: row.method,
          installment: row.installment,
          trainer_id: row.trainer_id,
          memo: row.memo,
          service_sessions: row.service_sessions,
          validity_per_session: row.validity_per_session,
          membership_start_date: row.membership_start_date,
          visit_route: row.visit_route,
          expiry_type: row.expiry_type,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setNewRows(prev => prev.filter(r => r.id !== id));
        // 저장 후 데이터 새로고침
        fetchPayments(selectedGymId, selectedCompanyId);
      } else {
        console.error("매출 저장 실패:", result.error);
        alert(`저장 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("매출 저장 중 오류:", error);
      alert("매출 저장 중 오류가 발생했습니다.");
    }
  };

  const removeNewRow = (id: string) => {
    setNewRows(prev => prev.filter(r => r.id !== id));
  };

  // 결제 삭제
  const deletePayment = async (id: string) => {
    if (!selectedGymId || !selectedCompanyId) return;

    try {
      const response = await fetch(`/api/admin/sales?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        // 삭제 후 데이터 새로고침
        fetchPayments(selectedGymId, selectedCompanyId);
      } else {
        console.error("매출 삭제 실패:", result.error);
        alert(`삭제 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("매출 삭제 중 오류:", error);
      alert("매출 삭제 중 오류가 발생했습니다.");
    }
  };

  // 결제 수정
  const updatePayment = async (id: string, updates: Partial<Payment>) => {
    if (!selectedGymId || !selectedCompanyId) return;

    try {
      const response = await fetch("/api/admin/sales", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updates }),
      });

      const result = await response.json();

      if (result.success) {
        // 수정 후 데이터 새로고침
        fetchPayments(selectedGymId, selectedCompanyId);
      } else {
        console.error("매출 수정 실패:", result.error);
        alert(`수정 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("매출 수정 중 오류:", error);
      alert("매출 수정 중 오류가 발생했습니다.");
    }
  };

  // 커스텀 옵션 추가
  const addCustomOption = async (type: "sale_type" | "membership_category" | "membership_name" | "payment_method", name: string) => {
    if (!name.trim() || !selectedGymId || !selectedCompanyId) return;

    const tableMap = {
      sale_type: "sale_types",
      membership_category: "membership_categories",
      membership_name: "membership_names",
      payment_method: "payment_methods"
    };

    const countMap = {
      sale_type: customSaleTypes.length,
      membership_category: customMembershipCategories.length,
      membership_name: customMembershipNames.length,
      payment_method: customPaymentMethods.length
    };

    const { error } = await supabase.from(tableMap[type]).insert({
      gym_id: selectedGymId,
      company_id: selectedCompanyId,
      name: name.trim(),
      display_order: countMap[type] + 1
    });

    if (error) {
      console.error(`${type} 추가 오류:`, error);
      return;
    }

    fetchCustomOptions(selectedGymId);
  };

  const deleteCustomOption = async (type: "sale_type" | "membership_category" | "membership_name" | "payment_method", id: string) => {
    const tableMap = {
      sale_type: "sale_types",
      membership_category: "membership_categories",
      membership_name: "membership_names",
      payment_method: "payment_methods"
    };

    const { error } = await supabase.from(tableMap[type]).delete().eq("id", id);

    if (error) {
      console.error(`${type} 삭제 오류:`, error);
      return;
    }

    if (selectedGymId) fetchCustomOptions(selectedGymId);
  };

  return {
    // 데이터
    filteredPayments,
    stats,
    staffList,

    // 옵션들
    allSaleTypes,
    allMembershipCategories,
    allMembershipNames,
    allPaymentMethods,
    defaultInstallments,

    // 커스텀 옵션 (설정용)
    customSaleTypes,
    customMembershipCategories,
    customMembershipNames,
    customPaymentMethods,

    // 설정 모달
    isSettingsOpen,
    setIsSettingsOpen,

    // 필터
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    methodFilter,
    setMethodFilter,
    membershipTypeFilter,
    setMembershipTypeFilter,
    registrationTypeFilter,
    setRegistrationTypeFilter,
    quickSelect,
    handleQuickSelect,

    // 새 행
    newRows,
    addNewRow,
    updateNewRow,
    saveNewRow,
    removeNewRow,

    // CRUD
    deletePayment,
    updatePayment,
    addCustomOption,
    deleteCustomOption,

    // 새로고침
    refreshData: () => {
      if (selectedGymId && selectedCompanyId) {
        fetchPayments(selectedGymId, selectedCompanyId);
      }
    }
  };
}
