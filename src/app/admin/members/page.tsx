"use client";

import { Suspense } from "react";
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
import { useMemberOperations } from "./hooks/useMemberOperations";

// Dynamic imports for modals (코드 스플리팅으로 초기 로드 성능 개선)
const SimpleMemberCreateModal = dynamicImport(
  () => import("./components/modals/SimpleMemberCreateModal").then(mod => ({ default: mod.SimpleMemberCreateModal })),
  { ssr: false }
);
const AddonSalesModal = dynamicImport(
  () => import("./components/modals/AddonSalesModal").then(mod => ({ default: mod.AddonSalesModal })),
  { ssr: false }
);
const ExcelImportModal = dynamicImport(
  () => import("./components/modals/ExcelImportModal").then(mod => ({ default: mod.ExcelImportModal })),
  { ssr: false }
);
const ExistingSalesModal = dynamicImport(
  () => import("./components/modals/ExistingSalesModal").then(mod => ({ default: mod.ExistingSalesModal })),
  { ssr: false }
);
const NewMemberCreateModal = dynamicImport(
  () => import("./components/modals/NewMemberCreateModal").then(mod => ({ default: mod.NewMemberCreateModal })),
  { ssr: false }
);
const MemberDetailModal = dynamicImport(
  () => import("./components/modals/MemberDetailModal").then(mod => ({ default: mod.MemberDetailModal })),
  { ssr: false }
);
const MemberEditModal = dynamicImport(
  () => import("./components/modals/MemberEditModal").then(mod => ({ default: mod.MemberEditModal })),
  { ssr: false }
);
const MembershipEditModal = dynamicImport(
  () => import("./components/modals/MembershipEditModal").then(mod => ({ default: mod.MembershipEditModal })),
  { ssr: false }
);
const AddMembershipModal = dynamicImport(
  () => import("./components/modals/AddMembershipModal").then(mod => ({ default: mod.AddMembershipModal })),
  { ssr: false }
);
const AddonEditModal = dynamicImport(
  () => import("./components/modals/AddonEditModal").then(mod => ({ default: mod.AddonEditModal })),
  { ssr: false }
);
const TransferMembershipModal = dynamicImport(
  () => import("./components/modals/TransferMembershipModal").then(mod => ({ default: mod.TransferMembershipModal })),
  { ssr: false }
);

export const dynamic = 'force-dynamic';

