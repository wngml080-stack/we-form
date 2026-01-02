"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { MembershipProduct } from "@/types/membership";
import { useExistingSalesForm, Member } from "./existing-sales/useExistingSalesForm";
import { MemberSelectSection } from "./existing-sales/MemberSelectSection";
import { RegistrationTypeSection } from "./existing-sales/RegistrationTypeSection";
import { ExistingMembershipSection } from "./existing-sales/ExistingMembershipSection";
import { AddonProductsSection } from "./existing-sales/AddonProductsSection";
import { UserCircle, X, CheckCircle2, Save, ShoppingBag, CreditCard, Banknote, History, Info, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExistingSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  products: MembershipProduct[];
  gymId: string;
  companyId: string;
  myStaffId: string | null;
  onSuccess: () => void;
}

export function ExistingSalesModal({
  isOpen,
  onClose,
  members,
  products,
  gymId,
  companyId,
  myStaffId,
  onSuccess,
}: ExistingSalesModalProps) {
  const {
    isLoading,
    formData, setFormData,
    memberSearch, setMemberSearch,
    selectedProductId,
    selectedMember,
    addons,
    memberships, products: hookProducts,
    filteredMembers,
    memberPayments,
    addAddon, removeAddon, updateAddon,
    addMembership, removeMembership, updateMembership, batchUpdateMembership,
    handleClose, handleSubmit,
    handleMemberSelect, handleProductSelect,
  } = useExistingSalesForm({
    members, products, gymId, companyId, myStaffId, onSuccess, onClose,
  });

  const handleRenewalProductSelect = (productId: string) => {
    handleProductSelect(productId);
  };

  const handleRegistrationTypeChange = (type: string) => {
    setFormData({ ...formData, registration_type: type });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px]">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <UserCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">기존 회원 매출 통합 등록</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <p className="text-sm text-slate-400 font-bold">재등록, 추가 회원권 및 부가상품 구매 일괄 처리</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">기존 회원의 매출을 등록합니다</DialogDescription>
          <button
            onClick={handleClose}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-[#f8fafc]">
          {/* 1. 회원 선택 섹션 */}
          <section className="space-y-6">
            <MemberSelectSection
              formData={formData}
              memberSearch={memberSearch}
              filteredMembers={filteredMembers}
              onSearchChange={setMemberSearch}
              onMemberSelect={handleMemberSelect}
            />
          </section>

          {/* 2. 등록 유형 섹션 */}
          <section className="space-y-6">
            <RegistrationTypeSection
              formData={formData}
              selectedMember={selectedMember}
              onTypeChange={handleRegistrationTypeChange}
            />
          </section>

          {/* 3. 회원권 정보 섹션 */}
          {formData.registration_type && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">회원권 구매 설정</h3>
              </div>
              <ExistingMembershipSection
                formData={formData}
                setFormData={setFormData}
                products={hookProducts}
                selectedProductId={selectedProductId}
                memberships={memberships}
                memberMemberships={selectedMember?.member_memberships}
                onProductSelect={handleRenewalProductSelect}
                addMembership={addMembership}
                removeMembership={removeMembership}
                updateMembership={updateMembership}
                batchUpdateMembership={batchUpdateMembership}
              />
            </section>
          )}

          {/* 4. 부가상품 섹션 */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">부가상품 추가 구매</h3>
            </div>
            <AddonProductsSection
              addons={addons}
              memberPayments={memberPayments}
              onAddAddon={addAddon}
              onRemoveAddon={removeAddon}
              onUpdateAddon={updateAddon}
            />
          </section>

          {/* 5. 추가 메모 섹션 */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">관리자 메모</h3>
            </div>
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
              <Input
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                placeholder="상담 내용이나 특이사항을 입력하세요 (예: 재등록 혜택 적용됨)"
                className="h-14 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </section>
        </div>

        <DialogFooter className="px-10 py-8 bg-white border-t flex items-center justify-end gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            className="h-14 px-8 rounded-2xl font-black text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !formData.member_id}
            className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-black font-black gap-3 shadow-xl shadow-slate-100 hover:-translate-y-1 transition-all text-white"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">등록 처리 중...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                통합 매출 등록 완료
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
