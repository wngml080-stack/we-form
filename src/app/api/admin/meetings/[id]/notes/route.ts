import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";
import type { MeetingNoteCreateInput, MeetingNoteUpdateInput } from "@/types/meeting";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// 회의록 조회
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id: meetingId } = await params;
    const supabase = getSupabaseAdmin();

    const { data: notes, error } = await supabase
      .from("meeting_notes")
      .select(`
        *,
        author:staffs(id, name)
      `)
      .eq("meeting_id", meetingId)
      .order("version", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notes });
  } catch (error: unknown) {
    console.error("[Notes GET] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 회의록 생성/추가
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id: meetingId } = await params;
    const body: MeetingNoteCreateInput = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 기존 회의록 버전 확인
    const { data: existingNotes } = await supabase
      .from("meeting_notes")
      .select("version")
      .eq("meeting_id", meetingId)
      .order("version", { ascending: false })
      .limit(1);

    const nextVersion = existingNotes && existingNotes.length > 0
      ? existingNotes[0].version + 1
      : 1;

    const { data: note, error } = await supabase
      .from("meeting_notes")
      .insert({
        meeting_id: meetingId,
        author_id: staff.id,
        content,
        version: nextVersion,
      })
      .select(`*, author:staffs(id, name)`)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ note }, { status: 201 });
  } catch (error: unknown) {
    console.error("[Notes POST] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 회의록 수정
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id: meetingId } = await params;
    const body: MeetingNoteUpdateInput & { note_id: string } = await request.json();
    const { note_id, content, is_final } = body;

    if (!note_id) {
      return NextResponse.json({ error: "note_id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 작성자 확인
    const { data: existing } = await supabase
      .from("meeting_notes")
      .select("author_id")
      .eq("id", note_id)
      .single();

    if (existing && existing.author_id !== staff.id && !["company_admin", "system_admin"].includes(staff.role)) {
      return NextResponse.json({ error: "수정 권한이 없습니다." }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (content !== undefined) updateData.content = content;
    if (is_final !== undefined) updateData.is_final = is_final;

    const { data: note, error } = await supabase
      .from("meeting_notes")
      .update(updateData)
      .eq("id", note_id)
      .eq("meeting_id", meetingId)
      .select(`*, author:staffs(id, name)`)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ note });
  } catch (error: unknown) {
    console.error("[Notes PUT] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 회의록 삭제
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id: meetingId } = await params;
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get("note_id");

    if (!noteId) {
      return NextResponse.json({ error: "note_id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 작성자 확인
    const { data: existing } = await supabase
      .from("meeting_notes")
      .select("author_id")
      .eq("id", noteId)
      .single();

    if (existing && existing.author_id !== staff.id && !["company_admin", "system_admin"].includes(staff.role)) {
      return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
    }

    const { error } = await supabase
      .from("meeting_notes")
      .delete()
      .eq("id", noteId)
      .eq("meeting_id", meetingId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[Notes DELETE] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
