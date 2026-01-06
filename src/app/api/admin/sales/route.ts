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
      trainer_name,
      memo,
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

    // trainer_name 조회 (trainer_id가 있고 trainer_name이 없을 경우)
    let finalTrainerName = trainer_name || "";
    if (trainer_id && !trainer_name) {
      const { data: trainerData } = await supabase
        .from("staffs")
        .select("name")
        .eq("id", trainer_id)
        .maybeSingle();
      if (trainerData) finalTrainerName = trainerData.name;
    }

    // member_payments 테이블에 저장
    const { data: payment, error: paymentError } = await supabase
      .from("member_payments")
      .insert({
        company_id,
        gym_id,
        member_name: member_name || "",
        phone: phone || "",
        sale_type: sale_type || "",
        membership_category: membership_category || "",
        membership_name: membership_name || "",
        amount: parseFloat(amount) || 0,
        method: method || "card",
        installment: installment || 1,
        trainer_id: trainer_id || null,
        trainer_name: finalTrainerName,
        memo: memo || "",
      })
      .select()
      .single();

    if (paymentError) {
      console.error("[Sales API] 매출 생성 오류:", paymentError);
      return NextResponse.json({ error: paymentError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, payment });
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

    // 기존 매출 확인
    const { data: existingPayment, error: findError } = await supabase
      .from("member_payments")
      .select("gym_id, company_id")
      .eq("id", id)
      .maybeSingle();

    if (findError) {
      console.error("[Sales API] 매출 조회 오류:", findError);
      return NextResponse.json({ error: "매출 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!existingPayment) {
      return NextResponse.json({ error: "매출 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    if (!canAccessGym(staff, existingPayment.gym_id, existingPayment.company_id)) {
      return NextResponse.json({ error: "해당 매출에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    // trainer_name 조회 (trainer_id가 변경된 경우)
    let trainerName = updates.trainer_name;
    if (updates.trainer_id && !updates.trainer_name) {
      const { data: trainerData } = await supabase
        .from("staffs")
        .select("name")
        .eq("id", updates.trainer_id)
        .maybeSingle();
      if (trainerData) trainerName = trainerData.name;
    }

    // 수정 가능한 필드들
    const allowedFields = ["member_name", "phone", "sale_type", "membership_category", "membership_name", "amount", "method", "installment", "trainer_id", "memo"];
    const dbUpdates: Record<string, unknown> = {};

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        if (key === "amount") {
          dbUpdates[key] = parseFloat(updates[key]) || 0;
        } else {
          dbUpdates[key] = updates[key];
        }
      }
    }

    // trainer_name 업데이트
    if (trainerName !== undefined) {
      dbUpdates.trainer_name = trainerName;
    }

    const { error: updateError } = await supabase
      .from("member_payments")
      .update(dbUpdates)
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

    // 기존 매출 확인
    const { data: existingPayment, error: findError } = await supabase
      .from("member_payments")
      .select("gym_id, company_id")
      .eq("id", id)
      .maybeSingle();

    if (findError) {
      console.error("[Sales API] 매출 조회 오류:", findError);
      return NextResponse.json({ error: "매출 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!existingPayment) {
      return NextResponse.json({ error: "매출 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    if (!canAccessGym(staff, existingPayment.gym_id, existingPayment.company_id)) {
      return NextResponse.json({ error: "해당 매출에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("member_payments")
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

// 매출 목록 조회 - member_payments 테이블에서 조회
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
      .select("*")
      .eq("gym_id", gymId)
      .eq("company_id", companyId);

    // 날짜 필터 적용
    if (startDate) {
      query = query.gte("created_at", `${startDate}T00:00:00`);
    }
    if (endDate) {
      const [year, month, day] = endDate.split('-').map(Number);
      const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
      const nextDayStr = nextDate.toISOString().split('T')[0];
      query = query.lt("created_at", `${nextDayStr}T00:00:00`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("매출 조회 에러:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // member_payments 데이터를 Payment 형태로 변환
    const payments = (data || []).map((p: any) => ({
      id: p.id,
      member_name: p.member_name || "",
      phone: p.phone || "",
      sale_type: p.sale_type || "",
      membership_category: p.membership_category || "",
      membership_name: p.membership_name || "",
      amount: p.amount || 0,
      method: p.method || "card",
      installment: p.installment || 1,
      trainer_id: p.trainer_id || "",
      trainer_name: p.trainer_name || "",
      memo: p.memo || "",
      created_at: p.created_at,
    }));

    return NextResponse.json({
      success: true,
      payments,
    });
  } catch (error: any) {
    console.error("매출 조회 API 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
