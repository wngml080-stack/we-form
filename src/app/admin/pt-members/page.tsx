"use client";

import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { usePTMembersData } from "./hooks/usePTMembersData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Dumbbell, DollarSign, Clock, Search, Phone, User } from "lucide-react";

export default function PTMembersPage() {
  const { selectedGymId, gymName, selectedCompanyId, isInitialized } = useAdminFilter();

  const {
    ptMembers,
    staffList,
    stats,
    membersByTrainer,
    isLoading,
    trainerFilter,
    setTrainerFilter,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    updateTrainer
  } = usePTMembersData({
    selectedGymId,
    selectedCompanyId,
    filterInitialized: isInitialized
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(amount);
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!selectedGymId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">지점을 선택해주세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PT회원관리</h1>
          <p className="text-gray-500 text-sm mt-1">{gymName} PT 회원 현황</p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">전체 회원</p>
              <p className="text-lg font-bold text-blue-600">{stats.totalMembers}명</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">이용중</p>
              <p className="text-lg font-bold text-green-600">{stats.activeMembers}명</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">총 매출</p>
              <p className="text-lg font-bold text-purple-600">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">평균 잔여횟수</p>
              <p className="text-lg font-bold text-orange-600">{stats.avgSessionsRemaining}회</p>
            </div>
          </div>
        </div>
      </div>

      {/* 트레이너별 회원 수 */}
      {Object.keys(membersByTrainer).length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">트레이너별 담당 회원</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(membersByTrainer).map(([id, data]) => (
              <div
                key={id}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setTrainerFilter(trainerFilter === id ? "all" : id)}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{data.name}</p>
                  <p className="text-xs text-gray-500">{data.count}명</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="회원명 또는 연락처 검색"
              className="pl-9 h-10"
            />
          </div>

          <Select value={trainerFilter} onValueChange={setTrainerFilter}>
            <SelectTrigger className="w-full sm:w-40 h-10">
              <SelectValue placeholder="담당 트레이너" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">전체 트레이너</SelectItem>
              {staffList.map(staff => (
                <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32 h-10">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="active">이용중</SelectItem>
              <SelectItem value="paused">일시정지</SelectItem>
              <SelectItem value="expired">만료</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 회원 목록 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : ptMembers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Dumbbell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>PT 회원이 없습니다.</p>
            <p className="text-sm mt-1">매출 관리에서 PT 매출을 등록하고 담당 트레이너를 지정해주세요.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">회원</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">회원권</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">담당</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">잔여/총</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">결제금액</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ptMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {member.member_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.member_name}</p>
                          <p className="text-xs text-gray-500">{member.sale_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {member.phone ? (
                        <a href={`tel:${member.phone}`} className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary">
                          <Phone className="w-3 h-3" />
                          {member.phone}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-900">{member.membership_category}</p>
                      <p className="text-xs text-gray-500">{member.membership_name}</p>
                    </td>
                    <td className="px-4 py-4">
                      <Select
                        value={member.trainer_id}
                        onValueChange={(value) => {
                          const trainer = staffList.find(s => s.id === value);
                          if (trainer) {
                            updateTrainer(member.id, trainer.id, trainer.name);
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {staffList.map(staff => (
                            <SelectItem key={staff.id} value={staff.id} className="text-xs">
                              {staff.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-4">
                      {member.remaining_sessions != null ? (
                        <span className="text-sm font-medium">
                          <span className={member.remaining_sessions <= 3 ? "text-red-600" : "text-gray-900"}>
                            {member.remaining_sessions}
                          </span>
                          <span className="text-gray-400">/{member.total_sessions}회</span>
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(member.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        member.status === "active" ? "bg-green-100 text-green-700" :
                        member.status === "paused" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {member.status === "active" ? "이용중" :
                         member.status === "paused" ? "일시정지" : "만료"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>안내:</strong> PT회원은 매출 관리에서 등록한 PT 관련 매출 중 담당 트레이너가 지정된 회원입니다.
          새 PT 회원을 추가하려면 <a href="/admin/sales" className="underline font-medium">매출 관리</a>에서 매출을 등록해주세요.
        </p>
      </div>
    </div>
  );
}
