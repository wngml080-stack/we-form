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
    // 상태 기반 차감 시스템:
    // - 일반 차감 상태: reserved, completed, no_show_deducted → used_sessions 차감
    // - 서비스 상태: service → used_service_sessions 차감 (서비스 세션에서만)
    // - 비차감 상태: no_show, cancelled → 환불

    let membershipInfo = "회원권 없음";
    const regularDeductedStatuses = ["reserved", "completed", "no_show_deducted"];
    const nonDeductedStatuses = ["no_show", "cancelled"];

    const wasRegularDeducted = regularDeductedStatuses.includes(oldStatus);
    const willBeRegularDeducted = regularDeductedStatuses.includes(newStatus);
    const wasService = oldStatus === "service";
    const willBeService = newStatus === "service";

    // 상태 변경에 따른 회원권 처리가 필요한 경우
    const needsUpdate = schedule.member_id && (
      wasRegularDeducted !== willBeRegularDeducted ||
      wasService !== willBeService
    );

    if (needsUpdate) {
      // 스케줄 타입에 맞는 회원권 조회
      const scheduleType = schedule.type?.toLowerCase() || "";

      let membershipQuery = supabase
        .from("member_memberships")
        .select("id, used_sessions, total_sessions, service_sessions, used_service_sessions, name")
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
        const usedSessions = membership.used_sessions || 0;
        const totalSessions = membership.total_sessions || 0;
        const serviceSessions = membership.service_sessions || 0;
        const usedServiceSessions = membership.used_service_sessions || 0;

        // 일반 세션 처리 (reserved, completed, no_show_deducted)
        if (wasRegularDeducted && !willBeRegularDeducted && !willBeService && usedSessions > 0) {
          // 일반 차감 → 비차감: 환불
          await supabase
            .from("member_memberships")
            .update({ used_sessions: usedSessions - 1 })
            .eq("id", membership.id);

          membershipInfo = `${membership.name} (1회 환불)`;
          console.log(`✅ 회원권 환불: ${membership.name}, ${usedSessions} → ${usedSessions - 1}`);
        } else if (!wasRegularDeducted && !wasService && willBeRegularDeducted && usedSessions < totalSessions) {
          // 비차감 → 일반 차감: 차감
          await supabase
            .from("member_memberships")
            .update({ used_sessions: usedSessions + 1 })
            .eq("id", membership.id);

          membershipInfo = `${membership.name} (1회 차감)`;
          console.log(`✅ 회원권 차감: ${membership.name}, ${usedSessions} → ${usedSessions + 1}`);
        }

        // 서비스 세션 처리
        if (wasService && !willBeService && usedServiceSessions > 0) {
          // 서비스 → 비서비스: 서비스 세션 환불
          await supabase
            .from("member_memberships")
            .update({ used_service_sessions: usedServiceSessions - 1 })
            .eq("id", membership.id);

          membershipInfo = `${membership.name} (서비스 1회 환불)`;
          console.log(`✅ 서비스 세션 환불: ${membership.name}, ${usedServiceSessions} → ${usedServiceSessions - 1}`);
        } else if (!wasService && willBeService && usedServiceSessions < serviceSessions) {
          // 비서비스 → 서비스: 서비스 세션 차감
          await supabase
            .from("member_memberships")
            .update({ used_service_sessions: usedServiceSessions + 1 })
            .eq("id", membership.id);

          membershipInfo = `${membership.name} (서비스 1회 차감)`;
          console.log(`✅ 서비스 세션 차감: ${membership.name}, ${usedServiceSessions} → ${usedServiceSessions + 1}`);
        } else if (!wasService && willBeService && usedServiceSessions >= serviceSessions) {
          // 서비스 세션이 부족한 경우
          console.log(`⚠️ 서비스 세션 부족: ${membership.name}, ${usedServiceSessions}/${serviceSessions}`);
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
