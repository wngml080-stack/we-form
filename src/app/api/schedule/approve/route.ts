import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reportId, approved, adminMemo, unlockOnReject = true } = body ?? {};

    if (!reportId || typeof approved !== "boolean") {
      return NextResponse.json({ error: "reportId와 approved(boolean)가 필요합니다." }, { status: 400 });
    }

    const supabase = await createClient();

    // 1) 관리자 권한 확인
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { data: adminStaff, error: staffError } = await supabase
      .from("staffs")
      .select("id, role, gym_id, company_id, employment_status")
      .eq("user_id", user.id)
      .single();

    if (staffError || !adminStaff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }
    if (adminStaff.employment_status === "퇴사") {
      return NextResponse.json({ error: "퇴사한 계정은 사용할 수 없습니다." }, { status: 403 });
    }

    const adminRoles = ["system_admin", "company_admin", "admin"];
    if (!adminRoles.includes(adminStaff.role)) {
      return NextResponse.json({ error: "승인 권한이 없습니다." }, { status: 403 });
    }

    // 2) 보고서 조회
    const { data: report, error: reportError } = await supabase
      .from("monthly_schedule_reports")
      .select("id, staff_id, gym_id, company_id, status")
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: "보고서를 찾을 수 없습니다." }, { status: 404 });
    }

    // 3) 권한 체크: company_admin은 회사 일치, admin은 지점 일치, system_admin은 통과
    if (adminStaff.role === "company_admin" && adminStaff.company_id !== report.company_id) {
      return NextResponse.json({ error: "이 회사 보고서에 대한 승인 권한이 없습니다." }, { status: 403 });
    }
    if (adminStaff.role === "admin" && adminStaff.gym_id !== report.gym_id) {
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
      .single();

    if (updateReportError || !updatedReport) {
      return NextResponse.json({ error: "보고서 업데이트 중 오류가 발생했습니다." }, { status: 500 });
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
  } catch (error: any) {
    console.error("❌ approve 오류:", error?.message ?? error);
    return NextResponse.json({ error: error?.message ?? "승인 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

