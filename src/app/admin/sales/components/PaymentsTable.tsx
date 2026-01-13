"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Save, X, Plus, Banknote, Calendar, Info, MapPin, Clock, Star, Search, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPhoneNumber, formatPhoneNumberOnChange } from "@/lib/utils/phone-format";

// 상품명에서 횟수 추출 (예: "PT 50회" → 50, "PT50" → 50, "50회" → 50)
const extractSessionsFromName = (name: string): number | null => {
  if (!name) return null;
  // "50회", "50 회" 패턴 먼저 검색
  const sessionMatch = name.match(/(\d+)\s*회/);
  if (sessionMatch) {
    return parseInt(sessionMatch[1], 10);
  }
  // "PT50", "PT 50" 패턴 검색
  const ptMatch = name.match(/PT\s*(\d+)/i);
  if (ptMatch) {
    return parseInt(ptMatch[1], 10);
  }
  // 숫자만 있는 경우 (예: "50")
  const numberMatch = name.match(/^(\d+)$/);
  if (numberMatch) {
    return parseInt(numberMatch[1], 10);
  }
  return null;
};

// 다음 입력 필드로 이동하는 헬퍼 함수 (TD 셀 단위로 이동)
const moveToNextCell = (currentElement: HTMLElement): boolean => {
  const currentTd = currentElement.closest("td");
  if (!currentTd) return false;

  let nextTd = currentTd.nextElementSibling as HTMLElement;

  // 다음 TD를 순회하면서 focusable 요소 찾기
  while (nextTd) {
    // 다음 TD에서 첫 번째 focusable 요소 찾기
    const focusableElement = nextTd.querySelector(
      "input:not([type='hidden']), [role='combobox']"
    ) as HTMLElement;

    if (focusableElement) {
      focusableElement.focus();
      if (focusableElement.tagName === "INPUT") {
        (focusableElement as HTMLInputElement).select();
      }
      return true;
    }

    nextTd = nextTd.nextElementSibling as HTMLElement;
  }

  return false;
};

interface Staff {
  id: string;
  name: string;
  role: string;
}

interface Payment {
  id: string;
  member_name: string;
  phone?: string;
  gender?: string; // 성별
  birth_date?: string; // 생년월일
  sale_type: string;
  membership_category: string;
  membership_name: string;
  amount: number;
  method: string;
  installment?: number;
  registrar?: string; // 등록자 (수기 입력)
  memo?: string;
  payment_date: string;
  isNew?: boolean;
  // 상세 필드
  service_sessions?: number;
  bonus_sessions?: number;
  validity_per_session?: number;
  membership_start_date?: string;
  visit_route?: string;
  expiry_type?: string;
}

interface PaymentsTableProps {
  payments: Payment[];
  staffList: Staff[];
  allSaleTypes: string[];
  allMembershipCategories: string[];
  allMembershipNames: string[];
  allPaymentMethods: string[];
  defaultInstallments: number[];
  editingId: string | null;
  editForm: Partial<Payment>;
  onStartEdit: (payment: Payment) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: (id: string) => void;
  onEditFormChange: (field: string, value: string | number) => void;
  onSaveNewRow: () => void;
  onCancelNewRow: () => void;
  onNewRowChange: (field: string, value: string | number) => void;
  onAddOption?: (type: "sale_type" | "membership_category" | "membership_name", name: string) => void;
  onAddNewRow?: () => void;
  onViewMemberDetail?: (payment: Payment) => void;
}

