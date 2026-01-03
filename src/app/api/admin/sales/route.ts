import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";

// 매출 생성
export async function POST(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const {
      company_id,
      gym_id,
      member_name,
      phone,
      sale_type,
      membership_category,
      membership_name,
      amount,
      method,
      installment,
      trainer_id,
      memo,
      service_sessions,
      validity_per_session,
      membership_start_date,
      visit_route,
      expiry_type,
    } = body;

    if (!company_id || !gym_id) {
      return NextResponse.json({ error: "company_id와 gym_id가 필요합니다." }, { status: 400 });
    }

    // 권한 확인
    const supabase = getSupabaseAdmin();
    const { data: gym } = await supabase
      .from("gyms")
      .select("company_id")
      .eq("id", gym_id)
      .maybeSingle();

    if (!canAccessGym(staff, gym_id, gym?.company_id)) {
      return NextResponse.json({ error: "해당 지점에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    // 결제일은 현재 시간
    const paymentDate = new Date().toISOString();

    // 추가 정보를 JSON으로 저장 (memo 필드에 메타데이터 포함)
    const metadata = {
      member_name: member_name || "",
      phone: phone || "",
      sale_type: sale_type || "",
      membership_category: membership_category || "",
      membership_name: membership_name || "",
      trainer_id: trainer_id || "",
      installment: installment || 1,
      visit_route: visit_route || "",
      user_memo: memo || "",
    };

    // 결제 레코드 생성 - 직접 입력 매출은 sales_logs 테이블에 저장
    const { data: salesLog, error: salesLogError } = await supabase
      .from("sales_logs")
      .insert({
        company_id,
        gym_id,
        staff_id: trainer_id || staff.id, // 담당 트레이너가 있으면 사용
        type: "sale",
        amount: parseFloat(amount) || 0,
        method: method || "card",
        memo: JSON.stringify(metadata), // JSON으로 저장
        occurred_at: paymentDate,
      })
      .select()
      .single();

    if (salesLogError) {
      console.error("[Sales API] 매출 로그 생성 오류:", salesLogError);
      return NextResponse.json({ error: salesLogError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, payment: salesLog });
  } catch (error: any) {
    console.error("[Sales API] 매출 생성 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 매출 수정
export async function PUT(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 기존 매출 로그 확인
    const { data: existingSalesLog, error: findError } = await supabase
      .from("sales_logs")
      .select("gym_id, company_id")
      .eq("id", id)
      .maybeSingle();

    if (findError) {
      console.error("[Sales API] 매출 로그 조회 오류:", findError);
      return NextResponse.json({ error: "매출 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!existingSalesLog) {
      return NextResponse.json({ error: "매출 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    if (!canAccessGym(staff, existingSalesLog.gym_id, existingSalesLog.company_id)) {
      return NextResponse.json({ error: "해당 매출에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    // 수정 가능한 필드만 필터링
    const allowedFields = ["amount", "method", "memo", "type"];
    const filteredUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    const { error: updateError } = await supabase
      .from("sales_logs")
      .update(filteredUpdates)
      .eq("id", id);

    if (updateError) {
      console.error("[Sales API] 매출 수정 오류:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Sales API] 매출 수정 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 매출 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 기존 매출 로그 확인
    const { data: existingSalesLog, error: findError } = await supabase
      .from("sales_logs")
      .select("gym_id, company_id")
      .eq("id", id)
      .maybeSingle();

    if (findError) {
      console.error("[Sales API] 매출 로그 조회 오류:", findError);
      return NextResponse.json({ error: "매출 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!existingSalesLog) {
      return NextResponse.json({ error: "매출 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    if (!canAccessGym(staff, existingSalesLog.gym_id, existingSalesLog.company_id)) {
      return NextResponse.json({ error: "해당 매출에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("sales_logs")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[Sales API] 매출 삭제 오류:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Sales API] 매출 삭제 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 매출 목록 조회 - sales_logs 테이블에서 조회
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
      .from("sales_logs")
      .select("*")
      .eq("gym_id", gymId)
      .eq("company_id", companyId)
      .eq("type", "sale");

    // 날짜 필터 적용
    if (startDate) {
      query = query.gte("occurred_at", `${startDate}T00:00:00`);
    }
    if (endDate) {
      const [year, month, day] = endDate.split('-').map(Number);
      const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
      const nextDayStr = nextDate.toISOString().split('T')[0];
      query = query.lt("occurred_at", `${nextDayStr}T00:00:00`);
    }

    const { data, error } = await query.order("occurred_at", { ascending: false });

    if (error) {
      console.error("매출 조회 에러:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // sales_logs 데이터를 Payment 형태로 변환
    const payments = (data || []).map((log: any) => {
      // memo 필드에서 JSON 메타데이터 파싱 시도
      let metadata: any = {};
      try {
        if (log.memo && log.memo.startsWith("{")) {
          metadata = JSON.parse(log.memo);
        }
      } catch {
        // JSON 파싱 실패시 기존 memo로 처리
        metadata = { user_memo: log.memo };
      }

      return {
        id: log.id,
        amount: log.amount,
        method: log.method,
        memo: metadata.user_memo || log.memo || "",
        paid_at: log.occurred_at,
        created_at: log.created_at,
        registration_type: metadata.sale_type || log.type,
        membership_type: metadata.membership_category || null,
        // 추가 필드들
        member_name: metadata.member_name || "",
        phone: metadata.phone || "",
        sale_type: metadata.sale_type || "",
        membership_category: metadata.membership_category || "",
        membership_name: metadata.membership_name || "",
        trainer_id: metadata.trainer_id || log.staff_id || "",
        installment: metadata.installment || 1,
        visit_route: metadata.visit_route || "",
      };
    });

    return NextResponse.json({
      success: true,
      payments,
    });
  } catch (error: any) {
    console.error("매출 조회 API 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
