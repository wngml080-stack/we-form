"use client";

import { useState, useMemo } from "react";
import { toast } from "@/lib/toast";
import { showSuccess, showError } from "@/lib/utils/error-handler";
import { MembershipProduct } from "@/types/membership";

export interface MemberMembershipInfo {
  id: string;
  name: string;
  membership_type?: string;
  total_sessions: number;
  used_sessions: number;
  start_date?: string;
  end_date?: string;
  status?: string;
}

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
  activeMembership?: MemberMembershipInfo;
  member_memberships?: MemberMembershipInfo[];
}

// 회원권명에서 유형을 추론하는 함수
const inferMembershipType = (name: string): string | null => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("헬스") || lowerName.includes("health")) return "헬스";
  if (lowerName.includes("필라테스") || lowerName.includes("pilates")) return "필라테스";
  if (lowerName.includes("ppt") || lowerName.includes("페어")) return "PPT";
  if (lowerName.includes("gpt") || lowerName.includes("그룹")) return "GPT";
  if (lowerName.includes("pt") || lowerName.includes("퍼스널")) return "PT";
  if (lowerName.includes("골프") || lowerName.includes("golf")) return "골프";
  if (lowerName.includes("gx") || lowerName.includes("그룹엑서사이즈")) return "GX";
  return null;
};

// 같은 회원권 유형의 최신 종료일을 찾는 함수
export const getLatestEndDateByType = (
  memberships: MemberMembershipInfo[] | undefined,
  membershipType: string
): string | null => {
  if (!memberships || memberships.length === 0) return null;

  // 같은 유형의 회원권 중 종료일이 가장 늦은 것을 찾음
  // membership_type이 NULL인 경우 회원권명에서 유형을 추론
  const sameTypeMemberships = memberships.filter((m) => {
    if (!m.end_date) return false;

    // membership_type이 있으면 직접 비교
    if (m.membership_type) {
      return m.membership_type === membershipType;
    }

    // membership_type이 없으면 이름에서 유형 추론
    const inferredType = inferMembershipType(m.name || "");
    return inferredType === membershipType;
  });

  if (sameTypeMemberships.length === 0) return null;

  const latestEndDate = sameTypeMemberships.reduce((latest, current) => {
    if (!latest.end_date) return current;
    if (!current.end_date) return latest;
    return new Date(current.end_date) > new Date(latest.end_date) ? current : latest;
  });

  return latestEndDate.end_date || null;
};

// 종료일 다음 날을 계산하는 함수
export const getNextDay = (dateStr: string): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
};

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

