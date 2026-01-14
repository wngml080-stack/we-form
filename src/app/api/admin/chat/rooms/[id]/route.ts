import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { isHQStaff, canAccessChatRoom } from "@/lib/api/chat-auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/chat/rooms/[id]
 * 채팅방 상세 조회
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

    const supabase = getSupabaseAdmin();

    // 채팅방 조회
    const { data: room, error: roomError } = await supabase
      .from("chat_rooms")
      .select(
        `
        *,
        members:chat_room_members(
          staff_id,
          role,
          joined_at,
          staff:staffs(id, name, email, job_title)
        )
      `
      )
      .eq("id", roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: "채팅방을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인
    if (!canAccessChatRoom(staff, room.company_id)) {
      return NextResponse.json(
        { error: "접근 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 내가 참여 중인지 확인
    const isMember = room.members.some(
      (m: { staff_id: string }) => m.staff_id === staff.id
    );
    if (!isMember) {
      return NextResponse.json(
        { error: "참여하지 않은 채팅방입니다." },
        { status: 403 }
      );
    }

    return NextResponse.json({ room });
  } catch (error) {
    console.error("[Chat Room Detail API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/chat/rooms/[id]
 * 채팅방 정보 수정 (그룹만)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
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

    const { name, description } = await request.json();

    const supabase = getSupabaseAdmin();

    // 채팅방 조회
    const { data: room, error: roomError } = await supabase
      .from("chat_rooms")
      .select("*, members:chat_room_members(staff_id, role)")
      .eq("id", roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: "채팅방을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (room.room_type !== "group") {
      return NextResponse.json(
        { error: "그룹 채팅방만 수정할 수 있습니다." },
        { status: 400 }
      );
    }

    // 권한 확인 (방장 또는 회사 관리자)
    const myMembership = room.members.find(
      (m: { staff_id: string }) => m.staff_id === staff.id
    );
    const isRoomAdmin = myMembership?.role === "admin";

    if (!isRoomAdmin && staff.role !== "system_admin") {
      return NextResponse.json(
        { error: "채팅방 관리 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 업데이트
    const { data: updatedRoom, error: updateError } = await supabase
      .from("chat_rooms")
      .update({
        name: name || room.name,
        description: description !== undefined ? description : room.description,
      })
      .eq("id", roomId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ room: updatedRoom });
  } catch (error) {
    console.error("[Chat Room Update API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/chat/rooms/[id]
 * 채팅방 나가기
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

    const supabase = getSupabaseAdmin();

    // 채팅방 조회
    const { data: room, error: roomError } = await supabase
      .from("chat_rooms")
      .select("*, members:chat_room_members(staff_id, role)")
      .eq("id", roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: "채팅방을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // DM은 나갈 수 없음
    if (room.room_type === "dm") {
      return NextResponse.json(
        { error: "1:1 대화는 나갈 수 없습니다." },
        { status: 400 }
      );
    }

    // 나가기 처리 (soft delete)
    const { error: leaveError } = await supabase
      .from("chat_room_members")
      .update({ left_at: new Date().toISOString() })
      .eq("room_id", roomId)
      .eq("staff_id", staff.id);

    if (leaveError) throw leaveError;

    // 시스템 메시지 추가
    await supabase.from("chat_messages").insert({
      room_id: roomId,
      sender_id: staff.id,
      content: `${staff.name}님이 채팅방을 나갔습니다.`,
      message_type: "system",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Chat Room Leave API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
