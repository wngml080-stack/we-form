"use client";

import { useState, use, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { useSalesPageData } from "./hooks/useSalesPageData";
import { useExpensesData } from "./hooks/useExpensesData";
import { SalesHeader } from "./components/SalesHeader";
import { SalesFilters } from "./components/SalesFilters";
import { SalesStats } from "./components/SalesStats";
import { ExpenseStats } from "./components/ExpenseStats";
import { PaymentsTable } from "./components/PaymentsTable";
import { ExpensesTable } from "./components/ExpensesTable";
import { SalesAnalysis } from "./components/SalesAnalysis";
import { DetailedAnalysis } from "./components/DetailedAnalysis";
import { InquirySection } from "./components/InquirySection";
import { RenewalSection } from "./components/RenewalSection";
import { BEPCard } from "./components/BEPCard";
import { exportSalesToExcel } from "./utils/excelExport";
import { TrendingUp, TrendingDown, MessageSquare, Settings, Plus, Download, Target, Award, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SalesSettingsModal = dynamic(
  () => import("./components/modals/SalesSettingsModal").then(mod => ({ default: mod.SalesSettingsModal })),
  { ssr: false }
);

const ExpenseSettingsModal = dynamic(
  () => import("./components/modals/ExpenseSettingsModal").then(mod => ({ default: mod.ExpenseSettingsModal })),
  { ssr: false }
);

const TotalSalesModal = dynamic(
  () => import("./components/modals/TotalSalesModal").then(mod => ({ default: mod.TotalSalesModal })),
  { ssr: false }
);

const FcSalesModal = dynamic(
  () => import("./components/modals/FcSalesModal").then(mod => ({ default: mod.FcSalesModal })),
  { ssr: false }
);

const PtSalesModal = dynamic(
  () => import("./components/modals/PtSalesModal").then(mod => ({ default: mod.PtSalesModal })),
  { ssr: false }
);

const MemberDetailModal = dynamic(
  () => import("../pt-members/components/modals/MemberDetailModal").then(mod => ({ default: mod.MemberDetailModal })),
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get("tab") as "sales" | "expenses" | "new_inquiries" | "renewals" | "analysis") || "sales";
  
  const [activeTab, setActiveTab] = useState<"sales" | "expenses" | "new_inquiries" | "renewals" | "analysis">(initialTab);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [continuousMode, setContinuousMode] = useState(false); // 연속 입력 모드 (기본 OFF)

  // URL 파라미터와 탭 상태 동기화
  useEffect(() => {
    const tab = searchParams.get("tab") as "sales" | "expenses" | "new_inquiries" | "renewals" | "analysis";
    if (tab && ["sales", "expenses", "new_inquiries", "renewals", "analysis"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // 탭 변경 시 URL 업데이트
  const handleTabChange = (tab: "sales" | "expenses" | "new_inquiries" | "renewals" | "analysis") => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${window.location.pathname}?${params.toString()}`);
  };
  const [editForm, setEditForm] = useState<any>({});

  // 회원 상세 모달 관련 상태
  const [isMemberDetailOpen, setIsMemberDetailOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberPaymentHistory, setMemberPaymentHistory] = useState<any[]>([]);
  const [memberAllMemberships, setMemberAllMemberships] = useState<any[]>([]);
  const [memberActivityLogs, setMemberActivityLogs] = useState<any[]>([]);

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
    removeNewRow,
    deletePayment,
    updatePayment,
    addCustomOption,
    deleteCustomOption,
    fetchPayments,
    // BEP 관련 데이터
    gymData,
    fcStats,
    ptStats,
    fcProgress,
    ptProgress,
    salesSummary,
    comparisonData,
    salesLoading,
    // 매출 통계 모달
    isFcModalOpen,
    setIsFcModalOpen,
    isPtModalOpen,
    setIsPtModalOpen,
    isSalesModalOpen,
    setIsSalesModalOpen,
    salesPeriod,
    modalCustomDateRange,
    setModalCustomDateRange,
    openFcModal,
    openPtModal,
    openSalesModal,
    handlePeriodChange,
    fetchDetailedSales,
    previousMonthPayments,
    lastYearPayments
  } = useSalesPageData({
    selectedGymId,
    selectedCompanyId,
    filterInitialized: isInitialized
  });

  // 지출 데이터 훅
  const expensesData = useExpensesData({
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
      installment: 1,
      service_sessions: 0,
      bonus_sessions: 0,
      validity_per_session: 0,
      membership_start_date: new Date().toISOString().split("T")[0],
      visit_route: "워크인",
      expiry_type: "60일 이내"
    });
  };

  // 새 행 저장
  const handleSaveNewRow = async () => {
    const newRow = newRows[0];
    if (!newRow || !selectedGymId || !selectedCompanyId) {
      console.error("저장 실패: 필수 정보가 없습니다", { newRow, selectedGymId, selectedCompanyId });
      return;
    }

    // editForm의 최신 값과 newRow를 병합
    const dataToSave = {
      ...newRow,
      ...editForm,
      payment_date: editForm.payment_date || newRow.payment_date || new Date().toISOString().split("T")[0],
    };

    try {
      const response = await fetch("/api/admin/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: selectedCompanyId,
          gym_id: selectedGymId,
          member_name: dataToSave.member_name || "",
          phone: dataToSave.phone || "",
          sale_type: dataToSave.sale_type || "신규",
          membership_category: dataToSave.membership_category || "",
          membership_name: dataToSave.membership_name || "",
          amount: dataToSave.amount || 0,
          method: dataToSave.method || "card",
          installment: dataToSave.installment || 1,
          trainer_id: dataToSave.trainer_id || "",
          registrar: dataToSave.registrar || "",
          memo: dataToSave.memo || "",
          service_sessions: dataToSave.service_sessions || 0,
          bonus_sessions: dataToSave.bonus_sessions || 0,
          validity_per_session: dataToSave.validity_per_session || 0,
          membership_start_date: dataToSave.membership_start_date || null,
          visit_route: dataToSave.visit_route || null,
          expiry_type: dataToSave.expiry_type || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 새 행 제거
        removeNewRow(newRow.id);

        // 회원 정보 임시 저장 (모달 표시용)
        const savedMemberName = editForm.member_name || dataToSave.member_name;
        const savedPhone = editForm.phone || dataToSave.phone;

        // 데이터 새로고침
        if (selectedGymId && selectedCompanyId) {
          fetchPayments(selectedGymId, selectedCompanyId);
        }

        // 연속 모드일 때: 새 행 자동 추가 및 첫 번째 필드로 포커스 이동
        if (continuousMode) {
          // 새 행 추가
          addNewRow();
          setEditForm({
            payment_date: new Date().toISOString().split("T")[0],
            sale_type: "신규",
            method: "card",
            installment: 1,
            service_sessions: 0,
            bonus_sessions: 0,
            validity_per_session: 0,
            membership_start_date: new Date().toISOString().split("T")[0],
            visit_route: "워크인",
            expiry_type: "60일 이내"
          });

          // 첫 번째 입력 필드로 포커스 이동
          setTimeout(() => {
            const firstInput = document.querySelector('tr[data-payment-id^="new-"] input:first-of-type') as HTMLInputElement;
            if (firstInput) {
              firstInput.focus();
              firstInput.select();
            }
          }, 100);
        } else {
          setEditForm({});

          // 연속 모드가 아닐 때만 회원 상세 모달 표시
          if (result.member_id && selectedGymId) {
            try {
              const detailResponse = await fetch(
                `/api/admin/members/${result.member_id}/detail?gym_id=${selectedGymId}`
              );
              const detailResult = await detailResponse.json();

              if (detailResponse.ok) {
                setSelectedMember({
                  id: result.member_id,
                  name: savedMemberName || "",
                  phone: savedPhone || "",
                });
                setMemberAllMemberships(detailResult.memberships || []);
                setMemberPaymentHistory(detailResult.payments || []);
                setMemberActivityLogs(detailResult.activityLogs || []);
                setIsMemberDetailOpen(true);
              }
            } catch (error) {
              console.error("회원 상세 조회 오류:", error);
            }
          }
        }
      } else {
        console.error("매출 저장 실패:", result.error);
        alert(`저장 실패: ${result.error || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("매출 저장 중 오류:", error);
      alert(`매출 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
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
      // newRows 상태 업데이트
      updateNewRow(newRow.id, field, value);
      // editForm 상태도 동시에 업데이트
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
      registrar: payment.registrar || "",
      memo: payment.memo || "",
      service_sessions: payment.service_sessions || 0,
      bonus_sessions: payment.bonus_sessions || 0,
      validity_per_session: payment.validity_per_session || 0,
      membership_start_date: payment.membership_start_date || payment.created_at?.split("T")[0] || "",
      visit_route: payment.visit_route || "워크인",
      expiry_type: payment.expiry_type || "60일 이내"
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
      registrar: editForm.registrar || "",
      memo: editForm.memo,
      service_sessions: editForm.service_sessions,
      bonus_sessions: editForm.bonus_sessions,
      validity_per_session: editForm.validity_per_session,
      membership_start_date: editForm.membership_start_date,
      visit_route: editForm.visit_route,
      expiry_type: editForm.expiry_type,
      gender: editForm.gender,
      birth_date: editForm.birth_date
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

  // 회원 상세 보기 (테이블에서 회원명 클릭 시)
  const handleViewMemberDetail = async (payment: any) => {
    if (!payment.phone || !selectedGymId) return;

    try {
      // 전화번호로 회원 조회
      const normalizedPhone = payment.phone.replace(/-/g, "");
      const response = await fetch(
        `/api/admin/members/by-phone?phone=${encodeURIComponent(normalizedPhone)}&gym_id=${selectedGymId}`
      );

      if (!response.ok) {
        console.error("회원 조회 실패");
        return;
      }

      const result = await response.json();

      if (result.member) {
        // 회원 상세 정보 조회
        const detailResponse = await fetch(
          `/api/admin/members/${result.member.id}/detail?gym_id=${selectedGymId}`
        );
        const detailResult = await detailResponse.json();

        if (detailResponse.ok) {
          setSelectedMember({
            id: result.member.id,
            name: result.member.name || payment.member_name,
            phone: result.member.phone || payment.phone,
          });
          setMemberAllMemberships(detailResult.memberships || []);
          setMemberPaymentHistory(detailResult.payments || []);
          setMemberActivityLogs(detailResult.activityLogs || []);
          setIsMemberDetailOpen(true);
        }
      }
    } catch (error) {
      console.error("회원 상세 조회 오류:", error);
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

  // 페이먼트 데이터를 테이블 형식으로 변환 (기존 데이터 먼저, 새 행은 아래에)
  const tablePayments = [
    ...filteredPayments.map(p => ({
      ...p,
      payment_date: p.created_at?.split("T")[0] || ""
    })),
    ...newRows.map(row => ({
      ...row,
      payment_date: new Date().toISOString().split("T")[0],
      isNew: true
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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 상단 통합 헤더 및 탭 */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl shadow-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">지점</span>
              <span className="text-lg font-black">{gymName || "선택 필요"}</span>
            </div>
            
            <div className="h-12 w-px bg-slate-100 hidden lg:block" />

            <div className="bg-slate-50 p-1 rounded-2xl flex gap-1">
              {[
                { id: "sales", label: "매출 관리", icon: TrendingUp, color: "text-blue-600" },
                { id: "expenses", label: "지출 관리", icon: TrendingDown, color: "text-rose-600" },
                { id: "new_inquiries", label: "신규 관리", icon: MessageSquare, color: "text-indigo-600" },
                { id: "renewals", label: "리뉴 관리", icon: Plus, color: "text-emerald-600" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all",
                    activeTab === tab.id
                      ? "bg-white shadow-md " + tab.color
                      : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 실적성과표 버튼 - 개별 배치 */}
            <button
              onClick={() => handleTabChange("analysis")}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-black transition-all h-12",
                activeTab === "analysis"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-100"
                  : "bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-100"
              )}
            >
              <BarChart3 className="w-4 h-4" />
              실적성과표
            </button>

            <div className="h-8 w-px bg-slate-100 mx-2" />

            <div className="flex items-center gap-2">
              {activeTab === "sales" && (
              <>
                <Button onClick={handleAddNewRow} className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-100 gap-2 transition-all hover:-translate-y-0.5">
                  <Plus className="w-4 h-4" />
                  매출 등록
                </Button>
                <div className="flex items-center gap-1.5 ml-2">
                  <Button variant="outline" onClick={() => setIsSettingsOpen(true)} className="h-11 w-11 p-0 rounded-xl border-slate-200 hover:bg-slate-50">
                    <Settings className="w-4 h-4 text-slate-500" />
                  </Button>
                  <Button variant="outline" onClick={handleExportExcel} className="h-11 w-11 p-0 rounded-xl border-slate-200 hover:bg-slate-50">
                    <Download className="w-4 h-4 text-slate-500" />
                  </Button>
                </div>
              </>
            )}
            {activeTab === "expenses" && (
              <>
                <Button onClick={expensesData.addNewRow} className="h-11 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black shadow-lg shadow-rose-100 gap-2 transition-all hover:-translate-y-0.5">
                  <Plus className="w-4 h-4" />
                  지출 등록
                </Button>
                <Button variant="outline" onClick={() => expensesData.setIsSettingsOpen(true)} className="h-11 w-11 p-0 rounded-xl border-slate-200 ml-2">
                  <Settings className="w-4 h-4 text-slate-500" />
                </Button>
              </>
            )}
          </div>
        </div>
        </div>
      </div>

      {activeTab === "sales" ? (
        <>
          <div className="space-y-8">
            {/* 상단 요약 영역 */}
            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-6 bg-blue-600 rounded-full" />
                <h3 className="text-lg font-black text-slate-900">매출 요약</h3>
              </div>
              <SalesStats stats={stats} onTotalClick={openSalesModal} layout="horizontal" />
            </div>

            {/* 통계 분석 영역 */}
            <SalesAnalysis payments={filteredPayments} />

            {/* 하단 상세 내역 영역 */}
            <div className="space-y-6">
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
                onViewMemberDetail={handleViewMemberDetail}
                continuousMode={continuousMode}
                onContinuousModeChange={setContinuousMode}
              />
            </div>
          </div>

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

          {/* FC 매출 통계 모달 */}
          <FcSalesModal
            isOpen={isFcModalOpen}
            onOpenChange={setIsFcModalOpen}
            salesPeriod={salesPeriod}
            onPeriodChange={handlePeriodChange}
            customDateRange={modalCustomDateRange}
            setCustomDateRange={setModalCustomDateRange}
            onCustomSearch={() => fetchDetailedSales("fc", "custom")}
            fcStats={fcStats}
            isLoading={salesLoading}
          />

          {/* PT 매출 통계 모달 */}
          <PtSalesModal
            isOpen={isPtModalOpen}
            onOpenChange={setIsPtModalOpen}
            salesPeriod={salesPeriod}
            onPeriodChange={handlePeriodChange}
            customDateRange={modalCustomDateRange}
            setCustomDateRange={setModalCustomDateRange}
            onCustomSearch={() => fetchDetailedSales("pt", "custom")}
            ptStats={ptStats}
            isLoading={salesLoading}
          />

          {/* 총 매출 통계 모달 */}
          <TotalSalesModal
            isOpen={isSalesModalOpen}
            onOpenChange={setIsSalesModalOpen}
            salesPeriod={salesPeriod}
            onPeriodChange={handlePeriodChange}
            customDateRange={modalCustomDateRange}
            setCustomDateRange={setModalCustomDateRange}
            onCustomSearch={() => fetchDetailedSales("all", "custom")}
            fcStats={fcStats}
            ptStats={ptStats}
            salesSummary={salesSummary}
            comparisonData={comparisonData}
            isLoading={salesLoading}
          />
        </>
      ) : activeTab === "expenses" ? (
        <>
          {/* 지출 필터 */}
          <div className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm animate-in fade-in duration-500">
            <div className="flex flex-wrap items-center gap-4">
              {/* 빠른 선택 */}
              <div className="flex gap-2">
                {[
                  { value: "today", label: "오늘" },
                  { value: "thisWeek", label: "이번 주" },
                  { value: "thisMonth", label: "이번 달" },
                  { value: "lastMonth", label: "지난 달" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => expensesData.handleQuickSelect(option.value)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black transition-all",
                      expensesData.quickSelect === option.value
                        ? "bg-rose-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* 날짜 필터 */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={expensesData.startDate}
                  onChange={(e) => expensesData.setStartDate(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-slate-200 text-sm font-bold"
                />
                <span className="text-slate-400">~</span>
                <input
                  type="date"
                  value={expensesData.endDate}
                  onChange={(e) => expensesData.setEndDate(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-slate-200 text-sm font-bold"
                />
              </div>

              {/* 카테고리 필터 */}
              <select
                value={expensesData.categoryFilter}
                onChange={(e) => expensesData.setCategoryFilter(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white"
              >
                <option value="all">전체 카테고리</option>
                {expensesData.allCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <ExpenseStats stats={expensesData.stats} salesTotal={stats.total} />

          <ExpensesTable
            expenses={expensesData.filteredExpenses}
            newRows={expensesData.newRows}
            categories={expensesData.allCategories}
            paymentMethods={expensesData.defaultPaymentMethods}
            onAddNewRow={expensesData.addNewRow}
            onUpdateNewRow={expensesData.updateNewRow}
            onSaveNewRow={expensesData.saveNewRow}
            onRemoveNewRow={expensesData.removeNewRow}
            onDelete={expensesData.deleteExpense}
            onUpdate={expensesData.updateExpense}
          />

          <ExpenseSettingsModal
            isOpen={expensesData.isSettingsOpen}
            onClose={() => expensesData.setIsSettingsOpen(false)}
            allCategories={expensesData.allCategories}
            customCategories={expensesData.customCategories}
            onAddCategory={expensesData.addCustomCategory}
            onDeleteCategory={expensesData.deleteCustomCategory}
          />
        </>
      ) : activeTab === "new_inquiries" ? (
        <InquirySection 
          selectedGymId={selectedGymId}
          selectedCompanyId={selectedCompanyId}
          gymName={gymName || ""}
          isInitialized={isInitialized}
        />
      ) : activeTab === "renewals" ? (
        <RenewalSection
          selectedGymId={selectedGymId}
          selectedCompanyId={selectedCompanyId}
          gymName={gymName || ""}
          isInitialized={isInitialized}
        />
      ) : (
        <DetailedAnalysis 
          currentPayments={filteredPayments} 
          previousPayments={previousMonthPayments} 
          lastYearPayments={lastYearPayments}
          currentExpenses={expensesData.filteredExpenses}
          previousExpenses={expensesData.previousMonthExpenses}
        />
      )}

      {/* 회원 상세 모달 (매출 등록 후 자동 표시) */}
      <MemberDetailModal
        isOpen={isMemberDetailOpen}
        onClose={() => {
          setIsMemberDetailOpen(false);
          setSelectedMember(null);
          setMemberPaymentHistory([]);
          setMemberAllMemberships([]);
          setMemberActivityLogs([]);
        }}
        member={selectedMember}
        paymentHistory={memberPaymentHistory}
        allMemberships={memberAllMemberships}
        activityLogs={memberActivityLogs}
        onEditMember={() => {}}
        onEditMembership={() => {}}
        onDeleteMembership={async () => {}}
        onEditAddon={() => {}}
        onTransferMembership={() => {}}
      />
    </div>
  );
}
