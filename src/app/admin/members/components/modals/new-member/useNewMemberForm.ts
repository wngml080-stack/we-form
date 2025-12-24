"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { createSupabaseClient } from "@/lib/supabase/client";
import { showSuccess, showError } from "@/lib/utils/error-handler";
import { MembershipProduct } from "@/types/membership";

// Types
export interface StaffMember {
  id: string;
  name: string;
  job_title: string;
}

export interface AddonItem {
  addon_type: string;
  custom_addon_name: string;
  locker_number: string;
  amount: string;
  duration: string;
  duration_type: "months" | "days";
  start_date: string;
  end_date: string;
  method: string;
}

export interface MembershipItem {
  id: string;
  product_id: string;
  membership_type: string;
  membership_name: string;
  registered_at: string;
  start_date: string;
  end_date: string;
  amount: string;
  total_sessions: string;
  days_per_session: string;
  duration_months: string;
  payment_method: string;
}

export interface CreateFormData {
  name: string;
  phone: string;
  registered_at: string;
  membership_name: string;
  membership_type: string;
  total_sessions: string;
  membership_amount: string;
  start_date: string;
  end_date: string;
  days_per_session: string;
  duration_months: string;
  payment_method: string;
  registered_by: string;
  trainer_id: string;
  birth_date: string;
  gender: string;
  exercise_goal: string;
  weight: string;
  body_fat_mass: string;
  skeletal_muscle_mass: string;
  memo: string;
}

export const INITIAL_CREATE_FORM: CreateFormData = {
  name: "",
  phone: "",
  registered_at: new Date().toISOString().split("T")[0],
  membership_name: "PT 30회",
  membership_type: "PT",
  total_sessions: "30",
  membership_amount: "",
  start_date: new Date().toISOString().split("T")[0],
  end_date: "",
  days_per_session: "7",
  duration_months: "",
  payment_method: "card",
  registered_by: "",
  trainer_id: "",
  birth_date: "",
  gender: "",
  exercise_goal: "",
  weight: "",
  body_fat_mass: "",
  skeletal_muscle_mass: "",
  memo: "",
};

// Helper: PT/PPT/GPT 타입인지 확인
export const isPTType = (type: string) => ["PT", "PPT", "GPT"].includes(type);

// Helper: 종료일 자동 계산
export const calculateEndDate = (
  startDate: string,
  membershipType: string,
  totalSessions: string,
  daysPerSession: string,
  durationMonths: string
): string => {
  if (!startDate) return "";

  const start = new Date(startDate);

  if (isPTType(membershipType)) {
    const sessions = parseInt(totalSessions) || 0;
    const days = parseInt(daysPerSession) || 7;
    const totalDays = sessions * days;
    const end = new Date(start);
    end.setDate(end.getDate() + totalDays - 1);
    return end.toISOString().split("T")[0];
  } else {
    const months = parseInt(durationMonths) || 0;
    if (months <= 0) return "";
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    end.setDate(end.getDate() - 1);
    return end.toISOString().split("T")[0];
  }
};

interface UseNewMemberFormProps {
  products: MembershipProduct[];
  gymId: string;
  companyId: string;
  myStaffId: string | null;
  onSuccess: () => void;
  onClose: () => void;
}

