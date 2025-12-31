"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Save, X, Edit2, Plus } from "lucide-react";

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
  onAddOption
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
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">날짜</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">회원명</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">휴대폰</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">유형</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">회원권</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">회원권명</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">금액</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">결제방법</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">할부</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">담당</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">메모</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.map((payment) => (
              payment.isNew ? (
                <tr key={payment.id} className="bg-blue-50">
                  <td className="px-2 py-2">
                    <Input
                      type="date"
                      value={editForm.payment_date || new Date().toISOString().split("T")[0]}
                      onChange={(e) => onNewRowChange("payment_date", e.target.value)}
                      className="h-8 w-28 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      value={editForm.member_name || ""}
                      onChange={(e) => onNewRowChange("member_name", e.target.value)}
                      placeholder="회원명"
                      className="h-8 w-20 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      value={editForm.phone || ""}
                      onChange={(e) => onNewRowChange("phone", e.target.value)}
                      placeholder="010-0000-0000"
                      className="h-8 w-28 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <SelectWithAdd
                      value={editForm.sale_type || "신규"}
                      options={allSaleTypes}
                      onChange={(v) => onNewRowChange("sale_type", v)}
                      onAdd={(name) => onAddOption?.("sale_type", name)}
                      className="h-8 w-20 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <SelectWithAdd
                      value={editForm.membership_category || ""}
                      options={allMembershipCategories}
                      placeholder="선택"
                      onChange={(v) => onNewRowChange("membership_category", v)}
                      onAdd={(name) => onAddOption?.("membership_category", name)}
                      className="h-8 w-24 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <SelectWithAdd
                      value={editForm.membership_name || ""}
                      options={allMembershipNames}
                      placeholder="선택"
                      onChange={(v) => onNewRowChange("membership_name", v)}
                      onAdd={(name) => onAddOption?.("membership_name", name)}
                      className="h-8 w-20 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      type="number"
                      value={editForm.amount || ""}
                      onChange={(e) => onNewRowChange("amount", parseInt(e.target.value) || 0)}
                      placeholder="금액"
                      className="h-8 w-24 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Select value={editForm.method || "card"} onValueChange={(v) => onNewRowChange("method", v)}>
                      <SelectTrigger className="h-8 w-20 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {allPaymentMethods.map(method => (
                          <SelectItem key={method} value={method} className="text-xs">{methodLabels[method] || method}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-2">
                    <Select value={String(editForm.installment || 1)} onValueChange={(v) => onNewRowChange("installment", parseInt(v))}>
                      <SelectTrigger className="h-8 w-16 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {defaultInstallments.map(num => (
                          <SelectItem key={num} value={String(num)} className="text-xs">{num === 1 ? "일시불" : `${num}개월`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-2">
                    <Select value={editForm.trainer_id || "none"} onValueChange={(v) => onNewRowChange("trainer_id", v === "none" ? "" : v)}>
                      <SelectTrigger className="h-8 w-20 text-xs">
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
                  <td className="px-2 py-2">
                    <Input
                      value={editForm.memo || ""}
                      onChange={(e) => onNewRowChange("memo", e.target.value)}
                      placeholder="메모"
                      className="h-8 w-24 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex justify-center gap-1">
                      <Button size="sm" variant="ghost" onClick={onSaveNewRow} className="h-7 w-7 p-0 text-green-600">
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={onCancelNewRow} className="h-7 w-7 p-0 text-gray-400">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : editingId === payment.id ? (
                <tr key={payment.id} className="bg-yellow-50">
                  <td className="px-2 py-2">
                    <Input
                      type="date"
                      value={editForm.payment_date || ""}
                      onChange={(e) => onEditFormChange("payment_date", e.target.value)}
                      className="h-8 w-28 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      value={editForm.member_name || ""}
                      onChange={(e) => onEditFormChange("member_name", e.target.value)}
                      className="h-8 w-20 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      value={editForm.phone || ""}
                      onChange={(e) => onEditFormChange("phone", e.target.value)}
                      className="h-8 w-28 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <SelectWithAdd
                      value={editForm.sale_type || ""}
                      options={allSaleTypes}
                      onChange={(v) => onEditFormChange("sale_type", v)}
                      onAdd={(name) => onAddOption?.("sale_type", name)}
                      className="h-8 w-20 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <SelectWithAdd
                      value={editForm.membership_category || ""}
                      options={allMembershipCategories}
                      onChange={(v) => onEditFormChange("membership_category", v)}
                      onAdd={(name) => onAddOption?.("membership_category", name)}
                      className="h-8 w-24 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <SelectWithAdd
                      value={editForm.membership_name || ""}
                      options={allMembershipNames}
                      onChange={(v) => onEditFormChange("membership_name", v)}
                      onAdd={(name) => onAddOption?.("membership_name", name)}
                      className="h-8 w-20 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      type="number"
                      value={editForm.amount || ""}
                      onChange={(e) => onEditFormChange("amount", parseInt(e.target.value) || 0)}
                      className="h-8 w-24 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Select value={editForm.method || ""} onValueChange={(v) => onEditFormChange("method", v)}>
                      <SelectTrigger className="h-8 w-20 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {allPaymentMethods.map(method => (
                          <SelectItem key={method} value={method} className="text-xs">{methodLabels[method] || method}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-2">
                    <Select value={String(editForm.installment || 1)} onValueChange={(v) => onEditFormChange("installment", parseInt(v))}>
                      <SelectTrigger className="h-8 w-16 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {defaultInstallments.map(num => (
                          <SelectItem key={num} value={String(num)} className="text-xs">{num === 1 ? "일시불" : `${num}개월`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-2">
                    <Select value={editForm.trainer_id || "none"} onValueChange={(v) => onEditFormChange("trainer_id", v === "none" ? "" : v)}>
                      <SelectTrigger className="h-8 w-20 text-xs">
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
                  <td className="px-2 py-2">
                    <Input
                      value={editForm.memo || ""}
                      onChange={(e) => onEditFormChange("memo", e.target.value)}
                      className="h-8 w-24 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex justify-center gap-1">
                      <Button size="sm" variant="ghost" onClick={onSaveEdit} className="h-7 w-7 p-0 text-green-600">
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-7 w-7 p-0 text-gray-400">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{formatDate(payment.payment_date)}</td>
                  <td className="px-3 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{payment.member_name}</td>
                  <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{payment.phone || "-"}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      payment.sale_type === "신규" ? "bg-green-100 text-green-700" :
                      payment.sale_type === "재등록" ? "bg-blue-100 text-blue-700" :
                      payment.sale_type === "연장" ? "bg-indigo-100 text-indigo-700" :
                      payment.sale_type === "환불" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {payment.sale_type}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{payment.membership_category}</td>
                  <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{payment.membership_name}</td>
                  <td className="px-3 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{formatCurrency(payment.amount)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      payment.method === "card" ? "bg-purple-100 text-purple-700" :
                      payment.method === "cash" ? "bg-green-100 text-green-700" :
                      "bg-orange-100 text-orange-700"
                    }`}>
                      {methodLabels[payment.method] || payment.method}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {payment.installment === 1 ? "일시불" : `${payment.installment}개월`}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{payment.trainer_name || "-"}</td>
                  <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap max-w-[100px] truncate">{payment.memo || "-"}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => onStartEdit(payment)} className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onDelete(payment.id)} className="h-7 w-7 p-0 text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-12 text-center text-gray-500">
                  매출 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
