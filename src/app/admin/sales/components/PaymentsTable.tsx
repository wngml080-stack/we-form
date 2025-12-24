"use client";

import { Plus } from "lucide-react";
import { PaymentRow } from "./PaymentRow";
import { NewPaymentRow } from "./NewPaymentRow";
import { EditingCell, NewRow } from "../hooks/useSalesPageData";

interface PaymentsTableProps {
  isLoading: boolean;
  filteredPayments: any[];
  newRows: NewRow[];
  editingCell: EditingCell | null;
  editValue: string;
  allMembershipTypes: any[];
  allPaymentMethods: any[];
  onStartEditing: (id: string, field: string, value: string) => void;
  onSaveEdit: (id: string, field: string) => void;
  onCancelEdit: () => void;
  onEditValueChange: (value: string) => void;
  onUpdateNewRow: (rowId: string, field: string, value: any) => void;
  onSaveNewRow: (rowId: string) => void;
  onRemoveNewRow: (rowId: string) => void;
  onAddNewRow: () => void;
}

export function PaymentsTable({
  isLoading, filteredPayments, newRows,
  editingCell, editValue,
  allMembershipTypes, allPaymentMethods,
  onStartEditing, onSaveEdit, onCancelEdit, onEditValueChange,
  onUpdateNewRow, onSaveNewRow, onRemoveNewRow, onAddNewRow
}: PaymentsTableProps) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="p-4 border-b bg-gray-50/50">
        <h3 className="font-semibold text-gray-900">결제 내역</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[900px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3">결제일</th>
              <th className="px-4 py-3">회원명</th>
              <th className="px-4 py-3">회원권 유형</th>
              <th className="px-4 py-3">등록 타입</th>
              <th className="px-4 py-3">방문루트</th>
              <th className="px-4 py-3">결제 방법</th>
              <th className="px-4 py-3">금액</th>
              <th className="px-4 py-3">분할정보</th>
              <th className="px-4 py-3">메모</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="text-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F80ED]"></div>
                    <p className="text-gray-500">데이터를 불러오는 중...</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <PaymentRow
                  key={payment.id}
                  payment={payment}
                  editingCell={editingCell}
                  editValue={editValue}
                  allMembershipTypes={allMembershipTypes}
                  allPaymentMethods={allPaymentMethods}
                  onStartEditing={onStartEditing}
                  onSaveEdit={onSaveEdit}
                  onCancelEdit={onCancelEdit}
                  onEditValueChange={onEditValueChange}
                />
              ))
            )}

            {!isLoading && filteredPayments.length === 0 && newRows.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-20 text-gray-400">
                  선택한 기간에 결제 내역이 없습니다.
                </td>
              </tr>
            )}

            {/* 새 행 입력 */}
            {newRows.map((row) => (
              <NewPaymentRow
                key={row.id}
                row={row}
                allPaymentMethods={allPaymentMethods}
                onUpdate={onUpdateNewRow}
                onSave={onSaveNewRow}
                onRemove={onRemoveNewRow}
              />
            ))}

            {/* 새 행 추가 버튼 */}
            <tr className="border-b hover:bg-gray-50">
              <td colSpan={9} className="px-4 py-3">
                <button
                  onClick={onAddNewRow}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#2F80ED] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  새 결제 내역 추가
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
