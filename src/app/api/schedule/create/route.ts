import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";
import { validateBody, scheduleCreateSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    // 통합 인증
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    const body = await request.json();

    // Zod 입력 검증
    const validation = validateBody(scheduleCreateSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const {
      gym_id,
      member_id,
      member_name,
      type,
      start_time,
      end_time,
      title,
      schedule_type,
    } = validation.data;

    const supabase = getSupabaseAdmin();

    // 해당 월의 보고서가 submitted/approved 상태인지 확인 (잠금 검증)
    const startDate = new Date(start_time);
    const yearMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`;

    const { data: report } = await supabase
      .from("monthly_schedule_reports")
      .select("id, status")
      .eq("staff_id", staff.id)
      .eq("year_month", yearMonth)
      .maybeSingle();

    if (report && (report.status === "submitted" || report.status === "approved")) {
      return NextResponse.json(
        { error: "제출/승인된 달에는 스케줄을 생성할 수 없습니다." },
        { status: 403 }
      );
    }

    // 스케줄 생성
    const { data: schedule, error: insertError } = await supabase
      .from("schedules")
      .insert({
        gym_id,
        staff_id: staff.id,
        member_id: member_id || null,
        member_name: member_name || null,
        type: type || "PT",
        status: "reserved",
        start_time,
        end_time,
        title: title || `${member_name} (${type})`,
        schedule_type: schedule_type || "inside",
        counted_for_salary: true,
      })
      .select()
      .maybeSingle();

    if (insertError) {
      console.error("[ScheduleCreate] 스케줄 생성 오류:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    if (!schedule) {
      return NextResponse.json({ error: "스케줄 생성에 실패했습니다." }, { status: 500 });
    }

    // 스케줄 생성 시 회원권 차감 없음 (상태 변경 시 처리)

    return NextResponse.json({ success: true, schedule });
  } catch (error: unknown) {
    console.error("[ScheduleCreate] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
