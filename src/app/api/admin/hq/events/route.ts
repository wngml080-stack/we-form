import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin, canAccessCompany } from "@/lib/api/auth";

// 이벤트 생성/수정
export async function POST(request: Request) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isAdmin(staff.role)) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { eventId, eventData } = body;

    if (!eventData || !eventData.company_id) {
      return NextResponse.json(
        { error: "eventData and company_id are required" },
        { status: 400 }
      );
    }

    // 권한 확인
    if (!canAccessCompany(staff, eventData.company_id)) {
      return NextResponse.json(
        { error: "해당 회사에 대한 권한이 없습니다." },
        { status: 403 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    if (eventId) {
      // 수정
      const { error } = await supabaseAdmin
        .from("company_events")
        .update(eventData)
        .eq("id", eventId);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: "회사 일정 & 행사가 수정되었습니다.",
      });
    } else {
      // 신규 등록
      const { error } = await supabaseAdmin
        .from("company_events")
        .insert(eventData);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: "회사 일정 & 행사가 등록되었습니다.",
      });
    }
  } catch (error: any) {
    console.error("[API] Error saving event:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 이벤트 삭제
export async function DELETE(request: Request) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isAdmin(staff.role)) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("id");

    if (!eventId) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 이벤트의 회사 확인
    const { data: event } = await supabaseAdmin
      .from("company_events")
      .select("company_id")
      .eq("id", eventId)
      .single();

    if (event?.company_id && !canAccessCompany(staff, event.company_id)) {
      return NextResponse.json(
        { error: "해당 일정에 대한 권한이 없습니다." },
        { status: 403 }
      );
    }

    const { error } = await supabaseAdmin
      .from("company_events")
      .delete()
      .eq("id", eventId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "회사 일정 & 행사가 삭제되었습니다.",
    });
  } catch (error: any) {
    console.error("[API] Error deleting event:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 이벤트 활성 상태 토글
export async function PATCH(request: Request) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isAdmin(staff.role)) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { eventId, isActive } = body;

    if (!eventId || isActive === undefined) {
      return NextResponse.json(
        { error: "eventId and isActive are required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 이벤트의 회사 확인
    const { data: event } = await supabaseAdmin
      .from("company_events")
      .select("company_id")
      .eq("id", eventId)
      .single();

    if (event?.company_id && !canAccessCompany(staff, event.company_id)) {
      return NextResponse.json(
        { error: "해당 일정에 대한 권한이 없습니다." },
        { status: 403 }
      );
    }

    const { error } = await supabaseAdmin
      .from("company_events")
      .update({ is_active: isActive })
      .eq("id", eventId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "활성 상태가 변경되었습니다.",
    });
  } catch (error: any) {
    console.error("[API] Error toggling event active:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
