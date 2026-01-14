import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { isHQStaff, canAccessChatRoom } from "@/lib/api/chat-auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/chat/rooms/[id]/members
 * 채팅방 참여자 목록 조회
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

    // 참여자 목록 조회
    const { data: members, error: membersError } = await supabase
      .from("chat_room_members")
      .select(
        `
        *,
        staff:staffs(id, name, email, job_title)
      `
      )
      .eq("room_id", roomId)
      .is("left_at", null)
      .order("joined_at");

    if (membersError) throw membersError;

    return NextResponse.json({ members });
  } catch (error) {
    console.error("[Chat Members API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

/**
 * POST /api/admin/chat/rooms/[id]/members
 * 그룹 채팅방에 참여자 추가
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

    const { staff_ids } = await request.json();

    if (!staff_ids || !Array.isArray(staff_ids) || staff_ids.length === 0) {
      return NextResponse.json(
        { error: "추가할 참여자를 선택해주세요." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 채팅방 확인
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
        { error: "그룹 채팅방에서만 참여자를 추가할 수 있습니다." },
        { status: 400 }
      );
    }

    // 권한 확인
    const myMembership = room.members.find(
      (m: { staff_id: string }) => m.staff_id === staff.id
    );
    if (!myMembership || myMembership.role !== "admin") {
      if (staff.role !== "system_admin") {
        return NextResponse.json(
          { error: "참여자 추가 권한이 없습니다." },
          { status: 403 }
        );
      }
    }

    // 이미 참여 중인 멤버 제외
    const existingMemberIds = room.members.map(
      (m: { staff_id: string }) => m.staff_id
    );
    const newMemberIds = staff_ids.filter(
      (id: string) => !existingMemberIds.includes(id)
    );

    if (newMemberIds.length === 0) {
      return NextResponse.json(
        { error: "모든 선택된 참여자가 이미 채팅방에 있습니다." },
        { status: 400 }
      );
    }

    // 새 멤버 추가
    const { error: insertError } = await supabase
      .from("chat_room_members")
      .insert(
        newMemberIds.map((staffId: string) => ({
          room_id: roomId,
          staff_id: staffId,
          role: "member",
        }))
      );

    if (insertError) throw insertError;

    // 추가된 멤버 이름 조회
    const { data: addedStaffs } = await supabase
      .from("staffs")
      .select("name")
      .in("id", newMemberIds);

    const names = addedStaffs?.map((s) => s.name).join(", ") || "";

    // 시스템 메시지
    await supabase.from("chat_messages").insert({
      room_id: roomId,
      sender_id: staff.id,
      content: `${staff.name}님이 ${names}님을 초대했습니다.`,
      message_type: "system",
    });

    return NextResponse.json({ success: true, added_count: newMemberIds.length });
  } catch (error) {
    console.error("[Chat Members Add API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/chat/rooms/[id]/members
 * 그룹 채팅방에서 참여자 제거
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

    const { staff_id } = await request.json();

    if (!staff_id) {
      return NextResponse.json(
        { error: "제거할 참여자를 선택해주세요." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 채팅방 확인
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
        { error: "그룹 채팅방에서만 참여자를 제거할 수 있습니다." },
        { status: 400 }
      );
    }

    // 권한 확인 (방장만 제거 가능)
    const myMembership = room.members.find(
      (m: { staff_id: string }) => m.staff_id === staff.id
    );
    if (!myMembership || myMembership.role !== "admin") {
      if (staff.role !== "system_admin") {
        return NextResponse.json(
          { error: "참여자 제거 권한이 없습니다." },
          { status: 403 }
        );
      }
    }

    // 방장은 제거 불가
    const targetMembership = room.members.find(
      (m: { staff_id: string }) => m.staff_id === staff_id
    );
    if (targetMembership?.role === "admin") {
      return NextResponse.json(
        { error: "방장은 제거할 수 없습니다." },
        { status: 400 }
      );
    }

    // 제거할 멤버 이름 조회
    const { data: targetStaff } = await supabase
      .from("staffs")
      .select("name")
      .eq("id", staff_id)
      .single();

    // 멤버 제거 (soft delete)
    const { error: deleteError } = await supabase
      .from("chat_room_members")
      .update({ left_at: new Date().toISOString() })
      .eq("room_id", roomId)
      .eq("staff_id", staff_id);

    if (deleteError) throw deleteError;

    // 시스템 메시지
    await supabase.from("chat_messages").insert({
      room_id: roomId,
      sender_id: staff.id,
      content: `${staff.name}님이 ${targetStaff?.name || "알 수 없음"}님을 내보냈습니다.`,
      message_type: "system",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Chat Members Remove API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
