import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";
import type { MeetingUpdateInput } from "@/types/meeting";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// 회의 상세 조회
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // 회의 기본 정보
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select(`
        *,
        creator:staffs!meetings_created_by_fkey(id, name, email)
      `)
      .eq("id", id)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json({ error: "회의를 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    if (staff.role !== "system_admin" && meeting.company_id !== staff.company_id) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    // 참석자 조회
    const { data: participants } = await supabase
      .from("meeting_participants")
      .select(`
        *,
        staff:staffs(id, name, email, phone, job_title)
      `)
      .eq("meeting_id", id)
      .order("role");

    // 안건 조회
    const { data: agendas } = await supabase
      .from("meeting_agendas")
      .select(`
        *,
        presenter:staffs(id, name)
      `)
      .eq("meeting_id", id)
      .order("order_index");

    // 회의록 조회
    const { data: notes } = await supabase
      .from("meeting_notes")
      .select(`
        *,
        author:staffs(id, name)
      `)
      .eq("meeting_id", id)
      .order("version", { ascending: false });

    // 액션 아이템 조회
    const { data: actionItems } = await supabase
      .from("meeting_action_items")
      .select(`
        *,
        assignee:staffs(id, name)
      `)
      .eq("meeting_id", id)
      .order("created_at");

    // 첨부파일 조회
    const { data: attachments } = await supabase
      .from("meeting_attachments")
      .select(`
        *,
        uploader:staffs(id, name)
      `)
      .eq("meeting_id", id)
      .order("created_at");

    const meetingDetail = {
      ...meeting,
      participants: participants || [],
      agendas: agendas || [],
      notes: notes || [],
      action_items: actionItems || [],
      attachments: attachments || [],
    };

    return NextResponse.json({ meeting: meetingDetail });
  } catch (error: unknown) {
    console.error("[Meeting GET] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 회의 수정
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id } = await params;
    const body: MeetingUpdateInput = await request.json();

    const supabase = getSupabaseAdmin();

    // 회의 존재 확인
    const { data: existing, error: existingError } = await supabase
      .from("meetings")
      .select("id, company_id, created_by")
      .eq("id", id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: "회의를 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인 (주최자 또는 관리자)
    const isCreator = existing.created_by === staff.id;
    const isAdmin = ["company_admin", "system_admin"].includes(staff.role);

    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: "수정 권한이 없습니다." }, { status: 403 });
    }

    // 업데이트할 필드만 추출
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "title", "description", "meeting_type", "scheduled_at",
      "started_at", "ended_at", "location", "is_online", "online_link",
      "status", "ai_summary", "ai_summary_generated_at"
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field as keyof MeetingUpdateInput];
      }
    }

    const { data: meeting, error: updateError } = await supabase
      .from("meetings")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[Meeting PUT] Error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ meeting });
  } catch (error: unknown) {
    console.error("[Meeting PUT] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 회의 삭제
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // 회의 존재 확인
    const { data: existing, error: existingError } = await supabase
      .from("meetings")
      .select("id, company_id, created_by")
      .eq("id", id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: "회의를 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인 (주최자 또는 관리자)
    const isCreator = existing.created_by === staff.id;
    const isAdmin = ["company_admin", "system_admin"].includes(staff.role);

    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("meetings")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[Meeting DELETE] Error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[Meeting DELETE] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
