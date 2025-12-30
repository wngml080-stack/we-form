// 스케줄 관련 CRUD 작업 커스텀 훅

import { showSuccess, showError } from "@/lib/utils/error-handler";
import { classifyScheduleType } from "@/lib/schedule-utils";
import { SupabaseClient } from "@supabase/supabase-js";

interface UseScheduleOperationsParams {
  supabase: SupabaseClient;
  selectedGymId: string | null;
  selectedStaffId: string;
  myStaffId: string | null;
  workStartTime: string | null;
  workEndTime: string | null;
  members: any[];
  memberMemberships: Record<string, any[]>;
  setMemberMemberships: (data: Record<string, any[]>) => void;
  fetchSchedules: (gymId: string, staffId: string, memberships?: Record<string, any[]>) => void;
  setIsLoading: (loading: boolean) => void;
}

export function useScheduleOperations({
  supabase,
  selectedGymId,
  selectedStaffId,
  myStaffId,
  workStartTime,
  workEndTime,
  members,
  memberMemberships,
  setMemberMemberships,
  fetchSchedules,
  setIsLoading
}: UseScheduleOperationsParams) {

  const refreshSchedules = () => {
    if (selectedGymId) {
      fetchSchedules(selectedGymId, selectedStaffId, memberMemberships);
    }
  };

  const refreshMemberships = async (): Promise<Record<string, any[]>> => {
    if (!selectedGymId) return memberMemberships;

    const { data: membershipData } = await supabase
      .from("member_memberships")
      .select("id, member_id, name, total_sessions, used_sessions, start_date, end_date, status")
      .eq("gym_id", selectedGymId)
      .eq("status", "active");

    if (membershipData) {
      const grouped = membershipData.reduce((acc: Record<string, any[]>, m) => {
        if (!acc[m.member_id]) acc[m.member_id] = [];
        acc[m.member_id].push(m);
        return acc;
      }, {});
      setMemberMemberships(grouped);
      return grouped;
    }
    return memberMemberships;
  };

  // 빠른 상태 변경
  const handleQuickStatusChange = async (selectedSchedule: any, newStatus: string, onSuccess: () => void) => {
    if (!selectedSchedule) return;

    try {
      // 선차감 시스템: 상태 변경 시 회원권 처리가 필요한 경우 API 호출
      // - no_show/cancelled/service로 변경 시 → 환불
      // - no_show/cancelled/service에서 다른 상태로 변경 시 → 재차감
      const refundStatuses = ["no_show", "cancelled", "service"];
      const needsMembershipUpdate =
        refundStatuses.includes(newStatus) !== refundStatuses.includes(selectedSchedule.status);

      if (needsMembershipUpdate || ["completed", "no_show_deducted"].includes(newStatus)) {
        // API 호출로 회원권 처리
        const res = await fetch("/api/schedule/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduleId: selectedSchedule.id,
            newStatus,
          }),
        });

        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || "상태 변경 실패");
        }

        const newMemberships = await refreshMemberships();
        showSuccess("상태가 변경되었습니다!");
        onSuccess();
        if (selectedGymId) {
          fetchSchedules(selectedGymId, selectedStaffId, newMemberships);
        }
        return;
      } else {
        // 일반 상태 변경 (회원권 처리 불필요)
        const { error } = await supabase
          .from("schedules")
          .update({ status: newStatus })
          .eq("id", selectedSchedule.id);

        if (error) throw error;
      }

      showSuccess("상태가 변경되었습니다!");
      onSuccess();
      refreshSchedules();
    } catch (error) {
      showError(error, "상태 변경");
    }
  };

  // 빠른 서브타입 변경
  const handleQuickSubTypeChange = async (selectedSchedule: any, newSubType: string, onSuccess: () => void) => {
    if (!selectedSchedule) return;

    try {
      const { error } = await supabase
        .from("schedules")
        .update({ sub_type: newSubType })
        .eq("id", selectedSchedule.id);

      if (error) throw error;

      showSuccess("분류가 변경되었습니다!");
      onSuccess();
      refreshSchedules();
    } catch (error) {
      showError(error, "분류 변경");
    }
  };

  // 스케줄 삭제
  const handleDeleteSchedule = async (selectedSchedule: any, onSuccess: () => void) => {
    if (!selectedSchedule) return;

    try {
      setIsLoading(true);

      // 선차감 시스템: 삭제 시 회원권 환불 (노쇼/취소/서비스가 아닌 경우만)
      // 이미 환불된 상태(no_show, cancelled, service)가 아니면 환불 처리
      const refundStatuses = ["no_show", "cancelled", "service"];
      const scheduleType = selectedSchedule.type?.toLowerCase() || "";
      const needsRefund = selectedSchedule.member_id &&
        (scheduleType === "pt" || scheduleType === "ot") &&
        !refundStatuses.includes(selectedSchedule.status);

      if (needsRefund && selectedGymId) {
        const typeFilter = scheduleType === "pt"
          ? "name.ilike.%PT%,name.ilike.%피티%"
          : "name.ilike.%OT%,name.ilike.%오티%";

        const { data: membership } = await supabase
          .from("member_memberships")
          .select("id, used_sessions")
          .eq("member_id", selectedSchedule.member_id)
          .eq("gym_id", selectedGymId)
          .eq("status", "active")
          .or(typeFilter)
          .order("end_date", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (membership && membership.used_sessions > 0) {
          await supabase
            .from("member_memberships")
            .update({ used_sessions: membership.used_sessions - 1 })
            .eq("id", membership.id);
        }
      }

      const { error } = await supabase
        .from("schedules")
        .delete()
        .eq("id", selectedSchedule.id);

      if (error) throw error;

      const newMemberships = await refreshMemberships();
      onSuccess();
      if (selectedGymId) {
        fetchSchedules(selectedGymId, selectedStaffId, newMemberships);
      }
    } catch (error) {
      showError(error, "스케줄 삭제");
    } finally {
      setIsLoading(false);
    }
  };

  // 출석 처리 (미등록 리스트에서 빠른 출석 처리)
  const handleQuickAttendance = async (scheduleId: string) => {
    try {
      const res = await fetch("/api/schedule/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId,
          newStatus: "completed",
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "출석 처리 실패");
      }

      showSuccess("출석 처리되었습니다!");
      const newMemberships = await refreshMemberships();
      if (selectedGymId) {
        fetchSchedules(selectedGymId, selectedStaffId, newMemberships);
      }
    } catch (error) {
      showError(error, "출석 처리");
    }
  };

  return {
    handleQuickStatusChange,
    handleQuickSubTypeChange,
    handleDeleteSchedule,
    handleQuickAttendance,
    refreshMemberships
  };
}
