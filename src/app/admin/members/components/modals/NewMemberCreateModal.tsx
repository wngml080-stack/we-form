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
import { useNewMemberForm, StaffMember } from "./new-member/useNewMemberForm";
import { BasicInfoSection } from "./new-member/BasicInfoSection";
import { MembershipSection } from "./new-member/MembershipSection";
import { AddonSection } from "./new-member/AddonSection";
import { StaffInfoSection } from "./new-member/StaffInfoSection";
import { InbodyInfoSection } from "./new-member/InbodyInfoSection";
import { MemoSection } from "./new-member/MemoSection";

interface NewMemberCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: MembershipProduct[];
  staffList: StaffMember[];
  gymId: string;
  companyId: string;
  myStaffId: string | null;
  onSuccess: () => void;
}

export function NewMemberCreateModal({
  isOpen,
  onClose,
  products,
  staffList,
  gymId,
  companyId,
  myStaffId,
  onSuccess,
}: NewMemberCreateModalProps) {
  const {
    isLoading,
    createForm,
    setCreateForm,
    selectedProductId,
    newMemberAddons,
    newMemberMemberships,
    addNewMemberMembership,
    removeNewMemberMembership,
    updateNewMemberMembership,
    addNewMemberAddon,
    removeNewMemberAddon,
    updateNewMemberAddon,
    handleProductSelect,
    updateFormWithEndDate,
    handleCreateMember,
    handleClose,
  } = useNewMemberForm({
    products,
    gymId,
    companyId,
    myStaffId,
    onSuccess,
    onClose,
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>신규 회원 등록</DialogTitle>
          <DialogDescription className="sr-only">
            신규 회원을 등록합니다
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* 1. 필수 정보 섹션 */}
          <BasicInfoSection
            createForm={createForm}
            setCreateForm={setCreateForm}
          />

          {/* 2. 회원권 섹션 */}
          <MembershipSection
            createForm={createForm}
            selectedProductId={selectedProductId}
            products={products}
            newMemberMemberships={newMemberMemberships}
            onProductSelect={handleProductSelect}
            updateFormWithEndDate={updateFormWithEndDate}
            setCreateForm={setCreateForm}
            addNewMemberMembership={addNewMemberMembership}
            removeNewMemberMembership={removeNewMemberMembership}
            updateNewMemberMembership={updateNewMemberMembership}
          />

          {/* 3. 부가상품 섹션 */}
          <AddonSection
            newMemberAddons={newMemberAddons}
            addNewMemberAddon={addNewMemberAddon}
            removeNewMemberAddon={removeNewMemberAddon}
            updateNewMemberAddon={updateNewMemberAddon}
          />

          {/* 4. 담당자 정보 섹션 */}
          <StaffInfoSection
            createForm={createForm}
            setCreateForm={setCreateForm}
            staffList={staffList}
          />

          {/* 5. 인바디 정보 섹션 */}
          <InbodyInfoSection
            createForm={createForm}
            setCreateForm={setCreateForm}
          />

          {/* 6. 메모 섹션 */}
          <MemoSection
            createForm={createForm}
            setCreateForm={setCreateForm}
          />
        </div>

        <DialogFooter>
          <Button
            onClick={handleCreateMember}
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
