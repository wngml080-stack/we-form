"use client";

import { useState, useEffect, useMemo } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

interface Expense {
  id: string;
  expense_date: string;
  category: string;
  sub_category: string;
  description: string;
  amount: number;
  payment_method: string;
  account_holder: string;
  receipt_memo: string;
  tax_invoice_issued: boolean;
  tax_invoice_date: string | null;
  card_receipt_collected: boolean;
  created_at: string;
}

interface ExpenseStats {
  total: number;
  card: number;
  cash: number;
  transfer: number;
  count: number;
  byCategory: Record<string, number>;
  bySubCategory: Record<string, Record<string, number>>; // { category: { subCategory: amount } }
}

interface CustomCategory {
  id: string;
  name: string;
  display_order: number;
}

interface UseExpensesDataProps {
  selectedGymId: string | null;
  selectedCompanyId: string | null;
  filterInitialized: boolean;
}

export function useExpensesData({ selectedGymId, selectedCompanyId, filterInitialized }: UseExpensesDataProps) {
  const supabase = useMemo(() => createSupabaseClient(), []);

  // 지출 데이터
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [previousMonthExpenses, setPreviousMonthExpenses] = useState<Expense[]>([]);

  // 필터
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [quickSelect, setQuickSelect] = useState("thisMonth");

  // 커스텀 카테고리
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);

  // 설정 모달
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 새 행 추가
  const [newRows, setNewRows] = useState<any[]>([]);

  // 통계
  const [stats, setStats] = useState<ExpenseStats>({
    total: 0,
    card: 0,
    cash: 0,
    transfer: 0,
    count: 0,
    byCategory: {},
    bySubCategory: {}
  });

  // 기본 대분류 카테고리
  const defaultCategories = ["운영비", "마케팅비", "인건비", "세금", "지원금", "예비비", "수익분배금"];
  const defaultPaymentMethods = ["card", "cash", "transfer"];

  // 전체 카테고리 (기본 + 커스텀)
  const allCategories = useMemo(() => {
    const custom = customCategories.map(c => c.name);
    return [...new Set([...defaultCategories, ...custom])];
  }, [customCategories]);

  // 필터링된 지출 데이터
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      return true;
    });
  }, [expenses, categoryFilter]);

  // 데이터 로드 (모든 API 병렬 실행 - 성능 최적화)
  useEffect(() => {
    if (filterInitialized && selectedGymId && selectedCompanyId) {
      Promise.all([
        fetchExpenses(selectedGymId, selectedCompanyId),
        fetchPreviousMonthExpenses(selectedGymId, selectedCompanyId),
        fetchCustomCategories(selectedGymId)
      ]).catch(console.error);
    }
  }, [filterInitialized, selectedGymId, selectedCompanyId, startDate, endDate]);

  // 지출 데이터 조회
  const fetchExpenses = async (gymId: string, companyId: string, overrideStartDate?: string, overrideEndDate?: string) => {
    const start = overrideStartDate || startDate;
    const end = overrideEndDate || endDate;

    try {
      const response = await fetch(
        `/api/admin/expenses?gym_id=${gymId}&company_id=${companyId}&start_date=${start}&end_date=${end}`
      );
      const result = await response.json();

      if (result.success && result.expenses) {
        const formattedExpenses: Expense[] = result.expenses.map((e: any) => ({
          id: e.id,
          expense_date: e.expense_date,
          category: e.category || "",
          sub_category: e.sub_category || "",
          description: e.description || "",
          amount: e.amount || 0,
          payment_method: e.payment_method || "card",
          account_holder: e.account_holder || "",
          receipt_memo: e.receipt_memo || "",
          tax_invoice_issued: e.tax_invoice_issued || false,
          tax_invoice_date: e.tax_invoice_date || null,
          card_receipt_collected: e.card_receipt_collected || false,
          created_at: e.created_at,
        }));
        setExpenses(formattedExpenses);
        calculateStats(formattedExpenses);
      } else {
        setExpenses([]);
        setStats({ total: 0, card: 0, cash: 0, transfer: 0, count: 0, byCategory: {}, bySubCategory: {} });
      }
    } catch (error) {
      console.error("지출 조회 중 오류:", error);
      setExpenses([]);
      setStats({ total: 0, card: 0, cash: 0, transfer: 0, count: 0, byCategory: {}, bySubCategory: {} });
    }
  };

  const fetchPreviousMonthExpenses = async (gymId: string, companyId: string) => {
    const start = new Date(startDate);
    start.setMonth(start.getMonth() - 1);
    const end = new Date(endDate);
    end.setMonth(end.getMonth() - 1);

    const s = start.toISOString().split("T")[0];
    const e = end.toISOString().split("T")[0];

    try {
      const response = await fetch(
        `/api/admin/expenses?gym_id=${gymId}&company_id=${companyId}&start_date=${s}&end_date=${e}`
      );
      const result = await response.json();
      if (result.success && result.expenses) {
        setPreviousMonthExpenses(result.expenses);
      }
    } catch {}
  };

  const fetchCustomCategories = async (gymId: string) => {
    try {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .eq("gym_id", gymId)
        .order("display_order");

      if (!error && data) {
        setCustomCategories(data);
      }
    } catch (error) {
      console.error("카테고리 조회 중 오류:", error);
    }
  };

  const calculateStats = (data: Expense[]) => {
    const byCategory: Record<string, number> = {};
    const bySubCategory: Record<string, Record<string, number>> = {};

    const stats = data.reduce((acc, e) => {
      acc.total += e.amount;
      acc.count += 1;
      if (e.payment_method === "card") acc.card += e.amount;
      else if (e.payment_method === "cash") acc.cash += e.amount;
      else if (e.payment_method === "transfer") acc.transfer += e.amount;

      // 카테고리별 합계
      if (!byCategory[e.category]) byCategory[e.category] = 0;
      byCategory[e.category] += e.amount;

      // 계정과목별 합계 (대분류 > 계정과목)
      if (e.category && e.sub_category) {
        if (!bySubCategory[e.category]) bySubCategory[e.category] = {};
        if (!bySubCategory[e.category][e.sub_category]) bySubCategory[e.category][e.sub_category] = 0;
        bySubCategory[e.category][e.sub_category] += e.amount;
      }

      return acc;
    }, { total: 0, card: 0, cash: 0, transfer: 0, count: 0, byCategory: {} as Record<string, number>, bySubCategory: {} as Record<string, Record<string, number>> });

    stats.byCategory = byCategory;
    stats.bySubCategory = bySubCategory;
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
      expense_date: new Date().toISOString().split("T")[0],
      category: "",
      sub_category: "",
      description: "",
      amount: 0,
      payment_method: "card",
      account_holder: "",
      receipt_memo: "",
      tax_invoice_issued: false,
      tax_invoice_date: null,
      card_receipt_collected: false,
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
      const response = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: selectedCompanyId,
          gym_id: selectedGymId,
          expense_date: row.expense_date,
          category: row.category,
          sub_category: row.sub_category,
          description: row.description,
          amount: row.amount,
          payment_method: row.payment_method,
          account_holder: row.account_holder,
          receipt_memo: row.receipt_memo,
          tax_invoice_issued: row.tax_invoice_issued,
          tax_invoice_date: row.tax_invoice_date,
          card_receipt_collected: row.card_receipt_collected,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setNewRows(prev => prev.filter(r => r.id !== id));

        // 약간의 딜레이 후 데이터 새로고침
        setTimeout(() => {
          fetchExpenses(selectedGymId, selectedCompanyId, startDate, endDate);
        }, 300);
      } else {
        console.error("지출 저장 실패:", result.error);
        alert(`저장 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("지출 저장 중 오류:", error);
      alert("지출 저장 중 오류가 발생했습니다.");
    }
  };

  const removeNewRow = (id: string) => {
    setNewRows(prev => prev.filter(r => r.id !== id));
  };

  // 지출 삭제
  const deleteExpense = async (id: string) => {
    if (!selectedGymId || !selectedCompanyId) return;

    try {
      const response = await fetch(`/api/admin/expenses?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        fetchExpenses(selectedGymId, selectedCompanyId);
      } else {
        console.error("지출 삭제 실패:", result.error);
        alert(`삭제 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("지출 삭제 중 오류:", error);
      alert("지출 삭제 중 오류가 발생했습니다.");
    }
  };

  // 지출 수정
  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    if (!selectedGymId || !selectedCompanyId) return;

    try {
      const response = await fetch("/api/admin/expenses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updates }),
      });

      const result = await response.json();

      if (result.success) {
        fetchExpenses(selectedGymId, selectedCompanyId);
      } else {
        console.error("지출 수정 실패:", result.error);
        alert(`수정 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("지출 수정 중 오류:", error);
      alert("지출 수정 중 오류가 발생했습니다.");
    }
  };

  // 커스텀 카테고리 추가
  const addCustomCategory = async (name: string) => {
    if (!name.trim() || !selectedGymId || !selectedCompanyId) return;

    const { error } = await supabase.from("expense_categories").insert({
      gym_id: selectedGymId,
      company_id: selectedCompanyId,
      name: name.trim(),
      display_order: customCategories.length + 1
    });

    if (error) {
      console.error("카테고리 추가 오류:", error);
      return;
    }

    fetchCustomCategories(selectedGymId);
  };

  const deleteCustomCategory = async (id: string) => {
    const { error } = await supabase.from("expense_categories").delete().eq("id", id);

    if (error) {
      console.error("카테고리 삭제 오류:", error);
      return;
    }

    if (selectedGymId) fetchCustomCategories(selectedGymId);
  };

  return {
    // 데이터
    filteredExpenses,
    stats,

    // 옵션들
    allCategories,
    defaultPaymentMethods,

    // 커스텀 카테고리 (설정용)
    customCategories,

    // 설정 모달
    isSettingsOpen,
    setIsSettingsOpen,

    // 필터
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    categoryFilter,
    setCategoryFilter,
    quickSelect,
    handleQuickSelect,

    // 새 행
    newRows,
    addNewRow,
    updateNewRow,
    saveNewRow,
    removeNewRow,

    // CRUD
    deleteExpense,
    updateExpense,
    addCustomCategory,
    deleteCustomCategory,

    previousMonthExpenses,
    // 새로고침
    refreshData: () => {
      if (selectedGymId && selectedCompanyId) {
        fetchExpenses(selectedGymId, selectedCompanyId);
        fetchPreviousMonthExpenses(selectedGymId, selectedCompanyId);
      }
    }
  };
}
