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
    const noFilter = searchParams.get("no_filter") === "true"; // 디버깅용: 날짜 필터 무시

    if (!gymId || !companyId) {
      return NextResponse.json({ error: "gym_id와 company_id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 먼저 필터 없이 전체 데이터 확인 (디버깅용)
    const { data: allPayments, count: totalCount } = await supabase
      .from("member_payments")
      .select("id, paid_at, amount, created_at, members (name)", { count: "exact" })
      .eq("gym_id", gymId)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(10);

    // paid_at이 NULL인 레코드 수 확인
    const { count: nullPaidAtCount } = await supabase
      .from("member_payments")
      .select("*", { count: "exact", head: true })
      .eq("gym_id", gymId)
      .eq("company_id", companyId)
      .is("paid_at", null);

    // 최근 7일 이내 등록된 회원의 결제 정보 확인
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: recentMemberPayments, error: recentError } = await supabase
      .from("members")
      .select(`
        id, name, phone, created_at,
        member_payments (id, amount, paid_at, created_at, membership_type, registration_type)
      `)
      .eq("gym_id", gymId)
      .eq("company_id", companyId)
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    console.log(`[Sales API] 최근 7일 이내 등록 회원 수: ${recentMemberPayments?.length || 0}`);
    if (recentMemberPayments) {
      recentMemberPayments.forEach((m: any) => {
        const paymentCount = m.member_payments?.length || 0;
        console.log(`[Sales API] 회원: ${m.name}, 등록일: ${m.created_at}, 결제 레코드 수: ${paymentCount}`);
        if (paymentCount === 0) {
          console.log(`  ⚠️ 결제 레코드 없음! 등록 시 금액 미입력 가능성`);
        }
      });
    }

    console.log(`[Sales API] gym_id: ${gymId}, company_id: ${companyId}`);
    console.log(`[Sales API] 전체 결제 레코드 수: ${totalCount}`);
    console.log(`[Sales API] paid_at NULL 레코드 수: ${nullPaidAtCount}`);
    console.log(`[Sales API] 필터 - startDate: ${startDate}, endDate: ${endDate}`);
    console.log(`[Sales API] 최근 10개 레코드 (created_at 기준):`, allPayments?.map(p => ({
      id: p.id,
      paid_at: p.paid_at,
      created_at: p.created_at,
      member: (p.members as any)?.name
    })));

    let query = supabase
      .from("member_payments")
      .select(`*, members (name, phone), member_memberships (name)`)
      .eq("gym_id", gymId)
      .eq("company_id", companyId);

    // 날짜 필터 적용 (noFilter가 true이면 무시)
    if (!noFilter) {
      if (startDate) {
        // startDate 00:00:00 이후
        query = query.gte("paid_at", `${startDate}T00:00:00`);
      }
      if (endDate) {
        // endDate 23:59:59 이전 (다음날 00:00:00 미만)
        // 날짜 문자열을 직접 파싱해서 다음날 계산 (timezone 문제 방지)
        const [year, month, day] = endDate.split('-').map(Number);
        const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
        const nextDayStr = nextDate.toISOString().split('T')[0];
        query = query.lt("paid_at", `${nextDayStr}T00:00:00`);
        console.log(`[Sales API] 날짜 필터: ${startDate}T00:00:00 ~ ${nextDayStr}T00:00:00 미만`);
      }
    } else {
      console.log(`[Sales API] noFilter=true - 날짜 필터 무시됨`);
    }

    const { data, error } = await query.order("paid_at", { ascending: false });

    if (error) {
      console.error("매출 조회 에러:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[Sales API] 필터 후 결과 수: ${data?.length || 0}`);
    if (data && data.length > 0) {
      console.log(`[Sales API] 첫 번째 레코드 paid_at: ${data[0].paid_at}`);
    }

    return NextResponse.json({
      success: true,
      payments: data || [],
      debug: {
        totalCount,
        nullPaidAtCount,
        filteredCount: data?.length || 0,
        startDate,
        endDate,
        gymId,
        companyId,
        recentPayments: allPayments?.slice(0, 5) || [],
        // 최근 7일 이내 등록 회원 및 결제 정보
        recentMembers: recentMemberPayments?.map((m: any) => ({
          name: m.name,
          created_at: m.created_at,
          hasPayment: (m.member_payments?.length || 0) > 0,
          paymentCount: m.member_payments?.length || 0,
          payments: m.member_payments || []
        })) || []
      }
    });
  } catch (error: any) {
    console.error("매출 조회 API 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
