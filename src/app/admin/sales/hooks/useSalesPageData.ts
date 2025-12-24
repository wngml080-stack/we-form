"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "@/lib/toast";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// 기본 회원권 유형 (고정)
export const DEFAULT_MEMBERSHIP_TYPES = [
  { name: "헬스", color: "bg-blue-100 text-blue-700" },
  { name: "필라테스", color: "bg-pink-100 text-pink-700" },
  { name: "PT", color: "bg-purple-100 text-purple-700" },
  { name: "PPT", color: "bg-violet-100 text-violet-700" },
  { name: "GPT", color: "bg-indigo-100 text-indigo-700" },
  { name: "골프", color: "bg-green-100 text-green-700" },
  { name: "GX", color: "bg-orange-100 text-orange-700" },
];

// 기본 결제방법 (고정)
export const DEFAULT_PAYMENT_METHODS = [
  { name: "카드", code: "card", color: "bg-blue-100 text-blue-700" },
  { name: "현금", code: "cash", color: "bg-emerald-100 text-emerald-700" },
  { name: "계좌이체", code: "transfer", color: "bg-purple-100 text-purple-700" },
];

// 날짜를 YYYY-MM-DD 형식으로 변환 (로컬 시간 기준)
export const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
};

export interface NewRow {
  id: string;
  isNew: boolean;
  paid_at: string;
  customer_name: string;
  customer_phone: string;
  product_name: string;
  method: string;
  amount: string;
  memo: string;
}

export interface EditingCell {
  id: string;
  field: string;
}

export interface Stats {
  total: number;
  card: number;
  cash: number;
  transfer: number;
  count: number;
}

interface UseSalesPageDataProps {
  selectedGymId: string | null;
  selectedCompanyId: string | null;
  filterInitialized: boolean;
}

