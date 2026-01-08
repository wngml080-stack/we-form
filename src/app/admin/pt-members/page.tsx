"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { usePTMembersData } from "./hooks/usePTMembersData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Users, Dumbbell, DollarSign, Clock, Search, Phone, User, RefreshCw,
  ChevronLeft, ChevronRight, Calendar, Target, TrendingUp, Award, BarChart3,
  Layers, UserCheck, AlertTriangle, ArrowRight, Activity, Filter, Info
} from "lucide-react";
import { MemberKanbanBoard } from "./components/MemberKanbanBoard";
import { ReRegistrationTab } from "./re-registration/components";
import { cn } from "@/lib/utils";
import { formatPhoneNumber } from "@/lib/utils/phone-format";

// Direct imports for faster modal loading
import { MemberDetailModal } from "./components/modals/MemberDetailModal";
import { TrainerAssignModal } from "./components/modals/TrainerAssignModal";
import { TrainerTransferModal } from "./components/modals/TrainerTransferModal";

export default function PTMembersPage(props: {
  params: Promise<any>;
  searchParams: Promise<any>;
}) {
  use(props.params);
  use(props.searchParams);

  const { selectedGymId, gymName, selectedCompanyId, isInitialized } = useAdminFilter();
  const [activeTab, setActiveTab] = useState("members");

  const {
    ptMembers,
    staffList,
    extendedStats,
    membersByTrainer,
    isLoading,
    trainerFilter,
    setTrainerFilter,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    updateTrainer,
    memberCategory,
    setMemberCategory,
    periodFilter,
    changePeriod,
    navigateMonth,
    dateRange,
    // 회원 상세 모달
    isMemberDetailOpen, setIsMemberDetailOpen,
    selectedMember,
    memberPaymentHistory,
    memberAllMemberships,
    memberActivityLogs,
    memberTrainers,
    openMemberDetailModal,
    // 트레이너 관리
    isTrainerAssignOpen, setIsTrainerAssignOpen,
    isTrainerTransferOpen, setIsTrainerTransferOpen,
    trainerTransferTarget,
    trainerTransferCategory,
    isPtTransfer,
    isAdmin,
    openTrainerAssignModal,
    openTrainerTransferModal,
    handleAssignTrainer,
    handleTransferTrainer,
    handleDeleteTrainer
  } = usePTMembersData({
    selectedGymId,
    selectedCompanyId,
    filterInitialized: isInitialized
  });

  const formatCurrency = (amount: number) => {
    if (amount >= 10000) {
      return `${Math.round(amount / 10000)}만`;
    }
    return new Intl.NumberFormat("ko-KR").format(amount);
  };

  const formatFullCurrency = (amount: number) => {
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

  const memberCategoryConfig = [
    { key: "all" as const, label: "전체회원", count: extendedStats.memberCounts.all, icon: Users },
    { key: "pt" as const, label: "PT회원", count: extendedStats.memberCounts.pt, icon: Dumbbell },
    { key: "ot" as const, label: "OT회원", count: extendedStats.memberCounts.ot, icon: UserCheck },
    { key: "reregistration" as const, label: "재등록 대상", count: extendedStats.memberCounts.reregistration, icon: AlertTriangle }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">통합 회원관리</h1>
          <p className="text-slate-500 text-sm">{gymName} 지점의 회원 현황입니다.</p>
        </div>
        <Link href="/admin/sales">
          <Button className="bg-slate-900 text-white">신규 매출 등록</Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="members" className="rounded-lg">회원 리스트</TabsTrigger>
          <TabsTrigger value="manual" className="rounded-lg">코칭 현황</TabsTrigger>
          <TabsTrigger value="re-registration" className="rounded-lg">재등록 관리</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {memberCategoryConfig.map(({ key, label, count, icon: Icon }) => (
              <Button
                key={key}
                variant={memberCategory === key ? "default" : "outline"}
                onClick={() => setMemberCategory(key)}
                className="h-24 flex flex-col items-center justify-center gap-2 rounded-xl"
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{label}</span>
                <span className="text-lg font-bold">{count}명</span>
              </Button>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="회원 검색"
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={trainerFilter} onValueChange={setTrainerFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="트레이너" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 트레이너</SelectItem>
                    {staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="active">이용중</SelectItem>
                    <SelectItem value="paused">일시정지</SelectItem>
                    <SelectItem value="expired">만료</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">회원명</th>
                    <th className="px-6 py-3 text-left font-semibold">연락처</th>
                    <th className="px-6 py-3 text-left font-semibold">회원권</th>
                    <th className="px-6 py-3 text-left font-semibold">트레이너</th>
                    <th className="px-6 py-3 text-left font-semibold">잔여 세션</th>
                    <th className="px-6 py-3 text-right font-semibold">금액</th>
                    <th className="px-6 py-3 text-center font-semibold">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ptMembers.map((member) => (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onDoubleClick={() => openMemberDetailModal(member)}
                    >
                      <td className="px-6 py-4 font-bold">{member.member_name}</td>
                      <td className="px-6 py-4 text-slate-500">{member.phone ? formatPhoneNumber(member.phone) : "-"}</td>
                      <td className="px-6 py-4">{member.membership_category}</td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        {member.trainer_id ? (
                          // 트레이너가 지정된 경우: 이름만 표시 (변경은 회원 상세에서)
                          <span className="text-slate-700 text-sm">{member.trainer_name || "지정됨"}</span>
                        ) : (
                          // 미지정인 경우: Select로 최초 지정 가능
                          <Select
                            value=""
                            onValueChange={(val) => {
                              const staff = staffList.find(s => s.id === val);
                              if (staff) updateTrainer(member.id, staff.id, staff.name);
                            }}
                          >
                            <SelectTrigger className="h-8 w-24 text-xs border-dashed text-slate-400">
                              <SelectValue placeholder="미지정" />
                            </SelectTrigger>
                            <SelectContent>
                              {staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {member.remaining_sessions != null ? `${member.remaining_sessions} / ${member.total_sessions}` : "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">{formatFullCurrency(member.amount)}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={member.status === "active" ? "default" : "secondary"} className="text-[10px]">
                          {member.status === "active" ? "이용중" : member.status === "paused" ? "정지" : "만료"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="manual" className="mt-6">
          <MemberKanbanBoard />
        </TabsContent>

        <TabsContent value="re-registration" className="mt-6">
          <ReRegistrationTab selectedGymId={selectedGymId} />
        </TabsContent>
      </Tabs>

      {/* 회원 상세 모달 */}
      <MemberDetailModal
        isOpen={isMemberDetailOpen}
        onClose={() => setIsMemberDetailOpen(false)}
        member={selectedMember}
        paymentHistory={memberPaymentHistory}
        allMemberships={memberAllMemberships}
        activityLogs={memberActivityLogs}
        onEditMember={() => {}}
        onEditMembership={() => {}}
        onDeleteMembership={async () => {}}
        onEditAddon={() => {}}
        onTransferMembership={() => {}}
        // 트레이너 관련 props
        memberTrainers={memberTrainers}
        staffList={staffList}
        isAdmin={isAdmin}
        onAssignTrainer={openTrainerAssignModal}
        onTransferTrainer={openTrainerTransferModal}
        onDeleteTrainer={handleDeleteTrainer}
      />

      {/* 트레이너 배정 모달 */}
      <TrainerAssignModal
        isOpen={isTrainerAssignOpen}
        onClose={() => setIsTrainerAssignOpen(false)}
        memberName={selectedMember?.name || ""}
        staffList={staffList}
        isLoading={isLoading}
        onSubmit={handleAssignTrainer}
        existingCategories={memberTrainers.map((t: any) => t.category)}
      />

      {/* 트레이너 인계 모달 */}
      <TrainerTransferModal
        isOpen={isTrainerTransferOpen}
        onClose={() => setIsTrainerTransferOpen(false)}
        memberName={selectedMember?.name || ""}
        category={trainerTransferCategory}
        fromTrainer={
          isPtTransfer
            ? (selectedMember?.trainer || null)
            : (trainerTransferTarget?.trainer || null)
        }
        staffList={staffList}
        isLoading={isLoading}
        onSubmit={handleTransferTrainer}
        memberTrainerId={trainerTransferTarget?.id}
        isPtTransfer={isPtTransfer}
      />
    </div>
  );
}

function PlusCircle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="M12 8v8" />
    </svg>
  );
}

function X(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}
