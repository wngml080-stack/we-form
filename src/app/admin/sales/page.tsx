"use client";

import { useEffect, Suspense } from "react";
import dynamicImport from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { useSalesPageData } from "./hooks/useSalesPageData";
import { SalesHeader } from "./components/SalesHeader";
import { SalesFilters } from "./components/SalesFilters";
import { SalesStats } from "./components/SalesStats";
import { PaymentsTable } from "./components/PaymentsTable";

// Dynamic imports for modals
const SalesSettingsModal = dynamicImport(
  () => import("./components/modals/SalesSettingsModal").then(mod => ({ default: mod.SalesSettingsModal })),
  { ssr: false }
);

function SalesPageContent() {
  const { isLoading: authLoading } = useAuth();
  const { branchFilter, isInitialized: filterInitialized } = useAdminFilter();
  const searchParams = useSearchParams();

  const selectedGymId = branchFilter.selectedGymId;
  const selectedCompanyId = branchFilter.selectedCompanyId;
  const gymName = branchFilter.gyms.find(g => g.id === selectedGymId)?.name || "We:form";
  const isLoading = !filterInitialized || authLoading;

  const {
    filteredPayments,
    stats,
    allMembershipTypes,
    allPaymentMethods,
    customMembershipTypes,
    customPaymentMethods,
    isSettingsOpen, setIsSettingsOpen,
    newMembershipType, setNewMembershipType,
    newPaymentMethod, setNewPaymentMethod,
    handleAddMembershipType,
    handleAddPaymentMethod,
    handleDeleteMembershipType,
    handleDeletePaymentMethod,
    startDate, setStartDate,
    endDate, setEndDate,
    methodFilter, setMethodFilter,
    membershipTypeFilter, setMembershipTypeFilter,
    registrationTypeFilter, setRegistrationTypeFilter,
    quickSelect, handleQuickSelect,
    newRows,
    addNewRow,
    updateNewRow,
    saveNewRow,
    removeNewRow,
    editingCell,
    editValue, setEditValue,
    startEditing,
    saveEdit,
    cancelEdit,
  } = useSalesPageData({
    selectedGymId,
    selectedCompanyId,
    filterInitialized
  });

  // URL 파라미터로 새 행 자동 추가
  useEffect(() => {
    if (searchParams.get("addon") === "true" && filterInitialized) {
      addNewRow();
      window.history.replaceState({}, "", "/admin/sales");
    }
  }, [searchParams, filterInitialized]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-4 sm:space-y-6">
      <SalesHeader
        gymName={gymName}
        onAddNewRow={addNewRow}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <SalesFilters
        startDate={startDate}
        endDate={endDate}
        membershipTypeFilter={membershipTypeFilter}
        registrationTypeFilter={registrationTypeFilter}
        methodFilter={methodFilter}
        quickSelect={quickSelect}
        allMembershipTypes={allMembershipTypes}
        allPaymentMethods={allPaymentMethods}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onMembershipTypeChange={setMembershipTypeFilter}
        onRegistrationTypeChange={setRegistrationTypeFilter}
        onMethodChange={setMethodFilter}
        onQuickSelect={handleQuickSelect}
      />

      <SalesStats stats={stats} />

      <PaymentsTable
        isLoading={isLoading}
        filteredPayments={filteredPayments}
        newRows={newRows}
        editingCell={editingCell}
        editValue={editValue}
        allMembershipTypes={allMembershipTypes}
        allPaymentMethods={allPaymentMethods}
        onStartEditing={startEditing}
        onSaveEdit={saveEdit}
        onCancelEdit={cancelEdit}
        onEditValueChange={setEditValue}
        onUpdateNewRow={updateNewRow}
        onSaveNewRow={saveNewRow}
        onRemoveNewRow={removeNewRow}
        onAddNewRow={addNewRow}
      />

      <SalesSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        customMembershipTypes={customMembershipTypes}
        customPaymentMethods={customPaymentMethods}
        newMembershipType={newMembershipType}
        newPaymentMethod={newPaymentMethod}
        onNewMembershipTypeChange={setNewMembershipType}
        onNewPaymentMethodChange={setNewPaymentMethod}
        onAddMembershipType={handleAddMembershipType}
        onAddPaymentMethod={handleAddPaymentMethod}
        onDeleteMembershipType={handleDeleteMembershipType}
        onDeletePaymentMethod={handleDeletePaymentMethod}
      />
    </div>
  );
}

export default function SalesPage() {
  return (
    <Suspense fallback={<div className="p-6">로딩 중...</div>}>
      <SalesPageContent />
    </Suspense>
  );
}
