import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";

// 지출 생성
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
      expense_date,
      category,
      sub_category,
      description,
      amount,
      payment_method,
      account_holder,
      receipt_memo,
      tax_invoice_issued,
      tax_invoice_date,
      card_receipt_collected,
    } = body;

    if (!company_id || !gym_id) {
      return NextResponse.json({ error: "company_id와 gym_id가 필요합니다." }, { status: 400 });
    }

    if (!category || !amount) {
      return NextResponse.json({ error: "카테고리와 금액은 필수입니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 권한 확인
    const { data: gym } = await supabase
      .from("gyms")
      .select("company_id")
      .eq("id", gym_id)
      .maybeSingle();

    if (!canAccessGym(staff, gym_id, gym?.company_id)) {
      return NextResponse.json({ error: "해당 지점에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    // gym_expenses 테이블에 저장
    const { data: expense, error: expenseError } = await supabase
      .from("gym_expenses")
      .insert({
        company_id,
        gym_id,
        expense_date: expense_date || new Date().toISOString().split("T")[0],
        category,
        sub_category: sub_category || "",
        description: description || "",
        amount: parseFloat(amount) || 0,
        payment_method: payment_method || "card",
        account_holder: account_holder || "",
        receipt_memo: receipt_memo || "",
        tax_invoice_issued: tax_invoice_issued || false,
        tax_invoice_date: tax_invoice_date || null,
        card_receipt_collected: card_receipt_collected || false,
        created_by: staff.id,
      })
      .select()
      .single();

    if (expenseError) {
      console.error("[Expenses API] 지출 생성 오류:", expenseError);
      return NextResponse.json({ error: expenseError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    console.error("[Expenses API] 지출 생성 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 지출 수정
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

    // 기존 지출 확인
    const { data: existingExpense, error: findError } = await supabase
      .from("gym_expenses")
      .select("gym_id, company_id")
      .eq("id", id)
      .maybeSingle();

    if (findError) {
      console.error("[Expenses API] 지출 조회 오류:", findError);
      return NextResponse.json({ error: "지출 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!existingExpense) {
      return NextResponse.json({ error: "지출 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    if (!canAccessGym(staff, existingExpense.gym_id, existingExpense.company_id)) {
      return NextResponse.json({ error: "해당 지출에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    // 수정 가능한 필드들
    const allowedFields = [
      "expense_date",
      "category",
      "sub_category",
      "description",
      "amount",
      "payment_method",
      "account_holder",
      "receipt_memo",
      "tax_invoice_issued",
      "tax_invoice_date",
      "card_receipt_collected"
    ];
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

    const { error: updateError } = await supabase
      .from("gym_expenses")
      .update(dbUpdates)
      .eq("id", id);

    if (updateError) {
      console.error("[Expenses API] 지출 수정 오류:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Expenses API] 지출 수정 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 지출 삭제
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

    // 기존 지출 확인
    const { data: existingExpense, error: findError } = await supabase
      .from("gym_expenses")
      .select("gym_id, company_id")
      .eq("id", id)
      .maybeSingle();

    if (findError) {
      console.error("[Expenses API] 지출 조회 오류:", findError);
      return NextResponse.json({ error: "지출 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!existingExpense) {
      return NextResponse.json({ error: "지출 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    if (!canAccessGym(staff, existingExpense.gym_id, existingExpense.company_id)) {
      return NextResponse.json({ error: "해당 지출에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("gym_expenses")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[Expenses API] 지출 삭제 오류:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Expenses API] 지출 삭제 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 지출 목록 조회
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
      .from("gym_expenses")
      .select("*")
      .eq("gym_id", gymId)
      .eq("company_id", companyId);

    // 날짜 필터 적용
    if (startDate) {
      query = query.gte("expense_date", startDate);
    }
    if (endDate) {
      query = query.lte("expense_date", endDate);
    }

    const { data, error } = await query.order("expense_date", { ascending: true });

    if (error) {
      console.error("지출 조회 에러:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const expenses = (data || []).map((e: any) => ({
      id: e.id,
      expense_date: e.expense_date,
      category: e.category || "",
      sub_category: e.sub_category || "",
      description: e.description || "",
      amount: e.amount || 0,
      payment_method: e.payment_method || "card",
      account_holder: e.account_holder || "",
      receipt_memo: e.receipt_memo || "",
      tax_invoice_issued: e.tax_invoice_issued || false,
      tax_invoice_date: e.tax_invoice_date || null,
      card_receipt_collected: e.card_receipt_collected || false,
      created_at: e.created_at,
    }));

    return NextResponse.json({
      success: true,
      expenses,
    });
  } catch (error: any) {
    console.error("지출 조회 API 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