export interface ExistingSalesFormData {
  member_id: string;
  registration_type: string;
  membership_type: string;
  membership_name: string;
  total_sessions: string;
  additional_sessions: string;
  days_per_session: string;
  duration_months: string;
  start_date: string;
  end_date: string;
  amount: string;
  total_amount: string;
  installment_count: string;
  installment_current: string;
  method: string;
  card_info: string;
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
  days_per_session: "7",
  duration_months: "",
  start_date: new Date().toISOString().split("T")[0],
  end_date: "",
  amount: "",
  total_amount: "",
  installment_count: "1",
  installment_current: "1",
  method: "card",
  card_info: "",
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
  members, products, gymId, companyId, onSuccess, onClose
}: UseExistingSalesFormProps) {

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ExistingSalesFormData>(INITIAL_FORM_DATA);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [addons, setAddons] = useState<AddonItem[]>([]);
  const [memberships, setMemberships] = useState<MembershipItem[]>([]);
  const [memberPayments, setMemberPayments] = useState<any[]>([]);

  // 부가상품 목록 필터링
  const addonProducts = useMemo(() => {
    return products.filter((p) => p.membership_type === "부가상품" && p.is_active);
  }, [products]);

  // 필터링된 회원 목록
  const filteredMembers = useMemo(() => {
    if (!members || members.length === 0) return [];
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

  // 회원권 추가/삭제/수정 헬퍼
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

  const addMembership = () => {
    setMemberships([...memberships, createEmptyMembership()]);
  };

  const removeMembership = (index: number) => {
    setMemberships(memberships.filter((_, i) => i !== index));
  };

  const updateMembership = (index: number, field: keyof MembershipItem, value: string) => {
    setMemberships(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      const m = updated[index];
      if (["start_date", "total_sessions", "days_per_session", "duration_months", "membership_type"].includes(field)) {
        updated[index].end_date = calculateEndDate(
          m.start_date, m.membership_type, m.total_sessions, m.days_per_session, m.duration_months
        );
      }

      return updated;
    });
  };

  // 회원권 여러 필드 한번에 업데이트 (배치 업데이트)
  const batchUpdateMembership = (index: number, updates: Partial<MembershipItem>) => {
    setMemberships(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };

      const m = updated[index];
      // 종료일 자동 계산
      updated[index].end_date = calculateEndDate(
        m.start_date, m.membership_type, m.total_sessions, m.days_per_session, m.duration_months
      );

      return updated;
    });
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setMemberSearch("");
    setSelectedProductId("");
    setSelectedMember(null);
    setAddons([]);
    setMemberships([]);
    setMemberPayments([]);
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  const handleMemberSelect = async (memberId: string) => {
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

      // 회원 결제 정보 조회 (기존 락커 정보 확인용)
      try {
        const response = await fetch(`/api/admin/members/${memberId}/detail?gym_id=${gymId}`);
        if (response.ok) {
          const data = await response.json();
          setMemberPayments(data.payments || []);
        }
      } catch (error) {
        // 에러 무시
      }
    } else {
      setFormData({ ...formData, member_id: memberId });
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setSelectedProductId(productId);
      const membershipType = product.membership_type || "PT";
      const totalSessions = product.default_sessions?.toString() || "0";
      const daysPerSession = product.days_per_session?.toString() || "7";
      const durationMonths = product.validity_months?.toString() || "";

      // 기본 시작일은 오늘
      const today = new Date().toISOString().split("T")[0];
      let startDate = today;

      // 같은 유형의 기존 회원권 종료일 확인
      if (selectedMember?.member_memberships) {
        const latestEndDate = getLatestEndDateByType(selectedMember.member_memberships, membershipType);
        if (latestEndDate) {
          // 기존 회원권 종료일이 오늘 이후라면, 종료일 다음 날부터 시작
          if (latestEndDate >= today) {
            startDate = getNextDay(latestEndDate);
            toast.info(`같은 유형(${membershipType})의 기존 회원권이 ${latestEndDate}까지 있어서 ${startDate}부터 시작합니다.`);
          }
        }
      }

      const endDate = calculateEndDate(
        startDate,
        membershipType,
        totalSessions,
        daysPerSession,
        durationMonths
      );

      setFormData({
        ...formData,
        start_date: startDate,
        membership_type: membershipType,
        membership_name: product.name,
        total_sessions: totalSessions,
        additional_sessions: totalSessions,
        days_per_session: daysPerSession,
        duration_months: durationMonths,
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
      // 부가상품 메모 형식 변환
      const formattedAddons = addons.filter(a => a.addon_type && a.amount).map(addon => {
        const addonName = addon.addon_type === "기타" ? addon.custom_addon_name : addon.addon_type;
        let memoText = addonName;
        if (addon.locker_number && (addon.addon_type === "개인락커" || addon.addon_type === "물품락커")) {
          memoText = `${addonName} ${addon.locker_number}번`;
        }
        if (addon.duration) {
          const durationLabel = addon.duration_type === "months" ? "개월" : "일";
          memoText += ` (${addon.duration}${durationLabel})`;
        }
        return {
          addon_type: addon.addon_type,
          amount: addon.amount,
          method: addon.method,
          memo: memoText,
          start_date: addon.start_date || null,
          end_date: addon.end_date || null,
        };
      });

      // API를 통해 매출 등록 (RLS 우회)
      const response = await fetch(`/api/admin/members/${formData.member_id}/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          gym_id: gymId,
          registration_type: formData.registration_type,
          membership_type: formData.membership_type,
          membership_name: formData.membership_name,
          total_sessions: formData.total_sessions,
          additional_sessions: formData.additional_sessions,
          start_date: formData.start_date,
          end_date: formData.end_date,
          amount: formData.amount,
          total_amount: formData.total_amount,
          installment_count: formData.installment_count,
          installment_current: formData.installment_current,
          method: formData.method,
          visit_route: formData.visit_route,
          memo: formData.memo,
          // 회원 정보 업데이트
          member_update: {
            name: formData.member_name,
            phone: formData.member_phone,
            birth_date: formData.birth_date,
            gender: formData.gender,
            exercise_goal: formData.exercise_goal,
            weight: formData.weight,
            body_fat_mass: formData.body_fat_mass,
            skeletal_muscle_mass: formData.skeletal_muscle_mass,
            trainer_id: formData.trainer_id,
          },
          // 추가 회원권
          additional_memberships: memberships.filter(m => m.product_id && m.amount).map(m => ({
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
          addons: formattedAddons,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "매출 등록에 실패했습니다.");
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
    memberships, products,
    filteredMembers,
    memberPayments,
    addAddon, removeAddon, updateAddon,
    addMembership, removeMembership, updateMembership, batchUpdateMembership,
    handleClose, handleSubmit,
    handleMemberSelect, handleProductSelect,
  };
}
