import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin, canAccessGym } from "@/lib/api/auth";

export async function POST(request: Request) {
  try {
    // 통합 인증
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { scheduleId, newStatus } = body;

    if (!scheduleId || !newStatus) {
      return NextResponse.json({ error: "필수 파라미터 누락" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. 스케줄 정보 조회 (member_id, 현재 status 확인)
    const { data: schedule, error: scheduleError } = await supabase
      .from("schedules")
      .select("id, gym_id, staff_id, member_id, member_name, type, status")
      .eq("id", scheduleId)
      .maybeSingle();

    if (scheduleError) {
      console.error("[ScheduleUpdateStatus] 스케줄 조회 오류:", scheduleError);
      return NextResponse.json({ error: "스케줄 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!schedule) {
      return NextResponse.json({ error: "스케줄을 찾을 수 없습니다." }, { status: 404 });
    }

    const oldStatus = schedule.status || "reserved";

    // 권한 체크: 본인 스케줄이거나 관리자(해당 지점 접근 권한 필요)여야 함
    const hasAdminRole = isAdmin(staff.role);
    const isOwner = schedule.staff_id === staff.id;

    if (hasAdminRole) {
      // 관리자: 지점 접근 권한 확인
      if (!canAccessGym(staff, schedule.gym_id)) {
        return NextResponse.json({ error: "이 지점 스케줄에 대한 권한이 없습니다." }, { status: 403 });
      }
    } else if (!isOwner) {
      // 일반 직원: 본인 스케줄만 수정 가능
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 2. 상태 업데이트
    const { error: updateError } = await supabase
      .from("schedules")
      .update({ status: newStatus })
      .eq("id", scheduleId);

    if (updateError) throw updateError;

    // 3. 회원권 횟수 처리
    // 선차감 시스템: 예약 시 차감, 노쇼/취소/서비스 시 환불
    // - reserved: 예약 생성 시 차감 (스케줄 생성에서 처리)
    // - completed, no_show_deducted: 변동 없음 (이미 예약 시 차감됨)
    // - no_show, cancelled, service: 1회 환불 (used_sessions - 1)
    // - no_show/cancelled/service → 다른 상태: 재차감 (used_sessions + 1)

    let membershipInfo = "회원권 없음";
    const refundStatuses = ["no_show", "cancelled", "service"];
    const wasRefunded = refundStatuses.includes(oldStatus);
    const willRefund = refundStatuses.includes(newStatus);

    // 상태 변경에 따른 회원권 처리가 필요한 경우
    if (schedule.member_id && wasRefunded !== willRefund) {
      // 스케줄 타입에 맞는 회원권 조회
      const scheduleType = schedule.type?.toLowerCase() || "";

      let membershipQuery = supabase
        .from("member_memberships")
        .select("id, used_sessions, total_sessions, name")
        .eq("member_id", schedule.member_id)
        .eq("gym_id", schedule.gym_id)
        .eq("status", "active");

      // PT 스케줄이면 PT 회원권만, OT면 OT 회원권만 찾기
      if (scheduleType === "pt") {
        membershipQuery = membershipQuery.or("name.ilike.%PT%,name.ilike.%피티%");
      } else if (scheduleType === "ot") {
        membershipQuery = membershipQuery.or("name.ilike.%OT%,name.ilike.%오티%");
      }

      const { data: membership } = await membershipQuery
        .order("end_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (membership) {
        if (!wasRefunded && willRefund && membership.used_sessions > 0) {
          // 환불: used_sessions - 1
          await supabase
            .from("member_memberships")
            .update({ used_sessions: membership.used_sessions - 1 })
            .eq("id", membership.id);

          membershipInfo = `${membership.name} (1회 환불)`;
          console.log(`✅ 회원권 환불: ${membership.name}, ${membership.used_sessions} → ${membership.used_sessions - 1}`);
        } else if (wasRefunded && !willRefund && membership.used_sessions < membership.total_sessions) {
          // 재차감: used_sessions + 1
          await supabase
            .from("member_memberships")
            .update({ used_sessions: membership.used_sessions + 1 })
            .eq("id", membership.id);

          membershipInfo = `${membership.name} (1회 재차감)`;
          console.log(`✅ 회원권 재차감: ${membership.name}, ${membership.used_sessions} → ${membership.used_sessions + 1}`);
        }
      }
    }

    // 4. 출석부(attendances) 기록 생성/업데이트
    if (["completed", "no_show_deducted"].includes(newStatus)) {
      const { data: existing } = await supabase
        .from("attendances")
        .select("id")
        .eq("schedule_id", schedule.id)
        .maybeSingle();

      const statusLabel = newStatus === 'completed' ? '출석' : '노쇼(공제)';

      if (!existing) {
        const { error: attendanceError } = await supabase
          .from("attendances")
          .insert({
            gym_id: schedule.gym_id,
            schedule_id: schedule.id,
            staff_id: schedule.staff_id,
            member_id: schedule.member_id,
            status_code: newStatus,
            attended_at: new Date().toISOString(),
            memo: `[자동] ${statusLabel} 처리`
          });

        if (attendanceError) {
          console.error("❌ 출석부 기록 실패:", attendanceError);
        }
      } else {
        await supabase
          .from("attendances")
          .update({
            status_code: newStatus,
            attended_at: new Date().toISOString()
          })
          .eq("id", existing.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ 상태 업데이트 실패:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
