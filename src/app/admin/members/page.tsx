"use client";

import { Suspense, use } from "react";
import dynamicImport from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { MembersTable } from "./components/MembersTable";
import { ProductsTab } from "./components/ProductsTab";
import { MembersHeader } from "./components/MembersHeader";
import { MembersFilters } from "./components/MembersFilters";
import { MembersStats } from "./components/MembersStats";
import { MembersLegacyTable } from "./components/MembersLegacyTable";
import { useMembersPageData } from "./hooks/useMembersPageData";

// Dynamic import for member detail modal (읽기 전용)
const MemberDetailModal = dynamicImport(
  () => import("./components/modals/MemberDetailModal").then(mod => ({ default: mod.MemberDetailModal })),
  { ssr: false }
);

// 트레이너 관련 모달
const TrainerAssignModal = dynamicImport(
  () => import("./components/modals/TrainerAssignModal").then(mod => ({ default: mod.TrainerAssignModal })),
  { ssr: false }
);

const TrainerTransferModal = dynamicImport(
  () => import("./components/modals/TrainerTransferModal").then(mod => ({ default: mod.TrainerTransferModal })),
  { ssr: false }
);

export const dynamic = 'force-dynamic';

function AdminMembersPageContent() {
  const searchParams = useSearchParams();
  const registrationType = searchParams.get('type');

  const data = useMembersPageData({ registrationType });

  // Stats calculation
  const stats = data.usePagination
    ? { total: data.paginatedData.stats.total, active: data.paginatedData.stats.active, paused: data.paginatedData.stats.paused }
    : { total: data.members.length, active: data.members.filter(m => m.status === 'active').length, paused: data.members.filter(m => m.status === 'paused').length };

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-4 sm:space-y-6">
      <MembersHeader gymName={data.gymName} />

      <Tabs value={data.activeTab} onValueChange={(v) => data.setActiveTab(v as "members" | "products")}>
        <TabsList className="mb-6">
          <TabsTrigger value="members">회원 목록</TabsTrigger>
          <TabsTrigger value="products">상품 관리</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          <MembersFilters
            searchQuery={data.searchQuery}
            onSearchChange={data.setSearchQuery}
            statusFilter={data.statusFilter}
            onStatusFilterChange={data.setStatusFilter}
          />

          <MembersStats total={stats.total} active={stats.active} paused={stats.paused} />

          {data.useTanStackTable ? (
            <MembersTable
              data={data.displayMembers}
              isLoading={data.isDataLoading}
              onViewDetail={data.openMemberDetailModal}
              onStatusChange={() => {}}
              searchQuery={data.searchQuery}
              statusFilter={data.statusFilter}
            />
          ) : (
            <MembersLegacyTable
              members={data.displayMembers}
              staffList={data.staffList}
              isLoading={data.isDataLoading}
              searchQuery={data.searchQuery}
              statusFilter={data.statusFilter}
              onSort={data.handleSort}
              onViewDetail={data.openMemberDetailModal}
            />
          )}

          {data.usePagination && data.paginatedData.totalPages > 0 && (
            <Pagination
              currentPage={data.currentPage}
              totalPages={data.paginatedData.totalPages}
              totalCount={data.paginatedData.totalCount}
              pageSize={data.paginatedData.pageSize}
              onPageChange={data.setCurrentPage}
            />
          )}
        </TabsContent>

        <TabsContent value="products">
          {data.gymId && <ProductsTab gymId={data.gymId} onProductsChange={data.refreshProducts} />}
        </TabsContent>
      </Tabs>

      {/* 회원 상세 모달 */}
      <MemberDetailModal
        isOpen={data.isMemberDetailOpen}
        onClose={() => data.setIsMemberDetailOpen(false)}
        member={data.selectedMember}
        paymentHistory={data.memberPaymentHistory}
        allMemberships={data.memberAllMemberships}
        activityLogs={data.memberActivityLogs}
        onEditMember={() => {}}
        onEditMembership={() => {}}
        onDeleteMembership={async () => {}}
        onEditAddon={() => {}}
        onTransferMembership={() => {}}
        // 트레이너 관련 props
        memberTrainers={data.memberTrainers}
        staffList={data.staffList}
        isAdmin={data.isAdmin}
        onAssignTrainer={data.openTrainerAssignModal}
        onTransferTrainer={data.openTrainerTransferModal}
        onDeleteTrainer={data.handleDeleteTrainer}
      />

      {/* 트레이너 배정 모달 */}
      <TrainerAssignModal
        isOpen={data.isTrainerAssignOpen}
        onClose={() => data.setIsTrainerAssignOpen(false)}
        memberName={data.selectedMember?.name || ""}
        staffList={data.staffList}
        isLoading={data.isDataLoading}
        onSubmit={data.handleAssignTrainer}
        existingCategories={data.memberTrainers.map((t: any) => t.category)}
      />

      {/* 트레이너 인계 모달 */}
      <TrainerTransferModal
        isOpen={data.isTrainerTransferOpen}
        onClose={() => data.setIsTrainerTransferOpen(false)}
        memberName={data.selectedMember?.name || ""}
        category={data.trainerTransferCategory}
        fromTrainer={
          data.isPtTransfer
            ? (data.selectedMember?.trainer || null)
            : (data.trainerTransferTarget?.trainer || null)
        }
        staffList={data.staffList}
        isLoading={data.isDataLoading}
        onSubmit={data.handleTransferTrainer}
        memberTrainerId={data.trainerTransferTarget?.id}
        isPtTransfer={data.isPtTransfer}
      />
    </div>
  );
}

export default function AdminMembersPage(props: {
  params: Promise<any>;
  searchParams: Promise<any>;
}) {
  // Next.js 15+에서 params와 searchParams는 Promise이므로 unwrap해야 합니다.
  use(props.params);
  use(props.searchParams);

  return (
    <Suspense fallback={
      <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto">
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    }>
      <AdminMembersPageContent />
    </Suspense>
  );
}
