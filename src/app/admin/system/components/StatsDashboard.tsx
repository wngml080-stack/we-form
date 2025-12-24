"use client";

import { Building2, MapPin, Users, CheckCircle } from "lucide-react";

interface StatsDashboardProps {
  totalCompanies: number;
  totalGymsCount: number;
  totalStaffsCount: number;
  pendingCount: number;
}

export function StatsDashboard({ totalCompanies, totalGymsCount, totalStaffsCount, pendingCount }: StatsDashboardProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">고객사</span>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{totalCompanies}</div>
        <p className="text-sm text-gray-500">전체 고객사 수</p>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <MapPin className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">지점</span>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{totalGymsCount}</div>
        <p className="text-sm text-gray-500">개 지점 운영 중</p>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">직원</span>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{totalStaffsCount}</div>
        <p className="text-sm text-gray-500">명 등록</p>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <CheckCircle className="w-5 h-5 text-amber-600" />
          </div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">승인 대기</span>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{pendingCount}</div>
        <p className="text-sm text-gray-500">개 업체 대기 중</p>
      </div>
    </div>
  );
}
