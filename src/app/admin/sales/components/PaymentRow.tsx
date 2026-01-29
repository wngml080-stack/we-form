"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, CreditCard, Banknote, X, Check, Edit2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface EditingCell {
  id: string;
  field: string;
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(amount);
};

// 회원권 유형별 색상
const MEMBERSHIP_TYPE_COLORS: Record<string, string> = {
  "헬스": "bg-blue-100 text-blue-700",
  "필라테스": "bg-pink-100 text-pink-700",
  "PT": "bg-purple-100 text-purple-700",
  "PPT": "bg-violet-100 text-violet-700",
  "GPT": "bg-indigo-100 text-indigo-700",
  "골프": "bg-green-100 text-green-700",
  "GX": "bg-orange-100 text-orange-700"
};

// 등록 타입별 색상
const REGISTRATION_TYPE_COLORS: Record<string, string> = {
  "신규": "bg-emerald-100 text-emerald-700",
  "리뉴": "bg-cyan-100 text-cyan-700",
  "기간변경": "bg-amber-100 text-amber-700",
  "회원 이외": "bg-rose-100 text-rose-700"
};

const getMethodBadge = (method: string) => {
  const config: Record<string, { label: string; color: string; icon: LucideIcon }> = {
    card: { label: "카드", color: "bg-blue-100 text-blue-700", icon: CreditCard },
    cash: { label: "현금", color: "bg-emerald-100 text-emerald-700", icon: Banknote },
    transfer: { label: "계좌이체", color: "bg-purple-100 text-purple-700", icon: DollarSign }
  };
  return config[method] || { label: method, color: "bg-gray-100 text-gray-700", icon: DollarSign };
};

interface PaymentMember {
  name: string | null;
  phone: string | null;
}

interface Payment {
  id: string;
  paid_at: string;
  amount: string;
  total_amount?: string;
  method: string;
  membership_type?: string;
  registration_type?: string;
  visit_route?: string;
  memo?: string;
  installment_count?: number;
  installment_current?: number;
  members?: PaymentMember;
  [key: string]: string | number | boolean | PaymentMember | undefined;
}

interface MembershipType {
  name: string;
}

interface PaymentMethod {
  code: string;
  name: string;
}

interface PaymentRowProps {
  payment: Payment;
  editingCell: EditingCell | null;
  editValue: string;
  allMembershipTypes: MembershipType[];
  allPaymentMethods: PaymentMethod[];
  onStartEditing: (id: string, field: string, value: string) => void;
  onSaveEdit: (id: string, field: string) => void;
  onCancelEdit: () => void;
  onEditValueChange: (value: string) => void;
}

