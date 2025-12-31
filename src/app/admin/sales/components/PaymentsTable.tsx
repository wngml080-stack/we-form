"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Save, X, Plus } from "lucide-react";

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

  return (
    <div className="bg-white border border-gray-300 overflow-hidden">
      {/* 엑셀 스타일 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#E8F0FE] border-b border-gray-300">
              <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap min-w-[100px]">날짜</th>
              <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap min-w-[80px]">회원명</th>
              <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap min-w-[110px]">휴대폰번호</th>
              <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap min-w-[70px]">유형</th>
              <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap min-w-[80px]">회원권</th>
              <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap min-w-[80px]">회원권명</th>
              <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap min-w-[90px]">금액</th>
              <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap min-w-[80px]">결제방법</th>
              <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap min-w-[70px]">할부</th>
              <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap min-w-[70px]">담당TR</th>
              <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap min-w-[100px]">메모</th>
              <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap min-w-[60px]">삭제</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              payment.isNew ? (
                <tr key={payment.id} className="bg-blue-50 border-b border-gray-200">
                  <td className="px-1 py-1 border-r border-gray-200">
                    <Input
                      type="date"
                      value={editForm.payment_date || new Date().toISOString().split("T")[0]}
                      onChange={(e) => onNewRowChange("payment_date", e.target.value)}
                      className="h-7 w-full text-xs border-0 bg-transparent focus:ring-1 focus:ring-blue-400"
                    />
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <Input
                      value={editForm.member_name || ""}
                      onChange={(e) => onNewRowChange("member_name", e.target.value)}
                      placeholder="회원명"
                      className="h-7 w-full text-xs border-0 bg-transparent focus:ring-1 focus:ring-blue-400"
                    />
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <Input
                      value={editForm.phone || ""}
                      onChange={(e) => onNewRowChange("phone", e.target.value)}
                      placeholder="010-0000-0000"
                      className="h-7 w-full text-xs border-0 bg-transparent focus:ring-1 focus:ring-blue-400"
                    />
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <SelectWithAdd
                      value={editForm.sale_type || "신규"}
                      options={allSaleTypes}
                      onChange={(v) => onNewRowChange("sale_type", v)}
                      onAdd={(name) => onAddOption?.("sale_type", name)}
                      className="h-7 w-full text-xs border-0"
                    />
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <SelectWithAdd
                      value={editForm.membership_category || ""}
                      options={allMembershipCategories}
                      placeholder="선택"
                      onChange={(v) => onNewRowChange("membership_category", v)}
                      onAdd={(name) => onAddOption?.("membership_category", name)}
                      className="h-7 w-full text-xs border-0"
                    />
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <SelectWithAdd
                      value={editForm.membership_name || ""}
                      options={allMembershipNames}
                      placeholder="선택"
                      onChange={(v) => onNewRowChange("membership_name", v)}
                      onAdd={(name) => onAddOption?.("membership_name", name)}
                      className="h-7 w-full text-xs border-0"
                    />
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <Input
                      type="number"
                      value={editForm.amount || ""}
                      onChange={(e) => onNewRowChange("amount", parseInt(e.target.value) || 0)}
                      placeholder="금액"
                      className="h-7 w-full text-xs border-0 bg-transparent focus:ring-1 focus:ring-blue-400 text-right"
                    />
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <Select value={editForm.method || "card"} onValueChange={(v) => onNewRowChange("method", v)}>
                      <SelectTrigger className="h-7 w-full text-xs border-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {allPaymentMethods.map(method => (
                          <SelectItem key={method} value={method} className="text-xs">{methodLabels[method] || method}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <Select value={String(editForm.installment || 1)} onValueChange={(v) => onNewRowChange("installment", parseInt(v))}>
                      <SelectTrigger className="h-7 w-full text-xs border-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {defaultInstallments.map(num => (
                          <SelectItem key={num} value={String(num)} className="text-xs">{num === 1 ? "일시불" : `${num}개월`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <Select value={editForm.trainer_id || "none"} onValueChange={(v) => onNewRowChange("trainer_id", v === "none" ? "" : v)}>
                      <SelectTrigger className="h-7 w-full text-xs border-0">
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="none" className="text-xs">없음</SelectItem>
                        {staffList.map(staff => (
                          <SelectItem key={staff.id} value={staff.id} className="text-xs">{staff.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <Input
                      value={editForm.memo || ""}
                      onChange={(e) => onNewRowChange("memo", e.target.value)}
                      placeholder="메모"
                      className="h-7 w-full text-xs border-0 bg-transparent focus:ring-1 focus:ring-blue-400"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <div className="flex justify-center gap-1">
                      <Button size="sm" variant="ghost" onClick={onSaveNewRow} className="h-6 w-6 p-0 text-green-600 hover:text-green-700">
                        <Save className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={onCancelNewRow} className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : editingId === payment.id ? (
                <tr key={payment.id} className="bg-yellow-50 border-b border-gray-200">
                  <td className="px-1 py-1 border-r border-gray-200">
                    <Input
                      type="date"
                      value={editForm.payment_date || ""}
                      onChange={(e) => onEditFormChange("payment_date", e.target.value)}
                      className="h-7 w-full text-xs border-0 bg-transparent focus:ring-1 focus:ring-blue-400"
                    />
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <Input
                      value={editForm.member_name || ""}
                      onChange={(e) => onEditFormChange("member_name", e.target.value)}
                      className="h-7 w-full text-xs border-0 bg-transparent focus:ring-1 focus:ring-blue-400"
                    />
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <Input
                      value={editForm.phone || ""}
                      onChange={(e) => onEditFormChange("phone", e.target.value)}
                      className="h-7 w-full text-xs border-0 bg-transparent focus:ring-1 focus:ring-blue-400"
                    />
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <SelectWithAdd
                      value={editForm.sale_type || ""}
                      options={allSaleTypes}
                      onChange={(v) => onEditFormChange("sale_type", v)}
                      onAdd={(name) => onAddOption?.("sale_type", name)}
                      className="h-7 w-full text-xs border-0"
                    />
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <SelectWithAdd
                      value={editForm.membership_category || ""}
                      options={allMembershipCategories}
                      onChange={(v) => onEditFormChange("membership_category", v)}
                      onAdd={(name) => onAddOption?.("membership_category", name)}
                      className="h-7 w-full text-xs border-0"
                    />
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <SelectWithAdd
                      value={editForm.membership_name || ""}
                      options={allMembershipNames}
                      onChange={(v) => onEditFormChange("membership_name", v)}
                      onAdd={(name) => onAddOption?.("membership_name", name)}
                      className="h-7 w-full text-xs border-0"
                    />
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <Input
                      type="number"
                      value={editForm.amount || ""}
                      onChange={(e) => onEditFormChange("amount", parseInt(e.target.value) || 0)}
                      className="h-7 w-full text-xs border-0 bg-transparent focus:ring-1 focus:ring-blue-400 text-right"
                    />
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <Select value={editForm.method || ""} onValueChange={(v) => onEditFormChange("method", v)}>
                      <SelectTrigger className="h-7 w-full text-xs border-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {allPaymentMethods.map(method => (
                          <SelectItem key={method} value={method} className="text-xs">{methodLabels[method] || method}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <Select value={String(editForm.installment || 1)} onValueChange={(v) => onEditFormChange("installment", parseInt(v))}>
                      <SelectTrigger className="h-7 w-full text-xs border-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {defaultInstallments.map(num => (
                          <SelectItem key={num} value={String(num)} className="text-xs">{num === 1 ? "일시불" : `${num}개월`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <Select value={editForm.trainer_id || "none"} onValueChange={(v) => onEditFormChange("trainer_id", v === "none" ? "" : v)}>
                      <SelectTrigger className="h-7 w-full text-xs border-0">
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="none" className="text-xs">없음</SelectItem>
                        {staffList.map(staff => (
                          <SelectItem key={staff.id} value={staff.id} className="text-xs">{staff.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <Input
                      value={editForm.memo || ""}
                      onChange={(e) => onEditFormChange("memo", e.target.value)}
                      className="h-7 w-full text-xs border-0 bg-transparent focus:ring-1 focus:ring-blue-400"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <div className="flex justify-center gap-1">
                      <Button size="sm" variant="ghost" onClick={onSaveEdit} className="h-6 w-6 p-0 text-green-600 hover:text-green-700">
                        <Save className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={payment.id} className="hover:bg-gray-50 border-b border-gray-200 cursor-pointer" onDoubleClick={() => onStartEdit(payment)}>
                  <td className="px-2 py-2 text-xs text-gray-900 text-center border-r border-gray-200 whitespace-nowrap">{formatDate(payment.payment_date)}</td>
                  <td className="px-2 py-2 text-xs text-gray-900 text-center border-r border-gray-200 whitespace-nowrap">{payment.member_name}</td>
                  <td className="px-2 py-2 text-xs text-gray-600 text-center border-r border-gray-200 whitespace-nowrap">{payment.phone || "-"}</td>
                  <td className="px-2 py-2 text-xs text-center border-r border-gray-200 whitespace-nowrap">{payment.sale_type}</td>
                  <td className="px-2 py-2 text-xs text-gray-600 text-center border-r border-gray-200 whitespace-nowrap">{payment.membership_category}</td>
                  <td className="px-2 py-2 text-xs text-gray-600 text-center border-r border-gray-200 whitespace-nowrap">{payment.membership_name}</td>
                  <td className="px-2 py-2 text-xs text-gray-900 text-right border-r border-gray-200 whitespace-nowrap">{formatCurrency(payment.amount)}</td>
                  <td className="px-2 py-2 text-xs text-center border-r border-gray-200 whitespace-nowrap">{methodLabels[payment.method] || payment.method}</td>
                  <td className="px-2 py-2 text-xs text-gray-600 text-center border-r border-gray-200 whitespace-nowrap">
                    {payment.installment === 1 ? "일시불" : `${payment.installment}개월`}
                  </td>
                  <td className="px-2 py-2 text-xs text-gray-600 text-center border-r border-gray-200 whitespace-nowrap">{payment.trainer_name || "-"}</td>
                  <td className="px-2 py-2 text-xs text-gray-500 text-center border-r border-gray-200 whitespace-nowrap max-w-[100px] truncate">{payment.memo || "-"}</td>
                  <td className="px-2 py-2">
                    <div className="flex justify-center">
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(payment.id); }} className="h-6 w-6 p-0 text-gray-400 hover:text-red-600">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-gray-500 text-sm border-b border-gray-200">
                  매출 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* 하단 매출 추가 버튼 */}
      <div className="border-t border-gray-300 bg-gray-50 px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddNewRow}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-medium"
        >
          <Plus className="w-3 h-3 mr-1" />
          매출 추가
        </Button>
      </div>
    </div>
  );
}
