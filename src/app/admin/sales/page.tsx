"use client";

import { useState, use } from "react";
import dynamic from "next/dynamic";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { useSalesPageData } from "./hooks/useSalesPageData";
import { SalesHeader } from "./components/SalesHeader";
import { SalesFilters } from "./components/SalesFilters";
import { SalesStats } from "./components/SalesStats";
import { PaymentsTable } from "./components/PaymentsTable";
import { exportSalesToExcel } from "./utils/excelExport";

const SalesSettingsModal = dynamic(
  () => import("./components/modals/SalesSettingsModal").then(mod => ({ default: mod.SalesSettingsModal })),
  { ssr: false }
);

export default function SalesPage(props: {
  params: Promise<any>;
  searchParams: Promise<any>;
}) {
  // Next.js 15+에서 params와 searchParams는 Promise이므로 unwrap해야 합니다.
  use(props.params);
  use(props.searchParams);

  const { selectedGymId, gymName, selectedCompanyId, isInitialized } = useAdminFilter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const {
    filteredPayments,
    stats,
    staffList,
    allSaleTypes,
    allMembershipCategories,
    allMembershipNames,
    allPaymentMethods,
    defaultInstallments,
    customSaleTypes,
    customMembershipCategories,
    customMembershipNames,
    customPaymentMethods,
    isSettingsOpen,
    setIsSettingsOpen,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    membershipTypeFilter,
    setMembershipTypeFilter,
    registrationTypeFilter,
    setRegistrationTypeFilter,
    methodFilter,
    setMethodFilter,
    quickSelect,
    handleQuickSelect,
    newRows,
    addNewRow,
    updateNewRow,
    saveNewRow,
    removeNewRow,
    deletePayment,
    updatePayment,
    addCustomOption,
    deleteCustomOption
  } = useSalesPageData({
    selectedGymId,
    selectedCompanyId,
    filterInitialized: isInitialized
  });

  // 새 행 추가 시 처리
  const handleAddNewRow = () => {
    addNewRow();
    setEditForm({
      payment_date: new Date().toISOString().split("T")[0],
      sale_type: "신규",
      method: "card",
      installment: 1
    });
  };

  // 새 행 저장
  const handleSaveNewRow = () => {
    const newRow = newRows[0];
    if (newRow) {
      saveNewRow(newRow.id);
      setEditForm({});
    }
  };

  // 새 행 취소
  const handleCancelNewRow = () => {
    const newRow = newRows[0];
    if (newRow) {
      removeNewRow(newRow.id);
      setEditForm({});
    }
  };

  // 새 행 수정
  const handleNewRowChange = (field: string, value: string | number) => {
    const newRow = newRows[0];
    if (newRow) {
      updateNewRow(newRow.id, field, value);
      setEditForm((prev: any) => ({ ...prev, [field]: value }));
    }
  };

  // 편집 시작
  const handleStartEdit = (payment: any) => {
    setEditingId(payment.id);
    setEditForm({
      payment_date: payment.payment_date || payment.created_at?.split("T")[0] || "",
      member_name: payment.member_name,
      phone: payment.phone || "",
      sale_type: payment.sale_type,
      membership_category: payment.membership_category,
      membership_name: payment.membership_name,
      amount: payment.amount,
      method: payment.method,
      installment: payment.installment || 1,
      trainer_id: payment.trainer_id || "",
      memo: payment.memo || ""
    });
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // 편집 저장
  const handleSaveEdit = async () => {
    if (!editingId) return;

    const trainer = staffList.find(s => s.id === editForm.trainer_id);

    await updatePayment(editingId, {
      member_name: editForm.member_name,
      phone: editForm.phone,
      sale_type: editForm.sale_type,
      membership_category: editForm.membership_category,
      membership_name: editForm.membership_name,
      amount: editForm.amount,
      method: editForm.method,
      installment: editForm.installment,
      trainer_id: editForm.trainer_id || undefined,
      trainer_name: trainer?.name || undefined,
      memo: editForm.memo
    });

    setEditingId(null);
    setEditForm({});
  };

  // 편집 폼 변경
  const handleEditFormChange = (field: string, value: string | number) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
  };

  // 삭제
  const handleDelete = async (id: string) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      await deletePayment(id);
    }
  };

  // 엑셀 내보내기
  const handleExportExcel = () => {
    const exportData = filteredPayments.map(p => ({
      ...p,
      payment_date: p.created_at?.split("T")[0] || ""
    }));
    exportSalesToExcel(exportData, gymName || "매출");
  };

  // 페이먼트 데이터를 테이블 형식으로 변환
  const tablePayments = [
    ...newRows.map(row => ({
      ...row,
      payment_date: new Date().toISOString().split("T")[0],
      isNew: true
    })),
    ...filteredPayments.map(p => ({
      ...p,
      payment_date: p.created_at?.split("T")[0] || ""
    }))
  ];

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
      <SalesHeader
        gymName={gymName || ""}
        onAddNewRow={handleAddNewRow}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportExcel={handleExportExcel}
      />

      <SalesFilters
        startDate={startDate}
        endDate={endDate}
        membershipTypeFilter={membershipTypeFilter}
        registrationTypeFilter={registrationTypeFilter}
        methodFilter={methodFilter}
        quickSelect={quickSelect}
        allMembershipTypes={allMembershipCategories}
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
        payments={tablePayments}
        staffList={staffList}
        allSaleTypes={allSaleTypes}
        allMembershipCategories={allMembershipCategories}
        allMembershipNames={allMembershipNames}
        allPaymentMethods={allPaymentMethods}
        defaultInstallments={defaultInstallments}
        editingId={editingId}
        editForm={editForm}
        onStartEdit={handleStartEdit}
        onCancelEdit={handleCancelEdit}
        onSaveEdit={handleSaveEdit}
        onDelete={handleDelete}
        onEditFormChange={handleEditFormChange}
        onSaveNewRow={handleSaveNewRow}
        onCancelNewRow={handleCancelNewRow}
        onNewRowChange={handleNewRowChange}
        onAddOption={addCustomOption}
        onAddNewRow={handleAddNewRow}
      />

      <SalesSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        allSaleTypes={allSaleTypes}
        allMembershipCategories={allMembershipCategories}
        allMembershipNames={allMembershipNames}
        allPaymentMethods={allPaymentMethods}
        customSaleTypes={customSaleTypes}
        customMembershipCategories={customMembershipCategories}
        customMembershipNames={customMembershipNames}
        customPaymentMethods={customPaymentMethods}
        onAddOption={addCustomOption}
        onDeleteOption={deleteCustomOption}
      />
    </div>
  );
}
