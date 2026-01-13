import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";

// 문의 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // 문의 조회
    const { data: inquiry, error } = await supabase
      .from("inquiries")
      .select(`
        *,
        assigned_staff:staffs!inquiries_assigned_staff_id_fkey(id, name, phone),
        reservation:reservations(
          id,
          scheduled_date,
          scheduled_time,
          duration_minutes,
          reservation_type,
          status,
          staff:staffs(id, name)
        ),
        converted_member:members(id, name, phone, status)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("[Inquiry API] Error:", error);
      return NextResponse.json({ error: "문의 조회 실패" }, { status: 500 });
    }

    if (!inquiry) {
      return NextResponse.json({ error: "문의를 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    const { data: gym } = await supabase
      .from("gyms")
      .select("company_id")
      .eq("id", inquiry.gym_id)
      .maybeSingle();

    if (!canAccessGym(staff, inquiry.gym_id, gym?.company_id)) {
      return NextResponse.json({ error: "해당 문의에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    // 메시지 조회
    const { data: messages } = await supabase
      .from("inquiry_messages")
      .select(`
        *,
        sender:staffs(id, name)
      `)
      .eq("inquiry_id", id)
      .order("created_at", { ascending: true });

    return NextResponse.json({ inquiry, messages: messages || [] });
  } catch (error) {
    console.error("[Inquiry API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// 문의 수정
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

    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseAdmin();

    // 기존 문의 조회
    const { data: existing } = await supabase
      .from("inquiries")
      .select("gym_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "문의를 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    const { data: gym } = await supabase
      .from("gyms")
      .select("company_id")
      .eq("id", existing.gym_id)
      .maybeSingle();

    if (!canAccessGym(staff, existing.gym_id, gym?.company_id)) {
      return NextResponse.json({ error: "해당 문의에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    // 업데이트 데이터 구성
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "customer_name",
      "customer_phone",
      "customer_email",
      "inquiry_type",
      "subject",
      "content",
      "status",
      "priority",
      "assigned_staff_id",
      "notes",
      "tags",
      "reservation_id",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // 상태가 resolved로 변경되면 resolved_at 설정
    if (body.status === "resolved" && !body.resolved_at) {
      updateData.resolved_at = new Date().toISOString();
    }

    // 문의 수정
    const { data: inquiry, error } = await supabase
      .from("inquiries")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[Inquiry API] Update error:", error);
      return NextResponse.json({ error: "문의 수정 실패" }, { status: 500 });
    }

    return NextResponse.json({ inquiry });
  } catch (error) {
    console.error("[Inquiry API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// 문의 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // 기존 문의 조회
    const { data: existing } = await supabase
      .from("inquiries")
      .select("gym_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "문의를 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    const { data: gym } = await supabase
      .from("gyms")
      .select("company_id")
      .eq("id", existing.gym_id)
      .maybeSingle();

    if (!canAccessGym(staff, existing.gym_id, gym?.company_id)) {
      return NextResponse.json({ error: "해당 문의에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    // 관리자 권한 확인
    if (!["admin", "company_admin", "system_admin", "manager"].includes(staff.role)) {
      return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
    }

    // 문의 삭제
    const { error } = await supabase
      .from("inquiries")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[Inquiry API] Delete error:", error);
      return NextResponse.json({ error: "문의 삭제 실패" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Inquiry API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
