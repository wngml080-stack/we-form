import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { isHQStaff, canAccessChatRoom } from "@/lib/api/chat-auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/chat/rooms/[id]/messages
 * 메시지 목록 조회 (페이지네이션)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: roomId } = await context.params;
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isHQStaff(staff)) {
      return NextResponse.json(
        { error: "본사 직원만 접근 가능합니다." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const cursor = searchParams.get("cursor"); // created_at 기준

    const supabase = getSupabaseAdmin();

    // 채팅방 확인
    const { data: room, error: roomError } = await supabase
      .from("chat_rooms")
      .select("company_id")
      .eq("id", roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: "채팅방을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (!canAccessChatRoom(staff, room.company_id)) {
      return NextResponse.json(
        { error: "접근 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 참여 여부 확인
    const { data: membership, error: membershipError } = await supabase
      .from("chat_room_members")
      .select("id")
      .eq("room_id", roomId)
      .eq("staff_id", staff.id)
      .is("left_at", null)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "참여하지 않은 채팅방입니다." },
        { status: 403 }
      );
    }

    // 메시지 조회
    let query = supabase
      .from("chat_messages")
      .select(
        `
        *,
        sender:staffs(id, name, email)
      `
      )
      .eq("room_id", roomId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit + 1); // hasMore 확인용

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) throw messagesError;

    const hasMore = messages && messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, limit) : messages;

    // 시간순 정렬 (오래된 것부터)
    resultMessages?.reverse();

    return NextResponse.json({
      messages: resultMessages || [],
      hasMore,
      nextCursor:
        hasMore && resultMessages?.length
          ? resultMessages[0].created_at
          : null,
    });
  } catch (error) {
    console.error("[Chat Messages API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

/**
 * POST /api/admin/chat/rooms/[id]/messages
 * 메시지 전송
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: roomId } = await context.params;
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isHQStaff(staff)) {
      return NextResponse.json(
        { error: "본사 직원만 접근 가능합니다." },
        { status: 403 }
      );
    }

    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "메시지 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 채팅방 확인
    const { data: room, error: roomError } = await supabase
      .from("chat_rooms")
      .select("company_id")
      .eq("id", roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: "채팅방을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (!canAccessChatRoom(staff, room.company_id)) {
      return NextResponse.json(
        { error: "접근 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 참여 여부 확인
    const { data: membership, error: membershipError } = await supabase
      .from("chat_room_members")
      .select("id")
      .eq("room_id", roomId)
      .eq("staff_id", staff.id)
      .is("left_at", null)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "참여하지 않은 채팅방입니다." },
        { status: 403 }
      );
    }

    // 메시지 저장
    const { data: message, error: messageError } = await supabase
      .from("chat_messages")
      .insert({
        room_id: roomId,
        sender_id: staff.id,
        content: content.trim(),
        message_type: "text",
      })
      .select(
        `
        *,
        sender:staffs(id, name, email)
      `
      )
      .single();

    if (messageError) throw messageError;

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("[Chat Send Message API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/chat/rooms/[id]/messages
 * 메시지 삭제 (본인 메시지만)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: roomId } = await context.params;
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isHQStaff(staff)) {
      return NextResponse.json(
        { error: "본사 직원만 접근 가능합니다." },
        { status: 403 }
      );
    }

    const { message_id } = await request.json();

    if (!message_id) {
      return NextResponse.json(
        { error: "삭제할 메시지를 선택해주세요." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 메시지 확인
    const { data: message, error: messageError } = await supabase
      .from("chat_messages")
      .select("sender_id, room_id")
      .eq("id", message_id)
      .single();

    if (messageError || !message) {
      return NextResponse.json(
        { error: "메시지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (message.room_id !== roomId) {
      return NextResponse.json(
        { error: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    // 본인 메시지만 삭제 가능 (system_admin은 모두 삭제 가능)
    if (message.sender_id !== staff.id && staff.role !== "system_admin") {
      return NextResponse.json(
        { error: "본인 메시지만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    // 소프트 삭제
    const { error: deleteError } = await supabase
      .from("chat_messages")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", message_id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Chat Delete Message API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
