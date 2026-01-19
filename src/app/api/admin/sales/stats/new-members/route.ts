import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

interface RegistrationTypeStats {
  type: string;
  count: number;
  amount: number;
}

interface DailyStats {
  date: string;
  day: number;
  count: number;
  walkIn: number;
  inquiry: number;
  reservation: number;
  amount: number;
  avgPrice: number;
}

interface UnconvertedStats {
  type: string;
  count: number;
  percent: number;
}

interface SportTypeStats {
  type: string;
  count: number;
  amount: number;
}

// 전화번호 정규화
function normalizePhone(phone: string): string {
  if (!phone) return "";
  return phone.replace(/-/g, "").replace(/\s/g, "");
}

// 신규 회원 통계 조회 (신규만)
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

    // 권한 확인
    const supabase = getSupabaseAdmin();
    const { data: gym } = await supabase
      .from("gyms")
      .select("company_id")
      .eq("id", gymId)
      .maybeSingle();

    if (!canAccessGym(staff, gymId, gym?.company_id)) {
      return NextResponse.json({ error: "해당 지점에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    // 기본 날짜 범위 설정 (이번 달 1일 ~ 말일)
    const now = new Date();
    const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const defaultEndDate = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    // 1. 신규 등록 데이터만 조회 (sale_type = '신규')
    const { data: newMemberPayments, error: paymentsError } = await supabase
      .from("member_payments")
      .select("id, phone, visit_route, amount, created_at, membership_name, membership_category")
      .eq("gym_id", gymId)
      .eq("company_id", companyId)
      .eq("sale_type", "신규")
      .gte("created_at", `${defaultStartDate}T00:00:00`)
      .lte("created_at", `${defaultEndDate}T23:59:59`);

    if (paymentsError) {
      console.error("[NewMemberStats] 결제 데이터 조회 오류:", paymentsError);
      return NextResponse.json({ error: paymentsError.message }, { status: 500 });
    }

    // 2. 문의 데이터 조회 (같은 기간)
    const { data: inquiries } = await supabase
      .from("inquiries")
      .select("id, customer_phone, channel, status, created_at")
      .eq("gym_id", gymId)
      .eq("company_id", companyId)
      .gte("created_at", `${defaultStartDate}T00:00:00`)
      .lte("created_at", `${defaultEndDate}T23:59:59`);

    // 3. 예약 데이터 조회 (같은 기간)
    const { data: reservations } = await supabase
      .from("reservations")
      .select("id, customer_phone, reservation_type, status, created_at")
      .eq("gym_id", gymId)
      .eq("company_id", companyId)
      .gte("created_at", `${defaultStartDate}T00:00:00`)
      .lte("created_at", `${defaultEndDate}T23:59:59`);

    const payments = newMemberPayments || [];
    const inquiryList = inquiries || [];
    const reservationList = reservations || [];

    // 등록된 전화번호 Set 생성
    const registeredPhones = new Set(payments.map(p => normalizePhone(p.phone || "")));

    // 문의한 전화번호 Set 생성
    const inquiryPhones = new Set(inquiryList.map(i => normalizePhone(i.customer_phone || "")));

    // 예약한 전화번호 Set 생성
    const reservationPhones = new Set(reservationList.map(r => normalizePhone(r.customer_phone || "")));

    // ========== 요약 통계 ==========
    const totalCount = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const avgAmount = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;

    // ========== 유형별 등록 현황 (visit_route 기반) ==========
    // visit_route 값을 기준으로 분류
    const visitRouteMap = new Map<string, { count: number; amount: number }>();

    payments.forEach(p => {
      const visitRoute = p.visit_route || "미지정";
      const amount = p.amount || 0;
      const current = visitRouteMap.get(visitRoute) || { count: 0, amount: 0 };
      visitRouteMap.set(visitRoute, {
        count: current.count + 1,
        amount: current.amount + amount
      });
    });

    const registrationTypes: RegistrationTypeStats[] = Array.from(visitRouteMap.entries())
      .map(([type, stats]) => ({ type, count: stats.count, amount: stats.amount }))
      .sort((a, b) => b.count - a.count);

    // ========== 타종목 신규 통계 (visit_route = "타종목신규"인 경우만) ==========
    // membership_name에서 종목 추출 (예: "PT 20회" -> "PT", "필라테스 3개월" -> "필라테스")
    const sportTypeMap = new Map<string, { count: number; amount: number }>();

    // 타종목신규로 등록된 결제만 필터링 ("타종목"이 포함된 모든 경우)
    const otherSportsPayments = payments.filter(p => {
      const route = (p.visit_route || "");
      return route.includes("타종목");
    });

    // 종목(membership_category) + 상품명(membership_name)으로 그룹화
    // 예: "PT 50회", "필라테스 3개월" 형태로 표시
    otherSportsPayments.forEach(p => {
      const category = p.membership_category || "";
      const name = p.membership_name || "기타";
      // 카테고리와 상품명을 조합 (예: "PT" + "50회" = "PT 50회")
      const displayName = category ? `${category} ${name}` : name;
      const amount = p.amount || 0;

      const current = sportTypeMap.get(displayName) || { count: 0, amount: 0 };
      sportTypeMap.set(displayName, {
        count: current.count + 1,
        amount: current.amount + amount
      });
    });

    const otherSportsTotal = otherSportsPayments.length;
    const healthCount = payments.length - otherSportsTotal;
    const otherSportTypes: SportTypeStats[] = Array.from(sportTypeMap.entries())
      .map(([type, stats]) => ({ type, count: stats.count, amount: stats.amount }))
      .sort((a, b) => b.count - a.count);

    // ========== 일자별 통계 (1일 ~ 말일) ==========
    // visit_route 기반으로 분류: 워크인/방문, 문의 관련, 예약 관련
    interface DailyData {
      count: number;
      walkIn: number;
      inquiry: number;
      reservation: number;
      amount: number;
    }
    const dailyMap = new Map<string, DailyData>();

    // 기간 내 모든 날짜 초기화
    const start = new Date(defaultStartDate);
    const end = new Date(defaultEndDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split("T")[0];
      dailyMap.set(key, { count: 0, walkIn: 0, inquiry: 0, reservation: 0, amount: 0 });
    }

    // 결제 데이터 집계 (visit_route 기반 분류)
    payments.forEach(p => {
      const date = new Date(p.created_at);
      const key = date.toISOString().split("T")[0];
      const current = dailyMap.get(key) || { count: 0, walkIn: 0, inquiry: 0, reservation: 0, amount: 0 };

      const visitRoute = (p.visit_route || "").toLowerCase();

      // visit_route 기반 유형 분류
      let walkIn = 0, inquiry = 0, reservation = 0;
      if (visitRoute.includes("문의") || visitRoute.includes("인터넷") || visitRoute.includes("sns") || visitRoute.includes("카카오") || visitRoute.includes("네이버")) {
        inquiry = 1;
      } else if (visitRoute.includes("예약") || visitRoute.includes("체험") || visitRoute.includes("ot") || visitRoute.includes("상담")) {
        reservation = 1;
      } else {
        // 워크인, 방문, 지인추천, 미지정 등 나머지는 워크인으로
        walkIn = 1;
      }

      dailyMap.set(key, {
        count: current.count + 1,
        walkIn: current.walkIn + walkIn,
        inquiry: current.inquiry + inquiry,
        reservation: current.reservation + reservation,
        amount: current.amount + (p.amount || 0)
      });
    });

    const dailyStats: DailyStats[] = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({
        date,
        day: new Date(date).getDate(),
        count: stats.count,
        walkIn: stats.walkIn,
        inquiry: stats.inquiry,
        reservation: stats.reservation,
        amount: stats.amount,
        avgPrice: stats.count > 0 ? Math.round(stats.amount / stats.count) : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ========== 미등록 현황 (전환 실패) ==========
    // 문의후 미등록: 문의했지만 등록하지 않은 고객
    const inquiryNotConverted = Array.from(inquiryPhones).filter(phone =>
      phone && !registeredPhones.has(phone)
    ).length;

    // 예약후 미등록: 예약했지만 등록하지 않은 고객
    const reservationNotConverted = Array.from(reservationPhones).filter(phone =>
      phone && !registeredPhones.has(phone)
    ).length;

    // 워크인후 미등록 계산을 위해 방문 기록 확인 (예약 중 방문/tour 타입)
    const walkInReservations = reservationList.filter(r =>
      r.reservation_type === "tour" || r.reservation_type === "consultation"
    );
    const walkInVisitPhones = new Set(walkInReservations.map(r => normalizePhone(r.customer_phone || "")));
    const walkInNotConverted = Array.from(walkInVisitPhones).filter(phone =>
      phone && !registeredPhones.has(phone)
    ).length;

    const totalNotConverted = inquiryNotConverted + reservationNotConverted;

    const unconvertedStats: UnconvertedStats[] = [
      {
        type: "문의후 미등록",
        count: inquiryNotConverted,
        percent: totalNotConverted > 0 ? Math.round((inquiryNotConverted / totalNotConverted) * 100) : 0
      },
      {
        type: "예약후 미등록",
        count: reservationNotConverted,
        percent: totalNotConverted > 0 ? Math.round((reservationNotConverted / totalNotConverted) * 100) : 0
      },
      {
        type: "워크인후 미등록",
        count: walkInNotConverted,
        percent: totalNotConverted > 0 ? Math.round((walkInNotConverted / totalNotConverted) * 100) : 0
      },
    ];

    // ========== 이전 기간 비교 ==========
    const currentStartDate = new Date(defaultStartDate);
    const currentEndDate = new Date(defaultEndDate);
    const periodLength = currentEndDate.getTime() - currentStartDate.getTime();
    const prevEndDate = new Date(currentStartDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - periodLength);

    const { data: prevData } = await supabase
      .from("member_payments")
      .select("id, amount")
      .eq("gym_id", gymId)
      .eq("company_id", companyId)
      .eq("sale_type", "신규")
      .gte("created_at", `${prevStartDate.toISOString().split("T")[0]}T00:00:00`)
      .lte("created_at", `${prevEndDate.toISOString().split("T")[0]}T23:59:59`);

    const prevPayments = prevData || [];
    const prevTotalCount = prevPayments.length;
    const prevTotalAmount = prevPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const countChangeRate = prevTotalCount > 0
      ? Math.round(((totalCount - prevTotalCount) / prevTotalCount) * 100)
      : totalCount > 0 ? 100 : 0;
    const amountChangeRate = prevTotalAmount > 0
      ? Math.round(((totalAmount - prevTotalAmount) / prevTotalAmount) * 100)
      : totalAmount > 0 ? 100 : 0;

    return NextResponse.json({
      summary: {
        total_count: totalCount,
        total_amount: totalAmount,
        avg_amount: avgAmount,
      },
      registration_types: registrationTypes,
      other_sports: {
        total_count: otherSportsTotal,
        health_count: healthCount,
        types: otherSportTypes,
      },
      daily_stats: dailyStats,
      unconverted_stats: unconvertedStats,
      comparison: {
        prev_period_count: prevTotalCount,
        prev_period_amount: prevTotalAmount,
        count_change_rate: countChangeRate,
        amount_change_rate: amountChangeRate,
      },
      period: {
        start_date: defaultStartDate,
        end_date: defaultEndDate,
      }
    });
  } catch (error: unknown) {
    console.error("[NewMemberStats] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