function AdminMembersPageContent() {
  const searchParams = useSearchParams();
  const registrationType = searchParams.get('type');

  const data = useMembersPageData({ registrationType });

  const memberOperations = useMemberOperations({
    supabase: data.supabase,
    gymId: data.gymId,
    companyId: data.companyId,
    myStaffId: data.myStaffId,
    myRole: data.myRole,
    usePagination: data.usePagination,
    paginatedData: data.paginatedData,
    fetchMembers: data.fetchMembers,
    products: data.products,
    selectedProductId: data.selectedProductId,
    setIsLoading: data.setIsLoading
  });

  // Stats calculation
  const stats = data.usePagination
    ? { total: data.paginatedData.stats.total, active: data.paginatedData.stats.active, paused: data.paginatedData.stats.paused }
    : { total: data.members.length, active: data.members.filter(m => m.status === 'active').length, paused: data.members.filter(m => m.status === 'paused').length };

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-4 sm:space-y-6">
      <MembersHeader
        gymName={data.gymName}
        onSimpleMemberCreate={() => data.setIsSimpleMemberCreateOpen(true)}
        onExcelImport={() => data.setIsExcelImportOpen(true)}
        onNewMemberCreate={() => data.setIsCreateOpen(true)}
        onExistingSales={() => data.setIsExistingSalesOpen(true)}
        onAddonSales={() => data.setIsAddonSalesOpen(true)}
      />

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
              onStatusChange={memberOperations.handleStatusChange}
              searchQuery={data.searchQuery}
              statusFilter={data.statusFilter}
              onBulkStatusChange={memberOperations.handleBulkStatusChange}
              onBulkTrainerAssign={memberOperations.handleBulkTrainerAssign}
              onBulkDelete={memberOperations.handleBulkDelete}
              trainers={data.staffList.map(staff => ({ id: staff.id, name: staff.name }))}
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

      {/* Modals */}
      <NewMemberCreateModal
        isOpen={data.isCreateOpen}
        onClose={() => data.setIsCreateOpen(false)}
        products={data.products}
        staffList={data.staffList}
        gymId={data.gymId || ""}
        companyId={data.companyId || ""}
        myStaffId={data.myStaffId}
        onSuccess={data.refreshMembers}
      />

      <MemberDetailModal
        isOpen={data.isMemberDetailOpen}
        onClose={() => data.setIsMemberDetailOpen(false)}
        member={data.selectedMember}
        paymentHistory={data.memberPaymentHistory}
        allMemberships={data.memberAllMemberships}
        activityLogs={data.memberActivityLogs}
        onEditMember={data.openMemberEditModal}
        onEditMembership={data.openMembershipEditModal}
        onDeleteMembership={async (membershipId) => {
          await memberOperations.handleDeleteMembership(membershipId, data.selectedMember?.id);
          data.setIsMemberDetailOpen(false);
        }}
        onEditAddon={data.openAddonEditModal}
        onTransferMembership={data.openTransferModal}
      />

      <MemberEditModal
        isOpen={data.isMemberEditOpen}
        onClose={() => data.setIsMemberEditOpen(false)}
        memberName={data.selectedMember?.name || ""}
        formData={data.memberEditForm}
        setFormData={data.setMemberEditForm}
        staffList={data.staffList}
        isLoading={data.isDataLoading}
        onSubmit={() => memberOperations.handleUpdateMemberInfo(
          data.selectedMember,
          data.memberEditForm,
          () => data.setIsMemberEditOpen(false)
        )}
      />

      <MembershipEditModal
        isOpen={data.isMembershipEditOpen}
        onClose={() => data.setIsMembershipEditOpen(false)}
        memberName={data.selectedMember?.name || ""}
        formData={data.membershipEditForm}
        setFormData={data.setMembershipEditForm}
        isLoading={data.isDataLoading}
        onSubmit={() => memberOperations.handleEditMembership(
          data.membershipEditForm,
          () => data.setIsMembershipEditOpen(false)
        )}
      />

      <AddMembershipModal
        isOpen={data.isMembershipOpen}
        onClose={() => data.setIsMembershipOpen(false)}
        memberName={data.selectedMember?.name || ""}
        products={data.products}
        selectedProductId={data.selectedProductId}
        setSelectedProductId={data.setSelectedProductId}
        membershipForm={data.membershipForm}
        setMembershipForm={data.setMembershipForm}
        addons={data.membershipModalAddons}
        onAddAddon={data.addMembershipModalAddon}
        onRemoveAddon={data.removeMembershipModalAddon}
        onUpdateAddon={data.updateMembershipModalAddon}
        isLoading={data.isDataLoading}
        onSubmit={() => memberOperations.handleUpdateMembership(
          data.selectedMember,
          data.membershipForm,
          data.membershipModalAddons,
          () => data.setIsMembershipOpen(false)
        )}
      />

      <ExistingSalesModal
        isOpen={data.isExistingSalesOpen}
        onClose={() => data.setIsExistingSalesOpen(false)}
        members={data.displayMembers}
        products={data.products}
        gymId={data.gymId || ""}
        companyId={data.companyId || ""}
        myStaffId={data.myStaffId}
        onSuccess={data.refreshMembers}
      />

      <AddonSalesModal
        isOpen={data.isAddonSalesOpen}
        onClose={() => data.setIsAddonSalesOpen(false)}
        members={data.displayMembers}
        gymId={data.gymId || ""}
        companyId={data.companyId || ""}
        onSuccess={data.refreshMembers}
      />

      <SimpleMemberCreateModal
        isOpen={data.isSimpleMemberCreateOpen}
        onClose={() => data.setIsSimpleMemberCreateOpen(false)}
        products={data.products}
        staffList={data.staffList}
        gymId={data.gymId || ""}
        companyId={data.companyId || ""}
        onSuccess={data.refreshMembers}
      />

      <ExcelImportModal
        isOpen={data.isExcelImportOpen}
        onClose={() => data.setIsExcelImportOpen(false)}
        gymId={data.gymId || ""}
        companyId={data.companyId || ""}
        onSuccess={data.refreshMembers}
      />

      <AddonEditModal
        isOpen={data.isAddonEditOpen}
        onClose={() => data.setIsAddonEditOpen(false)}
        memberName={data.selectedMember?.name || ""}
        memberId={data.selectedMember?.id}
        addon={data.selectedAddon}
        onSuccess={() => {
          data.refreshMembers();
          // Refresh member detail if it was open
          if (data.selectedMember) {
            data.openMemberDetailModal(data.selectedMember);
          }
        }}
      />

      <TransferMembershipModal
        isOpen={data.isTransferModalOpen}
        onClose={() => data.setIsTransferModalOpen(false)}
        members={data.displayMembers}
        gymId={data.gymId || ""}
        companyId={data.companyId || ""}
        preselectedMember={data.transferMember}
        preselectedMembership={data.transferMembership}
        onSuccess={data.refreshMembers}
      />
    </div>
  );
}

export default function AdminMembersPage() {
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
