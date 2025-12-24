"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { MembersTable } from "./components/MembersTable";
import { ProductsTab } from "./components/ProductsTab";
import { MembersHeader } from "./components/MembersHeader";
import { MembersFilters } from "./components/MembersFilters";
import { MembersStats } from "./components/MembersStats";
import { MembersLegacyTable } from "./components/MembersLegacyTable";
import { SimpleMemberCreateModal } from "./components/modals/SimpleMemberCreateModal";
import { AddonSalesModal } from "./components/modals/AddonSalesModal";
import { ExcelImportModal } from "./components/modals/ExcelImportModal";
import { ExistingSalesModal } from "./components/modals/ExistingSalesModal";
import { NewMemberCreateModal } from "./components/modals/NewMemberCreateModal";
import { MemberDetailModal } from "./components/modals/MemberDetailModal";
import { MemberEditModal } from "./components/modals/MemberEditModal";
import { MembershipEditModal } from "./components/modals/MembershipEditModal";
import { AddMembershipModal } from "./components/modals/AddMembershipModal";
import { useMembersPageData } from "./hooks/useMembersPageData";
import { useMemberOperations } from "./hooks/useMemberOperations";

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
          {data.gymId && <ProductsTab gymId={data.gymId} />}
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
        onEditMember={data.openMemberEditModal}
        onEditMembership={data.openMembershipEditModal}
        onDeleteMembership={async (membershipId) => {
          await memberOperations.handleDeleteMembership(membershipId);
          data.setIsMemberDetailOpen(false);
        }}
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
        members={data.members}
        products={data.products}
        gymId={data.gymId || ""}
        companyId={data.companyId || ""}
        myStaffId={data.myStaffId}
        onSuccess={data.refreshMembers}
      />

      <AddonSalesModal
        isOpen={data.isAddonSalesOpen}
        onClose={() => data.setIsAddonSalesOpen(false)}
        members={data.members}
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