// 추가 기능이 있는 Select 컴포넌트
function SelectWithAdd({
  value,
  options,
  placeholder,
  onChange,
  onAdd,
  className = "h-8 w-20 text-xs",
  triggerClassName = ""
}: {
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (value: string) => void;
  onAdd: (name: string) => void;
  className?: string;
  triggerClassName?: string;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState("");

  const handleAdd = () => {
    if (newValue.trim()) {
      onAdd(newValue.trim());
      onChange(newValue.trim());
      setNewValue("");
      setIsAdding(false);
    }
  };

  if (isAdding) {
    return (
      <div className="flex gap-1 items-center bg-white p-1 rounded-xl border border-blue-200 shadow-sm animate-in zoom-in-95 duration-200">
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="새 항목"
          className="h-8 flex-1 text-xs border-none focus-visible:ring-0"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
            if (e.key === "Escape") setIsAdding(false);
          }}
        />
        <Button size="sm" variant="ghost" onClick={handleAdd} className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50 rounded-lg">
          <Save className="w-3.5 h-3.5" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-7 w-7 p-0 text-rose-400 hover:bg-rose-50 rounded-lg">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={(v) => {
      if (v === "__add_new__") {
        setIsAdding(true);
      } else {
        onChange(v);
      }
    }}>
      <SelectTrigger className={cn(className, triggerClassName)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-white rounded-lg border border-slate-200 shadow-xl p-1">
        {options.map(opt => (
          <SelectItem key={opt} value={opt} className="text-xs focus:bg-slate-50 font-medium">{opt}</SelectItem>
        ))}
        <SelectItem value="__add_new__" className="text-xs text-blue-600 font-black border-t border-slate-200 mt-1 pt-2">
          <span className="flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" /> 새 항목 추가
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

export function PaymentsTable({
  payments,
  staffList,
  allSaleTypes,
  allMembershipCategories,
  allMembershipNames,
  allPaymentMethods,
  defaultInstallments,
  editingId,
  editForm,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onEditFormChange,
  onSaveNewRow,
  onCancelNewRow,
  onNewRowChange,
  onAddOption,
  onAddNewRow,
  onViewMemberDetail
}: PaymentsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const tableRef = useRef<HTMLTableElement>(null);
  
  // 필터 상태
  const [saleTypeFilter, setSaleTypeFilter] = useState<string>("all");
  const [membershipCategoryFilter, setMembershipCategoryFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");

  const methodLabels: Record<string, string> = {
    card: "카드",
    cash: "현금",
    transfer: "계좌이체"
  };

  // 검색 및 필터링
  const filteredPayments = payments.filter(payment => {
    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const amountStr = payment.amount.toString();
      
      // 금액 검색 (숫자만 입력된 경우)
      const isNumericQuery = /^\d+$/.test(query);
      if (isNumericQuery && amountStr.includes(query)) {
        // 금액이 일치하면 통과
      } else {
        // 텍스트 검색
        const matchesSearch = (
          payment.member_name?.toLowerCase().includes(query) ||
          payment.phone?.includes(query) ||
          payment.membership_category?.toLowerCase().includes(query) ||
          payment.membership_name?.toLowerCase().includes(query) ||
          payment.sale_type?.toLowerCase().includes(query) ||
          payment.memo?.toLowerCase().includes(query) ||
          payment.registrar?.toLowerCase().includes(query)
        );
        if (!matchesSearch) return false;
      }
    }
    
    // 필터 조건
    if (saleTypeFilter !== "all" && payment.sale_type !== saleTypeFilter) return false;
    if (membershipCategoryFilter !== "all" && payment.membership_category !== membershipCategoryFilter) return false;
    if (paymentMethodFilter !== "all" && payment.method !== paymentMethodFilter) return false;
    
    return true;
  });

  // 키보드 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 편집 중이 아닐 때만 삭제 키 작동
      if (e.key === "Delete" && !editingId && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        const selectedRow = document.querySelector("tr:hover");
        if (selectedRow) {
          const rowId = selectedRow.getAttribute("data-payment-id");
          if (rowId && rowId !== "new") {
            if (confirm("정말 삭제하시겠습니까?")) {
              onDelete(rowId);
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingId, onDelete]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}.${day}`;
  };

  const getSaleTypeColor = (type: string) => {
    switch (type) {
      case "신규": return "bg-blue-50 text-blue-600 border-blue-100";
      case "재등록": 
      case "리뉴": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "부가상품": return "bg-amber-50 text-amber-600 border-amber-100";
      default: return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  return (
    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500 delay-500">
      {/* 엑셀 스타일 헤더 */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b-2 border-slate-200">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <Banknote className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">매출 기록 관리</h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">엑셀 스프레드시트 형태로 빠르게 입력하세요</p>
            </div>
          </div>
          {/* 검색 바 */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="회원명, 연락처, 상품명, 내용, 금액 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-10 pr-4 bg-white border-slate-300 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* 필터 바 */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">필터:</span>
            <Select value={saleTypeFilter} onValueChange={setSaleTypeFilter}>
              <SelectTrigger className="h-8 w-[120px] text-xs border border-slate-300 bg-white">
                <SelectValue placeholder="매출유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 유형</SelectItem>
                {allSaleTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={membershipCategoryFilter} onValueChange={setMembershipCategoryFilter}>
              <SelectTrigger className="h-8 w-[120px] text-xs border border-slate-300 bg-white">
                <SelectValue placeholder="상품분류" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 분류</SelectItem>
                {allMembershipCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger className="h-8 w-[100px] text-xs border border-slate-300 bg-white">
                <SelectValue placeholder="결제방법" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 결제</SelectItem>
                {allPaymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>{methodLabels[method] || method}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(saleTypeFilter !== "all" || membershipCategoryFilter !== "all" || paymentMethodFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSaleTypeFilter("all");
                setMembershipCategoryFilter("all");
                setPaymentMethodFilter("all");
              }}
              className="h-8 text-xs text-slate-500 hover:text-slate-700"
            >
              필터 초기화
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse" style={{ borderSpacing: 0 }}>
          <thead>
            <tr className="bg-slate-100 border-b-2 border-slate-300 sticky top-0 z-10">
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[100px] border-r border-slate-300 bg-slate-100">등록자</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[120px] border-r border-slate-300 bg-slate-100">날짜</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[120px] border-r border-slate-300 bg-slate-100">회원명</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[120px] border-r border-slate-300 bg-slate-100">연락처</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[70px] border-r border-slate-300 bg-slate-100">성별</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[110px] border-r border-slate-300 bg-slate-100">생년월일</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[120px] border-r border-slate-300 bg-slate-100">매출유형</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[120px] border-r border-slate-300 bg-slate-100">상품분류</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[150px] border-r border-slate-300 bg-slate-100">상품명</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[120px] border-r border-slate-300 bg-slate-100">금액</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[100px] border-r border-slate-300 bg-slate-100">결제방법</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[100px] border-r border-slate-300 bg-slate-100">할부</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[150px] border-r border-slate-300 bg-slate-100">메모</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[50px] bg-slate-100"></th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {filteredPayments.map((payment) => {
              const isEditing = editingId === payment.id || payment.isNew;
              const currentData = isEditing ? editForm : payment;
              
              const isPT = currentData.membership_category?.toUpperCase().includes("PT");
              const isNewSale = currentData.sale_type === "신규";
              const isRenewal = currentData.sale_type === "재등록" || currentData.sale_type === "리뉴";

              if (isEditing) {
                // 새 행인 경우 onNewRowChange만 호출 (이미 editForm도 업데이트함)
                const onChangeHandler = payment.isNew ? onNewRowChange : onEditFormChange;
                const saveHandler = payment.isNew ? onSaveNewRow : onSaveEdit;
                const cancelHandler = payment.isNew ? onCancelNewRow : onCancelEdit;

                return (
                  <tr
                    key={payment.id}
                    data-payment-id={payment.id}
                    className={cn("border-b border-slate-200 hover:bg-blue-50/30 transition-colors", payment.isNew ? "bg-blue-50/50" : "bg-amber-50/30")}
                    onBlur={(e) => {
                      // 행 내부의 다른 요소로 이동하는 경우 저장하지 않음
                      const relatedTarget = e.relatedTarget as HTMLElement;
                      const currentRow = e.currentTarget;
                      if (relatedTarget && currentRow.contains(relatedTarget)) return;
                      // 행 바깥으로 포커스가 이동하면 자동 저장
                      setTimeout(() => {
                        // Select 드롭다운 팝오버가 열린 경우 저장하지 않음
                        const activeElement = document.activeElement;
                        const isInPopover = activeElement?.closest('[data-radix-popper-content-wrapper]') ||
                                           activeElement?.closest('[role="listbox"]') ||
                                           document.querySelector('[data-radix-popper-content-wrapper]');
                        if (isInPopover) return;

                        if (currentRow && !currentRow.contains(document.activeElement)) {
                          saveHandler();
                        }
                      }, 150);
                    }}
                  >
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      <Input
                        value={editForm.registrar || ""}
                        onChange={(e) => onChangeHandler("registrar", e.target.value)}
                        placeholder="등록자"
                        className="h-9 w-full text-xs border border-slate-300 bg-white rounded-md font-bold text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            moveToNextCell(e.currentTarget);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            cancelHandler();
                          }
                        }}
                      />
                    </td>
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      <Input
                        type="date"
                        value={editForm.payment_date || ""}
                        onChange={(e) => onChangeHandler("payment_date", e.target.value)}
                        className="h-9 w-full text-xs border border-slate-300 bg-white rounded-md font-bold text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            moveToNextCell(e.currentTarget);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            cancelHandler();
                          }
                        }}
                      />
                    </td>
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      <Input
                        value={editForm.member_name || ""}
                        onChange={(e) => onChangeHandler("member_name", e.target.value)}
                        placeholder="회원명"
                        className="h-9 w-full text-xs border border-slate-300 bg-white rounded-md font-bold text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            moveToNextCell(e.currentTarget);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            cancelHandler();
                          }
                        }}
                      />
                    </td>
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      <Input
                        value={editForm.phone || ""}
                        onChange={(e) => onChangeHandler("phone", formatPhoneNumberOnChange(e.target.value))}
                        placeholder="010-0000-0000"
                        className="h-9 w-full text-xs border border-slate-300 bg-white rounded-md font-bold text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            moveToNextCell(e.currentTarget);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            cancelHandler();
                          }
                        }}
                      />
                    </td>
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      <Select value={editForm.gender || ""} onValueChange={(v) => onChangeHandler("gender", v)}>
                        <SelectTrigger className="h-9 w-full text-xs bg-white border border-slate-300 rounded-md font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                          <SelectValue placeholder="성별" />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-lg border border-slate-200 shadow-xl p-1">
                          <SelectItem value="male" className="text-xs">남성</SelectItem>
                          <SelectItem value="female" className="text-xs">여성</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      <Input
                        type="date"
                        value={editForm.birth_date || ""}
                        onChange={(e) => onChangeHandler("birth_date", e.target.value)}
                        className="h-9 w-full text-xs border border-slate-300 bg-white rounded-md font-bold text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            moveToNextCell(e.currentTarget);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            cancelHandler();
                          }
                        }}
                      />
                    </td>
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      <div className="flex flex-col items-center gap-1.5">
                        <SelectWithAdd
                          value={editForm.sale_type || ""}
                          options={allSaleTypes}
                          onChange={(v) => onChangeHandler("sale_type", v)}
                          onAdd={(name) => onAddOption?.("sale_type", name)}
                          className="h-9 w-full text-xs bg-white border border-slate-300 rounded-md font-bold"
                          triggerClassName="border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        {isNewSale && (
                          <Select
                            value={editForm.visit_route || "워크인"}
                            onValueChange={(v) => onChangeHandler("visit_route", v)}
                          >
                            <SelectTrigger className="h-7 w-full text-[10px] bg-white border border-slate-300 rounded-md font-medium">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white rounded-lg border border-slate-200 shadow-xl">
                              {["워크인", "인터넷", "지인추천", "인스타그램", "네이버", "전화상담", "타종목신규", "기타"].map(route => (
                                <SelectItem key={route} value={route} className="text-[10px]">{route}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {isRenewal && (
                          <Select
                            value={editForm.expiry_type || "60일 이내"}
                            onValueChange={(v) => onChangeHandler("expiry_type", v)}
                          >
                            <SelectTrigger className="h-7 w-full text-[10px] bg-white border border-slate-300 rounded-md font-medium">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white rounded-lg border border-slate-200 shadow-xl">
                              {["60일 이내", "60일 이외"].map(type => (
                                <SelectItem key={type} value={type} className="text-[10px]">{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      <SelectWithAdd
                        value={editForm.membership_category || ""}
                        options={allMembershipCategories}
                        placeholder="분류"
                        onChange={(v) => onChangeHandler("membership_category", v)}
                        onAdd={(name) => onAddOption?.("membership_category", name)}
                        className="h-9 w-full text-xs bg-white border border-slate-300 rounded-md font-bold"
                        triggerClassName="border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      <div className="flex flex-col items-center gap-1.5">
                        <SelectWithAdd
                          value={editForm.membership_name || ""}
                          options={allMembershipNames}
                          placeholder="상품명"
                          onChange={(v) => {
                            onChangeHandler("membership_name", v);
                            // 상품명에서 횟수 자동 추출 (PT인 경우)
                            if (isPT) {
                              const extractedSessions = extractSessionsFromName(v);
                              if (extractedSessions) {
                                onChangeHandler("service_sessions", extractedSessions);
                              }
                            }
                          }}
                          onAdd={(name) => onAddOption?.("membership_name", name)}
                          className="h-9 w-full text-xs bg-white border border-slate-300 rounded-md font-bold"
                          triggerClassName="border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        {isPT && (
                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 w-full">
                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold text-orange-500 text-center block flex items-center justify-center gap-1">
                                <Gift className="w-3 h-3" />
                                서비스
                              </Label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={editForm.bonus_sessions !== undefined ? String(editForm.bonus_sessions) : ""}
                                onChange={(e) => {
                                  const v = e.target.value.replace(/[^0-9]/g, "");
                                  onChangeHandler("bonus_sessions", v === "" ? 0 : parseInt(v, 10));
                                }}
                                className="h-8 w-full text-sm border border-orange-300 bg-orange-50 rounded-md font-bold text-center px-2"
                                placeholder="0"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    moveToNextCell(e.currentTarget);
                                  } else if (e.key === "Escape") {
                                    e.preventDefault();
                                    cancelHandler();
                                  }
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold text-slate-500 text-center block flex items-center justify-center gap-1">
                                <Clock className="w-3 h-3" />
                                1회당
                              </Label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={editForm.validity_per_session !== undefined ? String(editForm.validity_per_session) : ""}
                                onChange={(e) => {
                                  const v = e.target.value.replace(/[^0-9]/g, "");
                                  onChangeHandler("validity_per_session", v === "" ? 0 : parseInt(v, 10));
                                }}
                                className="h-8 w-full text-sm border border-slate-300 bg-white rounded-md font-bold text-center px-2"
                                placeholder="7"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    moveToNextCell(e.currentTarget);
                                  } else if (e.key === "Escape") {
                                    e.preventDefault();
                                    cancelHandler();
                                  }
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold text-green-600 text-center block flex items-center justify-center gap-1">
                                <Calendar className="w-3 h-3" />
                                시작일
                              </Label>
                              <input
                                type="date"
                                value={editForm.membership_start_date || ""}
                                onChange={(e) => onChangeHandler("membership_start_date", e.target.value)}
                                className="h-8 w-full text-xs border border-green-300 bg-green-50 rounded-md font-bold text-center px-1"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    moveToNextCell(e.currentTarget);
                                  } else if (e.key === "Escape") {
                                    e.preventDefault();
                                    cancelHandler();
                                  }
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      <Input
                        type="number"
                        value={editForm.amount || ""}
                        onChange={(e) => onChangeHandler("amount", parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="h-9 w-full text-xs border border-slate-300 bg-white rounded-md font-black text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            moveToNextCell(e.currentTarget);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            cancelHandler();
                          }
                        }}
                      />
                    </td>
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      <Select value={editForm.method || "card"} onValueChange={(v) => onChangeHandler("method", v)}>
                        <SelectTrigger className="h-9 w-full text-xs bg-white border border-slate-300 rounded-md font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-lg border border-slate-200 shadow-xl p-1">
                          {allPaymentMethods.map(method => (
                            <SelectItem key={method} value={method} className="text-xs">{methodLabels[method] || method}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      <Select value={String(editForm.installment || 1)} onValueChange={(v) => onChangeHandler("installment", parseInt(v))}>
                        <SelectTrigger className="h-9 w-full text-xs bg-white border border-slate-300 rounded-md font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-lg border border-slate-200 shadow-xl p-1">
                          {defaultInstallments.map(num => (
                            <SelectItem key={num} value={String(num)} className="text-xs">{num === 1 ? "일시불" : `${num}개월`}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      <Input
                        value={editForm.memo || ""}
                        onChange={(e) => onChangeHandler("memo", e.target.value)}
                        placeholder="메모"
                        className="h-9 w-full text-xs border border-slate-300 bg-white rounded-md font-medium text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            e.preventDefault();
                            cancelHandler();
                          }
                        }}
                      />
                    </td>
                    <td className="px-1 py-3 text-center align-middle">
                      <Button
                        onClick={saveHandler}
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 rounded-lg transition-all",
                          payment.isNew ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
                        )}
                      >
                        <Save className="w-3.5 h-3.5 text-white" />
                      </Button>
                    </td>
                  </tr>
                );
              }

              return (
                <tr 
                  key={payment.id}
                  data-payment-id={payment.id}
                  className="border-b border-slate-200 hover:bg-blue-50/30 transition-all cursor-pointer group" 
                  onDoubleClick={() => onStartEdit(payment)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Delete" && !payment.isNew) {
                      e.preventDefault();
                      if (confirm("정말 삭제하시겠습니까?")) {
                        onDelete(payment.id);
                      }
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      onStartEdit(payment);
                    }
                  }}
                >
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-200">
                    <span className="text-xs font-medium text-slate-700">{payment.registrar || "-"}</span>
                  </td>
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-200">
                    <span className="text-xs font-bold text-slate-700">{formatDate(payment.payment_date)}</span>
                  </td>
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewMemberDetail && payment.phone) {
                          onViewMemberDetail(payment);
                        }
                      }}
                      className={cn(
                        "text-sm font-black transition-colors",
                        payment.phone && onViewMemberDetail
                          ? "text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          : "text-slate-900 cursor-default"
                      )}
                      disabled={!payment.phone || !onViewMemberDetail}
                    >
                      {payment.member_name}
                    </button>
                  </td>
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-200">
                    <span className="text-xs font-medium text-slate-600">{payment.phone ? formatPhoneNumber(payment.phone) : "-"}</span>
                  </td>
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-200">
                    <span className="text-xs font-medium text-slate-600">{payment.gender === "male" ? "남" : payment.gender === "female" ? "여" : "-"}</span>
                  </td>
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-200">
                    <span className="text-xs font-medium text-slate-600">{payment.birth_date || "-"}</span>
                  </td>
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-200">
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant="outline" className={cn("text-[10px] font-black px-2 py-0.5 border rounded", getSaleTypeColor(payment.sale_type))}>
                        {payment.sale_type}
                      </Badge>
                      {payment.sale_type === "신규" && payment.visit_route && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold">
                          <MapPin className="w-2.5 h-2.5" />
                          {payment.visit_route}
                        </div>
                      )}
                      {(payment.sale_type === "재등록" || payment.sale_type === "리뉴") && payment.expiry_type && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold">
                          <Clock className="w-2.5 h-2.5" />
                          {payment.expiry_type}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-200">
                    <span className="text-xs font-bold text-slate-700">{payment.membership_category}</span>
                  </td>
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-200">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-medium text-slate-900">{payment.membership_name}</span>
                      {payment.membership_category?.toUpperCase().includes("PT") && (
                        <div className="flex flex-wrap justify-center gap-1 mt-0.5">
                          {(payment.service_sessions ?? 0) > 0 && (
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold">
                              <Star className="w-2.5 h-2.5" />
                              {payment.service_sessions}회
                            </div>
                          )}
                          {(payment.bonus_sessions ?? 0) > 0 && (
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded text-[9px] font-bold">
                              <Gift className="w-2.5 h-2.5" />
                              서비스 {payment.bonus_sessions}회
                            </div>
                          )}
                          {(payment.service_sessions ?? 0) > 0 && (payment.validity_per_session ?? 0) > 0 && (
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold">
                              <Clock className="w-2.5 h-2.5" />
                              총 {(payment.service_sessions ?? 0) * (payment.validity_per_session ?? 0)}일
                            </div>
                          )}
                          {payment.membership_start_date && (payment.service_sessions ?? 0) > 0 && (payment.validity_per_session ?? 0) > 0 && (() => {
                            const startDate = new Date(payment.membership_start_date);
                            const totalDays = (payment.service_sessions ?? 0) * (payment.validity_per_session ?? 0);
                            const endDate = new Date(startDate);
                            endDate.setDate(endDate.getDate() + totalDays);
                            const today = new Date();
                            const remainingDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            const endDateStr = endDate.toISOString().split("T")[0];
                            return (
                              <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${remainingDays > 30 ? 'bg-slate-100 text-slate-700' : remainingDays > 0 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                                <Calendar className="w-2.5 h-2.5" />
                                ~{endDateStr}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-200">
                    <span className="text-sm font-black text-slate-900">{formatCurrency(payment.amount)}</span>
                  </td>
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-200">
                    <span className="text-xs font-bold text-slate-700">{methodLabels[payment.method] || payment.method}</span>
                  </td>
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-200">
                    <span className="text-xs font-medium text-slate-600">{payment.installment === 1 ? "일시불" : `${payment.installment}개월`}</span>
                  </td>
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-200">
                    <span className="text-xs font-medium text-slate-600 truncate block mx-auto">{payment.memo || "-"}</span>
                  </td>
                  <td className="px-1 py-3 text-center align-middle">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("정말 삭제하시겠습니까?")) {
                          onDelete(payment.id);
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
            {filteredPayments.length === 0 && payments.length > 0 && (
              <tr>
                <td colSpan={14} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <Search className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-base font-black text-slate-700 tracking-tight">검색 결과가 없습니다</h3>
                    <p className="text-slate-500 font-bold text-xs mt-2">다른 검색어를 입력해주세요</p>
                  </div>
                </td>
              </tr>
            )}
            {payments.length === 0 && (
              <tr>
                <td colSpan={14} className="px-6 py-32 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 border-2 border-slate-200">
                      <Banknote className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">기록된 매출 내역이 없습니다</h3>
                    <p className="text-slate-500 font-bold text-xs mt-2 max-w-xs mx-auto leading-relaxed">엑셀 스프레드시트 형태로 빠르게 매출을 기록하세요</p>
                    <Button onClick={onAddNewRow} className="mt-8 h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-200 gap-2 transition-all">
                      <Plus className="w-4 h-4" />
                      첫 매출 기록 시작하기
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* 하단 매출 추가 버튼 - 엑셀 스타일 */}
      <div className="border-t-2 border-slate-300 bg-slate-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Info className="w-4 h-4" />
            <span>더블클릭/Enter: 편집 | Enter/Tab: 다음 셀 | Delete: 삭제 | Esc: 취소 | 행 이탈: 자동저장</span>
          </div>
          <button
            onClick={onAddNewRow}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-xs shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            새 행 추가
          </button>
        </div>
      </div>
    </div>
  );
}
