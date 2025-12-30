import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";

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
    const gymId = searchParams.get("gym_id");
    const companyId = searchParams.get("company_id");
    const limit = parseInt(searchParams.get("limit") || "10");
    const todayOnly = searchParams.get("today_only") === "true";

    if (!gymId || !companyId) {
      return NextResponse.json(
        { error: "gym_id와 company_id는 필수입니다." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 오늘 날짜 범위 계산 (한국 시간 기준)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // registration_logs 테이블이 없을 경우를 대비해 member_payments에서 조회
    let query = supabaseAdmin
      .from("member_payments")
      .select(`
        id,
        member_id,
        amount,
        method,
        membership_type,
        registration_type,
        memo,
        paid_at,
        created_at,
        members(name)
      `)
      .eq("gym_id", gymId)
      .eq("company_id", companyId)
      .order("paid_at", { ascending: false });

    // 오늘만 조회하는 경우
    if (todayOnly) {
      query = query
        .gte("paid_at", todayStart.toISOString())
        .lte("paid_at", todayEnd.toISOString());
    } else {
      query = query.limit(limit);
    }

    const { data: logs, error } = await query;

    if (error) {
      throw error;
    }

    // 로그 형식 변환
    const formattedLogs = (logs || []).map((log: any) => ({
      id: log.id,
      type: log.registration_type === "신규" ? "new_member" :
            log.registration_type === "재등록" ? "existing_member" :
            log.registration_type === "부가상품" ? "addon" : "other",
      member_id: log.member_id,
      member_name: log.members?.name || log.memo?.split(" - ")[1]?.split("(")[0] || "고객",
      amount: log.amount,
      payment_method: log.method,
      membership_type: log.membership_type,
      memo: log.memo,
      registration_type: log.registration_type,
      created_at: log.paid_at || log.created_at
    }));

    // 카테고리별 합계 계산
    const summary = {
      new_member: { count: 0, amount: 0 },
      existing_member: { count: 0, amount: 0 },
      addon: { count: 0, amount: 0 },
      other: { count: 0, amount: 0 },
      total: { count: 0, amount: 0 }
    };

    formattedLogs.forEach((log: any) => {
      const category = log.type as keyof typeof summary;
      if (summary[category]) {
        summary[category].count += 1;
        summary[category].amount += log.amount || 0;
      }
      summary.total.count += 1;
      summary.total.amount += log.amount || 0;
    });

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      summary
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
