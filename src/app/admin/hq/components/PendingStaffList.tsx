"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from "lucide-react";

interface PendingStaffListProps {
  pendingStaffs: any[];
  gyms: any[];
  onGymChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onAssign: (staffId: string) => void;
}

export function PendingStaffList({
  pendingStaffs,
  gyms,
  onGymChange,
  onRoleChange,
  onAssign
}: PendingStaffListProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">가입 승인 및 발령 대기</h3>
          </div>
          {pendingStaffs.length > 0 && (
            <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
              {pendingStaffs.length}명
            </span>
          )}
        </div>
      </div>
      <div className="p-6 space-y-3">
        {pendingStaffs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">대기 인원 없음</p>
          </div>
        ) : (
          pendingStaffs.map((staff) => (
            <div key={staff.id} className="border border-gray-200 bg-white p-4 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="font-semibold text-gray-900">{staff.name}</span>
                  <p className="text-xs text-gray-500 mt-1">{staff.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Select onValueChange={onGymChange}>
                  <SelectTrigger className="flex-1 h-9 bg-white">
                    <SelectValue placeholder="지점 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {gyms.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select onValueChange={onRoleChange}>
                  <SelectTrigger className="w-[120px] h-9 bg-white">
                    <SelectValue placeholder="권한" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="admin">관리자</SelectItem>
                    <SelectItem value="staff">직원</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="h-9 bg-gray-900 hover:bg-gray-800 text-white"
                  onClick={() => onAssign(staff.id)}
                >
                  승인
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
