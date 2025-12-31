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
    // baseDate를 전달하지 않음 - 같은 유형의 회원권 종료일만 체크하도록
    handleProductSelect(productId);
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

          {formData.registration_type && (
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
          )}

          <AddonProductsSection
            addons={addons}
            memberPayments={memberPayments}
            onAddAddon={addAddon}
            onRemoveAddon={removeAddon}
            onUpdateAddon={updateAddon}
          />

          {/* 메모 */}
          <div className="space-y-2">
            <Label>메모</Label>
            <Input
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              placeholder="메모를 입력하세요"
            />
          </div>
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
