import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";
import type { AgendaCreateInput, AgendaUpdateInput } from "@/types/meeting";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// 안건 목록 조회
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id: meetingId } = await params;
    const supabase = getSupabaseAdmin();

    const { data: agendas, error } = await supabase
      .from("meeting_agendas")
      .select(`
        *,
        presenter:staffs(id, name)
      `)
      .eq("meeting_id", meetingId)
      .order("order_index");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ agendas });
  } catch (error: unknown) {
    console.error("[Agendas GET] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 안건 생성
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id: meetingId } = await params;
    const body: AgendaCreateInput = await request.json();
    const {
      title,
      description,
      order_index,
      estimated_minutes,
      presenter_id,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "안건 제목을 입력해주세요." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // order_index 자동 설정
    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined) {
      const { data: existingAgendas } = await supabase
        .from("meeting_agendas")
        .select("order_index")
        .eq("meeting_id", meetingId)
        .order("order_index", { ascending: false })
        .limit(1);

      finalOrderIndex = existingAgendas && existingAgendas.length > 0
        ? existingAgendas[0].order_index + 1
        : 0;
    }

    const { data: agenda, error } = await supabase
      .from("meeting_agendas")
      .insert({
        meeting_id: meetingId,
        title,
        description,
        order_index: finalOrderIndex,
        estimated_minutes,
        presenter_id,
        status: "pending",
      })
      .select(`*, presenter:staffs(id, name)`)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ agenda }, { status: 201 });
  } catch (error: unknown) {
    console.error("[Agendas POST] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 안건 수정
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id: meetingId } = await params;
    const body: AgendaUpdateInput & { agenda_id: string } = await request.json();
    const { agenda_id, ...updateData } = body;

    if (!agenda_id) {
      return NextResponse.json({ error: "agenda_id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: agenda, error } = await supabase
      .from("meeting_agendas")
      .update(updateData)
      .eq("id", agenda_id)
      .eq("meeting_id", meetingId)
      .select(`*, presenter:staffs(id, name)`)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ agenda });
  } catch (error: unknown) {
    console.error("[Agendas PUT] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 안건 삭제
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id: meetingId } = await params;
    const { searchParams } = new URL(request.url);
    const agendaId = searchParams.get("agenda_id");

    if (!agendaId) {
      return NextResponse.json({ error: "agenda_id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("meeting_agendas")
      .delete()
      .eq("id", agendaId)
      .eq("meeting_id", meetingId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[Agendas DELETE] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
