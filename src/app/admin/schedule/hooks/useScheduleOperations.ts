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
  fetchSchedules: (gymId: string, staffId: string) => void;
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
      fetchSchedules(selectedGymId, selectedStaffId);
    }
  };

  const refreshMemberships = async () => {
    if (!selectedGymId) return;

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
    }
  };

  // 빠른 상태 변경
  const handleQuickStatusChange = async (selectedSchedule: any, newStatus: string, onSuccess: () => void) => {
    if (!selectedSchedule) return;

    try {
      // 출석완료/노쇼(차감)인 경우 API 호출 (회원권 차감)
      if (["completed", "no_show_deducted"].includes(newStatus) &&
          !["completed", "no_show_deducted"].includes(selectedSchedule.status)) {
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

        await refreshMemberships();
      } else {
        // 일반 상태 변경
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

      const { error } = await supabase
        .from("schedules")
        .delete()
        .eq("id", selectedSchedule.id);

      if (error) throw error;

      onSuccess();
      refreshSchedules();
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
      refreshSchedules();
      await refreshMemberships();
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
