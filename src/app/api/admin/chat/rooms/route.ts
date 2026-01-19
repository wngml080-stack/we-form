import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { isHQStaff } from "@/lib/api/chat-auth";

/**
 * GET /api/admin/chat/rooms
 * 채팅방 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isHQStaff(staff)) {
      return NextResponse.json(
        { error: "본사 직원만 접근 가능합니다." },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 내가 참여한 채팅방 ID 목록 조회
    const { data: myMemberships, error: membershipError } = await supabase
      .from("chat_room_members")
      .select("room_id")
      .eq("staff_id", staff.id)
      .is("left_at", null);

    // 테이블이 없는 경우 빈 배열 반환
    if (membershipError) {
      console.error("[Chat Rooms API] Membership query error:", membershipError);
      // 테이블이 없으면 빈 목록 반환
      if (membershipError.code === "42P01" || membershipError.message?.includes("does not exist")) {
        return NextResponse.json({
          rooms: [],
          totalUnread: 0,
          error: "채팅 기능이 아직 설정되지 않았습니다. 데이터베이스 마이그레이션을 실행해주세요."
        });
      }
      throw membershipError;
    }

    const roomIds = myMemberships?.map((m) => m.room_id) || [];

    if (roomIds.length === 0) {
      return NextResponse.json({ rooms: [], totalUnread: 0 });
    }

    // 채팅방 목록 조회
    const { data: rooms, error: roomsError } = await supabase
      .from("chat_rooms")
      .select(
        `
        *,
        members:chat_room_members(
          staff_id,
          role,
          staff:staffs(id, name, email)
        )
      `
      )
      .in("id", roomIds)
      .eq("company_id", staff.company_id)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (roomsError) throw roomsError;

    // 안읽은 메시지 수 조회
    const { data: unreadCounts } = await supabase.rpc(
      "get_unread_message_count",
      { p_staff_id: staff.id }
    );

    const roomsWithUnread =
      rooms?.map((room) => ({
        ...room,
        unread_count:
          unreadCounts?.find(
            (u: { room_id: string; unread_count: number }) =>
              u.room_id === room.id
          )?.unread_count || 0,
      })) || [];

    const totalUnread = roomsWithUnread.reduce(
      (sum, room) => sum + room.unread_count,
      0
    );

    return NextResponse.json({ rooms: roomsWithUnread, totalUnread });
  } catch (error) {
    console.error("[Chat Rooms API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

/**
 * POST /api/admin/chat/rooms
 * 그룹 채팅방 생성
 */
export async function POST(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isHQStaff(staff)) {
      return NextResponse.json(
        { error: "본사 직원만 접근 가능합니다." },
        { status: 403 }
      );
    }

    const { name, description, member_ids } = await request.json();

    if (!name || !member_ids || member_ids.length < 1) {
      return NextResponse.json(
        { error: "채팅방 이름과 최소 1명의 참여자가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 채팅방 생성
    const { data: room, error: roomError } = await supabase
      .from("chat_rooms")
      .insert({
        company_id: staff.company_id,
        room_type: "group",
        name,
        description,
        created_by: staff.id,
      })
      .select()
      .single();

    if (roomError) throw roomError;

    // 참여자 추가 (생성자 포함)
    const allMembers = [
      staff.id,
      ...member_ids.filter((id: string) => id !== staff.id),
    ];
    const { error: membersError } = await supabase
      .from("chat_room_members")
      .insert(
        allMembers.map((staffId: string) => ({
          room_id: room.id,
          staff_id: staffId,
          role: staffId === staff.id ? "admin" : "member",
        }))
      );

    if (membersError) throw membersError;

    // 시스템 메시지 추가
    await supabase.from("chat_messages").insert({
      room_id: room.id,
      sender_id: staff.id,
      content: `${staff.name}님이 채팅방을 만들었습니다.`,
      message_type: "system",
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    console.error("[Chat Rooms API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
