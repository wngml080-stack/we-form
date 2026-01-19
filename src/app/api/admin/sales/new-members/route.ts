import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

// 신규 고객 목록 조회
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
    const search = searchParams.get("search") || "";
    const visitRoute = searchParams.get("visit_route");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!gymId || !companyId) {
      return NextResponse.json({ error: "gym_id와 company_id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: gym } = await supabase
      .from("gyms")
      .select("company_id")
      .eq("id", gymId)
      .maybeSingle();

    if (!canAccessGym(staff, gymId, gym?.company_id)) {
      return NextResponse.json({ error: "해당 지점에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    // 기본 날짜 범위 설정 (이번 달)
    const now = new Date();
    const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const defaultEndDate = endDate || now.toISOString().split("T")[0];

    // 쿼리 빌드 - member_payments 테이블의 직접 컬럼 사용
    let query = supabase
      .from("member_payments")
      .select(`
        id,
        member_name,
        phone,
        membership_name,
        membership_category,
        amount,
        sale_type,
        visit_route,
        memo,
        method,
        trainer_name,
        created_at
      `, { count: "exact" })
      .eq("gym_id", gymId)
      .eq("company_id", companyId)
      .eq("sale_type", "신규")
      .gte("created_at", `${defaultStartDate}T00:00:00`)
      .lte("created_at", `${defaultEndDate}T23:59:59`)
      .order("created_at", { ascending: false });

    // 검색어 필터 - member_payments의 직접 컬럼 사용
    if (search) {
      query = query.or(`member_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // 유입경로 필터
    if (visitRoute) {
      query = query.eq("visit_route", visitRoute);
    }

    // 페이지네이션
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("[NewMembers] 조회 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 데이터 변환
    const members = (data || []).map(payment => ({
      id: payment.id,
      memberName: payment.member_name || "-",
      memberPhone: payment.phone || "-",
      membershipName: payment.membership_name || payment.membership_category || "-",
      amount: payment.amount || 0,
      visitRoute: payment.visit_route || "-",
      paymentMethod: payment.method || "-",
      memo: payment.memo || "",
      staffName: payment.trainer_name || "-",
      createdAt: payment.created_at,
    }));

    // 유입경로 목록 조회 (필터용)
    const { data: visitRoutes } = await supabase
      .from("member_payments")
      .select("visit_route")
      .eq("gym_id", gymId)
      .eq("company_id", companyId)
      .eq("sale_type", "신규")
      .not("visit_route", "is", null);

    const uniqueRoutes = Array.from(new Set((visitRoutes || []).map(v => v.visit_route).filter((r): r is string => Boolean(r))));

    return NextResponse.json({
      members,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
      visitRoutes: uniqueRoutes,
      period: {
        start_date: defaultStartDate,
        end_date: defaultEndDate,
      }
    });
  } catch (error: unknown) {
    console.error("[NewMembers] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
