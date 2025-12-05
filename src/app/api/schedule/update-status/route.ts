import { createClient } from "../../../../lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scheduleId, newStatus } = body;

    if (!scheduleId || !newStatus) {
      return NextResponse.json({ error: "필수 파라미터 누락" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. 스케줄 정보 조회 (member_id 확인)
    const { data: schedule, error: scheduleError } = await supabase
      .from("schedules")
      .select("id, gym_id, staff_id, member_id, member_name, type")
      .eq("id", scheduleId)
      .single();

    if (scheduleError || !schedule) {
      throw new Error("스케줄을 찾을 수 없습니다.");
    }

    // 2. 상태 업데이트
    const { error: updateError } = await supabase
      .from("schedules")
      .update({ status: newStatus })
      .eq("id", scheduleId);

    if (updateError) throw updateError;

    // 3. 출석/노쇼 처리 (횟수 차감 및 출석부 기록)
    // 'completed'(출석) 또는 'no_show_deducted'(노쇼-공제) 일 때만 처리
    if (["completed", "no_show_deducted"].includes(newStatus)) {
      
      let membershipInfo = "회원권 없음";

      // 3-1. 회원권 차감 로직 (회원이 연결되어 있을 때만)
      if (schedule.member_id) {
        // 사용 가능한(active) 회원권 조회 (만료일이 가까운 순서로)
        const { data: membership } = await supabase
          .from("member_memberships")
          .select("id, used_sessions, total_sessions, name")
          .eq("member_id", schedule.member_id)
          .eq("gym_id", schedule.gym_id)
          .eq("status", "active")
          .order("end_date", { ascending: true }) // 만료 임박순
          .limit(1)
          .maybeSingle();

        if (membership) {
          // 횟수 차감 (used_sessions + 1)
          if (membership.used_sessions < membership.total_sessions) {
             await supabase
              .from("member_memberships")
              .update({ used_sessions: membership.used_sessions + 1 })
              .eq("id", membership.id);
             
             membershipInfo = `${membership.name} (1회 차감)`;
          } else {
            membershipInfo = `${membership.name} (횟수 소진됨)`;
          }
        }
      }

      // 3-2. 출석부(attendances) 기록 생성
      // 이미 존재하는지 확인 (중복 생성 방지)
      const { data: existing } = await supabase
        .from("attendances")
        .select("id")
        .eq("schedule_id", schedule.id)
        .maybeSingle();

      if (!existing) {
        const { error: attendanceError } = await supabase
          .from("attendances")
          .insert({
            gym_id: schedule.gym_id,
            schedule_id: schedule.id,
            staff_id: schedule.staff_id,
            member_id: schedule.member_id, // null일 수 있음
            status_code: newStatus,
            attended_at: new Date().toISOString(),
            memo: `[자동] ${newStatus === 'completed' ? '출석' : '노쇼(공제)'} 처리 / ${membershipInfo}`
          });
          
        if (attendanceError) {
           console.error("❌ 출석부 기록 실패:", attendanceError);
        }
      } else {
        // 이미 존재하면 상태만 업데이트
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
