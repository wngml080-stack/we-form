"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Plus, Receipt, PlusCircle, Trash2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

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

// 대분류별 기본 계정과목 매핑
const defaultSubCategoryMap: Record<string, string[]> = {
  "운영비": ["임대료", "관리비", "주차비", "세탁비", "렌탈가전", "CCTV", "통신비", "유지자동이체", "세무기장", "기구리스료", "외식비", "관리보험료", "수리비", "비품"],
  "마케팅비": ["인스타", "파워링크", "플레이스", "다짐", "니짐내짐", "당근", "카카오채널", "홍보물제작", "아파트게시판", "기타"],
  "인건비": ["정직원", "프리랜서", "파트강사", "구인비용", "퇴직금", "트레이너상금", "기타"],
  "세금": ["부가세", "사업소득세", "지방소득세", "법인세", "근로소득세", "사회보험료", "벌금", "기타"],
  "지원금": ["교육비", "컨설팅비", "기타"],
  "예비비": ["예비비", "세금예비비"],
  "수익분배금": ["수익분배금"],
};

// localStorage 키
const CUSTOM_SUB_CATEGORIES_KEY = "expense_custom_sub_categories";

interface ExpensesTableProps {
  expenses: Expense[];
  newRows: any[];
  categories: string[];
  paymentMethods: string[];
  onAddNewRow: () => void;
  onUpdateNewRow: (id: string, field: string, value: any) => void;
  onSaveNewRow: (id: string) => void;
  onRemoveNewRow: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Expense>) => void;
}

