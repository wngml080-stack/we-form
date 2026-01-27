import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";
import type { ParticipantCreateInput, ParticipantUpdateInput } from "@/types/meeting";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// 참석자 목록 조회
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id: meetingId } = await params;
    const supabase = getSupabaseAdmin();

    const { data: participants, error } = await supabase
      .from("meeting_participants")
      .select(`
        *,
        staff:staffs(id, name, email, phone, job_title)
      `)
      .eq("meeting_id", meetingId)
      .order("role");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ participants });
  } catch (error: unknown) {
    console.error("[Participants GET] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 참석자 추가
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id: meetingId } = await params;
    const body: ParticipantCreateInput | { staff_ids: string[] } = await request.json();

    const supabase = getSupabaseAdmin();

    // 회의 존재 확인
    const { data: meeting } = await supabase
      .from("meetings")
      .select("id, created_by")
      .eq("id", meetingId)
      .single();

    if (!meeting) {
      return NextResponse.json({ error: "회의를 찾을 수 없습니다." }, { status: 404 });
    }

    // 여러 명 추가 처리
    if ("staff_ids" in body && Array.isArray(body.staff_ids)) {
      const inserts = body.staff_ids.map((staffId) => ({
        meeting_id: meetingId,
        staff_id: staffId,
        role: "attendee",
      }));

      const { data: participants, error } = await supabase
        .from("meeting_participants")
        .upsert(inserts, { onConflict: "meeting_id,staff_id" })
        .select(`*, staff:staffs(id, name)`);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ participants }, { status: 201 });
    }

    // 단일 추가
    const { staff_id, role = "attendee" } = body as ParticipantCreateInput;

    const { data: participant, error } = await supabase
      .from("meeting_participants")
      .insert({
        meeting_id: meetingId,
        staff_id,
        role,
      })
      .select(`*, staff:staffs(id, name)`)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "이미 참석자로 등록되어 있습니다." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ participant }, { status: 201 });
  } catch (error: unknown) {
    console.error("[Participants POST] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 참석자 정보 수정 (상태 변경 등)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id: meetingId } = await params;
    const body: ParticipantUpdateInput & { participant_id: string } = await request.json();
    const { participant_id, ...updateData } = body;

    if (!participant_id) {
      return NextResponse.json({ error: "participant_id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 참석 확인 시 시간 자동 기록
    if (updateData.attendance_status === "confirmed" && !updateData.confirmed_at) {
      (updateData as Record<string, unknown>).confirmed_at = new Date().toISOString();
    }
    if (updateData.attendance_status === "attended" && !updateData.attended_at) {
      (updateData as Record<string, unknown>).attended_at = new Date().toISOString();
    }

    const { data: participant, error } = await supabase
      .from("meeting_participants")
      .update(updateData)
      .eq("id", participant_id)
      .eq("meeting_id", meetingId)
      .select(`*, staff:staffs(id, name)`)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ participant });
  } catch (error: unknown) {
    console.error("[Participants PUT] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 참석자 삭제
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id: meetingId } = await params;
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get("participant_id");

    if (!participantId) {
      return NextResponse.json({ error: "participant_id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("meeting_participants")
      .delete()
      .eq("id", participantId)
      .eq("meeting_id", meetingId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[Participants DELETE] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
