import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";
import type { ActionItemCreateInput, ActionItemUpdateInput } from "@/types/meeting";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// 액션 아이템 목록 조회
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id: meetingId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("meeting_action_items")
      .select(`
        *,
        assignee:staffs(id, name)
      `)
      .eq("meeting_id", meetingId)
      .order("created_at");

    if (status) {
      query = query.eq("status", status);
    }

    const { data: actionItems, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ action_items: actionItems });
  } catch (error: unknown) {
    console.error("[ActionItems GET] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 액션 아이템 생성
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id: meetingId } = await params;
    const body: ActionItemCreateInput = await request.json();
    const {
      title,
      description,
      agenda_id,
      assignee_id,
      due_date,
      priority = "medium",
    } = body;

    if (!title) {
      return NextResponse.json({ error: "제목을 입력해주세요." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: actionItem, error } = await supabase
      .from("meeting_action_items")
      .insert({
        meeting_id: meetingId,
        agenda_id,
        title,
        description,
        assignee_id,
        due_date,
        priority,
        status: "pending",
      })
      .select(`*, assignee:staffs(id, name)`)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ action_item: actionItem }, { status: 201 });
  } catch (error: unknown) {
    console.error("[ActionItems POST] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 액션 아이템 수정
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id: meetingId } = await params;
    const body: ActionItemUpdateInput & { action_item_id: string } = await request.json();
    const { action_item_id, ...updateData } = body;

    if (!action_item_id) {
      return NextResponse.json({ error: "action_item_id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 완료 처리 시 시간 기록
    if (updateData.status === "completed" && !updateData.completed_at) {
      (updateData as Record<string, unknown>).completed_at = new Date().toISOString();
    }

    const { data: actionItem, error } = await supabase
      .from("meeting_action_items")
      .update(updateData)
      .eq("id", action_item_id)
      .eq("meeting_id", meetingId)
      .select(`*, assignee:staffs(id, name)`)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ action_item: actionItem });
  } catch (error: unknown) {
    console.error("[ActionItems PUT] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 액션 아이템 삭제
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id: meetingId } = await params;
    const { searchParams } = new URL(request.url);
    const actionItemId = searchParams.get("action_item_id");

    if (!actionItemId) {
      return NextResponse.json({ error: "action_item_id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("meeting_action_items")
      .delete()
      .eq("id", actionItemId)
      .eq("meeting_id", meetingId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[ActionItems DELETE] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
