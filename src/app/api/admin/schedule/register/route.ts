import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";

// 상품 ID로 상품명 조회하는 헬퍼 함수
async function getProductName(supabaseAdmin: any, productId: string, fallbackName: string): Promise<string> {
  // UUID 형식인지 확인 (상품 ID인 경우)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(productId)) {
    const { data: product } = await supabaseAdmin
      .from("membership_products")
      .select("name")
      .eq("id", productId)
      .maybeSingle();

    if (product?.name) {
      return product.name;
    }
  }
  return fallbackName;
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { type, gym_id, company_id, staff_id, data } = body;

    if (!type || !gym_id || !company_id || !staff_id || !data) {
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const now = new Date().toISOString();

    if (type === "new_member") {
      // 신규 회원 등록
      const { name, phone, membership_type, membership_name, sessions, amount, payment_method, memo } = data;

      // 상품 ID로 실제 상품명 조회
      const actualMembershipName = await getProductName(supabaseAdmin, membership_name, membership_name || membership_type);

      // 1. 회원 생성
      const { data: member, error: memberError } = await supabaseAdmin
        .from("members")
        .insert({
          gym_id,
          company_id,
          name,
          phone,
          status: "active",
          created_at: now
        })
        .select()
        .maybeSingle();

      if (memberError) {
        console.error("[Register] 회원 생성 오류:", memberError);
        throw memberError;
      }

      if (!member) {
        throw new Error("회원 생성에 실패했습니다.");
      }

      // 2. 회원권 생성
      const { error: membershipError } = await supabaseAdmin
        .from("member_memberships")
        .insert({
          member_id: member.id,
          gym_id,
          name: actualMembershipName,
          total_sessions: parseInt(sessions) || 0,
          used_sessions: 0,
          status: "active",
          start_date: now.split("T")[0]
        });

      if (membershipError) console.error("회원권 생성 에러:", membershipError);

      // 3. 결제 기록 생성
      const { error: paymentError } = await supabaseAdmin
        .from("member_payments")
        .insert({
          member_id: member.id,
          gym_id,
          company_id,
          amount: parseFloat(amount),
          total_amount: parseFloat(amount),
          method: payment_method,
          membership_type,
          registration_type: "신규",
          memo: memo || `${actualMembershipName} 신규 등록`,
          paid_at: now
        });

      if (paymentError) console.error("결제 기록 에러:", paymentError);

      // 4. 등록 로그 생성
      await supabaseAdmin
        .from("registration_logs")
        .insert({
          gym_id,
          company_id,
          staff_id,
          type: "new_member",
          member_id: member.id,
          member_name: name,
          amount: parseFloat(amount),
          payment_method,
          memo: memo || `${actualMembershipName} 신규 등록`,
          created_at: now
        });

      return NextResponse.json({ success: true, member_id: member.id });

    } else if (type === "existing_member") {
      // 기존 회원에 회원권 추가
      const { member_id, member_name, membership_type, membership_name, sessions, amount, payment_method, memo } = data;

      // 상품 ID로 실제 상품명 조회
      const actualMembershipName = await getProductName(supabaseAdmin, membership_name, membership_name || membership_type);

      // 1. 회원권 생성
      const { error: membershipError } = await supabaseAdmin
        .from("member_memberships")
        .insert({
          member_id,
          gym_id,
          name: actualMembershipName,
          total_sessions: parseInt(sessions) || 0,
          used_sessions: 0,
          status: "active",
          start_date: now.split("T")[0]
        });

      if (membershipError) console.error("회원권 생성 에러:", membershipError);

      // 2. 결제 기록 생성
      const { error: paymentError } = await supabaseAdmin
        .from("member_payments")
        .insert({
          member_id,
          gym_id,
          company_id,
          amount: parseFloat(amount),
          total_amount: parseFloat(amount),
          method: payment_method,
          membership_type,
          registration_type: "재등록",
          memo: memo || `${actualMembershipName} 재등록`,
          paid_at: now
        });

      if (paymentError) console.error("결제 기록 에러:", paymentError);

      // 3. 등록 로그 생성
      await supabaseAdmin
        .from("registration_logs")
        .insert({
          gym_id,
          company_id,
          staff_id,
          type: "existing_member",
          member_id,
          member_name,
          amount: parseFloat(amount),
          payment_method,
          memo: memo || `${actualMembershipName} 재등록`,
          created_at: now
        });

      return NextResponse.json({ success: true });

    } else if (type === "addon") {
      // 부가상품 등록
      const { customer_name, customer_phone, product_name, amount, payment_method, memo } = data;

      // 1. 부가매출 기록 생성
      const { error: paymentError } = await supabaseAdmin
        .from("member_payments")
        .insert({
          gym_id,
          company_id,
          amount: parseFloat(amount),
          total_amount: parseFloat(amount),
          method: payment_method,
          registration_type: "부가상품",
          memo: `${product_name} - ${customer_name}${memo ? ` (${memo})` : ""}`,
          paid_at: now
        });

      if (paymentError) throw paymentError;

      // 2. 등록 로그 생성
      await supabaseAdmin
        .from("registration_logs")
        .insert({
          gym_id,
          company_id,
          staff_id,
          type: "addon",
          member_name: customer_name,
          product_name,
          amount: parseFloat(amount),
          payment_method,
          memo: memo || product_name,
          created_at: now
        });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "지원하지 않는 타입입니다." }, { status: 400 });

  } catch (error: any) {
    console.error("[API] Error registering:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
