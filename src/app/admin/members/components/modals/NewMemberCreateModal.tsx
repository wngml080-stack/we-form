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

import { cn } from "@/lib/utils";
import { UserPlus, Save, Clock } from "lucide-react";

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
      <DialogContent className="max-w-3xl bg-[#f8fafc] p-0 border-none rounded-[40px] shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">신규 회원 등록</h2>
              <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Register New Member</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid gap-8">
            {/* 1. 필수 정보 섹션 */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <BasicInfoSection
                createForm={createForm}
                setCreateForm={setCreateForm}
              />
            </div>

            {/* 2. 회원권 섹션 */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
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
            </div>

            {/* 3. 부가상품 섹션 */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <AddonSection
                newMemberAddons={newMemberAddons}
                addNewMemberAddon={addNewMemberAddon}
                removeNewMemberAddon={removeNewMemberAddon}
                updateNewMemberAddon={updateNewMemberAddon}
              />
            </div>

            {/* 4. 담당자 정보 섹션 */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <StaffInfoSection
                createForm={createForm}
                setCreateForm={setCreateForm}
                staffList={staffList}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 5. 인바디 정보 섹션 */}
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <InbodyInfoSection
                  createForm={createForm}
                  setCreateForm={setCreateForm}
                />
              </div>

              {/* 6. 메모 섹션 */}
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <MemoSection
                  createForm={createForm}
                  setCreateForm={setCreateForm}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-white border-t border-slate-50 flex gap-3">
          <Button variant="ghost" onClick={handleClose} className="flex-1 h-14 rounded-2xl font-black text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">
            취소
          </Button>
          <Button
            onClick={handleCreateMember}
            disabled={isLoading}
            className="flex-[2] h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? <Clock className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isLoading ? "등록 처리 중..." : "회원 등록 완료"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
