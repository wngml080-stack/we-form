import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";

// 시스템 공지사항 조회 (로그인한 사용자만)
export async function GET() {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from("system_announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      announcements: data || [],
    });
  } catch (error: any) {
    console.error("[API] Error fetching announcements:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 시스템 공지사항 생성
export async function POST(request: Request) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;

    // 시스템 관리자만 공지 생성 가능
    if (!staff || staff.role !== "system_admin") {
      return NextResponse.json(
        { error: "시스템 관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, priority, is_active } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "제목과 내용은 필수입니다." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from("system_announcements")
      .insert({
        title,
        content,
        priority: priority || "normal",
        is_active: is_active ?? true,
        author_id: staff.id,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Announcements] 공지 생성 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "공지 생성에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true, announcement: data });
  } catch (error: any) {
    console.error("[API] Error creating announcement:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 시스템 공지사항 수정 (활성화 토글 포함)
export async function PATCH(request: Request) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;

    // 시스템 관리자만 공지 수정 가능
    if (!staff || staff.role !== "system_admin") {
      return NextResponse.json(
        { error: "시스템 관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from("system_announcements")
      .update(updateData)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Announcements] 공지 수정 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "공지를 찾을 수 없거나 수정에 실패했습니다." }, { status: 404 });
    }

    return NextResponse.json({ success: true, announcement: data });
  } catch (error: any) {
    console.error("[API] Error updating announcement:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 시스템 공지사항 삭제
export async function DELETE(request: Request) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;

    // 시스템 관리자만 공지 삭제 가능
    if (!staff || staff.role !== "system_admin") {
      return NextResponse.json(
        { error: "시스템 관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin
      .from("system_announcements")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API] Error deleting announcement:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
