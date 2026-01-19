import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { isHQStaff } from "@/lib/api/chat-auth";

/**
 * POST /api/admin/chat/rooms/dm
 * DM 채팅방 찾기/생성
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

    const { target_staff_id } = await request.json();

    if (!target_staff_id) {
      return NextResponse.json(
        { error: "대화 상대를 선택해주세요." },
        { status: 400 }
      );
    }

    if (target_staff_id === staff.id) {
      return NextResponse.json(
        { error: "자신과는 대화할 수 없습니다." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 대상 직원이 같은 회사 직원인지 확인
    const { data: targetStaff, error: targetError } = await supabase
      .from("staffs")
      .select("id, name, company_id, employment_status")
      .eq("id", target_staff_id)
      .single();

    if (targetError || !targetStaff) {
      return NextResponse.json(
        { error: "대화 상대를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 같은 회사 직원인지, 퇴사자가 아닌지 확인
    if (targetStaff.company_id !== staff.company_id) {
      return NextResponse.json(
        { error: "대화할 수 없는 상대입니다." },
        { status: 403 }
      );
    }

    if (targetStaff.employment_status === "퇴사") {
      return NextResponse.json(
        { error: "퇴사한 직원과는 대화할 수 없습니다." },
        { status: 403 }
      );
    }

    // DB 함수로 DM 방 찾기/생성
    const { data: roomId, error: dmError } = await supabase.rpc(
      "find_or_create_dm_room",
      {
        p_company_id: staff.company_id,
        p_staff_id_1: staff.id,
        p_staff_id_2: target_staff_id,
      }
    );

    if (dmError) {
      console.error("[Chat DM API] find_or_create_dm_room error:", dmError);
      // 함수가 없는 경우 (마이그레이션 미적용)
      if (dmError.code === "42883" || dmError.message?.includes("does not exist")) {
        return NextResponse.json(
          { error: "채팅 기능이 아직 설정되지 않았습니다. 데이터베이스 마이그레이션을 실행해주세요." },
          { status: 503 }
        );
      }
      throw dmError;
    }

    // 생성된 방 정보 조회
    const { data: room, error: roomError } = await supabase
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
      .eq("id", roomId)
      .single();

    if (roomError) throw roomError;

    return NextResponse.json({ room });
  } catch (error) {
    console.error("[Chat DM API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
