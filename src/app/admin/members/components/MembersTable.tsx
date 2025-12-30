"use client";

import { toast } from "@/lib/toast";
import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  flexRender,
} from "@tanstack/react-table";
import { getMemberColumns, Member, MemberActionsProps } from "./columns";
import { exportSelectedMembers } from "@/lib/utils/exportToExcel";

interface MembersTableProps extends MemberActionsProps {
  data: Member[];
  isLoading?: boolean;
  searchQuery?: string;
  statusFilter?: string;
  onBulkStatusChange?: (memberIds: string[], newStatus: string) => Promise<void>;
  onBulkTrainerAssign?: (memberIds: string[], trainerId: string) => Promise<void>;
  onBulkDelete?: (memberIds: string[]) => Promise<void>;
  trainers?: Array<{ id: string; name: string }>;
}

/**
 * TanStack Table을 사용한 회원 관리 테이블
 *
 * @param data - 표시할 회원 데이터
 * @param isLoading - 로딩 상태
 * @param onViewDetail - 회원 상세정보 및 결제이력 핸들러
 * @param onStatusChange - 상태 변경 핸들러
 * @param searchQuery - 검색어 (빈 상태 메시지용)
 * @param statusFilter - 상태 필터 (빈 상태 메시지용)
 */
export function MembersTable({
  data,
  isLoading = false,
  onViewDetail,
  onStatusChange,
  searchQuery = "",
  statusFilter = "all",
  onBulkStatusChange,
  onBulkTrainerAssign,
  onBulkDelete,
  trainers = [],
}: MembersTableProps) {
  // 정렬 상태
  const [sorting, setSorting] = React.useState<SortingState>([]);
  // 행 선택 상태
  const [rowSelection, setRowSelection] = React.useState({});

  // 컬럼 정의 메모이제이션
  const columns = useMemo(
    () => getMemberColumns({ onViewDetail, onStatusChange }),
    [onViewDetail, onStatusChange]
  );

  // TanStack Table 인스턴스
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // 페이지네이션은 서버 사이드로 처리 (부모 컴포넌트)
    manualPagination: true,
    enableRowSelection: true,
  });

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="rounded-md border bg-white overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[800px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              {table.getHeaderGroups()[0]?.headers.map((header) => (
                <th key={header.id} className="px-4 py-3 whitespace-nowrap">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={9} className="text-center py-20 text-gray-500">
                로딩 중...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // 빈 상태
  if (data.length === 0) {
    const message = searchQuery || statusFilter !== "all"
      ? "검색 결과가 없습니다."
      : "등록된 회원이 없습니다.";

    return (
      <div className="rounded-md border bg-white overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[800px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              {table.getHeaderGroups()[0]?.headers.map((header) => (
                <th key={header.id} className="px-4 py-3 whitespace-nowrap">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={9} className="text-center py-20 text-gray-500">
                {message}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // 선택된 행 정보
  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;
  const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original);

  // 테이블 렌더링
  return (
    <div className="space-y-4">
      {/* 선택된 행 툴바 */}
      {selectedRowCount > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-900">
              {selectedRowCount}명 선택됨
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* 대량 상태 변경 */}
            {onBulkStatusChange && (
              <select
                onChange={async (e) => {
                  if (!e.target.value) return;
                  const confirmed = confirm(`선택된 ${selectedRowCount}명의 회원 상태를 "${e.target.value === 'active' ? '활성' : e.target.value === 'paused' ? '홀딩' : '만료'}"으로 변경하시겠습니까?`);
                  if (confirmed) {
                    try {
                      const memberIds = selectedRows.map(row => row.id);
                      await onBulkStatusChange(memberIds, e.target.value);
                      setRowSelection({});
                      toast.success("상태가 변경되었습니다.");
                    } catch (error) {
                      console.error("상태 변경 실패:", error);
                      toast.error("상태 변경 중 오류가 발생했습니다.");
                    }
                  }
                  e.target.value = "";
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                defaultValue=""
              >
                <option value="" disabled>상태 변경</option>
                <option value="active">활성</option>
                <option value="paused">홀딩</option>
                <option value="expired">만료</option>
              </select>
            )}

            {/* 대량 트레이너 할당 */}
            {onBulkTrainerAssign && trainers.length > 0 && (
              <select
                onChange={async (e) => {
                  if (!e.target.value) return;
                  const trainerName = trainers.find(t => t.id === e.target.value)?.name || '';
                  const confirmed = confirm(`선택된 ${selectedRowCount}명의 회원을 "${trainerName}" 트레이너에게 할당하시겠습니까?`);
                  if (confirmed) {
                    try {
                      const memberIds = selectedRows.map(row => row.id);
                      await onBulkTrainerAssign(memberIds, e.target.value);
                      setRowSelection({});
                      toast.success("트레이너가 할당되었습니다.");
                    } catch (error) {
                      console.error("트레이너 할당 실패:", error);
                      toast.error("트레이너 할당 중 오류가 발생했습니다.");
                    }
                  }
                  e.target.value = "";
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                defaultValue=""
              >
                <option value="" disabled>트레이너 할당</option>
                {trainers.map(trainer => (
                  <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
                ))}
              </select>
            )}

            {/* Excel 내보내기 */}
            <button
              onClick={() => {
                try {
                  exportSelectedMembers(selectedRows);
                  // 성공 메시지는 브라우저 다운로드로 대체
                } catch (error) {
                  console.error("Excel 내보내기 실패:", error);
                  toast.error("Excel 파일 생성 중 오류가 발생했습니다.");
                }
              }}
              className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            >
              Excel 내보내기
            </button>

            {/* 대량 삭제 */}
            {onBulkDelete && (
              <button
                onClick={async () => {
                  const memberIds = selectedRows.map(row => row.id);

                  // 3명 이상일 때 확인 텍스트 입력 필요
                  if (selectedRowCount >= 3) {
                    const confirmText = prompt(
                      `⚠️ 정말로 선택된 ${selectedRowCount}명의 회원을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.\n계속하려면 아래 텍스트를 정확히 입력하세요:\n\n"모든내용삭제동의"`
                    );

                    if (confirmText !== "모든내용삭제동의") {
                      if (confirmText !== null) {
                        toast.warning("입력한 텍스트가 일치하지 않습니다. 삭제가 취소되었습니다.");
                      }
                      return;
                    }
                  } else {
                    // 3명 미만일 때는 일반 확인
                    const confirmed = confirm(
                      `선택된 ${selectedRowCount}명의 회원을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
                    );
                    if (!confirmed) return;
                  }

                  try {
                    await onBulkDelete(memberIds);
                    setRowSelection({});
                    toast.success("선택된 회원이 삭제되었습니다.");
                  } catch (error) {
                    console.error("회원 삭제 실패:", error);
                    toast.error("회원 삭제 중 오류가 발생했습니다.");
                  }
                }}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                선택 삭제
              </button>
            )}

            {/* 선택 해제 */}
            <button
              onClick={() => setRowSelection({})}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              선택 해제
            </button>
          </div>
        </div>
      )}

      {/* 테이블 */}
      <div className="rounded-md border bg-white overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[800px]">
        <thead className="bg-gray-50 border-b">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-4 py-3 whitespace-nowrap">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
