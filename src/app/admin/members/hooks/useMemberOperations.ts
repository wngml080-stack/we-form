// 회원 관련 CRUD 작업 커스텀 훅

import { toast } from "@/lib/toast";
import { showSuccess, showError } from "@/lib/utils/error-handler";
import { SupabaseClient } from "@supabase/supabase-js";

interface MembershipEditForm {
  id: string;
  name: string;
  membership_type: string;
  start_date: string;
  end_date: string;
  total_sessions: string;
  used_sessions: string;
}

interface MemberEditForm {
  name: string;
  phone: string;
  birth_date: string;
  gender: string;
  exercise_goal: string;
  weight: string;
  body_fat_mass: string;
  skeletal_muscle_mass: string;
  trainer_id: string;
  memo: string;
}

interface MembershipForm {
  name: string;
  total_sessions: string;
  start_date: string;
  end_date: string;
  amount: string;
  method: string;
  member_name: string;
  member_phone: string;
  birth_date: string;
  gender: string;
  exercise_goal: string;
  weight: string;
  body_fat_mass: string;
  skeletal_muscle_mass: string;
  trainer_id: string;
  memo: string;
}

interface AddonItem {
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

interface UseMemberOperationsParams {
  supabase: SupabaseClient;
  gymId: string | null;
  companyId: string | null;
  myStaffId: string | null;
  myRole: string;
  usePagination: boolean;
  paginatedData: { mutate: () => void };
  fetchMembers: (gymId: string, companyId: string, role: string, staffId: string) => void;
  products: any[];
  selectedProductId: string;
  setIsLoading: (loading: boolean) => void;
}

export function useMemberOperations({
  supabase,
  gymId,
  companyId,
  myStaffId,
  myRole,
  usePagination,
  paginatedData,
  fetchMembers,
  products,
  selectedProductId,
  setIsLoading
}: UseMemberOperationsParams) {

  const refreshData = () => {
    if (usePagination) {
      paginatedData.mutate();
    } else if (gymId && companyId) {
      fetchMembers(gymId, companyId, myRole, myStaffId || "");
    }
  };

  // 부가상품 저장 함수
  const saveAddonPayments = async (memberId: string, addons: AddonItem[], registeredAt: string) => {
    for (const addon of addons) {
      if (!addon.addon_type || !addon.amount) continue;

      const addonName = addon.addon_type === "기타" ? addon.custom_addon_name : addon.addon_type;
      const memoText = addon.locker_number ? `${addonName} (락커 ${addon.locker_number})` : addonName;

      // 결제 기록 생성
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
        created_by: myStaffId
      });

      // 매출 로그 기록
      await supabase.from("sales_logs").insert({
        company_id: companyId,
        gym_id: gymId,
        staff_id: myStaffId,
        type: "sale",
        amount: parseFloat(addon.amount),
        method: addon.method,
        memo: `부가상품: ${memoText}`,
        occurred_at: registeredAt
      });
    }
  };

  // 회원권 수정 처리
  const handleEditMembership = async (
    membershipEditForm: MembershipEditForm,
    onSuccess: () => void
  ) => {
    if (!membershipEditForm.id || !gymId) return;

    setIsLoading(true);
    try {
      const updateData = {
        start_date: membershipEditForm.start_date || null,
        end_date: membershipEditForm.end_date || null,
        total_sessions: parseInt(membershipEditForm.total_sessions) || 0,
        used_sessions: parseInt(membershipEditForm.used_sessions) || 0
      };

      const { error } = await supabase
        .from("member_memberships")
        .update(updateData)
        .eq("id", membershipEditForm.id);

      if (error) throw error;

      showSuccess("회원권 정보가 수정되었습니다!");
      onSuccess();
      refreshData();
    } catch (error: any) {
      showError(`회원권 수정 실패: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 회원정보 수정 처리
  const handleUpdateMemberInfo = async (
    selectedMember: any,
    memberEditForm: MemberEditForm,
    onSuccess: () => void
  ) => {
    if (!selectedMember || !gymId || !companyId) return;

    setIsLoading(true);
    try {
      const updateData: any = {
        name: memberEditForm.name,
        phone: memberEditForm.phone,
        birth_date: memberEditForm.birth_date || null,
        gender: memberEditForm.gender || null,
        exercise_goal: memberEditForm.exercise_goal || null,
        memo: memberEditForm.memo || null
      };

      if (memberEditForm.weight) updateData.weight = parseFloat(memberEditForm.weight);
      if (memberEditForm.body_fat_mass) updateData.body_fat_mass = parseFloat(memberEditForm.body_fat_mass);
      if (memberEditForm.skeletal_muscle_mass) updateData.skeletal_muscle_mass = parseFloat(memberEditForm.skeletal_muscle_mass);
      if (memberEditForm.trainer_id) updateData.trainer_id = memberEditForm.trainer_id;

      const { error } = await supabase
        .from("members")
        .update(updateData)
        .eq("id", selectedMember.id);

      if (error) throw error;

      showSuccess("회원정보가 수정되었습니다!");
      onSuccess();
      refreshData();
    } catch (error: any) {
      showError(error, "회원정보 수정");
    } finally {
      setIsLoading(false);
    }
  };

  // 회원권 등록 처리
  const handleUpdateMembership = async (
    selectedMember: any,
    membershipForm: MembershipForm,
    membershipModalAddons: AddonItem[],
    onSuccess: () => void
  ) => {
    if (!selectedMember || !gymId || !companyId) return;
    if (!membershipForm.name || !membershipForm.total_sessions) {
      toast.warning("회원권 이름과 횟수는 필수입니다.");
      return;
    }

    setIsLoading(true);
    try {
      // 새 회원권 생성
      const { error: membershipError } = await supabase
        .from("member_memberships")
        .insert({
          gym_id: gymId,
          member_id: selectedMember.id,
          name: membershipForm.name,
          total_sessions: parseInt(membershipForm.total_sessions),
          used_sessions: 0,
          start_date: membershipForm.start_date || null,
          end_date: membershipForm.end_date || null,
          status: "active"
        });

      if (membershipError) throw membershipError;

      // 결제 기록 생성 (회원권)
      if (membershipForm.amount && parseFloat(membershipForm.amount) > 0) {
        await supabase.from("member_payments").insert({
          company_id: companyId,
          gym_id: gymId,
          member_id: selectedMember.id,
          amount: parseFloat(membershipForm.amount),
          registration_type: "회원권추가",
          payment_method: membershipForm.method || "card",
          memo: membershipForm.name,
          registered_at: membershipForm.start_date || new Date().toISOString().split('T')[0],
          membership_type: products.find(p => p.id === selectedProductId)?.membership_type || "기타",
          created_by: myStaffId
        });
      }

      // 부가상품 저장
      if (membershipModalAddons.length > 0) {
        await saveAddonPayments(selectedMember.id, membershipModalAddons, membershipForm.start_date || new Date().toISOString().split('T')[0]);
      }

      showSuccess("회원권이 등록되었습니다!");
      onSuccess();
      refreshData();
    } catch (error: any) {
      showError(error, "회원권 등록");
    } finally {
      setIsLoading(false);
    }
  };

  // 대량 상태 변경
  const handleBulkStatusChange = async (memberIds: string[], newStatus: string) => {
    try {
      const { error } = await supabase
        .from("members")
        .update({ status: newStatus })
        .in("id", memberIds);

      if (error) throw error;
      refreshData();
    } catch (error: any) {
      console.error("대량 상태 변경 실패:", error);
      throw error;
    }
  };

  // 대량 트레이너 할당
  const handleBulkTrainerAssign = async (memberIds: string[], trainerId: string) => {
    try {
      const { error } = await supabase
        .from("members")
        .update({ trainer_id: trainerId })
        .in("id", memberIds);

      if (error) throw error;
      refreshData();
    } catch (error: any) {
      console.error("대량 트레이너 할당 실패:", error);
      throw error;
    }
  };

  // 단일 회원 상태 변경
  const handleStatusChange = async (member: any, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("members")
        .update({ status: newStatus })
        .eq("id", member.id);

      if (error) throw error;
      refreshData();
    } catch (error: any) {
      console.error("상태 변경 실패:", error);
      toast.error("상태 변경 중 오류가 발생했습니다.");
    }
  };

  // 대량 회원 삭제
  const handleBulkDelete = async (memberIds: string[]) => {
    try {
      const { error } = await supabase
        .from("members")
        .delete()
        .in("id", memberIds);

      if (error) throw error;
      refreshData();
    } catch (error: any) {
      console.error("대량 삭제 실패:", error);
      throw error;
    }
  };

  // 회원권 삭제
  const handleDeleteMembership = async (membershipId: string) => {
    try {
      const { error } = await supabase
        .from("member_memberships")
        .delete()
        .eq("id", membershipId);

      if (error) throw error;

      showSuccess("회원권이 삭제되었습니다.");
      refreshData();
    } catch (error: any) {
      showError(error, "회원권 삭제");
      throw error;
    }
  };

  return {
    saveAddonPayments,
    handleEditMembership,
    handleUpdateMemberInfo,
    handleUpdateMembership,
    handleBulkStatusChange,
    handleBulkTrainerAssign,
    handleStatusChange,
    handleBulkDelete,
    handleDeleteMembership
  };
}

// 상태 배지 헬퍼 함수
export function getStatusBadge(status: string) {
  const colors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    paused: "bg-amber-100 text-amber-700",
    expired: "bg-gray-100 text-gray-500"
  };
  const labels: Record<string, string> = {
    active: "활성",
    paused: "휴면",
    expired: "만료"
  };
  return { color: colors[status] || "bg-gray-100", label: labels[status] || status };
}
