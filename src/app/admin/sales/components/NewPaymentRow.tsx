"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Check } from "lucide-react";
import { NewRow } from "../hooks/useSalesPageData";

interface NewPaymentRowProps {
  row: NewRow;
  allPaymentMethods: any[];
  onUpdate: (rowId: string, field: string, value: any) => void;
  onSave: (rowId: string) => void;
  onRemove: (rowId: string) => void;
}

export function NewPaymentRow({ row, allPaymentMethods, onUpdate, onSave, onRemove }: NewPaymentRowProps) {
  return (
    <tr className="border-b bg-green-50/50 border-green-200">
      {/* 결제일 */}
      <td className="px-4 py-2">
        <Input
          type="date"
          value={row.paid_at}
          onChange={(e) => onUpdate(row.id, "paid_at", e.target.value)}
          className="h-8 w-32 text-xs bg-white"
        />
      </td>

      {/* 이름 & 전화번호 */}
      <td className="px-4 py-2">
        <div className="flex flex-col gap-1">
          <Input
            placeholder="이름"
            value={row.customer_name}
            onChange={(e) => onUpdate(row.id, "customer_name", e.target.value)}
            className="h-7 w-24 text-xs bg-white"
          />
          <Input
            placeholder="전화번호"
            value={row.customer_phone}
            onChange={(e) => onUpdate(row.id, "customer_phone", e.target.value)}
            className="h-7 w-24 text-xs bg-white"
          />
        </div>
      </td>

      {/* 회원권 유형 - 부가상품 고정 */}
      <td className="px-4 py-2">
        <Badge className="bg-rose-100 text-rose-700 border-0">부가상품</Badge>
      </td>

      {/* 등록 타입 - 회원 이외 고정 */}
      <td className="px-4 py-2">
        <Badge className="bg-rose-100 text-rose-700 border-0">회원 이외</Badge>
      </td>

      {/* 상품명 */}
      <td className="px-4 py-2">
        <Input
          placeholder="상품명"
          value={row.product_name}
          onChange={(e) => onUpdate(row.id, "product_name", e.target.value)}
          className="h-8 w-24 text-xs bg-white"
        />
      </td>

      {/* 결제 방법 */}
      <td className="px-4 py-2">
        <Select value={row.method} onValueChange={(v) => onUpdate(row.id, "method", v)}>
          <SelectTrigger className="h-8 w-20 text-xs bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {allPaymentMethods.map((method: any) => (
              <SelectItem key={method.code} value={method.code}>{method.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      {/* 금액 */}
      <td className="px-4 py-2">
        <Input
          type="number"
          placeholder="금액"
          value={row.amount}
          onChange={(e) => onUpdate(row.id, "amount", e.target.value)}
          className="h-8 w-28 text-xs bg-white"
        />
      </td>

      {/* 분할정보 - 고정 */}
      <td className="px-4 py-2 text-gray-400 text-xs">
        일시불
      </td>

      {/* 메모 & 액션 버튼 */}
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <Input
            placeholder="메모"
            value={row.memo}
            onChange={(e) => onUpdate(row.id, "memo", e.target.value)}
            className="h-8 w-20 text-xs bg-white"
          />
          <button
            onClick={() => onSave(row.id)}
            className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded"
            title="저장"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRemove(row.id)}
            className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded"
            title="취소"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
