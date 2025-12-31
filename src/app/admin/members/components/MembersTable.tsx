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
}

/**
 * TanStack Table을 사용한 회원 관리 테이블 (읽기 전용)
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
      {/* 선택된 행 툴바 (Excel 내보내기와 선택 해제만) */}
      {selectedRowCount > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-900">
              {selectedRowCount}명 선택됨
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Excel 내보내기 */}
            <button
              onClick={() => {
                try {
                  exportSelectedMembers(selectedRows);
                } catch (error) {
                  console.error("Excel 내보내기 실패:", error);
                  toast.error("Excel 파일 생성 중 오류가 발생했습니다.");
                }
              }}
              className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            >
              Excel 내보내기
            </button>

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
