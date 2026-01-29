"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from "lucide-react";
import { HqStaff, HqGym } from "../hooks/useHqData";

interface PendingStaffListProps {
  pendingStaffs: HqStaff[];
  gyms: HqGym[];
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
    <div className="bg-white rounded-[32px] shadow-sm overflow-hidden border border-gray-100 flex flex-col h-full hover:shadow-md transition-all duration-500">
      <div className="bg-white px-8 py-6 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">가입 승인 및 발령 대기</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Approval Waiting List</p>
            </div>
          </div>
          {pendingStaffs.length > 0 && (
            <Badge className="bg-amber-500 text-white border-none font-black text-xs px-3 py-1 rounded-lg shadow-sm shadow-amber-100">
              {pendingStaffs.length}명 대기 중
            </Badge>
          )}
        </div>
      </div>
      <div className="p-8 space-y-4 flex-1">
        {pendingStaffs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 py-20">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 opacity-20" />
            </div>
            <p className="font-bold text-sm text-center">대기 인원이 없습니다.</p>
          </div>
        ) : (
          pendingStaffs.map((staff) => (
            <div key={staff.id} className="group border border-gray-100 bg-slate-50/50 p-6 rounded-2xl hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all duration-500">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-lg font-black text-slate-400 border border-gray-100 shadow-sm">
                    {staff.name[0]}
                  </div>
                  <div>
                    <span className="font-black text-slate-900 text-lg tracking-tighter">{staff.name}</span>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">{staff.email}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Select onValueChange={onGymChange}>
                    <SelectTrigger className="w-full h-11 bg-white border-none rounded-xl font-bold shadow-sm focus:ring-2 focus:ring-blue-100">
                      <SelectValue placeholder="지점 선택" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-xl border-none shadow-2xl p-2">
                      {gyms.map(g => <SelectItem key={g.id} value={g.id} className="rounded-lg font-bold py-2.5">{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:w-32">
                  <Select onValueChange={onRoleChange}>
                    <SelectTrigger className="w-full h-11 bg-white border-none rounded-xl font-bold shadow-sm focus:ring-2 focus:ring-blue-100">
                      <SelectValue placeholder="권한" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-xl border-none shadow-2xl p-2">
                      <SelectItem value="admin" className="rounded-lg font-bold py-2.5">관리자</SelectItem>
                      <SelectItem value="staff" className="rounded-lg font-bold py-2.5">직원</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="h-11 bg-slate-900 hover:bg-blue-600 text-white font-black px-6 rounded-xl transition-all shadow-lg shadow-slate-200"
                  onClick={() => onAssign(staff.id)}
                >
                  승인하기
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
