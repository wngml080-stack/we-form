"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
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
  card_info: string;
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
  card_info: string;
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
  card_info: "",
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
    card_info: "",
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
      // default_price가 없거나 null인 경우 0으로 처리
      const priceValue = product.default_price ?? 0;
      const priceString = priceValue.toString();

      console.log(`[NewMember Form] 상품 선택:
        productId: ${productId}
        productName: ${product.name}
        default_price (raw): ${product.default_price}
        default_price (사용값): ${priceString}
        default_sessions: ${product.default_sessions}
        membership_type: ${product.membership_type}
      `);

      setSelectedProductId(productId);
      const newForm = {
        ...createForm,
        membership_name: product.name,
        membership_type: product.membership_type || "PT",
        total_sessions: product.default_sessions?.toString() || "0",
        membership_amount: priceString,
        days_per_session: product.days_per_session?.toString() || "7",
        duration_months: product.validity_months?.toString() || "",
      };
      // 종료일 자동 계산
      newForm.end_date = calculateEndDate(
        newForm.start_date,
        newForm.membership_type,
        newForm.total_sessions,
        newForm.days_per_session,
        newForm.duration_months
      );

      console.log(`[NewMember Form] 폼 업데이트:
        membership_amount: "${newForm.membership_amount}"
        membership_name: ${newForm.membership_name}
        membership_type: ${newForm.membership_type}
      `);

      setCreateForm(newForm);
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

    // 회원권 유형이 변경되면 선택된 상품 초기화 (DOM 이슈 방지)
    if (field === "membership_type") {
      setSelectedProductId("");
    }

    setCreateForm(updatedForm);
  };

  // 회원 등록 (API 사용)
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
      // 디버그: 등록할 데이터 확인 (상세)
      const hasPaymentCondition = !!(selectedProductId || createForm.membership_amount);
      console.log(`[NewMember Form] 회원 등록 요청 (상세):
        회원명: ${createForm.name}
        연락처: ${createForm.phone}
        selectedProductId: "${selectedProductId}" (${selectedProductId ? '있음' : '없음'})
        membership_amount: "${createForm.membership_amount}" (${createForm.membership_amount ? '있음' : '없음'})
        membership_name: ${createForm.membership_name}
        membership_type: ${createForm.membership_type}
        hasPayment 조건 결과: ${hasPaymentCondition}
        gym_id: ${gymId}
        company_id: ${companyId}
      `);

      // API를 통해 회원 등록 (RLS 우회)
      const response = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          gym_id: gymId,
          name: createForm.name,
          phone: createForm.phone,
          birth_date: createForm.birth_date || null,
          gender: createForm.gender || null,
          registered_by: createForm.registered_by || myStaffId,
          trainer_id: createForm.trainer_id || null,
          exercise_goal: createForm.exercise_goal || null,
          weight: createForm.weight || null,
          body_fat_mass: createForm.body_fat_mass || null,
          skeletal_muscle_mass: createForm.skeletal_muscle_mass || null,
          memo: createForm.memo || null,
          status: "active",
          created_at: createForm.registered_at,
          // 회원권 정보
          membership: (selectedProductId || createForm.membership_amount) ? {
            name: createForm.membership_name,
            membership_type: createForm.membership_type,
            total_sessions: parseInt(createForm.total_sessions) || 0,
            start_date: createForm.start_date || createForm.registered_at,
            end_date: createForm.end_date || null,
          } : null,
          // 결제 정보
          payment: (selectedProductId || createForm.membership_amount) ? {
            membership_type: createForm.membership_type,
            membership_name: createForm.membership_name,
            registration_type: "신규",
            payment_date: createForm.registered_at,
            amount: createForm.membership_amount,
            total_amount: createForm.membership_amount,
            total_sessions: createForm.total_sessions,
            start_date: createForm.start_date || createForm.registered_at,
            end_date: createForm.end_date || null,
            method: createForm.payment_method,
            memo: `${createForm.membership_name} 신규 등록`,
          } : null,
          // 매출 로그
          sales_log: (selectedProductId || createForm.membership_amount) ? {
            type: "sale",
            amount: createForm.membership_amount,
            method: createForm.payment_method,
            memo: `${createForm.name} - ${createForm.membership_name} 신규 등록`,
            occurred_at: createForm.registered_at,
          } : null,
          // 추가 회원권
          additional_memberships: newMemberMemberships.filter(m => m.product_id && m.amount).map(m => ({
            product_id: m.product_id,
            membership_name: m.membership_name,
            membership_type: m.membership_type,
            total_sessions: m.total_sessions,
            start_date: m.start_date || m.registered_at,
            end_date: m.end_date || null,
            amount: m.amount,
            payment_method: m.payment_method,
            registered_at: m.registered_at,
          })),
          // 부가상품
          addons: newMemberAddons.filter(a => a.addon_type && a.amount).map(a => {
            const addonName = a.addon_type === "기타" ? a.custom_addon_name : a.addon_type;
            let memoText = addonName;
            if (a.locker_number && (a.addon_type === "개인락커" || a.addon_type === "물품락커")) {
              memoText = `${addonName} ${a.locker_number}번`;
            }
            if (a.duration) {
              const durationLabel = a.duration_type === "months" ? "개월" : "일";
              memoText += ` (${a.duration}${durationLabel})`;
            }
            return {
              amount: a.amount,
              payment_method: a.method,
              memo: memoText,
              start_date: a.start_date || null,
              end_date: a.end_date || null,
              occurred_at: createForm.registered_at,
            };
          }),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "회원 등록에 실패했습니다.");
      }

      // 디버그: API 응답 확인
      console.log(`[NewMember Form] API 응답:
        member.id: ${result.member?.id}
        membership.id: ${result.membership?.id}
        payment.id: ${result.payment?.id}
        payment.amount: ${result.payment?.amount}

        === API Debug ===
        receivedPayment: ${result.debug?.receivedPayment}
        paymentAmount: ${result.debug?.paymentAmount}
        isValidPayment: ${result.debug?.isValidPayment}
        paymentCreated: ${result.debug?.paymentCreated}
      `);

      if (!result.payment && hasPaymentCondition) {
        console.error(`[NewMember Form] ❌ 결제 레코드가 생성되지 않음!
        문제 원인 분석:
        - API가 payment 받음: ${result.debug?.receivedPayment}
        - paymentAmount 값: ${result.debug?.paymentAmount}
        - isValidPayment: ${result.debug?.isValidPayment}
        `, result);
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