export function useSalesPageData({
  selectedGymId,
  selectedCompanyId,
  filterInitialized
}: UseSalesPageDataProps) {
  const { user } = useAuth();
  const supabase = useMemo(() => createSupabaseClient(), []);

  const [payments, setPayments] = useState<any[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<any[]>([]);

  // 커스텀 회원권 유형 및 결제방법
  const [customMembershipTypes, setCustomMembershipTypes] = useState<any[]>([]);
  const [customPaymentMethods, setCustomPaymentMethods] = useState<any[]>([]);

  // 전체 목록 (기본 + 커스텀)
  const allMembershipTypes = [...DEFAULT_MEMBERSHIP_TYPES, ...customMembershipTypes];
  const allPaymentMethods = [...DEFAULT_PAYMENT_METHODS, ...customPaymentMethods];

  // 설정 모달
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newMembershipType, setNewMembershipType] = useState("");
  const [newPaymentMethod, setNewPaymentMethod] = useState({ name: "", code: "" });

  // 새 행 추가 (엑셀 스타일)
  const [newRows, setNewRows] = useState<NewRow[]>([]);

  // 인라인 편집
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");

  // 필터
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    return formatDate(new Date(date.getFullYear(), date.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return formatDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
  });
  const [methodFilter, setMethodFilter] = useState("all");
  const [membershipTypeFilter, setMembershipTypeFilter] = useState("all");
  const [registrationTypeFilter, setRegistrationTypeFilter] = useState("all");
  const [quickSelect, setQuickSelect] = useState<string>("month");

  // 통계
  const [stats, setStats] = useState<Stats>({
    total: 0,
    card: 0,
    cash: 0,
    transfer: 0,
    count: 0
  });

  // 필터 초기화 시 데이터 로드
  useEffect(() => {
    if (filterInitialized && selectedGymId && selectedCompanyId) {
      fetchPayments(selectedGymId, selectedCompanyId);
      fetchCustomOptions(selectedGymId);
    }
  }, [filterInitialized, selectedGymId, selectedCompanyId]);

  // 날짜 필터 변경 시 데이터 다시 불러오기
  useEffect(() => {
    if (selectedGymId && selectedCompanyId) {
      fetchPayments(selectedGymId, selectedCompanyId);
    }
  }, [startDate, endDate]);

  // 클라이언트 사이드 필터링
  useEffect(() => {
    let filtered = [...payments];

    if (methodFilter !== "all") {
      filtered = filtered.filter(p => p.method === methodFilter);
    }
    if (membershipTypeFilter !== "all") {
      filtered = filtered.filter(p => p.membership_type === membershipTypeFilter);
    }
    if (registrationTypeFilter !== "all") {
      filtered = filtered.filter(p => p.registration_type === registrationTypeFilter);
    }

    setFilteredPayments(filtered);

    // 통계 계산
    const newStats = filtered.reduce((acc, p) => {
      const amount = parseFloat(p.amount || 0);
      acc.total += amount;
      acc.count += 1;

      if (p.method === 'card') acc.card += amount;
      else if (p.method === 'cash') acc.cash += amount;
      else if (p.method === 'transfer') acc.transfer += amount;

      return acc;
    }, { total: 0, card: 0, cash: 0, transfer: 0, count: 0 });

    setStats(newStats);
  }, [payments, methodFilter, membershipTypeFilter, registrationTypeFilter]);

  const fetchPayments = async (targetGymId: string, targetCompanyId: string) => {
    let query = supabase
      .from("member_payments")
      .select(`*, members (name, phone), member_memberships (name)`)
      .eq("gym_id", targetGymId)
      .eq("company_id", targetCompanyId);

    if (startDate) {
      query = query.gte("paid_at", startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      query = query.lte("paid_at", endDateTime.toISOString());
    }

    const { data, error } = await query.order("paid_at", { ascending: true });

    if (error) {
      console.error("결제 내역 조회 에러:", error);
      return;
    }

    setPayments(data || []);
  };

  const fetchCustomOptions = async (targetGymId: string) => {
    const [typesRes, methodsRes] = await Promise.all([
      supabase.from("membership_types").select("*").eq("gym_id", targetGymId).order("display_order"),
      supabase.from("payment_methods").select("*").eq("gym_id", targetGymId).order("display_order")
    ]);
    if (typesRes.data) setCustomMembershipTypes(typesRes.data);
    if (methodsRes.data) setCustomPaymentMethods(methodsRes.data);
  };

  // 회원권 유형 추가
  const handleAddMembershipType = async () => {
    if (!newMembershipType.trim() || !selectedGymId || !selectedCompanyId) return;
    const { error } = await supabase.from("membership_types").insert({
      gym_id: selectedGymId,
      company_id: selectedCompanyId,
      name: newMembershipType.trim(),
      display_order: customMembershipTypes.length + 1
    });
    if (error) {
      console.error("회원권 유형 추가 에러:", error);
      toast.error(`추가 실패: ${error.message}`);
    } else {
      setNewMembershipType("");
      fetchCustomOptions(selectedGymId);
    }
  };

  // 결제방법 추가
  const handleAddPaymentMethod = async () => {
    if (!newPaymentMethod.name.trim() || !selectedGymId || !selectedCompanyId) return;
    const code = newPaymentMethod.code.trim() || newPaymentMethod.name.trim().toLowerCase();
    const { error } = await supabase.from("payment_methods").insert({
      gym_id: selectedGymId,
      company_id: selectedCompanyId,
      name: newPaymentMethod.name.trim(),
      code: code,
      display_order: customPaymentMethods.length + 1
    });
    if (error) {
      console.error("결제방법 추가 에러:", error);
      toast.error(`추가 실패: ${error.message}`);
    } else {
      setNewPaymentMethod({ name: "", code: "" });
      fetchCustomOptions(selectedGymId);
    }
  };

  // 회원권 유형 삭제
  const handleDeleteMembershipType = async (id: string) => {
    if (!confirm("이 회원권 유형을 삭제하시겠습니까?") || !selectedGymId) return;
    await supabase.from("membership_types").delete().eq("id", id);
    fetchCustomOptions(selectedGymId);
  };

  // 결제방법 삭제
  const handleDeletePaymentMethod = async (id: string) => {
    if (!confirm("이 결제방법을 삭제하시겠습니까?") || !selectedGymId) return;
    await supabase.from("payment_methods").delete().eq("id", id);
    fetchCustomOptions(selectedGymId);
  };

  // 새 행 추가
  const addNewRow = () => {
    const newRow: NewRow = {
      id: `new-${Date.now()}`,
      isNew: true,
      paid_at: formatDate(new Date()),
      customer_name: "",
      customer_phone: "",
      product_name: "",
      method: "card",
      amount: "",
      memo: ""
    };
    setNewRows([...newRows, newRow]);
  };

  // 새 행 값 변경
  const updateNewRow = (rowId: string, field: string, value: any) => {
    setNewRows(prev => prev.map(row =>
      row.id === rowId ? { ...row, [field]: value } : row
    ));
  };

  // 새 행 저장
  const saveNewRow = async (rowId: string) => {
    const row = newRows.find(r => r.id === rowId);
    if (!row) return;

    if (!row.amount || parseFloat(row.amount) <= 0) {
      toast.warning("금액을 입력해주세요.");
      return;
    }

    const memoDetails = [
      row.product_name,
      row.customer_name ? `(${row.customer_name})` : null,
      row.customer_phone ? `${row.customer_phone}` : null,
      row.memo
    ].filter(Boolean).join(" ");

    const { error } = await supabase.from("member_payments").insert({
      gym_id: selectedGymId,
      company_id: selectedCompanyId,
      member_id: null,
      amount: parseFloat(row.amount),
      total_amount: parseFloat(row.amount),
      method: row.method,
      membership_type: "부가상품",
      registration_type: "회원 이외",
      visit_route: null,
      memo: memoDetails || null,
      paid_at: row.paid_at || new Date().toISOString(),
      installment_count: 1,
      installment_current: 1,
      created_by: user?.id || null
    });

    if (error) {
      console.error("저장 에러:", error);
      toast.error(`저장 실패: ${error.message}`);
    } else {
      setNewRows(prev => prev.filter(r => r.id !== rowId));
      if (selectedGymId && selectedCompanyId) {
        fetchPayments(selectedGymId, selectedCompanyId);
      }
    }
  };

  // 새 행 삭제
  const removeNewRow = (rowId: string) => {
    setNewRows(prev => prev.filter(r => r.id !== rowId));
  };

  // 인라인 편집 시작
  const startEditing = (id: string, field: string, currentValue: string) => {
    setEditingCell({ id, field });
    setEditValue(currentValue);
  };

  // 인라인 편집 저장
  const saveEdit = async (paymentId: string, field: string) => {
    let updateValue: any = editValue;

    if (field === "amount") {
      updateValue = parseFloat(editValue.replace(/[^0-9.-]/g, ""));
      if (isNaN(updateValue)) {
        toast.warning("올바른 금액을 입력해주세요.");
        return;
      }
    }

    const { error } = await supabase
      .from("member_payments")
      .update({ [field]: updateValue })
      .eq("id", paymentId);

    if (error) {
      console.error("수정 에러:", error);
      toast.error(`수정 실패: ${error.message}`);
    } else {
      setPayments(prev => prev.map(p =>
        p.id === paymentId ? { ...p, [field]: updateValue } : p
      ));
    }
    setEditingCell(null);
    setEditValue("");
  };

  // 편집 취소
  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  // 빠른 선택 핸들러
  const handleQuickSelect = (type: string) => {
    const today = new Date();

    switch (type) {
      case "today":
        const todayStr = formatDate(today);
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      case "yesterday":
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = formatDate(yesterday);
        setStartDate(yesterdayStr);
        setEndDate(yesterdayStr);
        break;
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        setStartDate(formatDate(weekAgo));
        setEndDate(formatDate(today));
        break;
      case "month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setStartDate(formatDate(monthStart));
        setEndDate(formatDate(monthEnd));
        break;
    }
    setQuickSelect(type);
  };

  return {
    // Data
    payments,
    filteredPayments,
    stats,
    allMembershipTypes,
    allPaymentMethods,
    customMembershipTypes,
    customPaymentMethods,

    // Settings modal
    isSettingsOpen, setIsSettingsOpen,
    newMembershipType, setNewMembershipType,
    newPaymentMethod, setNewPaymentMethod,
    handleAddMembershipType,
    handleAddPaymentMethod,
    handleDeleteMembershipType,
    handleDeletePaymentMethod,

    // Filters
    startDate, setStartDate,
    endDate, setEndDate,
    methodFilter, setMethodFilter,
    membershipTypeFilter, setMembershipTypeFilter,
    registrationTypeFilter, setRegistrationTypeFilter,
    quickSelect, handleQuickSelect,

    // New rows
    newRows,
    addNewRow,
    updateNewRow,
    saveNewRow,
    removeNewRow,

    // Inline editing
    editingCell,
    editValue, setEditValue,
    startEditing,
    saveEdit,
    cancelEdit,
  };
}
