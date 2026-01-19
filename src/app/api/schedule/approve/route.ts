import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin, canAccessGym, canAccessCompany } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reportId, approved, adminMemo, unlockOnReject = true } = body ?? {};

    if (!reportId || typeof approved !== "boolean") {
      return NextResponse.json({ error: "reportId와 approved(boolean)가 필요합니다." }, { status: 400 });
    }

    // 통합 인증
    const { staff: adminStaff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!adminStaff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    // 퇴사 상태 확인
    const { data: staffDetail, error: staffDetailError } = await supabase
      .from("staffs")
      .select("employment_status")
      .eq("id", adminStaff.id)
      .maybeSingle();

    if (staffDetailError) {
      console.error("[ScheduleApprove] 직원 상태 조회 오류:", staffDetailError);
      return NextResponse.json({ error: "직원 상태 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (staffDetail?.employment_status === "퇴사") {
      return NextResponse.json({ error: "퇴사한 계정은 사용할 수 없습니다." }, { status: 403 });
    }

    // 관리자 권한 확인
    if (!isAdmin(adminStaff.role)) {
      return NextResponse.json({ error: "승인 권한이 없습니다." }, { status: 403 });
    }

    // 2) 보고서 조회
    const { data: report, error: reportError } = await supabase
      .from("monthly_schedule_reports")
      .select("id, staff_id, gym_id, company_id, status")
      .eq("id", reportId)
      .maybeSingle();

    if (reportError) {
      console.error("[ScheduleApprove] 보고서 조회 오류:", reportError);
      return NextResponse.json({ error: "보고서 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!report) {
      return NextResponse.json({ error: "보고서를 찾을 수 없습니다." }, { status: 404 });
    }

    // 3) 권한 체크: canAccessCompany/canAccessGym 사용
    if (!canAccessCompany(adminStaff, report.company_id)) {
      return NextResponse.json({ error: "이 회사 보고서에 대한 승인 권한이 없습니다." }, { status: 403 });
    }
    if (!canAccessGym(adminStaff, report.gym_id)) {
      return NextResponse.json({ error: "이 지점 보고서에 대한 승인 권한이 없습니다." }, { status: 403 });
    }

    const newStatus = approved ? "approved" : "rejected";

    // 4) 보고서 상태 업데이트
    const { data: updatedReport, error: updateReportError } = await supabase
      .from("monthly_schedule_reports")
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminStaff.id,
        admin_memo: adminMemo ?? null,
      })
      .eq("id", report.id)
      .select()
      .maybeSingle();

    if (updateReportError) {
      console.error("[ScheduleApprove] 보고서 업데이트 오류:", updateReportError);
      return NextResponse.json({ error: "보고서 업데이트 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!updatedReport) {
      return NextResponse.json({ error: "보고서 업데이트에 실패했습니다." }, { status: 500 });
    }

    // 5) 스케줄 잠금/해제 처리
    if (approved) {
      // 승인: 잠금 유지
      const { error: lockError } = await supabase
        .from("schedules")
        .update({ is_locked: true })
        .eq("report_id", report.id);
      if (lockError) {
        return NextResponse.json({ error: "스케줄 잠금 처리 중 오류가 발생했습니다." }, { status: 500 });
      }
    } else {
      // 거절: 잠금 해제 옵션
      if (unlockOnReject) {
        const { error: unlockError } = await supabase
          .from("schedules")
          .update({ is_locked: false })
          .eq("report_id", report.id);
        if (unlockError) {
          return NextResponse.json({ error: "스케줄 잠금 해제 중 오류가 발생했습니다." }, { status: 500 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      report: updatedReport,
      message: approved
        ? "승인되었습니다. 스케줄은 잠금 상태로 유지됩니다."
        : `거절되었습니다.${unlockOnReject ? " 스케줄 잠금이 해제되었습니다." : ""}`,
    });
  } catch (error: unknown) {
    console.error("[ScheduleApprove] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
