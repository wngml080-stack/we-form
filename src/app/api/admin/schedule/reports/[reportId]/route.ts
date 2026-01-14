import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin, canAccessGym, canAccessCompany } from "@/lib/api/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    if (!isAdmin(staff.role)) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { reportId } = await params;

    if (!reportId) {
      return NextResponse.json(
        { error: "reportId는 필수입니다." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. 보고서 정보 조회
    const { data: report, error: reportError } = await supabaseAdmin
      .from("monthly_schedule_reports")
      .select("id, staff_id, gym_id, company_id, year_month, status")
      .eq("id", reportId)
      .maybeSingle();

    if (reportError) {
      console.error("[DeleteReport] 보고서 조회 오류:", reportError);
      return NextResponse.json(
        { error: "보고서 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    if (!report) {
      return NextResponse.json(
        { error: "보고서를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 2. 권한 체크
    if (!canAccessCompany(staff, report.company_id)) {
      return NextResponse.json(
        { error: "이 회사 보고서에 대한 삭제 권한이 없습니다." },
        { status: 403 }
      );
    }
    if (!canAccessGym(staff, report.gym_id)) {
      return NextResponse.json(
        { error: "이 지점 보고서에 대한 삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 3. 연관된 스케줄의 report_id를 null로 변경하고 잠금 해제
    const { error: unlockError } = await supabaseAdmin
      .from("schedules")
      .update({ report_id: null, is_locked: false })
      .eq("report_id", reportId);

    if (unlockError) {
      console.error("[DeleteReport] 스케줄 업데이트 오류:", unlockError);
      return NextResponse.json(
        { error: "스케줄 잠금 해제 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 4. 보고서 삭제
    const { error: deleteError } = await supabaseAdmin
      .from("monthly_schedule_reports")
      .delete()
      .eq("id", reportId);

    if (deleteError) {
      console.error("[DeleteReport] 보고서 삭제 오류:", deleteError);
      return NextResponse.json(
        { error: "보고서 삭제 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    console.log(`[DeleteReport] 보고서 폐기 완료: ${reportId} (${report.year_month})`);

    return NextResponse.json({
      success: true,
      message: "보고서가 폐기되었습니다. 연관된 스케줄의 잠금이 해제되었습니다.",
    });
  } catch (error: any) {
    console.error("[DeleteReport] 예외 발생:", error);
    return NextResponse.json({ error: error.message || "알 수 없는 오류" }, { status: 500 });
  }
}
