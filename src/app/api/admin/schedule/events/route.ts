import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("company_id");
    const gymId = searchParams.get("gym_id");

    if (!companyId) {
      return NextResponse.json(
        { error: "company_id is required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 회사 일정 & 행사 조회 (해당 지점 또는 전사 행사)
    let query = supabaseAdmin
      .from("company_events")
      .select("*, gyms(name)")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("event_date", { ascending: true });

    // gym_id가 있으면 해당 지점 또는 전사 행사만 필터링
    if (gymId) {
      query = query.or(`gym_id.eq.${gymId},gym_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[API] Error fetching events:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      events: data || [],
    });
  } catch (error: unknown) {
    console.error("[ScheduleEvents] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
