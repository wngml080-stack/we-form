import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";

// 부가상품 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id: memberId } = await params;
    const body = await request.json();
    const { paymentId, amount, method, memo, start_date, end_date } = body;

    console.log("[AddonUpdate] 요청 데이터:", { paymentId, amount, method, memo, start_date, end_date, memberId });

    if (!paymentId) {
      return NextResponse.json({ error: "결제 ID가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 기존 데이터 조회 (로그용)
    const { data: beforeData } = await supabase
      .from("member_payments")
      .select("amount, method, memo, start_date, end_date, gym_id, company_id")
      .eq("id", paymentId)
      .eq("member_id", memberId)
      .single();

    // 결제 정보 업데이트
    const { data, error } = await supabase
      .from("member_payments")
      .update({
        amount: amount,
        total_amount: amount,
        method: method,
        memo: memo,
        start_date: start_date || null,
        end_date: end_date || null,
      })
      .eq("id", paymentId)
      .eq("member_id", memberId)
      .select()
      .single();

    if (error) {
      console.error("[AddonUpdate] 수정 에러:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 활동 로그 기록
    if (beforeData) {
      // 변경 여부 확인
      const hasChanges =
        beforeData.amount !== amount ||
        beforeData.method !== method ||
        beforeData.memo !== memo ||
        beforeData.start_date !== start_date ||
        beforeData.end_date !== end_date;

      if (hasChanges) {
        // 이전/이후 상태를 간단하게 표시 (memo에 이미 기간 정보가 포함됨)
        const formatAddon = (m: string | null, a: number | null) => {
          let result = m || "부가상품";
          if (a) {
            result += ` ${a.toLocaleString()}원`;
          }
          return result;
        };

        const beforeStr = formatAddon(beforeData.memo, beforeData.amount);
        const afterStr = formatAddon(memo, amount);

        try {
          await supabase.from("member_activity_logs").insert({
            gym_id: beforeData.gym_id,
            company_id: beforeData.company_id,
            member_id: memberId,
            action_type: "addon_updated",
            description: `${beforeStr} → ${afterStr}`,
            changes: { before: beforeData, after: { amount, method, memo, start_date, end_date } },
            created_by: staff.id
          });
        } catch (logError) {
          console.error("[AddonUpdate] 로그 기록 실패:", logError);
        }
      }
    }

    console.log("[AddonUpdate] 수정 성공:", data);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("부가상품 수정 API 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
