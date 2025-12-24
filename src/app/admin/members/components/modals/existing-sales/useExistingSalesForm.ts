"use client";

import { useState, useMemo } from "react";
import { toast } from "@/lib/toast";
import { createSupabaseClient } from "@/lib/supabase/client";
import { showSuccess, showError } from "@/lib/utils/error-handler";
import { MembershipProduct } from "@/types/membership";

export interface Member {
  id: string;
  name: string;
  phone: string;
  birth_date?: string;
  gender?: string;
  exercise_goal?: string;
  weight?: number;
  body_fat_mass?: number;
  skeletal_muscle_mass?: number;
  trainer_id?: string;
  activeMembership?: {
    id: string;
    name: string;
    total_sessions: number;
    used_sessions: number;
    end_date?: string;
  };
}

export interface AddonItem {
  product_id?: string;
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

export interface ExistingSalesFormData {
  member_id: string;
  registration_type: string;
  membership_type: string;
  membership_name: string;
  total_sessions: string;
  additional_sessions: string;
  start_date: string;
  end_date: string;
  amount: string;
  total_amount: string;
  installment_count: string;
  installment_current: string;
  method: string;
  visit_route: string;
  memo: string;
  member_name: string;
  member_phone: string;
  birth_date: string;
  gender: string;
  exercise_goal: string;
  weight: string;
  body_fat_mass: string;
  skeletal_muscle_mass: string;
  trainer_id: string;
}

const INITIAL_FORM_DATA: ExistingSalesFormData = {
  member_id: "",
  registration_type: "",
  membership_type: "PT",
  membership_name: "PT 30회",
  total_sessions: "30",
  additional_sessions: "0",
  start_date: new Date().toISOString().split("T")[0],
  end_date: "",
  amount: "",
  total_amount: "",
  installment_count: "1",
  installment_current: "1",
  method: "card",
  visit_route: "",
  memo: "",
  member_name: "",
  member_phone: "",
  birth_date: "",
  gender: "",
  exercise_goal: "",
  weight: "",
  body_fat_mass: "",
  skeletal_muscle_mass: "",
  trainer_id: "",
};

// PT/PPT/GPT 타입인지 확인
export const isPTType = (type: string) => ["PT", "PPT", "GPT"].includes(type);

// 종료일 자동 계산
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

interface UseExistingSalesFormProps {
  members: Member[];
  products: MembershipProduct[];
  gymId: string;
  companyId: string;
  myStaffId: string | null;
  onSuccess: () => void;
  onClose: () => void;
}

export function useExistingSalesForm({
  members, products, gymId, companyId, myStaffId, onSuccess, onClose
}: UseExistingSalesFormProps) {
  const supabase = createSupabaseClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ExistingSalesFormData>(INITIAL_FORM_DATA);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [addons, setAddons] = useState<AddonItem[]>([]);

  // 부가상품 목록 필터링
  const addonProducts = useMemo(() => {
    return products.filter((p) => p.membership_type === "부가상품" && p.is_active);
  }, [products]);

  // 필터링된 회원 목록
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (!memberSearch.trim()) return true;
      const searchLower = memberSearch.toLowerCase();
      return member.name?.toLowerCase().includes(searchLower) || member.phone?.includes(memberSearch);
    });
  }, [members, memberSearch]);

  // 부가상품 추가/삭제/수정 헬퍼
  const createEmptyAddon = (): AddonItem => ({
    product_id: "",
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

  const addAddon = () => {
    setAddons([...addons, createEmptyAddon()]);
  };

  const removeAddon = (index: number) => {
    setAddons(addons.filter((_, i) => i !== index));
  };

  const updateAddon = (index: number, field: keyof AddonItem, value: string) => {
    const updated = [...addons];
    updated[index] = { ...updated[index], [field]: value };

    // 상품 선택 시 상품명과 가격 자동 입력
    if (field === "product_id" && value) {
      const selectedProduct = addonProducts.find((p) => p.id === value);
      if (selectedProduct) {
        updated[index].addon_type = selectedProduct.name;
        updated[index].amount = selectedProduct.default_price.toString();
      }
    }

    // 기간 변경 시 종료일 자동 계산
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
    setAddons(updated);
  };

  // 부가상품 저장
  const saveAddonPayments = async (memberId: string, addonList: AddonItem[], registeredAt: string) => {
    for (const addon of addonList) {
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
        registration_type: "부가상품",
        memo: memoText,
        paid_at: registeredAt,
        created_by: myStaffId,
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

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setMemberSearch("");
    setSelectedProductId("");
    setSelectedMember(null);
    setAddons([]);
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  const handleMemberSelect = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (member) {
      setSelectedMember(member);
      setFormData({
        ...formData,
        member_id: memberId,
        member_name: member.name || "",
        member_phone: member.phone || "",
        birth_date: member.birth_date || "",
        gender: member.gender || "",
        exercise_goal: member.exercise_goal || "",
        weight: member.weight?.toString() || "",
        body_fat_mass: member.body_fat_mass?.toString() || "",
        skeletal_muscle_mass: member.skeletal_muscle_mass?.toString() || "",
        trainer_id: member.trainer_id || "",
      });
    } else {
      setFormData({ ...formData, member_id: memberId });
    }
  };

  const handleProductSelect = (productId: string, baseDate?: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setSelectedProductId(productId);
      const membershipType = product.membership_type || "PT";
      const totalSessions = product.default_sessions?.toString() || "0";
      const daysPerSession = product.days_per_session?.toString() || "7";
      const durationMonths = product.validity_months?.toString() || "";

      const endDate = calculateEndDate(
        baseDate || formData.start_date,
        membershipType,
        totalSessions,
        daysPerSession,
        durationMonths
      );

      setFormData({
        ...formData,
        membership_type: membershipType,
        membership_name: product.name,
        total_sessions: totalSessions,
        additional_sessions: totalSessions,
        amount: product.default_price.toString(),
        total_amount: product.default_price.toString(),
        end_date: endDate,
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.member_id || !formData.registration_type) {
      toast.warning("회원과 등록 타입을 선택해주세요.");
      return;
    }

    if (!gymId || !companyId) {
      toast.error("지점 정보를 찾을 수 없습니다.");
      return;
    }

    setIsLoading(true);
    try {
      const member = members.find((m) => m.id === formData.member_id);
      if (!member) throw new Error("회원을 찾을 수 없습니다.");

      const registrationType = formData.registration_type;

      if (registrationType === "리뉴") {
        const activeMembership = member.activeMembership;
        if (!activeMembership) {
          toast.warning("활성 회원권이 없습니다. 부가상품으로 등록해주세요.");
          return;
        }

        const additionalSessions = parseInt(formData.additional_sessions || "0");
        const { error: updateError } = await supabase
          .from("member_memberships")
          .update({
            total_sessions: activeMembership.total_sessions + additionalSessions,
            end_date: formData.end_date || activeMembership.end_date,
            status: "active",
          })
          .eq("id", activeMembership.id);

        if (updateError) throw updateError;

        await supabase.from("members").update({ status: "active" }).eq("id", member.id);
      } else if (registrationType === "기간변경") {
        const activeMembership = member.activeMembership;
        if (!activeMembership) {
          toast.warning("활성 회원권이 없습니다.");
          return;
        }

        const { error: updateError } = await supabase
          .from("member_memberships")
          .update({ end_date: formData.end_date })
          .eq("id", activeMembership.id);

        if (updateError) throw updateError;
      } else if (registrationType === "부가상품") {
        const { error: membershipError } = await supabase.from("member_memberships").insert({
          gym_id: gymId,
          member_id: member.id,
          name: formData.membership_name,
          total_sessions: parseInt(formData.total_sessions),
          used_sessions: 0,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          status: "active",
        });

        if (membershipError) throw membershipError;
      }

      // 결제 내역 등록
      const amount = parseFloat(formData.amount);
      const totalAmount = formData.total_amount ? parseFloat(formData.total_amount) : amount;

      const { error: paymentError } = await supabase.from("member_payments").insert({
        company_id: companyId,
        gym_id: gymId,
        member_id: member.id,
        amount: amount,
        total_amount: totalAmount,
        installment_count: parseInt(formData.installment_count),
        installment_current: parseInt(formData.installment_current),
        method: formData.method,
        membership_type: formData.membership_type,
        registration_type: formData.registration_type,
        visit_route: formData.visit_route || null,
        memo: formData.memo || null,
        paid_at: formData.start_date,
        created_by: myStaffId,
      });

      if (paymentError) throw paymentError;

      // 회원 정보 업데이트
      const memberUpdateData: Record<string, unknown> = {};
      if (formData.member_name) memberUpdateData.name = formData.member_name;
      if (formData.member_phone) memberUpdateData.phone = formData.member_phone;
      if (formData.birth_date) memberUpdateData.birth_date = formData.birth_date;
      if (formData.gender) memberUpdateData.gender = formData.gender;
      if (formData.exercise_goal) memberUpdateData.exercise_goal = formData.exercise_goal;
      if (formData.weight) memberUpdateData.weight = parseFloat(formData.weight);
      if (formData.body_fat_mass) memberUpdateData.body_fat_mass = parseFloat(formData.body_fat_mass);
      if (formData.skeletal_muscle_mass) memberUpdateData.skeletal_muscle_mass = parseFloat(formData.skeletal_muscle_mass);
      if (formData.trainer_id) memberUpdateData.trainer_id = formData.trainer_id;

      if (Object.keys(memberUpdateData).length > 0) {
        const { error: memberUpdateError } = await supabase.from("members").update(memberUpdateData).eq("id", member.id);
        if (memberUpdateError) throw memberUpdateError;
      }

      // 부가상품 저장
      if (addons.length > 0) {
        await saveAddonPayments(member.id, addons, formData.start_date);
      }

      showSuccess("매출이 등록되었습니다!");
      resetForm();
      onClose();
      onSuccess();
    } catch (error: unknown) {
      showError(error, "매출 등록");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    formData, setFormData,
    memberSearch, setMemberSearch,
    selectedProductId, setSelectedProductId,
    selectedMember,
    addons, addonProducts,
    filteredMembers,
    addAddon, removeAddon, updateAddon,
    handleClose, handleSubmit,
    handleMemberSelect, handleProductSelect,
  };
}