export function useNewMemberForm({
  products, gymId, companyId, myStaffId, onSuccess, onClose
}: UseNewMemberFormProps) {
  const supabase = createSupabaseClient();
  const [isLoading, setIsLoading] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormData>({
    ...INITIAL_CREATE_FORM,
    registered_by: myStaffId || "",
    trainer_id: myStaffId || "",
  });
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [newMemberAddons, setNewMemberAddons] = useState<AddonItem[]>([]);
  const [newMemberMemberships, setNewMemberMemberships] = useState<MembershipItem[]>([]);

  // 회원권 헬퍼 함수
  const createEmptyMembership = (): MembershipItem => ({
    id: crypto.randomUUID(),
    product_id: "",
    membership_type: "PT",
    membership_name: "",
    registered_at: new Date().toISOString().split("T")[0],
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    amount: "",
    total_sessions: "",
    days_per_session: "7",
    duration_months: "",
    payment_method: "card",
  });

  const addNewMemberMembership = () => {
    setNewMemberMemberships([...newMemberMemberships, createEmptyMembership()]);
  };

  const removeNewMemberMembership = (index: number) => {
    setNewMemberMemberships(newMemberMemberships.filter((_, i) => i !== index));
  };

  const updateNewMemberMembership = (
    index: number,
    field: keyof MembershipItem,
    value: string
  ) => {
    const updated = [...newMemberMemberships];
    updated[index] = { ...updated[index], [field]: value };

    const m = updated[index];
    if (["start_date", "total_sessions", "days_per_session", "duration_months", "membership_type"].includes(field)) {
      updated[index].end_date = calculateEndDate(
        m.start_date, m.membership_type, m.total_sessions, m.days_per_session, m.duration_months
      );
    }

    setNewMemberMemberships(updated);
  };

  // 부가상품 헬퍼 함수
  const createEmptyAddon = (): AddonItem => ({
    addon_type: "",
    custom_addon_name: "",
    locker_number: "",
    amount: "",
    duration: "",
    duration_type: "months",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    method: "card",
  });

  const addNewMemberAddon = () => {
    setNewMemberAddons([...newMemberAddons, createEmptyAddon()]);
  };

  const removeNewMemberAddon = (index: number) => {
    setNewMemberAddons(newMemberAddons.filter((_, i) => i !== index));
  };

  const updateNewMemberAddon = (
    index: number,
    field: keyof AddonItem,
    value: string
  ) => {
    const updated = [...newMemberAddons];
    updated[index] = { ...updated[index], [field]: value };

    if (field === "duration" || field === "duration_type" || field === "start_date") {
      const addon = updated[index];
      if (addon.duration && addon.start_date) {
        const num = parseInt(addon.duration);
        const startDate = new Date(addon.start_date);
        const endDate = new Date(startDate);
        if (addon.duration_type === "months") {
          endDate.setMonth(endDate.getMonth() + num);
          endDate.setDate(endDate.getDate() - 1);
        } else {
          endDate.setDate(endDate.getDate() + num - 1);
        }
        updated[index].end_date = endDate.toISOString().split("T")[0];
      }
    }
    setNewMemberAddons(updated);
  };

  // 부가상품 저장
  const saveAddonPayments = async (memberId: string, addons: AddonItem[], registeredAt: string) => {
    for (const addon of addons) {
      if (!addon.addon_type || !addon.amount) continue;

      const addonName = addon.addon_type === "기타" ? addon.custom_addon_name : addon.addon_type;
      const memoText = addon.locker_number ? `${addonName} (락커 ${addon.locker_number})` : addonName;

      await supabase.from("member_payments").insert({
        company_id: companyId,
        gym_id: gymId,
        member_id: memberId,
        amount: parseFloat(addon.amount),
        total_amount: parseFloat(addon.amount),
        method: addon.method,
        membership_type: "부가상품",
        registration_type: "부가상품",
        memo: memoText,
        paid_at: registeredAt,
      });

      await supabase.from("sales_logs").insert({
        company_id: companyId,
        gym_id: gymId,
        staff_id: myStaffId,
        type: "sale",
        amount: parseFloat(addon.amount),
        method: addon.method,
        memo: `부가상품: ${memoText}`,
        occurred_at: registeredAt,
      });
    }
  };

  // 폼 리셋
  const resetForm = () => {
    setCreateForm({
      ...INITIAL_CREATE_FORM,
      registered_by: myStaffId || "",
      trainer_id: myStaffId || "",
    });
    setSelectedProductId("");
    setNewMemberAddons([]);
    setNewMemberMemberships([]);
  };

  // 모달 닫기
  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  // 상품 선택 시 폼 업데이트
  const handleProductSelect = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setSelectedProductId(productId);
      setCreateForm({
        ...createForm,
        membership_name: product.name,
        membership_type: product.membership_type || "PT",
        total_sessions: product.default_sessions?.toString() || "0",
        membership_amount: product.default_price.toString(),
      });
    }
  };

  // 폼 필드 업데이트 (종료일 자동 계산 포함)
  const updateFormWithEndDate = (field: keyof CreateFormData, value: string) => {
    const updatedForm = { ...createForm, [field]: value };

    if (["start_date", "membership_type", "total_sessions", "days_per_session", "duration_months"].includes(field)) {
      updatedForm.end_date = calculateEndDate(
        field === "start_date" ? value : createForm.start_date,
        field === "membership_type" ? value : createForm.membership_type,
        field === "total_sessions" ? value : createForm.total_sessions,
        field === "days_per_session" ? value : createForm.days_per_session,
        field === "duration_months" ? value : createForm.duration_months
      );
    }

    setCreateForm(updatedForm);
  };

  // 회원 등록
  const handleCreateMember = async () => {
    if (!createForm.name || !createForm.phone) {
      toast.warning("필수 항목을 모두 입력해주세요. (회원명, 연락처)");
      return;
    }

    if (selectedProductId || createForm.membership_amount) {
      if (!createForm.registered_at || !createForm.membership_amount) {
        toast.warning("회원권 등록 시 등록날짜와 등록금액을 입력해주세요.");
        return;
      }
    }

    if (!gymId || !companyId) {
      toast.error("지점 정보를 찾을 수 없습니다.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. 회원 등록
      const { data: member, error: memberError } = await supabase
        .from("members")
        .insert({
          company_id: companyId,
          gym_id: gymId,
          name: createForm.name,
          phone: createForm.phone,
          birth_date: createForm.birth_date || null,
          gender: createForm.gender || null,
          registered_by: createForm.registered_by || myStaffId,
          trainer_id: createForm.trainer_id || null,
          exercise_goal: createForm.exercise_goal || null,
          weight: createForm.weight ? parseFloat(createForm.weight) : null,
          body_fat_mass: createForm.body_fat_mass ? parseFloat(createForm.body_fat_mass) : null,
          skeletal_muscle_mass: createForm.skeletal_muscle_mass ? parseFloat(createForm.skeletal_muscle_mass) : null,
          memo: createForm.memo || null,
          status: "active",
          created_at: createForm.registered_at,
        })
        .select()
        .single();

      if (memberError) throw memberError;

      // 2. 기본 회원권 등록
      if (selectedProductId || createForm.membership_amount) {
        const { data: membership, error: membershipError } = await supabase
          .from("member_memberships")
          .insert({
            gym_id: gymId,
            member_id: member.id,
            name: createForm.membership_name,
            membership_type: createForm.membership_type,
            total_sessions: parseInt(createForm.total_sessions) || 0,
            used_sessions: 0,
            start_date: createForm.start_date || createForm.registered_at,
            end_date: createForm.end_date || null,
            status: "active",
          })
          .select()
          .single();

        if (membershipError) throw membershipError;

        // 3. 결제 정보 등록
        const amount = parseFloat(createForm.membership_amount);
        const { error: paymentError } = await supabase
          .from("member_payments")
          .insert({
            company_id: companyId,
            gym_id: gymId,
            member_id: member.id,
            membership_id: membership.id,
            amount: amount,
            total_amount: amount,
            method: createForm.payment_method,
            membership_type: createForm.membership_type,
            registration_type: "신규",
            memo: `${createForm.membership_name} 신규 등록`,
            paid_at: createForm.registered_at,
          });

        if (paymentError) throw paymentError;

        // 4. 매출 로그
        await supabase.from("sales_logs").insert({
          company_id: companyId,
          gym_id: gymId,
          staff_id: myStaffId,
          type: "sale",
          amount: amount,
          method: createForm.payment_method,
          memo: `${createForm.name} - ${createForm.membership_name} 신규 등록`,
          occurred_at: createForm.registered_at,
        });
      }

      // 5. 추가 회원권 등록
      for (const additionalMembership of newMemberMemberships) {
        if (!additionalMembership.product_id || !additionalMembership.amount) continue;

        const { data: addMembership, error: addMembershipError } = await supabase
          .from("member_memberships")
          .insert({
            gym_id: gymId,
            member_id: member.id,
            name: additionalMembership.membership_name,
            membership_type: additionalMembership.membership_type,
            total_sessions: parseInt(additionalMembership.total_sessions) || 0,
            used_sessions: 0,
            start_date: additionalMembership.start_date || additionalMembership.registered_at,
            end_date: additionalMembership.end_date || null,
            status: "active",
          })
          .select()
          .single();

        if (addMembershipError) {
          console.error("추가 회원권 등록 실패:", addMembershipError);
          continue;
        }

        const addAmount = parseFloat(additionalMembership.amount);
        await supabase.from("member_payments").insert({
          company_id: companyId,
          gym_id: gymId,
          member_id: member.id,
          membership_id: addMembership.id,
          amount: addAmount,
          total_amount: addAmount,
          method: additionalMembership.payment_method,
          membership_type: additionalMembership.membership_type,
          registration_type: "신규",
          memo: `${additionalMembership.membership_name} 신규 등록 (추가)`,
          paid_at: additionalMembership.registered_at,
        });

        await supabase.from("sales_logs").insert({
          company_id: companyId,
          gym_id: gymId,
          staff_id: myStaffId,
          type: "sale",
          amount: addAmount,
          method: additionalMembership.payment_method,
          memo: `${createForm.name} - ${additionalMembership.membership_name} 신규 등록 (추가)`,
          occurred_at: additionalMembership.registered_at,
        });
      }

      // 6. 부가상품 저장
      if (newMemberAddons.length > 0) {
        await saveAddonPayments(member.id, newMemberAddons, createForm.registered_at);
      }

      showSuccess("회원이 등록되었습니다!");
      resetForm();
      onClose();
      onSuccess();
    } catch (error: any) {
      showError(error, "회원 등록");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    isLoading,
    createForm, setCreateForm,
    selectedProductId,
    newMemberAddons,
    newMemberMemberships,

    // Membership handlers
    addNewMemberMembership,
    removeNewMemberMembership,
    updateNewMemberMembership,

    // Addon handlers
    addNewMemberAddon,
    removeNewMemberAddon,
    updateNewMemberAddon,

    // Form handlers
    handleProductSelect,
    updateFormWithEndDate,
    handleCreateMember,
    handleClose,
  };
}
