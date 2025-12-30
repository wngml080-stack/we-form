import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";

// 매출 목록 조회 (RLS 우회)
export async function GET(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gymId = searchParams.get("gym_id");
    const companyId = searchParams.get("company_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    if (!gymId || !companyId) {
      return NextResponse.json({ error: "gym_id와 company_id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("member_payments")
      .select(`*, members (name, phone), member_memberships (name)`)
      .eq("gym_id", gymId)
      .eq("company_id", companyId);

    // 날짜 비교를 위해 startDate와 endDate를 ISO timestamp 형식으로 변환
    // UTC 기준으로 변환하여 타임존 문제 방지
    if (startDate) {
      // startDate의 시작 시점 (00:00:00 UTC)
      query = query.gte("paid_at", `${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      // endDate의 끝 시점 (23:59:59.999 UTC)
      query = query.lte("paid_at", `${endDate}T23:59:59.999Z`);
    }

    const { data, error } = await query.order("paid_at", { ascending: true });

    if (error) {
      console.error("매출 조회 에러:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, payments: data || [] });
  } catch (error: any) {
    console.error("매출 조회 API 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
