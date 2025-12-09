import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { staff_id, gym_id, company_id, year_month, stats, staff_memo } = body;

    // Validate required fields
    if (!staff_id || !gym_id || !company_id || !year_month || !stats) {
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