const methodLabels: Record<string, string> = {
  card: "카드",
  cash: "현금",
  transfer: "이체"
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ko-KR").format(amount) + "원";
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}.${day}`;
};

export function ExpensesTable({
  expenses,
  newRows,
  categories,
  paymentMethods,
  onAddNewRow,
  onUpdateNewRow,
  onSaveNewRow,
  onRemoveNewRow,
  onDelete,
  onUpdate,
}: ExpensesTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Expense>>({});
  
  // 필터 상태
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 커스텀 계정과목 상태
  const [customSubCategories, setCustomSubCategories] = useState<Record<string, string[]>>({});
  const [addingSubCategory, setAddingSubCategory] = useState<{ rowId: string; category: string } | null>(null);
  const [newSubCategoryName, setNewSubCategoryName] = useState("");

  // localStorage에서 커스텀 계정과목 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_SUB_CATEGORIES_KEY);
      if (saved) {
        setCustomSubCategories(JSON.parse(saved));
      }
    } catch (e) {
      console.error("커스텀 계정과목 로드 실패:", e);
    }
  }, []);

  // 전체 계정과목 가져오기 (기본 + 커스텀)
  const getSubCategories = (category: string): string[] => {
    const defaults = defaultSubCategoryMap[category] || [];
    const customs = customSubCategories[category] || [];
    return [...new Set([...defaults, ...customs])];
  };

  // 필터링된 데이터
  const filteredExpenses = expenses.filter(expense => {
    // 필터 조건
    if (categoryFilter !== "all" && expense.category !== categoryFilter) return false;
    if (subCategoryFilter !== "all" && expense.sub_category !== subCategoryFilter) return false;
    if (paymentMethodFilter !== "all" && expense.payment_method !== paymentMethodFilter) return false;
    
    // 검색 조건
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const amountStr = expense.amount.toString();
      const description = expense.description?.toLowerCase() || "";
      const receiptMemo = expense.receipt_memo?.toLowerCase() || "";
      const accountHolder = expense.account_holder?.toLowerCase() || "";
      
      // 금액 검색 (숫자만 입력된 경우)
      const isNumericQuery = /^\d+$/.test(query);
      if (isNumericQuery && amountStr.includes(query)) {
        return true;
      }
      
      // 텍스트 검색 (내용, 메모, 예금주)
      if (
        description.includes(query) ||
        receiptMemo.includes(query) ||
        accountHolder.includes(query)
      ) {
        return true;
      }
      
      return false;
    }
    
    return true;
  });

  // 선택된 대분류의 계정과목 목록
  const availableSubCategories = categoryFilter !== "all" 
    ? getSubCategories(categoryFilter)
    : [];

  // 대분류 변경 시 계정과목 필터 초기화
  useEffect(() => {
    setSubCategoryFilter("all");
  }, [categoryFilter]);

  // 커스텀 계정과목 추가
  const addCustomSubCategory = (category: string, name: string) => {
    if (!name.trim()) return;

    const updated = {
      ...customSubCategories,
      [category]: [...(customSubCategories[category] || []), name.trim()]
    };
    setCustomSubCategories(updated);

    // localStorage에 저장
    try {
      localStorage.setItem(CUSTOM_SUB_CATEGORIES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("커스텀 계정과목 저장 실패:", e);
    }

    setAddingSubCategory(null);
    setNewSubCategoryName("");
  };

  const onStartEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setEditForm({
      expense_date: expense.expense_date,
      category: expense.category,
      sub_category: expense.sub_category,
      description: expense.description,
      amount: expense.amount,
      payment_method: expense.payment_method,
      account_holder: expense.account_holder,
      receipt_memo: expense.receipt_memo,
      tax_invoice_issued: expense.tax_invoice_issued,
      tax_invoice_date: expense.tax_invoice_date,
      card_receipt_collected: expense.card_receipt_collected,
    });
  };

  const onSaveEdit = () => {
    if (editingId) {
      onUpdate(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // 결제방법에 따른 추가 필드 렌더링 (새 행용)
  const renderPaymentSpecificFields = (row: any, isNew: boolean) => {
    const paymentMethod = isNew ? row.payment_method : editForm.payment_method;

    if (paymentMethod === "card") {
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isNew ? row.card_receipt_collected : editForm.card_receipt_collected}
            onCheckedChange={(checked) => {
              if (isNew) {
                onUpdateNewRow(row.id, "card_receipt_collected", checked);
              } else {
                setEditForm({ ...editForm, card_receipt_collected: checked as boolean });
              }
            }}
          />
          <span className="text-[10px] text-slate-500">영수증 수집</span>
        </div>
      );
    } else if (paymentMethod === "cash" || paymentMethod === "transfer") {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isNew ? row.tax_invoice_issued : editForm.tax_invoice_issued}
              onCheckedChange={(checked) => {
                if (isNew) {
                  onUpdateNewRow(row.id, "tax_invoice_issued", checked);
                } else {
                  setEditForm({ ...editForm, tax_invoice_issued: checked as boolean });
                }
              }}
            />
            <span className="text-[10px] text-slate-500">세금계산서</span>
          </div>
          {(isNew ? row.tax_invoice_issued : editForm.tax_invoice_issued) && (
            <Input
              type="date"
              value={(isNew ? row.tax_invoice_date : editForm.tax_invoice_date) || ""}
              onChange={(e) => {
                if (isNew) {
                  onUpdateNewRow(row.id, "tax_invoice_date", e.target.value);
                } else {
                  setEditForm({ ...editForm, tax_invoice_date: e.target.value });
                }
              }}
              className="h-7 text-[10px] w-full"
              placeholder="발행일"
            />
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500 delay-500">
      {/* 헤더 */}
      <div className="bg-white px-6 py-5 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">지출 내역 상세</h3>
              <p className="text-[11px] font-bold text-slate-400">총 {filteredExpenses.length}건의 지출이 조회되었습니다</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* 검색 바 */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="결과 내 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-9 pr-4 bg-slate-50 border-none rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-rose-500/20 transition-all"
              />
            </div>
          </div>
        </div>
        
        {/* 필터 바 */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-8 w-[110px] text-[11px] font-black border-none bg-slate-50 rounded-lg focus:ring-0">
              <SelectValue placeholder="대분류" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-xl border-slate-100 shadow-xl">
              <SelectItem value="all" className="text-xs font-bold">전체 대분류</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-xs font-bold">{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={subCategoryFilter} 
            onValueChange={setSubCategoryFilter}
            disabled={categoryFilter === "all"}
          >
            <SelectTrigger className="h-8 w-[110px] text-[11px] font-black border-none bg-slate-50 rounded-lg focus:ring-0">
              <SelectValue placeholder="계정과목" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-xl border-slate-100 shadow-xl">
              <SelectItem value="all" className="text-xs font-bold">전체 계정과목</SelectItem>
              {availableSubCategories.map((sub) => (
                <SelectItem key={sub} value={sub} className="text-xs font-bold">{sub}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
            <SelectTrigger className="h-8 w-[110px] text-[11px] font-black border-none bg-slate-50 rounded-lg focus:ring-0">
              <SelectValue placeholder="결제방법" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-xl border-slate-100 shadow-xl">
              <SelectItem value="all" className="text-xs font-bold">전체 결제</SelectItem>
              {paymentMethods.map((method) => (
                <SelectItem key={method} value={method} className="text-xs font-bold">{methodLabels[method] || method}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(categoryFilter !== "all" || subCategoryFilter !== "all" || paymentMethodFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCategoryFilter("all");
                setSubCategoryFilter("all");
                setPaymentMethodFilter("all");
              }}
              className="h-8 px-2 text-[11px] font-black text-slate-400 hover:text-slate-600"
            >
              필터 초기화
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 sticky top-0 z-10">
              <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap border-r border-slate-100/50">날짜</th>
              <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap border-r border-slate-100/50">대분류</th>
              <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap border-r border-slate-100/50">계정과목</th>
              <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap border-r border-slate-100/50">내용</th>
              <th className="px-4 py-4 text-center text-[10px] font-black text-rose-500 uppercase tracking-widest whitespace-nowrap border-r border-slate-100/50">금액</th>
              <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap border-r border-slate-100/50">결제</th>
              <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap border-r border-slate-100/50">예금주</th>
              <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap border-r border-slate-100/50">증빙</th>
              <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">메모</th>
              <th className="px-2 py-4 w-[50px]"></th>
            </tr>
          </thead>
          <tbody>
            {/* 기존 데이터 */}
            {filteredExpenses.map((expense) => {
              const isEditing = editingId === expense.id;

              if (isEditing) {
                return (
                  <tr key={expense.id} className="bg-amber-50/30 border-b border-slate-200">
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      <Input
                        type="date"
                        value={editForm.expense_date || ""}
                        onChange={(e) => setEditForm({ ...editForm, expense_date: e.target.value })}
                        className="h-9 w-full text-xs border border-slate-300 bg-white rounded-md font-bold text-center"
                      />
                    </td>
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      <Select
                        value={editForm.category}
                        onValueChange={(v) => setEditForm({ ...editForm, category: v, sub_category: "" })}
                      >
                        <SelectTrigger className="h-9 text-xs border border-slate-300 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      {addingSubCategory?.rowId === `edit-${expense.id}` ? (
                        <div className="flex gap-1">
                          <Input
                            value={newSubCategoryName}
                            onChange={(e) => setNewSubCategoryName(e.target.value)}
                            placeholder="새 항목명"
                            className="h-9 text-xs border border-slate-300 bg-white rounded-md"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newSubCategoryName.trim()) {
                                addCustomSubCategory(addingSubCategory.category, newSubCategoryName);
                                setEditForm({ ...editForm, sub_category: newSubCategoryName.trim() });
                              } else if (e.key === "Escape") {
                                setAddingSubCategory(null);
                                setNewSubCategoryName("");
                              }
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            className="h-9 px-2 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => {
                              if (newSubCategoryName.trim()) {
                                addCustomSubCategory(addingSubCategory.category, newSubCategoryName);
                                setEditForm({ ...editForm, sub_category: newSubCategoryName.trim() });
                              }
                            }}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <Select
                          value={editForm.sub_category || ""}
                          onValueChange={(v) => {
                            if (v === "__add_new__") {
                              setAddingSubCategory({ rowId: `edit-${expense.id}`, category: editForm.category || "" });
                              setNewSubCategoryName("");
                            } else {
                              setEditForm({ ...editForm, sub_category: v });
                            }
                          }}
                          disabled={!editForm.category}
                        >
                          <SelectTrigger className="h-9 text-xs border border-slate-300 bg-white">
                            <SelectValue placeholder="선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {getSubCategories(editForm.category || "").map((sub) => (
                              <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                            ))}
                            {editForm.category && (
                              <SelectItem value="__add_new__" className="text-blue-600 font-bold">
                                <div className="flex items-center gap-1">
                                  <PlusCircle className="w-3 h-3" />
                                  항목 추가
                                </div>
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      <Input
                        value={editForm.description || ""}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="h-9 w-full text-xs border border-slate-300 bg-white rounded-md font-bold text-center"
                      />
                    </td>
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      <Input
                        type="number"
                        value={editForm.amount || ""}
                        onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                        className="h-9 w-full text-xs border border-slate-300 bg-white rounded-md font-bold text-center"
                      />
                    </td>
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      <Select value={editForm.payment_method} onValueChange={(v) => setEditForm({ ...editForm, payment_method: v })}>
                        <SelectTrigger className="h-9 text-xs border border-slate-300 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method} value={method}>{methodLabels[method] || method}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      <Input
                        value={editForm.account_holder || ""}
                        onChange={(e) => setEditForm({ ...editForm, account_holder: e.target.value })}
                        className="h-9 w-full text-xs border border-slate-300 bg-white rounded-md font-bold text-center"
                      />
                    </td>
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      {renderPaymentSpecificFields(expense, false)}
                    </td>
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      <Input
                        value={editForm.receipt_memo || ""}
                        onChange={(e) => setEditForm({ ...editForm, receipt_memo: e.target.value })}
                        className="h-9 w-full text-xs border border-slate-300 bg-white rounded-md font-medium text-center"
                      />
                    </td>
                    <td className="px-1 py-3 text-center align-middle">
                      <Button
                        onClick={onSaveEdit}
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Save className="w-3.5 h-3.5 text-white" />
                      </Button>
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={expense.id}
                  className="border-b border-slate-200 hover:bg-blue-50/30 transition-all cursor-pointer group"
                  onDoubleClick={() => onStartEdit(expense)}
                  tabIndex={0}
                >
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-100/50">
                    <span className="text-xs font-bold text-slate-700">{formatDate(expense.expense_date)}</span>
                  </td>
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-100/50">
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-black shadow-sm",
                      expense.category === "운영비" ? "bg-slate-100 text-slate-600" :
                      expense.category === "마케팅비" ? "bg-pink-50 text-pink-600 border border-pink-100" :
                      expense.category === "인건비" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                      expense.category === "세금" ? "bg-red-50 text-red-600 border border-red-100" :
                      expense.category === "지원금" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                      expense.category === "예비비" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                      expense.category === "수익분배금" ? "bg-violet-50 text-violet-600 border border-violet-100" :
                      "bg-gray-100 text-gray-600"
                    )}>
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-100/50">
                    <span className="text-[10px] font-bold text-slate-600">{expense.sub_category || "-"}</span>
                  </td>
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-100/50">
                    <span className="text-xs font-bold text-slate-900">{expense.description || "-"}</span>
                  </td>
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-100/50">
                    <span className="text-sm font-black text-rose-600">{formatCurrency(expense.amount)}</span>
                  </td>
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-100/50">
                    <span className="text-xs font-bold text-slate-700">{methodLabels[expense.payment_method] || expense.payment_method}</span>
                  </td>
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-100/50">
                    <span className="text-xs font-bold text-slate-700">{expense.account_holder || "-"}</span>
                  </td>
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-100/50">
                    {expense.payment_method === "card" ? (
                      expense.card_receipt_collected ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">카드영수증</span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300">미수집</span>
                      )
                    ) : (
                      expense.tax_invoice_issued ? (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">세금계산서</span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300">미발행</span>
                      )
                    )}
                  </td>
                  <td className="px-2 py-3 text-center align-middle">
                    <span className="text-[11px] font-medium text-slate-500 truncate block max-w-[150px] mx-auto">{expense.receipt_memo || "-"}</span>
                  </td>
                  <td className="px-1 py-3 text-center align-middle">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("정말 삭제하시겠습니까?")) {
                          onDelete(expense.id);
                        }
                      }}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}

            {/* 새 행 입력 - 테이블 하단에 표시 */}
            {newRows.map((row) => (
              <tr key={row.id} className="bg-rose-50/30 border-b border-rose-100">
                <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                  <Input
                    type="date"
                    value={row.expense_date}
                    onChange={(e) => onUpdateNewRow(row.id, "expense_date", e.target.value)}
                    className="h-9 w-full text-xs border border-slate-300 bg-white rounded-md font-bold text-center"
                  />
                </td>
                <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                  <Select
                    value={row.category}
                    onValueChange={(v) => {
                      onUpdateNewRow(row.id, "category", v);
                      onUpdateNewRow(row.id, "sub_category", "");
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs border border-slate-300 bg-white">
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                  {addingSubCategory?.rowId === row.id ? (
                    <div className="flex gap-1">
                      <Input
                        value={newSubCategoryName}
                        onChange={(e) => setNewSubCategoryName(e.target.value)}
                        placeholder="새 항목명"
                        className="h-9 text-xs border border-slate-300 bg-white rounded-md"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newSubCategoryName.trim() && addingSubCategory) {
                            addCustomSubCategory(addingSubCategory.category, newSubCategoryName);
                            onUpdateNewRow(row.id, "sub_category", newSubCategoryName.trim());
                          } else if (e.key === "Escape") {
                            setAddingSubCategory(null);
                            setNewSubCategoryName("");
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="h-9 px-2 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          if (newSubCategoryName.trim() && addingSubCategory) {
                            addCustomSubCategory(addingSubCategory.category, newSubCategoryName);
                            onUpdateNewRow(row.id, "sub_category", newSubCategoryName.trim());
                          }
                        }}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={row.sub_category || ""}
                      onValueChange={(v) => {
                        if (v === "__add_new__") {
                          setAddingSubCategory({ rowId: row.id, category: row.category });
                          setNewSubCategoryName("");
                        } else {
                          onUpdateNewRow(row.id, "sub_category", v);
                        }
                      }}
                      disabled={!row.category}
                    >
                      <SelectTrigger className="h-9 text-xs border border-slate-300 bg-white">
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSubCategories(row.category).map((sub) => (
                          <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                        ))}
                        {row.category && (
                          <SelectItem value="__add_new__" className="text-blue-600 font-bold">
                            <div className="flex items-center gap-1">
                              <PlusCircle className="w-3 h-3" />
                              항목 추가
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </td>
                <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                  <Input
                    value={row.description}
                    onChange={(e) => onUpdateNewRow(row.id, "description", e.target.value)}
                    placeholder="내용"
                    className="h-9 w-full text-xs border border-slate-300 bg-white rounded-md font-bold text-center"
                  />
                </td>
                <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                  <Input
                    type="number"
                    value={row.amount || ""}
                    onChange={(e) => onUpdateNewRow(row.id, "amount", parseFloat(e.target.value) || 0)}
                    placeholder="금액"
                    className="h-9 w-full text-xs border border-slate-300 bg-white rounded-md font-bold text-center"
                  />
                </td>
                <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                  <Select value={row.payment_method} onValueChange={(v) => onUpdateNewRow(row.id, "payment_method", v)}>
                    <SelectTrigger className="h-9 text-xs border border-slate-300 bg-white">
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>{methodLabels[method] || method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                  <Input
                    value={row.account_holder}
                    onChange={(e) => onUpdateNewRow(row.id, "account_holder", e.target.value)}
                    placeholder="예금주"
                    className="h-9 w-full text-xs border border-slate-300 bg-white rounded-md font-bold text-center"
                  />
                </td>
                <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                  {renderPaymentSpecificFields(row, true)}
                </td>
                <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                  <Input
                    value={row.receipt_memo || ""}
                    onChange={(e) => onUpdateNewRow(row.id, "receipt_memo", e.target.value)}
                    placeholder="메모"
                    className="h-9 w-full text-xs border border-slate-300 bg-white rounded-md font-medium text-center"
                  />
                </td>
                <td className="px-1 py-3 text-center align-middle">
                  <Button
                    onClick={() => onSaveNewRow(row.id)}
                    disabled={!row.category || !row.amount}
                    size="sm"
                    className="h-8 w-8 p-0 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300"
                  >
                    <Save className="w-3.5 h-3.5 text-white" />
                  </Button>
                </td>
              </tr>
            ))}

            {filteredExpenses.length === 0 && expenses.length > 0 && newRows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">
                      {searchQuery ? "검색 결과가 없습니다" : "필터 조건에 맞는 지출 내역이 없습니다"}
                    </h3>
                    <p className="text-slate-400 font-bold text-sm mt-1">
                      {searchQuery ? "다른 검색어를 입력해주세요" : "다른 필터를 선택해보세요"}
                    </p>
                  </div>
                </td>
              </tr>
            )}
            {expenses.length === 0 && newRows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4">
                      <Receipt className="w-8 h-8 text-rose-300" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">기록된 지출 내역이 없습니다</h3>
                    <p className="text-slate-400 font-bold text-sm mt-1">지점 운영 비용을 기록해보세요</p>
                    <Button onClick={onAddNewRow} className="mt-6 h-12 px-6 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black shadow-lg gap-2">
                      <Plus className="w-4 h-4" />
                      첫 지출 기록하기
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 하단 지출 추가 버튼 */}
      {(filteredExpenses.length > 0 || newRows.length > 0) && (
        <div className="border-t border-slate-50 bg-slate-50/20 p-4">
          <button
            onClick={onAddNewRow}
            className="group w-full py-4 flex items-center justify-center gap-2 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50/50 rounded-2xl border-2 border-dashed border-slate-100 hover:border-rose-200 transition-all font-black text-sm"
          >
            <Plus className="w-4 h-4 group-hover:text-rose-500" />
            새 지출 추가
          </button>
        </div>
      )}
    </div>
  );
}
