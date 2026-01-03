import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";

// 부가상품 매출 등록
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
      member_id,
      amount,
      method,
      memo,
      start_date,
      end_date,
    } = body;

    if (!company_id || !gym_id || !member_id) {
      return NextResponse.json({ error: "필수 필드가 누락되었습니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 결제일은 오늘 날짜+시간 사용 (timestamptz 타입에 맞게 ISO 형식)
    const paymentDate = new Date().toISOString();
    const paymentAmount = parseFloat(amount || "0");

    if (paymentAmount <= 0) {
      return NextResponse.json({ error: "금액을 입력해주세요." }, { status: 400 });
    }

    // 회원 정보 조회
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, name")
      .eq("id", member_id)
      .maybeSingle();

    if (memberError) {
      console.error("[AddonSales] 회원 조회 오류:", memberError);
      return NextResponse.json({ error: "회원 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!member) {
      return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
    }

    // 결제 기록 생성
    const { data: paymentData, error: paymentError } = await supabase
      .from("member_payments")
      .insert({
        company_id,
        gym_id,
        member_id,
        amount: paymentAmount,
        total_amount: paymentAmount,
        method: method || "card",
        membership_type: "부가상품",
        registration_type: "부가상품",
        memo: memo || null,
        paid_at: paymentDate,
        start_date: start_date || null,
        end_date: end_date || null,
        created_by: staff.id,
      })
      .select()
      .maybeSingle();

    if (paymentError) {
      console.error("[AddonSales] 결제 등록 오류:", paymentError);
      return NextResponse.json({ error: paymentError.message }, { status: 500 });
    }

    if (!paymentData) {
      return NextResponse.json({ error: "결제 등록에 실패했습니다." }, { status: 500 });
    }

    // 매출 로그 생성
    await supabase.from("sales_logs").insert({
      company_id,
      gym_id,
      member_id,
      staff_id: staff.id,
      type: "sale",
      amount: paymentAmount,
      method: method || "card",
      memo: `부가상품: ${memo}`,
      occurred_at: paymentDate,
    });

    return NextResponse.json({ success: true, payment: paymentData });
  } catch (error: any) {
    console.error("부가상품 매출 등록 API 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
