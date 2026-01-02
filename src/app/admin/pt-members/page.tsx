"use client";

import { useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { usePTMembersData } from "./hooks/usePTMembersData";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Dumbbell, DollarSign, Clock, Search, Phone, User, RefreshCw } from "lucide-react";
import { MemberKanbanBoard } from "./components/MemberKanbanBoard";
import { ReRegistrationTab } from "./re-registration/components";

export default function PTMembersPage(props: {
  params: Promise<any>;
  searchParams: Promise<any>;
}) {
  // Next.js 15+에서 params와 searchParams는 Promise이므로 사용하지 않더라도 unwrap해야 오류가 발생하지 않습니다.
  use(props.params);
  use(props.searchParams);

  const { selectedGymId, gymName, selectedCompanyId, isInitialized } = useAdminFilter();
  const [activeTab, setActiveTab] = useState("members");

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
          <h1 className="text-2xl font-bold text-gray-900">통합 회원관리</h1>
          <p className="text-gray-500 text-sm mt-1">{gymName} 회원 현황 및 코칭/재등록 프로세스</p>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="members"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2"
          >
            <Dumbbell className="w-4 h-4" />
            PT회원리스트 & 통계표
          </TabsTrigger>
          <TabsTrigger
            value="manual"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2"
          >
            <Users className="w-4 h-4" />
            회원 코칭현황
          </TabsTrigger>
          <TabsTrigger
            value="re-registration"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            재등록 관리
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-6 space-y-6">
          {/* 관리중인 회원 리스트 칸반 보드 */}
          <MemberKanbanBoard />
        </TabsContent>

                  <TabsContent value="members" className="mt-6 space-y-6 animate-in fade-in duration-500">
                    {/* 통계 카드 - 더 현대적인 디자인 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                          </div>
                          <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-bold">Total</Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">전체 회원</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalMembers}<span className="text-sm font-normal text-gray-400 ml-1">명</span></p>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <Dumbbell className="w-6 h-6 text-emerald-600" />
                          </div>
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none font-bold">Active</Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">이용중</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeMembers}<span className="text-sm font-normal text-gray-400 ml-1">명</span></p>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-purple-600" />
                          </div>
                          <Badge variant="secondary" className="bg-purple-50 text-purple-600 border-none font-bold">Sales</Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">총 매출</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalRevenue).replace('₩', '')}<span className="text-sm font-normal text-gray-400 ml-1">원</span></p>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-orange-600" />
                          </div>
                          <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-none font-bold">Avg</Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">평균 잔여횟수</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.avgSessionsRemaining}<span className="text-sm font-normal text-gray-400 ml-1">회</span></p>
                        </div>
                      </div>
                    </div>

                    {/* 트레이너별 회원 수 - 가로 스크롤 가능한 칩 형태 */}
                    {Object.keys(membersByTrainer).length > 0 && (
                      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                          트레이너별 담당 현황
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(membersByTrainer).map(([id, data]) => {
                            const isSelected = trainerFilter === id;
                            return (
                              <button
                                key={id}
                                onClick={() => setTrainerFilter(isSelected ? "all" : id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                                  isSelected 
                                    ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                                    : "bg-gray-50 border-gray-100 text-gray-600 hover:border-blue-200 hover:bg-white"
                                }`}
                              >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isSelected ? "bg-white/20" : "bg-white"}`}>
                                  <User className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-blue-600"}`} />
                                </div>
                                <span className="text-sm font-bold">{data.name}</span>
                                <span className={`text-xs ${isSelected ? "text-blue-100" : "text-gray-400"}`}>{data.count}명</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 필터 및 목록 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="p-5 border-b border-gray-50 bg-gray-50/30">
                        <div className="flex flex-col md:flex-row gap-3">
                          <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="회원명 또는 연락처 검색"
                              className="pl-10 h-11 bg-white border-gray-200 rounded-xl focus:ring-blue-100"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Select value={trainerFilter} onValueChange={setTrainerFilter}>
                              <SelectTrigger className="w-full sm:w-40 h-11 bg-white border-gray-200 rounded-xl">
                                <SelectValue placeholder="담당 트레이너" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-100 shadow-xl rounded-xl">
                                <SelectItem value="all">전체 트레이너</SelectItem>
                                {staffList.map(staff => (
                                  <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                              <SelectTrigger className="w-full sm:w-32 h-11 bg-white border-gray-200 rounded-xl">
                                <SelectValue placeholder="상태" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-100 shadow-xl rounded-xl">
                                <SelectItem value="all">전체 상태</SelectItem>
                                <SelectItem value="active">이용중</SelectItem>
                                <SelectItem value="paused">일시정지</SelectItem>
                                <SelectItem value="expired">만료</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-50 border-t-blue-600"></div>
                        </div>
                      ) : ptMembers.length === 0 ? (
                        <div className="text-center py-20 bg-white">
                          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Dumbbell className="w-10 h-10 text-gray-200" />
                          </div>
                          <p className="text-gray-900 font-bold text-lg">해당하는 PT 회원이 없습니다.</p>
                          <p className="text-gray-500 mt-2">필터를 조정하거나 새로운 매출을 등록해주세요.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead className="bg-gray-50/50">
                              <tr>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">회원 정보</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">연락처</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">회원권 종류</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">담당 트레이너</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">잔여 / 총 횟수</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">결제 금액</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">상태</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                              {ptMembers.map((member) => (
                                <tr key={member.id} className="hover:bg-blue-50/30 transition-colors group">
                                  <td className="px-6 py-5">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                                        <span className="text-sm font-bold text-white">
                                          {member.member_name.charAt(0)}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{member.member_name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{member.sale_type}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-5">
                                    {member.phone ? (
                                      <a href={`tel:${member.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 font-medium">
                                        <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors">
                                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                                        </div>
                                        {member.phone}
                                      </a>
                                    ) : (
                                      <span className="text-sm text-gray-300">-</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-5">
                                    <p className="text-sm font-bold text-gray-800">{member.membership_category}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{member.membership_name}</p>
                                  </td>
                                  <td className="px-6 py-5">
                                    <Select
                                      value={member.trainer_id}
                                      onValueChange={(value) => {
                                        const trainer = staffList.find(s => s.id === value);
                                        if (trainer) {
                                          updateTrainer(member.id, trainer.id, trainer.name);
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="h-9 w-28 text-xs font-bold border-gray-200 rounded-lg bg-gray-50/50 hover:bg-white transition-all">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-white border-gray-100 shadow-xl rounded-xl">
                                        {staffList.map(staff => (
                                          <SelectItem key={staff.id} value={staff.id} className="text-xs font-medium">
                                            {staff.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </td>
                                  <td className="px-6 py-5">
                                    {member.remaining_sessions != null ? (
                                      <div className="flex items-center gap-3">
                                        <div className="flex-1 max-w-[60px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                          <div 
                                            className={`h-full rounded-full ${
                                              member.remaining_sessions <= 3 ? "bg-red-500" : "bg-blue-500"
                                            }`}
                                            style={{ width: `${Math.min(100, (member.remaining_sessions / (member.total_sessions || 1)) * 100)}%` }}
                                          ></div>
                                        </div>
                                        <span className="text-sm font-bold">
                                          <span className={member.remaining_sessions <= 3 ? "text-red-600" : "text-gray-900"}>
                                            {member.remaining_sessions}
                                          </span>
                                          <span className="text-gray-400 ml-0.5">/ {member.total_sessions}회</span>
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-300">-</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-5">
                                    <span className="text-sm font-bold text-gray-900">
                                      {formatCurrency(member.amount)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-5">
                                    <Badge className={`px-3 py-1 rounded-full border-none font-bold ${
                                      member.status === "active" ? "bg-emerald-50 text-emerald-600" :
                                      member.status === "paused" ? "bg-amber-50 text-amber-600" :
                                      "bg-gray-100 text-gray-500"
                                    }`}>
                                      {member.status === "active" ? "이용중" :
                                       member.status === "paused" ? "일시정지" : "만료"}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* 안내 카드 */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-lg mb-1">PT 회원 관리 안내</p>
                          <p className="text-blue-50/80 text-sm leading-relaxed">
                            PT 회원은 매출 관리에서 등록한 PT 관련 매출 중 담당 트레이너가 지정된 회원들입니다.<br />
                            목록에서 담당 트레이너를 즉시 변경하거나 회원 상세 정보를 확인할 수 있습니다. 새로운 PT 회원을 추가하려면 
                            <Link href="/admin/sales" className="underline font-bold ml-1 hover:text-white transition-colors">매출 관리</Link>에서 매출을 등록해주세요.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

        <TabsContent value="re-registration" className="mt-6">
          <ReRegistrationTab selectedGymId={selectedGymId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
