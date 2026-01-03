import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isAdmin } from "@/lib/api/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// 상품 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gym_id = searchParams.get("gym_id");

    if (!gym_id) {
      return NextResponse.json({ error: "gym_id가 필요합니다." }, { status: 400 });
    }

    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("membership_products")
      .select("*")
      .eq("gym_id", gym_id)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "알 수 없는 오류" }, { status: 500 });
  }
}

// 상품 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gym_id, name, membership_type, default_sessions, default_price, validity_months, days_per_session, description, is_active, display_order } = body;

    if (!gym_id || !name || !membership_type || default_price === undefined) {
      return NextResponse.json({ error: "필수 필드가 누락되었습니다." }, { status: 400 });
    }

    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    if (!isAdmin(staff.role)) {
      return NextResponse.json({ error: `상품 관리 권한이 없습니다.` }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("membership_products")
      .insert({
        gym_id,
        name: name.trim(),
        membership_type,
        default_sessions: default_sessions || null,
        default_price: parseFloat(default_price),
        validity_months: validity_months || null,
        days_per_session: days_per_session || null,
        description: description?.trim() || null,
        is_active: is_active ?? true,
        display_order: display_order || 0,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Products] 상품 등록 오류:", error);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "상품 등록에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "알 수 없는 오류" }, { status: 500 });
  }
}

// 상품 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, gym_id, name, membership_type, default_sessions, default_price, validity_months, days_per_session, description, is_active, display_order } = body;

    if (!id || !gym_id) {
      return NextResponse.json({ error: "필수 필드가 누락되었습니다." }, { status: 400 });
    }

    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    if (!isAdmin(staff.role)) {
      return NextResponse.json({ error: `상품 관리 권한이 없습니다.` }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (membership_type !== undefined) updateData.membership_type = membership_type;
    if (default_sessions !== undefined) updateData.default_sessions = default_sessions || null;
    if (default_price !== undefined) updateData.default_price = parseFloat(default_price);
    if (validity_months !== undefined) updateData.validity_months = validity_months || null;
    if (days_per_session !== undefined) updateData.days_per_session = days_per_session || null;
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (display_order !== undefined) updateData.display_order = display_order;

    const { data, error } = await supabase
      .from("membership_products")
      .update(updateData)
      .eq("id", id)
      .eq("gym_id", gym_id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Products] 상품 수정 오류:", error);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "상품을 찾을 수 없거나 수정에 실패했습니다." }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "알 수 없는 오류" }, { status: 500 });
  }
}

// 상품 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const gym_id = searchParams.get("gym_id");

    if (!id || !gym_id) {
      return NextResponse.json({ error: "필수 필드가 누락되었습니다." }, { status: 400 });
    }

    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    if (!isAdmin(staff.role)) {
      return NextResponse.json({ error: `상품 관리 권한이 없습니다.` }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("membership_products")
      .delete()
      .eq("id", id)
      .eq("gym_id", gym_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "알 수 없는 오류" }, { status: 500 });
  }
}
