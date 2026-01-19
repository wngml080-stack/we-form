import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

// 전화번호 정규화 (하이픈 제거, 010 형식 통일)
function normalizePhone(phone: string): string {
  if (!phone) return "";
  return phone.replace(/-/g, "").replace(/\s/g, "");
}

// 고객 전환 퍼널 조회 API
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
    const statusFilter = searchParams.get("status"); // all, not_converted, converted
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

    // 기본 날짜 범위 설정 (최근 3개월)
    const now = new Date();
    const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split("T")[0];
    const defaultEndDate = endDate || now.toISOString().split("T")[0];

    // 1. 문의 데이터 조회
    const { data: inquiries } = await supabase
      .from("inquiries")
      .select("id, customer_name, customer_phone, channel, inquiry_type, status, created_at")
      .eq("gym_id", gymId)
      .eq("company_id", companyId)
      .gte("created_at", `${defaultStartDate}T00:00:00`)
      .lte("created_at", `${defaultEndDate}T23:59:59`);

    // 2. 예약 데이터 조회
    const { data: reservations } = await supabase
      .from("reservations")
      .select("id, customer_name, customer_phone, reservation_type, status, scheduled_date, created_at")
      .eq("gym_id", gymId)
      .eq("company_id", companyId)
      .gte("created_at", `${defaultStartDate}T00:00:00`)
      .lte("created_at", `${defaultEndDate}T23:59:59`);

    // 3. 등록(결제) 데이터 조회 - 신규만
    const { data: registrations } = await supabase
      .from("member_payments")
      .select("id, member_name, phone, membership_name, membership_category, amount, visit_route, created_at")
      .eq("gym_id", gymId)
      .eq("company_id", companyId)
      .eq("sale_type", "신규")
      .gte("created_at", `${defaultStartDate}T00:00:00`)
      .lte("created_at", `${defaultEndDate}T23:59:59`);

    // 전화번호 기준으로 고객 데이터 통합
    const customerMap = new Map<string, {
      phone: string;
      name: string;
      inquiry: { id: string; channel: string; type: string; status: string; date: string } | null;
      reservation: { id: string; type: string; status: string; date: string } | null;
      registration: { id: string; membershipName: string; amount: number; visitRoute: string; date: string } | null;
      firstContactDate: string;
      lastActivityDate: string;
    }>();

    // 문의 데이터 처리
    (inquiries || []).forEach(inq => {
      const phone = normalizePhone(inq.customer_phone || "");
      if (!phone) return;

      const existing = customerMap.get(phone);
      if (existing) {
        if (!existing.inquiry || new Date(inq.created_at) > new Date(existing.inquiry.date)) {
          existing.inquiry = {
            id: inq.id,
            channel: inq.channel,
            type: inq.inquiry_type,
            status: inq.status,
            date: inq.created_at
          };
        }
        if (new Date(inq.created_at) < new Date(existing.firstContactDate)) {
          existing.firstContactDate = inq.created_at;
          existing.name = inq.customer_name || existing.name;
        }
        if (new Date(inq.created_at) > new Date(existing.lastActivityDate)) {
          existing.lastActivityDate = inq.created_at;
        }
      } else {
        customerMap.set(phone, {
          phone,
          name: inq.customer_name || "",
          inquiry: {
            id: inq.id,
            channel: inq.channel,
            type: inq.inquiry_type,
            status: inq.status,
            date: inq.created_at
          },
          reservation: null,
          registration: null,
          firstContactDate: inq.created_at,
          lastActivityDate: inq.created_at
        });
      }
    });

    // 예약 데이터 처리
    (reservations || []).forEach(res => {
      const phone = normalizePhone(res.customer_phone || "");
      if (!phone) return;

      const existing = customerMap.get(phone);
      if (existing) {
        if (!existing.reservation || new Date(res.created_at) > new Date(existing.reservation.date)) {
          existing.reservation = {
            id: res.id,
            type: res.reservation_type,
            status: res.status,
            date: res.created_at
          };
        }
        if (new Date(res.created_at) < new Date(existing.firstContactDate)) {
          existing.firstContactDate = res.created_at;
          existing.name = res.customer_name || existing.name;
        }
        if (new Date(res.created_at) > new Date(existing.lastActivityDate)) {
          existing.lastActivityDate = res.created_at;
        }
      } else {
        customerMap.set(phone, {
          phone,
          name: res.customer_name || "",
          inquiry: null,
          reservation: {
            id: res.id,
            type: res.reservation_type,
            status: res.status,
            date: res.created_at
          },
          registration: null,
          firstContactDate: res.created_at,
          lastActivityDate: res.created_at
        });
      }
    });

    // 등록 데이터 처리
    (registrations || []).forEach(reg => {
      const phone = normalizePhone(reg.phone || "");
      if (!phone) return;

      const existing = customerMap.get(phone);
      if (existing) {
        if (!existing.registration || new Date(reg.created_at) > new Date(existing.registration.date)) {
          existing.registration = {
            id: reg.id,
            membershipName: reg.membership_name || reg.membership_category || "-",
            amount: reg.amount || 0,
            visitRoute: reg.visit_route || "-",
            date: reg.created_at
          };
        }
        if (new Date(reg.created_at) < new Date(existing.firstContactDate)) {
          existing.firstContactDate = reg.created_at;
          existing.name = reg.member_name || existing.name;
        }
        if (new Date(reg.created_at) > new Date(existing.lastActivityDate)) {
          existing.lastActivityDate = reg.created_at;
        }
      } else {
        customerMap.set(phone, {
          phone,
          name: reg.member_name || "",
          inquiry: null,
          reservation: null,
          registration: {
            id: reg.id,
            membershipName: reg.membership_name || reg.membership_category || "-",
            amount: reg.amount || 0,
            visitRoute: reg.visit_route || "-",
            date: reg.created_at
          },
          firstContactDate: reg.created_at,
          lastActivityDate: reg.created_at
        });
      }
    });

    // 배열로 변환 및 전환 상태 계산
    let customers = Array.from(customerMap.values()).map(customer => {
      // 전환 상태 계산
      let conversionStatus: string;
      let funnelStage: string[];

      if (customer.registration) {
        // 등록 완료
        funnelStage = [];
        if (customer.inquiry) funnelStage.push("문의");
        if (customer.reservation) funnelStage.push("예약");
        funnelStage.push("등록");
        conversionStatus = "converted";
      } else if (customer.reservation) {
        // 예약만 있음
        funnelStage = [];
        if (customer.inquiry) funnelStage.push("문의");
        funnelStage.push("예약");
        conversionStatus = "not_converted";
      } else {
        // 문의만 있음
        funnelStage = ["문의"];
        conversionStatus = "not_converted";
      }

      return {
        ...customer,
        conversionStatus,
        funnelStage: funnelStage.join(" → ")
      };
    });

    // 검색 필터
    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.phone.includes(search)
      );
    }

    // 상태 필터
    if (statusFilter && statusFilter !== "all") {
      customers = customers.filter(c => c.conversionStatus === statusFilter);
    }

    // 최근 활동일 기준 정렬
    customers.sort((a, b) => new Date(b.lastActivityDate).getTime() - new Date(a.lastActivityDate).getTime());

    // 통계 계산
    const stats = {
      total: customers.length,
      converted: customers.filter(c => c.conversionStatus === "converted").length,
      notConverted: customers.filter(c => c.conversionStatus === "not_converted").length,
      inquiryOnly: customers.filter(c => c.inquiry && !c.reservation && !c.registration).length,
      reservationOnly: customers.filter(c => !c.inquiry && c.reservation && !c.registration).length,
      inquiryToReservation: customers.filter(c => c.inquiry && c.reservation && !c.registration).length,
    };

    // 페이지네이션
    const total = customers.length;
    const offset = (page - 1) * limit;
    const paginatedCustomers = customers.slice(offset, offset + limit);

    return NextResponse.json({
      customers: paginatedCustomers,
      stats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      period: {
        start_date: defaultStartDate,
        end_date: defaultEndDate,
      }
    });
  } catch (error: unknown) {
    console.error("[CustomerFunnel] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
