import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";

export async function POST(request: Request) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const body = await request.json();
    const { year_month, stats, staff_memo } = body;

    // 인증된 사용자 정보 사용 (body에서 받지 않음 - 보안)
    const staff_id = staff.id;
    const gym_id = staff.gym_id;
    const company_id = staff.company_id;

    // Validate required fields
    if (!year_month || !stats) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // Check if report already exists
    const { data: existing } = await supabase
      .from("monthly_schedule_reports")
      .select("id, status")
      .eq("staff_id", staff_id)
      .eq("year_month", year_month)
      .single();

    if (existing) {
      if (existing.status === "approved") {
        return NextResponse.json(
          { error: "이미 승인된 보고서는 수정할 수 없습니다." },
          { status: 400 }
        );
      }

      // Update existing report
      const { error } = await supabase
        .from("monthly_schedule_reports")
        .update({
          stats,
          staff_memo,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "보고서가 재제출되었습니다.",
      });
    }

    // Create new report
    const { error } = await supabase.from("monthly_schedule_reports").insert({
      staff_id,
      gym_id,
      company_id,
      year_month,
      stats,
      staff_memo,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "보고서가 제출되었습니다.",
    });
  } catch (error: any) {
    console.error("Submit report error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