export function PaymentRow({
  payment, editingCell, editValue,
  allMembershipTypes, allPaymentMethods,
  onStartEditing, onSaveEdit, onCancelEdit, onEditValueChange
}: PaymentRowProps) {
  const methodBadge = getMethodBadge(payment.method);
  const MethodIcon = methodBadge.icon;
  const isEditing = (field: string) => editingCell?.id === payment.id && editingCell?.field === field;

  const renderEditableCell = (
    field: string,
    displayContent: React.ReactNode,
    inputType: "text" | "date" | "select" = "text",
    selectOptions?: { value: string; label: string }[],
    inputClassName = "h-8 w-32 text-xs"
  ) => {
    if (isEditing(field)) {
      return (
        <div className="flex items-center gap-1">
          {inputType === "select" ? (
            <Select value={editValue} onValueChange={onEditValueChange}>
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {selectOptions?.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={inputType}
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              className={inputClassName}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && onSaveEdit(payment.id, field)}
            />
          )}
          <button onClick={() => onSaveEdit(payment.id, field)} className="p-1 hover:bg-green-100 rounded">
            <Check className="w-4 h-4 text-green-600" />
          </button>
          <button onClick={onCancelEdit} className="p-1 hover:bg-red-100 rounded">
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      );
    }

    return (
      <div
        className="cursor-pointer hover:bg-blue-100 px-2 py-1 rounded flex items-center gap-1 group/cell"
        onClick={() => onStartEditing(payment.id, field, getFieldValue(field))}
      >
        {displayContent}
        <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover/cell:opacity-100" />
      </div>
    );
  };

  const getFieldValue = (field: string): string => {
    switch (field) {
      case "paid_at": return formatDate(new Date(payment.paid_at));
      case "amount": return payment.amount?.toString() || "0";
      default: {
        const value = payment[field];
        if (typeof value === "string") return value;
        if (typeof value === "number") return value.toString();
        return "";
      }
    }
  };

  return (
    <tr className="border-b hover:bg-blue-50/30 group">
      {/* 결제일 */}
      <td className="px-4 py-3 text-gray-600">
        {renderEditableCell(
          "paid_at",
          new Date(payment.paid_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
          "date",
          undefined,
          "h-8 w-32 text-xs"
        )}
      </td>

      {/* 회원명 */}
      <td className="px-4 py-3">
        <div className="font-medium">{payment.members?.name || "-"}</div>
        <div className="text-xs text-gray-400">{payment.members?.phone || ""}</div>
      </td>

      {/* 회원권 유형 */}
      <td className="px-4 py-3">
        {renderEditableCell(
          "membership_type",
          payment.membership_type ? (
            <Badge className={`border-0 ${MEMBERSHIP_TYPE_COLORS[payment.membership_type] || "bg-gray-100 text-gray-700"} w-fit`}>
              {payment.membership_type}
            </Badge>
          ) : <span className="text-gray-400">-</span>,
          "select",
          [...allMembershipTypes.map(t => ({ value: t.name, label: t.name })), { value: "부가상품", label: "부가상품" }]
        )}
      </td>

      {/* 등록 타입 */}
      <td className="px-4 py-3">
        {renderEditableCell(
          "registration_type",
          payment.registration_type ? (
            <Badge className={`border-0 ${REGISTRATION_TYPE_COLORS[payment.registration_type] || "bg-gray-100 text-gray-700"} w-fit`}>
              {payment.registration_type}
            </Badge>
          ) : <span className="text-gray-400">-</span>,
          "select",
          [
            { value: "신규", label: "신규" },
            { value: "리뉴", label: "리뉴" },
            { value: "기간변경", label: "기간변경" },
            { value: "회원 이외", label: "회원 이외" }
          ]
        )}
      </td>

      {/* 방문루트 */}
      <td className="px-4 py-3">
        {renderEditableCell(
          "visit_route",
          <span className="text-gray-600">{payment.visit_route || "-"}</span>,
          "text",
          undefined,
          "h-8 w-20 text-xs"
        )}
      </td>

      {/* 결제 방법 */}
      <td className="px-4 py-3">
        {renderEditableCell(
          "method",
          <Badge className={`border-0 ${methodBadge.color} flex items-center gap-1 w-fit`}>
            <MethodIcon className="w-3 h-3" />
            {methodBadge.label}
          </Badge>,
          "select",
          allPaymentMethods.map(m => ({ value: m.code, label: m.name }))
        )}
      </td>

      {/* 금액 */}
      <td className="px-4 py-3">
        {renderEditableCell(
          "amount",
          <div className="font-semibold text-gray-900">{formatCurrency(parseFloat(payment.amount))}</div>,
          "text",
          undefined,
          "h-8 w-28 text-xs"
        )}
        {payment.total_amount && parseFloat(payment.total_amount) !== parseFloat(payment.amount) && (
          <div className="text-xs text-gray-500">전체: {formatCurrency(parseFloat(payment.total_amount))}</div>
        )}
      </td>

      {/* 분할정보 */}
      <td className="px-4 py-3 text-gray-600">
        {(payment.installment_count ?? 0) > 1 ? (
          <div className="text-sm">
            <span className="font-medium text-[#2F80ED]">{payment.installment_current}/{payment.installment_count}</span>
            <span className="text-gray-500"> 회차</span>
          </div>
        ) : (
          <span className="text-gray-400">일시불</span>
        )}
      </td>

      {/* 메모 */}
      <td className="px-4 py-3">
        {renderEditableCell(
          "memo",
          <span className="truncate text-gray-500 text-xs max-w-[150px] inline-block">{payment.memo || "-"}</span>,
          "text",
          undefined,
          "h-8 w-32 text-xs"
        )}
      </td>
    </tr>
  );
}
