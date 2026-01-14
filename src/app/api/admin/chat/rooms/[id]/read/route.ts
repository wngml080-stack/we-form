import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { isHQStaff, canAccessChatRoom } from "@/lib/api/chat-auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/chat/rooms/[id]/read
 * 읽음 상태 업데이트
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

    // 읽음 시간 업데이트
    const { error: updateError } = await supabase
      .from("chat_room_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("room_id", roomId)
      .eq("staff_id", staff.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Chat Read Status API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
