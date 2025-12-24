"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Eye } from "lucide-react";
import { getStatusBadge } from "../hooks/useMemberOperations";

interface MembersLegacyTableProps {
  members: any[];
  staffList: any[];
  isLoading: boolean;
  searchQuery: string;
  statusFilter: string;
  onSort: (field: string) => void;
  onViewDetail: (member: any) => void;
}

export function MembersLegacyTable({
  members,
  staffList,
  isLoading,
  searchQuery,
  statusFilter,
  onSort,
  onViewDetail,
}: MembersLegacyTableProps) {
  return (
    <div className="rounded-md border bg-white overflow-x-auto">
      <table className="w-full text-sm text-left min-w-[900px]">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 whitespace-nowrap">
              <button
                onClick={() => onSort("name")}
                className="flex items-center gap-1 hover:text-blue-600 font-semibold"
              >
                이름
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </th>
            <th className="px-4 py-3 whitespace-nowrap">연락처</th>
            <th className="px-4 py-3 whitespace-nowrap">생년월일</th>
            <th className="px-4 py-3 whitespace-nowrap">성별</th>
            <th className="px-4 py-3 whitespace-nowrap">담당 트레이너</th>
            <th className="px-4 py-3 whitespace-nowrap">활성 회원권</th>
            <th className="px-4 py-3 whitespace-nowrap">
              <button
                onClick={() => onSort("membership_start_date")}
                className="flex items-center gap-1 hover:text-blue-600 font-semibold"
              >
                회원권 시작일
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </th>
            <th className="px-4 py-3 whitespace-nowrap">
              <button
                onClick={() => onSort("membership_end_date")}
                className="flex items-center gap-1 hover:text-blue-600 font-semibold"
              >
                회원권 종료일
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </th>
            <th className="px-4 py-3 whitespace-nowrap">잔여횟수</th>
            <th className="px-4 py-3 whitespace-nowrap">상태</th>
            <th className="px-4 py-3 text-right whitespace-nowrap">관리</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={11} className="text-center py-20 text-gray-500">
                로딩 중...
              </td>
            </tr>
          ) : (
            <>
              {members.map((member) => {
                const statusBadge = getStatusBadge(member.status);
                const remaining = member.activeMembership
                  ? member.activeMembership.total_sessions - member.activeMembership.used_sessions
                  : null;

                return (
                  <tr key={member.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{member.name}</td>
                    <td className="px-4 py-3 text-gray-600">{member.phone || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{member.birth_date || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{member.gender || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {staffList.find((s) => s.id === member.trainer_id)?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {member.activeMembership ? member.activeMembership.name : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {member.activeMembership?.start_date || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {member.activeMembership?.end_date || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {member.activeMembership ? (
                        <span className={remaining === 0 ? "text-red-500 font-semibold" : "text-gray-700"}>
                          {remaining} / {member.activeMembership.total_sessions}회
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`border-0 ${statusBadge.color}`}>{statusBadge.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(member)}
                        title="회원 상세 정보"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {members.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center py-20 text-gray-500">
                    {searchQuery || statusFilter !== "all"
                      ? "검색 결과가 없습니다."
                      : "등록된 회원이 없습니다."}
                  </td>
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
