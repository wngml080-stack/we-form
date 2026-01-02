"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Save, X, Plus, Banknote, Edit } from "lucide-react";

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
  className = "h-8 w-20 text-xs"
}: {
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (value: string) => void;
  onAdd: (name: string) => void;
  className?: string;
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
      <div className="flex gap-1">
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="새 항목"
          className="h-8 w-20 text-xs"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
            if (e.key === "Escape") setIsAdding(false);
          }}
        />
        <Button size="sm" variant="ghost" onClick={handleAdd} className="h-8 w-6 p-0 text-green-600">
          <Save className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-8 w-6 p-0 text-gray-400">
          <X className="w-3 h-3" />
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
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-white">
        {options.map(opt => (
          <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
        ))}
        <SelectItem value="__add_new__" className="text-xs text-blue-600 font-medium border-t mt-1 pt-1">
          <span className="flex items-center gap-1">
            <Plus className="w-3 h-3" /> 추가
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

import { Badge } from "@/components/ui/badge";

// ... (existing helper functions)

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
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}.${day}`;
  };

  const getSaleTypeColor = (type: string) => {
    switch (type) {
      case "신규": return "bg-blue-50 text-blue-600 border-blue-100";
      case "재등록": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "부가상품": return "bg-amber-50 text-amber-600 border-amber-100";
      default: return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500 delay-500">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-gray-100">
              <th className="px-4 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[100px]">날짜</th>
              <th className="px-4 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[100px]">회원 정보</th>
              <th className="px-4 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[80px]">등록 유형</th>
              <th className="px-4 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[150px]">상품 내역</th>
              <th className="px-4 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[120px]">결제 금액</th>
              <th className="px-4 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[100px]">결제 정보</th>
              <th className="px-4 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[100px]">담당 직워</th>
              <th className="px-4 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[120px]">메모</th>
              <th className="px-4 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[60px]">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {payments.map((payment) => (
              payment.isNew ? (
                <tr key={payment.id} className="bg-blue-50/30 animate-pulse-subtle">
                  <td className="px-2 py-3 text-center">
                    <Input
                      type="date"
                      value={editForm.payment_date || new Date().toISOString().split("T")[0]}
                      onChange={(e) => onNewRowChange("payment_date", e.target.value)}
                      className="h-9 w-full text-xs border-gray-200 bg-white rounded-xl font-bold"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <div className="space-y-1">
                      <Input
                        value={editForm.member_name || ""}
                        onChange={(e) => onNewRowChange("member_name", e.target.value)}
                        placeholder="성함"
                        className="h-9 w-full text-xs border-gray-200 bg-white rounded-xl font-bold"
                      />
                      <Input
                        value={editForm.phone || ""}
                        onChange={(e) => onNewRowChange("phone", e.target.value)}
                        placeholder="연락처"
                        className="h-9 w-full text-xs border-gray-200 bg-white rounded-xl font-medium"
                      />
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <SelectWithAdd
                      value={editForm.sale_type || "신규"}
                      options={allSaleTypes}
                      onChange={(v) => onNewRowChange("sale_type", v)}
                      onAdd={(name) => onAddOption?.("sale_type", name)}
                      className="h-9 w-full text-xs bg-white rounded-xl border-gray-200"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <div className="space-y-1">
                      <SelectWithAdd
                        value={editForm.membership_category || ""}
                        options={allMembershipCategories}
                        placeholder="분류 선택"
                        onChange={(v) => onNewRowChange("membership_category", v)}
                        onAdd={(name) => onAddOption?.("membership_category", name)}
                        className="h-9 w-full text-xs bg-white rounded-xl border-gray-200"
                      />
                      <SelectWithAdd
                        value={editForm.membership_name || ""}
                        options={allMembershipNames}
                        placeholder="상품명 선택"
                        onChange={(v) => onNewRowChange("membership_name", v)}
                        onAdd={(name) => onAddOption?.("membership_name", name)}
                        className="h-9 w-full text-xs bg-white rounded-xl border-gray-200"
                      />
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <Input
                      type="number"
                      value={editForm.amount || ""}
                      onChange={(e) => onNewRowChange("amount", parseInt(e.target.value) || 0)}
                      placeholder="금액 입력"
                      className="h-9 w-full text-xs border-gray-200 bg-white rounded-xl font-black text-right"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <div className="space-y-1">
                      <Select value={editForm.method || "card"} onValueChange={(v) => onNewRowChange("method", v)}>
                        <SelectTrigger className="h-9 w-full text-xs bg-white rounded-xl border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-xl border-gray-100 shadow-xl">
                          {allPaymentMethods.map(method => (
                            <SelectItem key={method} value={method} className="text-xs">{methodLabels[method] || method}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={String(editForm.installment || 1)} onValueChange={(v) => onNewRowChange("installment", parseInt(v))}>
                        <SelectTrigger className="h-9 w-full text-xs bg-white rounded-xl border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-xl border-gray-100 shadow-xl">
                          {defaultInstallments.map(num => (
                            <SelectItem key={num} value={String(num)} className="text-xs">{num === 1 ? "일시불" : `${num}개월`}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <Select value={editForm.trainer_id || "none"} onValueChange={(v) => onNewRowChange("trainer_id", v === "none" ? "" : v)}>
                      <SelectTrigger className="h-9 w-full text-xs bg-white rounded-xl border-gray-200">
                        <SelectValue placeholder="직원 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-xl border-gray-100 shadow-xl">
                        <SelectItem value="none" className="text-xs font-bold text-slate-400">없음</SelectItem>
                        {staffList.map(staff => (
                          <SelectItem key={staff.id} value={staff.id} className="text-xs">{staff.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-3">
                    <Input
                      value={editForm.memo || ""}
                      onChange={(e) => onNewRowChange("memo", e.target.value)}
                      placeholder="비고"
                      className="h-9 w-full text-xs border-gray-200 bg-white rounded-xl"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex justify-center gap-1.5">
                      <Button onClick={onSaveNewRow} className="h-9 w-9 p-0 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100">
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" onClick={onCancelNewRow} className="h-9 w-9 p-0 text-slate-400 hover:bg-slate-100 rounded-xl">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : editingId === payment.id ? (
                <tr key={payment.id} className="bg-amber-50/30">
                  <td className="px-2 py-3 text-center">
                    <Input
                      type="date"
                      value={editForm.payment_date || ""}
                      onChange={(e) => onEditFormChange("payment_date", e.target.value)}
                      className="h-9 w-full text-xs border-gray-200 bg-white rounded-xl font-bold"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <div className="space-y-1">
                      <Input
                        value={editForm.member_name || ""}
                        onChange={(e) => onEditFormChange("member_name", e.target.value)}
                        className="h-9 w-full text-xs border-gray-200 bg-white rounded-xl font-bold"
                      />
                      <Input
                        value={editForm.phone || ""}
                        onChange={(e) => onEditFormChange("phone", e.target.value)}
                        className="h-9 w-full text-xs border-gray-200 bg-white rounded-xl font-medium"
                      />
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <SelectWithAdd
                      value={editForm.sale_type || ""}
                      options={allSaleTypes}
                      onChange={(v) => onEditFormChange("sale_type", v)}
                      onAdd={(name) => onAddOption?.("sale_type", name)}
                      className="h-9 w-full text-xs bg-white rounded-xl border-gray-200"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <div className="space-y-1">
                      <SelectWithAdd
                        value={editForm.membership_category || ""}
                        options={allMembershipCategories}
                        onChange={(v) => onEditFormChange("membership_category", v)}
                        onAdd={(name) => onAddOption?.("membership_category", name)}
                        className="h-9 w-full text-xs bg-white rounded-xl border-gray-200"
                      />
                      <SelectWithAdd
                        value={editForm.membership_name || ""}
                        options={allMembershipNames}
                        onChange={(v) => onEditFormChange("membership_name", v)}
                        onAdd={(name) => onAddOption?.("membership_name", name)}
                        className="h-9 w-full text-xs bg-white rounded-xl border-gray-200"
                      />
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <Input
                      type="number"
                      value={editForm.amount || ""}
                      onChange={(e) => onEditFormChange("amount", parseInt(e.target.value) || 0)}
                      className="h-9 w-full text-xs border-gray-200 bg-white rounded-xl font-black text-right"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <div className="space-y-1">
                      <Select value={editForm.method || ""} onValueChange={(v) => onEditFormChange("method", v)}>
                        <SelectTrigger className="h-9 w-full text-xs bg-white rounded-xl border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-xl border-gray-100 shadow-xl">
                          {allPaymentMethods.map(method => (
                            <SelectItem key={method} value={method} className="text-xs">{methodLabels[method] || method}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={String(editForm.installment || 1)} onValueChange={(v) => onEditFormChange("installment", parseInt(v))}>
                        <SelectTrigger className="h-9 w-full text-xs bg-white rounded-xl border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-xl border-gray-100 shadow-xl">
                          {defaultInstallments.map(num => (
                            <SelectItem key={num} value={String(num)} className="text-xs">{num === 1 ? "일시불" : `${num}개월`}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <Select value={editForm.trainer_id || "none"} onValueChange={(v) => onEditFormChange("trainer_id", v === "none" ? "" : v)}>
                      <SelectTrigger className="h-9 w-full text-xs bg-white rounded-xl border-gray-200">
                        <SelectValue placeholder="직원 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-xl border-gray-100 shadow-xl">
                        <SelectItem value="none" className="text-xs font-bold text-slate-400">없음</SelectItem>
                        {staffList.map(staff => (
                          <SelectItem key={staff.id} value={staff.id} className="text-xs">{staff.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-3">
                    <Input
                      value={editForm.memo || ""}
                      onChange={(e) => onEditFormChange("memo", e.target.value)}
                      className="h-9 w-full text-xs border-gray-200 bg-white rounded-xl"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex justify-center gap-1.5">
                      <Button onClick={handleSaveEdit} className="h-9 w-9 p-0 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" onClick={handleCancelEdit} className="h-9 w-9 p-0 text-slate-400 hover:bg-slate-100 rounded-xl">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr 
                  key={payment.id} 
                  className="hover:bg-blue-50/30 transition-all cursor-pointer group" 
                  onDoubleClick={() => onStartEdit(payment)}
                >
                  <td className="px-4 py-4 text-center">
                    <span className="text-xs font-bold text-slate-400 leading-none">{formatDate(payment.payment_date)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-black text-slate-900 leading-none mb-1">{payment.member_name}</span>
                      <span className="text-[10px] font-bold text-slate-400">{payment.phone || "-"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Badge variant="outline" className={`rounded-lg px-2.5 py-0.5 font-bold text-[10px] border ${getSaleTypeColor(payment.sale_type)}`}>
                      {payment.sale_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{payment.membership_category}</span>
                      <span className="text-sm font-bold text-slate-700">{payment.membership_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-base font-black text-slate-900 tracking-tight">{formatCurrency(payment.amount)}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs font-bold text-slate-700">{methodLabels[payment.method] || payment.method}</span>
                      <span className="text-[10px] font-medium text-slate-400">{payment.installment === 1 ? "일시불" : `${payment.installment}개월`}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-5 h-5 rounded-lg bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                        {payment.trainer_name?.charAt(0) || "TR"}
                      </div>
                      <span className="text-xs font-bold text-slate-600">{payment.trainer_name || "-"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-xs font-medium text-slate-500 truncate max-w-[120px] block mx-auto">{payment.memo || "-"}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onStartEdit(payment); }} className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(payment.id); }} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-24 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <Banknote className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">매출 내역이 없습니다</h3>
                    <p className="text-slate-400 text-sm mb-6">검색 조건을 변경하거나 새로운 매출을 추가해보세요</p>
                    <Button onClick={onAddNewRow} variant="outline" className="rounded-xl border-slate-200 font-bold px-6">
                      첫 매출 기록하기
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* 하단 매출 추가 버튼 - 통합형 */}
      <div className="border-t border-gray-50 bg-slate-50/30 p-4">
        <button
          onClick={onAddNewRow}
          className="w-full py-3 flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-2xl transition-all font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          실시간 매출 데이터 추가하기
        </button>
      </div>
    </div>
  );
}
