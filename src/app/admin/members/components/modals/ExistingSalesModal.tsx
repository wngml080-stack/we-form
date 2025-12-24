"use client";

import { Button } from "@/components/ui/button";
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
import { RenewalSection } from "./existing-sales/RenewalSection";
import { PeriodChangeSection } from "./existing-sales/PeriodChangeSection";
import { AdditionalProductSection } from "./existing-sales/AdditionalProductSection";
import { PaymentInfoSection } from "./existing-sales/PaymentInfoSection";
import { AddonProductsSection } from "./existing-sales/AddonProductsSection";

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
    addons, addonProducts,
    filteredMembers,
    addAddon, removeAddon, updateAddon,
    handleClose, handleSubmit,
    handleMemberSelect, handleProductSelect,
  } = useExistingSalesForm({
    members, products, gymId, companyId, myStaffId, onSuccess, onClose,
  });

  const handleRenewalProductSelect = (productId: string) => {
    const baseDate = selectedMember?.activeMembership?.end_date || formData.start_date;
    handleProductSelect(productId, baseDate);
  };

  const handleRegistrationTypeChange = (type: string) => {
    setFormData({ ...formData, registration_type: type });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>기존회원 매출등록</DialogTitle>
          <DialogDescription className="sr-only">
            기존 회원의 매출을 등록합니다
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <MemberSelectSection
            formData={formData}
            memberSearch={memberSearch}
            filteredMembers={filteredMembers}
            onSearchChange={setMemberSearch}
            onMemberSelect={handleMemberSelect}
          />

          <RegistrationTypeSection
            formData={formData}
            selectedMember={selectedMember}
            onTypeChange={handleRegistrationTypeChange}
          />

          {formData.registration_type === "리뉴" && (
            <RenewalSection
              formData={formData}
              setFormData={setFormData}
              products={products}
              selectedProductId={selectedProductId}
              onProductSelect={handleRenewalProductSelect}
            />
          )}

          {formData.registration_type === "기간변경" && (
            <PeriodChangeSection
              formData={formData}
              setFormData={setFormData}
            />
          )}

          {formData.registration_type === "부가상품" && (
            <AdditionalProductSection
              formData={formData}
              setFormData={setFormData}
              products={products}
              selectedProductId={selectedProductId}
              onProductSelect={handleProductSelect}
            />
          )}

          <PaymentInfoSection
            formData={formData}
            setFormData={setFormData}
          />

          <AddonProductsSection
            addons={addons}
            addonProducts={addonProducts}
            onAddAddon={addAddon}
            onRemoveAddon={removeAddon}
            onUpdateAddon={updateAddon}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#2F80ED] hover:bg-[#2570d6] text-white font-semibold"
            disabled={isLoading}
          >
            {isLoading ? "등록 중..." : "등록하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
