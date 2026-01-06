"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Save, X, Plus, Banknote, Edit, ChevronDown, Calendar, Info, MapPin, Clock, Star, Sparkles, UserCheck, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPhoneNumber, formatPhoneNumberOnChange } from "@/lib/utils/phone-format";

interface Staff {
  id: string;
  name: string;
  role: string;
}

interface Payment {
  id: string;
  member_name: string;
  phone?: string;
  sale_type: string;
  membership_category: string;
  membership_name: string;
  amount: number;
  method: string;
  installment?: number;
  trainer_id?: string;
  trainer_name?: string;
  memo?: string;
  payment_date: string;
  isNew?: boolean;
  // 상세 필드
  service_sessions?: number;
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
  onAddNewRow
}: PaymentsTableProps) {
  const methodLabels: Record<string, string> = {
    card: "카드",
    cash: "현금",
    transfer: "계좌이체"
  };

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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <Banknote className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">매출 기록 관리</h3>
            <p className="text-xs font-bold text-slate-400 mt-0.5">엑셀 스프레드시트 형태로 빠르게 입력하세요</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse" style={{ borderSpacing: 0 }}>
          <thead>
            <tr className="bg-slate-100 border-b-2 border-slate-300 sticky top-0 z-10">
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[120px] border-r border-slate-300 bg-slate-100">날짜</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[120px] border-r border-slate-300 bg-slate-100">회원명</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[120px] border-r border-slate-300 bg-slate-100">연락처</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[120px] border-r border-slate-300 bg-slate-100">매출유형</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[120px] border-r border-slate-300 bg-slate-100">상품분류</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[150px] border-r border-slate-300 bg-slate-100">상품명</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[120px] border-r border-slate-300 bg-slate-100">금액</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[100px] border-r border-slate-300 bg-slate-100">결제방법</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[100px] border-r border-slate-300 bg-slate-100">할부</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[120px] border-r border-slate-300 bg-slate-100">담당자</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[150px] border-r border-slate-300 bg-slate-100">메모</th>
              <th className="px-3 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap w-[100px] bg-slate-100">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {payments.map((payment) => {
              const isEditing = editingId === payment.id || payment.isNew;
              const currentData = isEditing ? editForm : payment;
              
              const isPT = currentData.membership_category?.toUpperCase().includes("PT");
              const isNewSale = currentData.sale_type === "신규";
              const isRenewal = currentData.sale_type === "재등록" || currentData.sale_type === "리뉴";

              if (isEditing) {
                const onChangeHandler = payment.isNew ? onNewRowChange : onEditFormChange;
                const saveHandler = payment.isNew ? onSaveNewRow : onSaveEdit;
                const cancelHandler = payment.isNew ? onCancelNewRow : onCancelEdit;

                return (
                  <tr key={payment.id} className={cn("border-b border-slate-200 hover:bg-blue-50/30 transition-colors", payment.isNew ? "bg-blue-50/50" : "bg-amber-50/30")}>
                    <td className="px-2 py-3 border-r border-slate-200 text-center align-middle">
                      <Input
                        type="date"
                        value={editForm.payment_date || ""}
                        onChange={(e) => onChangeHandler("payment_date", e.target.value)}
                        className="h-9 w-full text-xs border border-slate-300 bg-white rounded-md font-bold text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === "Tab" && !e.shiftKey) {
                            e.preventDefault();
                            const nextInput = e.currentTarget.closest("td")?.nextElementSibling?.querySelector("input, select");
                            if (nextInput instanceof HTMLElement) nextInput.focus();
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
                          if (e.key === "Tab" && !e.shiftKey) {
                            e.preventDefault();
                            const nextInput = e.currentTarget.closest("td")?.nextElementSibling?.querySelector("input, select");
                            if (nextInput instanceof HTMLElement) nextInput.focus();
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
                          if (e.key === "Tab" && !e.shiftKey) {
                            e.preventDefault();
                            const nextInput = e.currentTarget.closest("td")?.nextElementSibling?.querySelector("input, select");
                            if (nextInput instanceof HTMLElement) nextInput.focus();
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
                              {["워크인", "인터넷", "지인추천", "인스타그램", "네이버", "전화상담", "기타"].map(route => (
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
                          onChange={(v) => onChangeHandler("membership_name", v)}
                          onAdd={(name) => onAddOption?.("membership_name", name)}
                          className="h-9 w-full text-xs bg-white border border-slate-300 rounded-md font-bold"
                          triggerClassName="border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        {isPT && (
                          <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-200 w-full">
                            <div className="space-y-0.5">
                              <Label className="text-[9px] font-bold text-slate-400 text-center block">서비스</Label>
                              <Input
                                type="number"
                                value={editForm.service_sessions || 0}
                                onChange={(e) => onChangeHandler("service_sessions", parseInt(e.target.value) || 0)}
                                className="h-7 text-[10px] border border-slate-300 bg-white rounded-md font-bold text-center"
                                placeholder="0"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <Label className="text-[9px] font-bold text-slate-400 text-center block">유효일</Label>
                              <Input
                                type="number"
                                value={editForm.validity_per_session || 0}
                                onChange={(e) => onChangeHandler("validity_per_session", parseInt(e.target.value) || 0)}
                                className="h-7 text-[10px] border border-slate-300 bg-white rounded-md font-bold text-center"
                                placeholder="0"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <Label className="text-[9px] font-bold text-slate-400 text-center block">시작일</Label>
                              <Input
                                type="date"
                                value={editForm.membership_start_date || ""}
                                onChange={(e) => onChangeHandler("membership_start_date", e.target.value)}
                                className="h-7 text-[10px] border border-slate-300 bg-white rounded-md font-bold"
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
                          if (e.key === "Tab" && !e.shiftKey) {
                            e.preventDefault();
                            const nextInput = e.currentTarget.closest("td")?.nextElementSibling?.querySelector("input, select");
                            if (nextInput instanceof HTMLElement) nextInput.focus();
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
                      <Select value={editForm.trainer_id || "none"} onValueChange={(v) => onChangeHandler("trainer_id", v === "none" ? "" : v)}>
                        <SelectTrigger className="h-9 w-full text-xs bg-white border border-slate-300 rounded-md font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                          <SelectValue placeholder="직원" />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-lg border border-slate-200 shadow-xl p-1">
                          <SelectItem value="none" className="text-xs text-slate-400">없음</SelectItem>
                          {staffList.map(staff => (
                            <SelectItem key={staff.id} value={staff.id} className="text-xs">{staff.name}</SelectItem>
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
                          if (e.key === "Tab" && !e.shiftKey) {
                            e.preventDefault();
                            const nextInput = e.currentTarget.closest("td")?.nextElementSibling?.querySelector("input, select");
                            if (nextInput instanceof HTMLElement) nextInput.focus();
                          }
                        }}
                      />
                    </td>
                    <td className="px-2 py-3 text-center align-middle">
                      <div className="flex gap-1.5 justify-center">
                        <Button 
                          onClick={saveHandler} 
                          size="sm"
                          className={cn(
                            "h-8 px-3 rounded-md text-xs font-black transition-all",
                            payment.isNew ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"
                          )}
                        >
                          <Save className="w-3.5 h-3.5 mr-1" />
                          저장
                        </Button>
                        <Button variant="ghost" size="sm" onClick={cancelHandler} className="h-8 px-3 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-md">
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr 
                  key={payment.id} 
                  className="border-b border-slate-200 hover:bg-blue-50/30 transition-all cursor-pointer group" 
                  onDoubleClick={() => onStartEdit(payment)}
                >
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-200">
                    <span className="text-xs font-bold text-slate-700">{formatDate(payment.payment_date)}</span>
                  </td>
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-200">
                    <span className="text-sm font-black text-slate-900">{payment.member_name}</span>
                  </td>
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-200">
                    <span className="text-xs font-medium text-slate-600">{payment.phone ? formatPhoneNumber(payment.phone) : "-"}</span>
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
                          {payment.service_sessions && payment.service_sessions > 0 && (
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold">
                              <Star className="w-2.5 h-2.5" />
                              서비스 {payment.service_sessions}
                            </div>
                          )}
                          {payment.validity_per_session && payment.validity_per_session > 0 && (
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-50 text-slate-600 rounded text-[9px] font-bold">
                              <Clock className="w-2.5 h-2.5" />
                              유효 {payment.validity_per_session}일
                            </div>
                          )}
                          {payment.membership_start_date && (
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-bold">
                              <Calendar className="w-2.5 h-2.5" />
                              {payment.membership_start_date}
                            </div>
                          )}
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
                    <span className="text-xs font-medium text-slate-700">{payment.trainer_name || "-"}</span>
                  </td>
                  <td className="px-2 py-3 text-center align-middle border-r border-slate-200">
                    <span className="text-xs font-medium text-slate-600 truncate block mx-auto">{payment.memo || "-"}</span>
                  </td>
                  <td className="px-2 py-3 text-center align-middle">
                    <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onStartEdit(payment); }} className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(payment.id); }} className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {payments.length === 0 && (
              <tr>
                <td colSpan={11} className="px-6 py-32 text-center border-r border-slate-200">
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
            <span>더블클릭으로 편집 | Tab 키로 셀 간 이동</span>
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
