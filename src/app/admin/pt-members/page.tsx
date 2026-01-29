"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { usePTMembersSWR, MemberTrainer } from "./hooks/usePTMembersSWR";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Users, Dumbbell, Search, UserCheck, AlertTriangle
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
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  use(props.params);
  use(props.searchParams);

  const { selectedGymId, gymName, selectedCompanyId, isInitialized } = useAdminFilter();
  const [activeTab, setActiveTab] = useState("members");

  const {
    ptMembers,
    staffList,
    extendedStats,
    isLoading,
    trainerFilter,
    setTrainerFilter,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    updateTrainer,
    handleBulkUpdateTrainer,
    selectedMemberIds,
    setSelectedMemberIds,
    memberCategory,
    setMemberCategory,
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
  } = usePTMembersSWR({
    selectedGymId,
    selectedCompanyId,
    filterInitialized: isInitialized
  });

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
    <div className="space-y-4 xs:space-y-6">
      <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3 xs:gap-4">
        <div>
          <h1 className="text-xl xs:text-2xl font-bold text-slate-900">통합 회원관리</h1>
          <p className="text-slate-500 text-xs xs:text-sm">{gymName} 지점의 회원 현황입니다.</p>
        </div>
        <Link href="/admin/sales">
          <Button className="bg-slate-900 text-white h-9 xs:h-10 text-xs xs:text-sm px-3 xs:px-4">신규 매출 등록</Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col gap-3 xs:gap-4 mb-4 xs:mb-6">
          {/* 탭 리스트 - 모바일에서 가로 스크롤 */}
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 xs:mx-0 xs:px-0">
            <TabsList className="bg-slate-100 p-1 rounded-lg xs:rounded-xl h-10 xs:h-12 min-w-max">
              <TabsTrigger value="members" className="rounded-md xs:rounded-lg px-3 xs:px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs xs:text-sm">회원목록</TabsTrigger>
              <TabsTrigger value="manual" className="rounded-md xs:rounded-lg px-3 xs:px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs xs:text-sm">회원관리</TabsTrigger>
              <TabsTrigger value="re-registration" className="rounded-md xs:rounded-lg px-3 xs:px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs xs:text-sm">재등록관리</TabsTrigger>
            </TabsList>
          </div>

          {/* 일괄 변경 툴바 */}
          {selectedMemberIds.length > 0 && (
            <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-right-1 shadow-sm">
              <span className="text-sm font-bold text-blue-700 whitespace-nowrap">
                {selectedMemberIds.length}명 선택됨
              </span>
              <div className="h-4 w-[1px] bg-blue-200 mx-1" />
              <Select
                onValueChange={(val) => {
                  const staff = staffList.find(s => s.id === val);
                  if (staff) {
                    if (confirm(`${selectedMemberIds.length}명의 담당자를 ${staff.name}님으로 변경하시겠습니까?`)) {
                      handleBulkUpdateTrainer(staff.id, staff.name);
                    }
                  }
                }}
              >
                <SelectTrigger className="h-9 w-40 text-xs bg-white border-blue-200 text-blue-700 font-bold hover:bg-blue-100 transition-colors shadow-none focus:ring-1 focus:ring-blue-400">
                  <SelectValue placeholder="일괄 담당자 지정" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-xl rounded-xl">
                  {staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-transparent px-2"
                onClick={() => setSelectedMemberIds([])}
              >
                취소
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="members" className="mt-0 space-y-4 xs:space-y-6">
          {/* 카테고리 버튼 - 모바일 2열, 데스크탑 4열 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
            {memberCategoryConfig.map(({ key, label, count, icon: Icon }) => (
              <Button
                key={key}
                variant={memberCategory === key ? "default" : "outline"}
                onClick={() => setMemberCategory(key)}
                className="h-16 xs:h-20 sm:h-24 flex flex-col items-center justify-center gap-1 xs:gap-2 rounded-lg xs:rounded-xl"
              >
                <Icon className="w-4 xs:w-5 h-4 xs:h-5" />
                <span className="text-[10px] xs:text-xs font-semibold">{label}</span>
                <span className="text-sm xs:text-lg font-bold">{count}명</span>
              </Button>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#E5E8EB] overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow duration-200">
            {/* 검색/필터 영역 */}
            <div className="p-3 xs:p-4 sm:p-6 border-b border-[#E5E8EB] flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="회원 검색"
                  className="pl-10 h-9 xs:h-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={trainerFilter} onValueChange={setTrainerFilter}>
                  <SelectTrigger className="flex-1 xs:w-32 sm:w-40 h-9 xs:h-10 text-xs xs:text-sm">
                    <SelectValue placeholder="트레이너" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 트레이너</SelectItem>
                    {staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="flex-1 xs:w-28 sm:w-32 h-9 xs:h-10 text-xs xs:text-sm">
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
                <thead className="bg-[var(--background-secondary)] text-[var(--foreground-secondary)]">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">
                      <Checkbox 
                        checked={ptMembers.length > 0 && selectedMemberIds.length === ptMembers.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedMemberIds(ptMembers.map(m => m.id));
                          } else {
                            setSelectedMemberIds([]);
                          }
                        }}
                      />
                    </th>
                    <th className="px-6 py-3 text-left font-semibold">회원명</th>
                    <th className="px-6 py-3 text-left font-semibold">연락처</th>
                    <th className="px-6 py-3 text-left font-semibold">회원권</th>
                    <th className="px-6 py-3 text-left font-semibold">트레이너</th>
                    <th className="px-6 py-3 text-left font-semibold">잔여 세션</th>
                    <th className="px-6 py-3 text-right font-semibold">금액</th>
                    <th className="px-6 py-3 text-center font-semibold">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E8EB]">
                  {ptMembers.map((member) => (
                    <tr
                      key={member.id}
                      className={cn(
                        "hover:bg-[var(--background-secondary)] transition-colors duration-200 cursor-pointer",
                        selectedMemberIds.includes(member.id) && "bg-[var(--primary-light-hex)]"
                      )}
                      onDoubleClick={() => openMemberDetailModal(member)}
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          checked={selectedMemberIds.includes(member.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMemberIds(prev => [...prev, member.id]);
                            } else {
                              setSelectedMemberIds(prev => prev.filter(id => id !== member.id));
                            }
                          }}
                        />
                      </td>
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
                        {member.remaining_sessions != null ? (
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-blue-600">{member.remaining_sessions}</span>
                            <span className="text-slate-400">/</span>
                            <span className="text-slate-600">{member.total_sessions}</span>
                            {member.service_sessions != null && member.service_sessions > 0 && (
                              <span className="ml-1 text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold">
                                +{(member.service_sessions || 0) - (member.used_service_sessions || 0)}서비스
                              </span>
                            )}
                          </div>
                        ) : "-"}
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
        member={selectedMember ? {
          id: selectedMember.id,
          name: selectedMember.member_name,
          phone: selectedMember.phone,
          trainer_id: selectedMember.trainer_id
        } : null}
        paymentHistory={memberPaymentHistory as { id: string; sale_type: string; amount: number; created_at: string }[]}
        allMemberships={memberAllMemberships as { id: string; name: string; total_sessions: number; used_sessions: number; start_date: string; end_date: string; status: string }[]}
        activityLogs={memberActivityLogs as { id: string; action_type: string; description: string; created_at: string }[]}
        onEditMember={() => {}}
        onEditMembership={() => {}}
        onDeleteMembership={async () => {}}
        onEditAddon={() => {}}
        onTransferMembership={() => {}}
        memberTrainers={memberTrainers}
        staffList={staffList}
        isAdmin={isAdmin}
        onAssignTrainer={openTrainerAssignModal}
        onTransferTrainer={(trainer, category, isPt) => {
          if (trainer) openTrainerTransferModal(trainer, category, isPt);
        }}
        onDeleteTrainer={handleDeleteTrainer}
      />

      {/* 트레이너 배정 모달 */}
      <TrainerAssignModal
        isOpen={isTrainerAssignOpen}
        onClose={() => setIsTrainerAssignOpen(false)}
        memberName={selectedMember?.member_name || ""}
        staffList={staffList}
        isLoading={isLoading}
        onSubmit={(data) => handleAssignTrainer(data.trainer_id, data.category, false)}
        existingCategories={memberTrainers.map((t: MemberTrainer) => t.category)}
      />

      {/* 트레이너 인계 모달 */}
      <TrainerTransferModal
        isOpen={isTrainerTransferOpen}
        onClose={() => setIsTrainerTransferOpen(false)}
        memberName={selectedMember?.member_name || ""}
        category={trainerTransferCategory}
        fromTrainer={trainerTransferTarget?.trainer || null}
        staffList={staffList}
        isLoading={isLoading}
        onSubmit={(data) => handleTransferTrainer(data.to_trainer_id)}
        memberTrainerId={trainerTransferTarget?.id}
        isPtTransfer={isPtTransfer}
      />
    </div>
  );
}
